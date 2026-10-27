"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/core/db";
import { requireUser } from "@/core/auth/session";
import { getT } from "@/core/i18n/server";
import { tr, type T } from "@/core/i18n";
import { assertCan, isPrivileged, scope, type SessionUser } from "@/core/permissions";
import { getFieldDefs, parseCustomFields, saveFieldValues, type FieldDef } from "@/core/custom-fields";
import { companySchema } from "@/modules/companies/schema";
import { contactSchema } from "@/modules/contacts/schema";
import type { CsvEntity } from "./fields";

export type ImportResult = { created: number; skipped: number; errors: { row: number; message: string }[]; fatal?: string };

const MAX_ROWS = 2000;
const clean = (row: Record<string, string>) => Object.fromEntries(Object.entries(row).map(([k, v]) => [k, String(v ?? "").trim() || undefined]));

function customForm(defs: FieldDef[], row: Record<string, string | undefined>) {
  const fd = new FormData();
  for (const d of defs) fd.set(`cf_${d.key}`, row[`cf:${d.key}`] ?? "");
  return fd;
}

/** Owner column only honoured for Admin/Manager; everyone else imports into their own name. */
async function ownerResolver(user: SessionUser) {
  if (!isPrivileged(user)) return () => user.id;
  const users = await db.user.findMany({ where: { active: true }, select: { id: true, email: true } });
  const byEmail = new Map(users.map((u) => [u.email.toLowerCase(), u.id]));
  return (email?: string) => (email && byEmail.get(email.toLowerCase())) || user.id;
}

const issue = (e: { issues: { code: string; path: PropertyKey[]; message: string }[] }, t: T) =>
  e.issues.map((i) => `${String(i.path[0] ?? "")}: ${i.code === "invalid_type" ? t.errors.importWord : tr(t, i.message)}`).join("; ");

export async function importRows(entity: CsvEntity, input: Record<string, string>[]): Promise<ImportResult> {
  const user = await requireUser();
  const t = await getT();
  const result: ImportResult = { created: 0, skipped: 0, errors: [] };
  try {
    assertCan(user, "import");
    assertCan(user, entity === "CONTACT" ? "contact" : "company", "create");
  } catch {
    return { ...result, fatal: t.importExport.noPermission };
  }
  if (!Array.isArray(input) || input.length === 0) return { ...result, fatal: t.importExport.noRows };
  if (input.length > MAX_ROWS) return { ...result, fatal: t.tpl(t.importExport.tooMany, { max: MAX_ROWS }) };

  const defs = await getFieldDefs(entity);
  const ownerOf = await ownerResolver(user);
  const audit: { userId: string; entity: string; recordId: string; action: string; changes: object }[] = [];

  // Existing records the user can see → duplicate detection without leaking hidden data.
  const companies = await db.company.findMany({ where: scope(user, "company"), select: { id: true, name: true } });
  const companyByName = new Map(companies.map((c) => [c.name.toLowerCase(), c.id]));

  if (entity === "COMPANY") {
    for (const [i, raw] of input.entries()) {
      const row = clean(raw);
      const line = i + 2; // header is line 1
      const parsed = companySchema.omit({ ownerId: true }).safeParse(row);
      const cf = parseCustomFields(defs, customForm(defs, row), t);
      if (!parsed.success || Object.keys(cf.errors).length) {
        result.errors.push({ row: line, message: [parsed.success ? "" : issue(parsed.error, t), ...Object.values(cf.errors)].filter(Boolean).join("; ") });
        continue;
      }
      if (companyByName.has(parsed.data.name.toLowerCase())) {
        result.skipped++;
        result.errors.push({ row: line, message: t.tpl(t.importExport.skippedCompany, { name: parsed.data.name }) });
        continue;
      }
      const rec = await db.company.create({ data: { ...parsed.data, ownerId: ownerOf(row.owner) } });
      companyByName.set(rec.name.toLowerCase(), rec.id);
      await saveFieldValues("COMPANY", rec.id, defs, cf.values);
      audit.push({ userId: user.id, entity: "Company", recordId: rec.id, action: "CREATE", changes: { name: rec.name, source: "csv import" } });
      result.created++;
    }
  } else {
    const existing = await db.contact.findMany({ where: { ...scope(user, "contact"), email: { not: null } }, select: { email: true } });
    const emails = new Set(existing.map((c) => c.email!.toLowerCase()));
    for (const [i, raw] of input.entries()) {
      const row = clean(raw);
      const line = i + 2;
      const parsed = contactSchema.omit({ ownerId: true, companyId: true }).safeParse(row);
      const cf = parseCustomFields(defs, customForm(defs, row), t);
      if (!parsed.success || Object.keys(cf.errors).length) {
        result.errors.push({ row: line, message: [parsed.success ? "" : issue(parsed.error, t), ...Object.values(cf.errors)].filter(Boolean).join("; ") });
        continue;
      }
      const email = parsed.data.email?.toLowerCase();
      if (email && emails.has(email)) {
        result.skipped++;
        result.errors.push({ row: line, message: t.tpl(t.importExport.skippedEmail, { email: parsed.data.email ?? "" }) });
        continue;
      }
      let companyId: string | null = null;
      if (row.company) {
        companyId = companyByName.get(row.company.toLowerCase()) ?? null;
        if (!companyId) {
          const c = await db.company.create({ data: { name: row.company, ownerId: user.id } });
          companyByName.set(c.name.toLowerCase(), c.id);
          companyId = c.id;
          audit.push({ userId: user.id, entity: "Company", recordId: c.id, action: "CREATE", changes: { name: c.name, source: "csv import" } });
        }
      }
      const rec = await db.contact.create({ data: { ...parsed.data, companyId, ownerId: ownerOf(row.owner) } });
      if (email) emails.add(email);
      await saveFieldValues("CONTACT", rec.id, defs, cf.values);
      audit.push({ userId: user.id, entity: "Contact", recordId: rec.id, action: "CREATE", changes: { name: `${rec.firstName} ${rec.lastName}`, source: "csv import" } });
      result.created++;
    }
  }

  if (audit.length) await db.auditLog.createMany({ data: audit.map((a) => ({ ...a, changes: a.changes as never })) });
  await db.auditLog.create({
    data: { userId: user.id, entity: entity === "CONTACT" ? "Contact" : "Company", recordId: "batch", action: "IMPORT", changes: { created: result.created, skipped: result.skipped, errors: result.errors.length } },
  });
  revalidatePath("/contacts");
  revalidatePath("/companies");
  return result;
}

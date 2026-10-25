"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/core/db";
import { requireUser } from "@/core/auth/session";
import { getT } from "@/core/i18n/server";
import { assertCan, assertOwns } from "@/core/permissions";
import { logAudit, diff } from "@/core/audit";
import { formToObject, toActionError, zodErrors, type ActionState } from "@/core/forms";
import { deleteFieldValues, getFieldDefs, parseCustomFields, saveFieldValues } from "@/core/custom-fields";
import { resolveOwnerId } from "@/modules/users/queries";
import { companySchema } from "./schema";

export async function createCompany(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const t = await getT();
  let id: string;
  try {
    assertCan(user, "company", "create");
    const parsed = companySchema.safeParse(formToObject(fd));
    const defs = await getFieldDefs("COMPANY");
    const cf = parseCustomFields(defs, fd, t);
    if (!parsed.success || Object.keys(cf.errors).length) {
      const base = parsed.success ? {} : zodErrors(parsed.error, t).fieldErrors;
      return { error: t.errors.pleaseFix, fieldErrors: { ...base, ...cf.errors } };
    }
    const { ownerId: requestedOwner, ...data } = parsed.data;
    const ownerId = await resolveOwnerId(user, requestedOwner);
    const rec = await db.company.create({ data: { ...data, ownerId } });
    await saveFieldValues("COMPANY", rec.id, defs, cf.values);
    await logAudit(user, "Company", rec.id, "CREATE", { name: rec.name });
    id = rec.id;
  } catch (e) {
    return toActionError(e, t);
  }
  revalidatePath("/companies");
  redirect(`/companies/${id}`);
}

export async function updateCompany(id: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const t = await getT();
  try {
    const existing = await db.company.findUnique({ where: { id } });
    if (!existing) return { error: t.errors.notFound };
    assertOwns(user, "company", existing);
    assertCan(user, "company", "update");
    const parsed = companySchema.safeParse(formToObject(fd));
    const defs = await getFieldDefs("COMPANY");
    const cf = parseCustomFields(defs, fd, t);
    if (!parsed.success || Object.keys(cf.errors).length) {
      const base = parsed.success ? {} : zodErrors(parsed.error, t).fieldErrors;
      return { error: t.errors.pleaseFix, fieldErrors: { ...base, ...cf.errors } };
    }
    const { ownerId: requestedOwner, ...rest } = parsed.data;
    const ownerId = await resolveOwnerId(user, requestedOwner ?? existing.ownerId);
    const data = { name: rest.name, industry: rest.industry ?? null, website: rest.website ?? null, phone: rest.phone ?? null, address: rest.address ?? null, ownerId };
    const updated = await db.company.update({ where: { id }, data });
    const customDiff = await saveFieldValues("COMPANY", id, defs, cf.values);
    const changes = { ...diff(existing, updated), ...customDiff };
    if (Object.keys(changes).length) await logAudit(user, "Company", id, "UPDATE", changes);
  } catch (e) {
    return toActionError(e, t);
  }
  revalidatePath("/companies");
  redirect(`/companies/${id}`);
}

export async function deleteCompany(id: string) {
  const user = await requireUser();
  const t = await getT();
  const existing = await db.company.findUnique({ where: { id } });
  if (!existing) redirect("/companies");
  assertOwns(user, "company", existing);
  assertCan(user, "company", "delete");
  await db.company.delete({ where: { id } });
  await deleteFieldValues("COMPANY", id);
  await logAudit(user, "Company", id, "DELETE", { name: existing.name });
  revalidatePath("/companies");
  redirect("/companies");
}

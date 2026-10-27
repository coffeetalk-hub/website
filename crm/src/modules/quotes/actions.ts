"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/core/db";
import { requireUser } from "@/core/auth/session";
import { getT } from "@/core/i18n/server";
import { assertCan, assertOwns } from "@/core/permissions";
import { logAudit } from "@/core/audit";
import { formToObject, toActionError, zodErrors, type ActionState } from "@/core/forms";
import { nextNumber } from "@/core/numbering";
import { calcTotals } from "@/modules/billing/totals";
import { parseLines } from "@/modules/billing/lines";
import { addDays, checkLinks, parseDate } from "@/modules/billing/links";
import { getCompanyProfile } from "@/modules/billing/profile";
import { QUOTE_TRANSITIONS, quoteSchema, type QuoteStatus } from "./schema";

export async function createQuote(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const t = await getT();
  let id: string;
  try {
    assertCan(user, "quote", "create");
    const header = quoteSchema.safeParse(formToObject(fd));
    if (!header.success) return zodErrors(header.error, t);
    const lines = parseLines(fd.get("lines"));
    if (!lines) return { error: t.errors.linesInvalid };
    const links = await checkLinks(user, header.data);
    const profile = await getCompanyProfile();
    const issueDate = parseDate(header.data.issueDate) ?? new Date();
    const rec = await db.quote.create({
      data: {
        number: await nextNumber("Q", "quote", issueDate),
        issueDate,
        validUntil: parseDate(header.data.validUntil) ?? addDays(issueDate, profile.quoteValidityDays),
        notes: header.data.notes ?? null,
        terms: header.data.terms ?? null,
        ...links,
        ownerId: user.id,
        lines: { create: lines.map((l, i) => ({ ...l, productId: l.productId || null, position: i })) },
      },
    });
    await logAudit(user, "Quote", rec.id, "CREATE", { number: rec.number, total: calcTotals(lines).total });
    id = rec.id;
  } catch (e) {
    return toActionError(e, t);
  }
  revalidatePath("/quotes");
  redirect(`/quotes/${id}`);
}

export async function updateQuote(id: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const t = await getT();
  try {
    const existing = await db.quote.findUnique({ where: { id } });
    if (!existing) return { error: t.errors.notFound };
    assertOwns(user, "quote", existing);
    assertCan(user, "quote", "update");
    if (existing.status !== "DRAFT") return { error: t.errors.quoteLocked };
    const header = quoteSchema.safeParse(formToObject(fd));
    if (!header.success) return zodErrors(header.error, t);
    const lines = parseLines(fd.get("lines"));
    if (!lines) return { error: t.errors.linesInvalid };
    const links = await checkLinks(user, header.data);
    await db.$transaction([
      db.quoteLine.deleteMany({ where: { quoteId: id } }),
      db.quote.update({
        where: { id },
        data: {
          issueDate: parseDate(header.data.issueDate) ?? existing.issueDate,
          validUntil: parseDate(header.data.validUntil),
          notes: header.data.notes ?? null,
          terms: header.data.terms ?? null,
          ...links,
          lines: { create: lines.map((l, i) => ({ ...l, productId: l.productId || null, position: i })) },
        },
      }),
    ]);
    await logAudit(user, "Quote", id, "UPDATE", { total: { from: null, to: calcTotals(lines).total } });
  } catch (e) {
    return toActionError(e, t);
  }
  revalidatePath("/quotes");
  redirect(`/quotes/${id}`);
}

export async function setQuoteStatus(id: string, status: QuoteStatus) {
  const user = await requireUser();
  const q = await db.quote.findUnique({ where: { id }, include: { invoices: { where: { status: { not: "CANCELLED" } }, select: { id: true } } } });
  if (!q) redirect("/quotes");
  assertOwns(user, "quote", q);
  assertCan(user, "quote", "update");
  const allowed = QUOTE_TRANSITIONS[q.status as QuoteStatus] ?? [];
  if (allowed.includes(status) && !(status === "DRAFT" && q.invoices.length > 0)) {
    await db.quote.update({ where: { id }, data: { status } });
    await logAudit(user, "Quote", id, "UPDATE", { status: { from: q.status, to: status } });
  }
  revalidatePath(`/quotes/${id}`);
  redirect(`/quotes/${id}`);
}

export async function deleteQuote(id: string) {
  const user = await requireUser();
  const q = await db.quote.findUnique({ where: { id } });
  if (!q) redirect("/quotes");
  assertOwns(user, "quote", q);
  assertCan(user, "quote", "delete");
  if (q.status !== "DRAFT") redirect(`/quotes/${id}`);
  await db.quote.delete({ where: { id } });
  await logAudit(user, "Quote", id, "DELETE", { number: q.number });
  revalidatePath("/quotes");
  redirect("/quotes");
}

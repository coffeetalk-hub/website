"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
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
import { getCompanyProfile, isValidVatNumber } from "@/modules/billing/profile";
import { invoiceSchema } from "./schema";

const draftNumber = () => `DRAFT-${randomUUID().slice(0, 8).toUpperCase()}`;

export async function createInvoice(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const t = await getT();
  let id: string;
  try {
    assertCan(user, "invoice", "create");
    const header = invoiceSchema.safeParse(formToObject(fd));
    if (!header.success) return zodErrors(header.error, t);
    const lines = parseLines(fd.get("lines"));
    if (!lines) return { error: t.errors.linesInvalid };
    const { buyerName, buyerVat, buyerAddress, issueDate, dueDate, notes, ...rest } = header.data;
    const links = await checkLinks(user, rest);
    const profile = await getCompanyProfile();
    const issue = parseDate(issueDate) ?? new Date();
    const rec = await db.invoice.create({
      data: {
        number: draftNumber(),
        issueDate: issue,
        dueDate: parseDate(dueDate) ?? addDays(issue, profile.paymentTermsDays),
        buyerName,
        buyerVat: buyerVat ?? null,
        buyerAddress: buyerAddress ?? null,
        notes: notes ?? null,
        ...links,
        ownerId: user.id,
        lines: { create: lines.map((l, i) => ({ description: l.description, qty: l.qty, unitPrice: l.unitPrice, discountPct: l.discountPct, vatRate: l.vatRate, position: i })) },
      },
    });
    await logAudit(user, "Invoice", rec.id, "CREATE", { total: calcTotals(lines).total });
    id = rec.id;
  } catch (e) {
    return toActionError(e, t);
  }
  revalidatePath("/invoices");
  redirect(`/invoices/${id}`);
}

/** Copy an accepted quote into a draft invoice (buyer details can be completed before issuing). */
export async function createInvoiceFromQuote(quoteId: string) {
  const user = await requireUser();
  assertCan(user, "invoice", "create");
  const q = await db.quote.findUnique({ where: { id: quoteId }, include: { lines: { orderBy: { position: "asc" } }, company: true, contact: true, invoices: { where: { status: { not: "CANCELLED" } }, select: { id: true } } } });
  if (!q) redirect("/quotes");
  assertOwns(user, "quote", q);
  if (q.invoices.length) redirect(`/invoices/${q.invoices[0].id}`); // one live invoice per quote
  if (q.status !== "ACCEPTED") redirect(`/quotes/${quoteId}`);
  const profile = await getCompanyProfile();
  const now = new Date();
  const inv = await db.invoice.create({
    data: {
      number: draftNumber(),
      issueDate: now,
      dueDate: addDays(now, profile.paymentTermsDays),
      quoteId: q.id,
      dealId: q.dealId,
      companyId: q.companyId,
      contactId: q.contactId,
      ownerId: q.ownerId,
      buyerName: q.company?.name ?? (q.contact ? `${q.contact.firstName} ${q.contact.lastName}` : ""),
      buyerAddress: q.company?.address ?? null,
      notes: q.notes,
      lines: { create: q.lines.map((l, i) => ({ description: l.description, qty: l.qty, unitPrice: l.unitPrice, discountPct: l.discountPct, vatRate: l.vatRate, position: i })) },
    },
  });
  await logAudit(user, "Invoice", inv.id, "CREATE", { fromQuote: q.number });
  revalidatePath("/invoices");
  redirect(`/invoices/${inv.id}`);
}

export async function updateInvoice(id: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const t = await getT();
  try {
    assertCan(user, "invoice", "update");
    const existing = await db.invoice.findUnique({ where: { id } });
    if (!existing) return { error: t.errors.notFound };
    assertOwns(user, "invoice", existing);
    if (existing.status !== "DRAFT") return { error: t.errors.invoiceLocked };
    const header = invoiceSchema.safeParse(formToObject(fd));
    if (!header.success) return zodErrors(header.error, t);
    const lines = parseLines(fd.get("lines"));
    if (!lines) return { error: t.errors.linesInvalid };
    const { buyerName, buyerVat, buyerAddress, issueDate, dueDate, notes, ...rest } = header.data;
    const links = await checkLinks(user, rest);
    await db.$transaction([
      db.invoiceLine.deleteMany({ where: { invoiceId: id } }),
      db.invoice.update({
        where: { id },
        data: {
          buyerName,
          buyerVat: buyerVat ?? null,
          buyerAddress: buyerAddress ?? null,
          issueDate: parseDate(issueDate) ?? existing.issueDate,
          dueDate: parseDate(dueDate),
          notes: notes ?? null,
          ...links,
          lines: { create: lines.map((l, i) => ({ description: l.description, qty: l.qty, unitPrice: l.unitPrice, discountPct: l.discountPct, vatRate: l.vatRate, position: i })) },
        },
      }),
    ]);
    await logAudit(user, "Invoice", id, "UPDATE", { total: { from: null, to: calcTotals(lines).total } });
  } catch (e) {
    return toActionError(e, t);
  }
  revalidatePath("/invoices");
  redirect(`/invoices/${id}`);
}

/** Assigns the gap-free tax invoice number and locks the invoice. */
export async function issueInvoice(id: string) {
  const user = await requireUser();
  assertCan(user, "invoice", "update");
  const inv = await db.invoice.findUnique({ where: { id }, include: { lines: true } });
  if (!inv) redirect("/invoices");
  assertOwns(user, "invoice", inv);
  if (inv.status !== "DRAFT") redirect(`/invoices/${id}`);
  const profile = await getCompanyProfile();
  if (!isValidVatNumber(profile.vatNumber) || !(profile.nameEn || profile.nameAr)) redirect(`/invoices/${id}?error=profile`);
  if (inv.lines.length === 0) redirect(`/invoices/${id}`);
  const number = await nextNumber("INV", "invoice");
  const now = new Date();
  await db.invoice.update({ where: { id }, data: { number, status: "ISSUED", issuedAt: now } });
  await logAudit(user, "Invoice", id, "UPDATE", { status: { from: "DRAFT", to: "ISSUED" }, number: { from: inv.number, to: number } });
  revalidatePath("/invoices");
  redirect(`/invoices/${id}`);
}

export async function markInvoicePaid(id: string) {
  const user = await requireUser();
  assertCan(user, "invoice", "update");
  const inv = await db.invoice.findUnique({ where: { id } });
  if (!inv) redirect("/invoices");
  assertOwns(user, "invoice", inv);
  if (inv.status === "ISSUED") {
    await db.invoice.update({ where: { id }, data: { status: "PAID", paidAt: new Date() } });
    await logAudit(user, "Invoice", id, "UPDATE", { status: { from: "ISSUED", to: "PAID" } });
  }
  revalidatePath(`/invoices/${id}`);
  redirect(`/invoices/${id}`);
}

export async function cancelInvoice(id: string) {
  const user = await requireUser();
  assertCan(user, "invoice", "update");
  const inv = await db.invoice.findUnique({ where: { id } });
  if (!inv) redirect("/invoices");
  assertOwns(user, "invoice", inv);
  if (inv.status === "ISSUED") {
    await db.invoice.update({ where: { id }, data: { status: "CANCELLED" } });
    await logAudit(user, "Invoice", id, "UPDATE", { status: { from: "ISSUED", to: "CANCELLED" } });
  }
  revalidatePath(`/invoices/${id}`);
  redirect(`/invoices/${id}`);
}

export async function deleteInvoice(id: string) {
  const user = await requireUser();
  assertCan(user, "invoice", "delete");
  const inv = await db.invoice.findUnique({ where: { id } });
  if (!inv) redirect("/invoices");
  assertOwns(user, "invoice", inv);
  if (inv.status !== "DRAFT") redirect(`/invoices/${id}`); // issued invoices are never deleted (they can be cancelled)
  await db.invoice.delete({ where: { id } });
  await logAudit(user, "Invoice", id, "DELETE", { draft: true });
  revalidatePath("/invoices");
  redirect("/invoices");
}

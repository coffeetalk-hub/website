import { notFound } from "next/navigation";
import { requireAccess } from "@/core/auth/session";
import { getT } from "@/core/i18n/server";
import { getInvoice } from "@/modules/invoices/queries";
import { getCompanyProfile, isValidVatNumber } from "@/modules/billing/profile";
import { calcTotals } from "@/modules/billing/totals";
import { qrSvg, zatcaTlv } from "@/modules/billing/zatca";
import { DocumentSheet } from "@/modules/billing/components/document-sheet";
import { PrintButton } from "@/modules/billing/components/print-button";

export default async function PrintInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const user = await requireAccess("invoice");
  const { id } = await params;
  const inv = await getInvoice(user, id);
  if (!inv) notFound();
  const profile = await getCompanyProfile();

  // ZATCA Phase 1 QR: only for issued invoices of a seller with a valid VAT number.
  let qr: { svg: string; payload: string } | null = null;
  if (inv.status !== "DRAFT" && inv.issuedAt && isValidVatNumber(profile.vatNumber)) {
    const totals = calcTotals(inv.lines);
    const payload = zatcaTlv({ sellerName: profile.nameAr || profile.nameEn, vatNumber: profile.vatNumber, timestamp: inv.issuedAt, total: totals.total, vat: totals.vat });
    qr = { payload, svg: await qrSvg(payload) };
  }
  return (
    <>
      <div className="mx-auto mb-4 flex max-w-[820px] justify-end print:hidden">
        <PrintButton />
      </div>
      <DocumentSheet
        t={t}
        profile={profile}
        lines={inv.lines}
        qr={qr}
        doc={{ kind: "invoice", number: inv.number, status: inv.status, issueDate: inv.issueDate, secondDate: inv.dueDate, buyerName: inv.buyerName, buyerVat: inv.buyerVat, buyerAddress: inv.buyerAddress, notes: inv.notes }}
      />
      {qr && <pre className="sr-only" data-testid="zatca-payload">{qr.payload}</pre>}
    </>
  );
}

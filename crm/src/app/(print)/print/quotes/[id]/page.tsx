import { notFound } from "next/navigation";
import { requireAccess } from "@/core/auth/session";
import { getT } from "@/core/i18n/server";
import { getQuote } from "@/modules/quotes/queries";
import { getCompanyProfile } from "@/modules/billing/profile";
import { DocumentSheet } from "@/modules/billing/components/document-sheet";
import { PrintButton } from "@/modules/billing/components/print-button";

export default async function PrintQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const user = await requireAccess("quote");
  const { id } = await params;
  const q = await getQuote(user, id);
  if (!q) notFound();
  const profile = await getCompanyProfile();
  return (
    <>
      <div className="mx-auto mb-4 flex max-w-[820px] justify-end print:hidden">
        <PrintButton />
      </div>
      <DocumentSheet
        t={t}
        profile={profile}
        lines={q.lines}
        doc={{
          kind: "quote",
          number: q.number,
          status: q.status,
          issueDate: q.issueDate,
          secondDate: q.validUntil,
          buyerName: q.company?.name ?? (q.contact ? `${q.contact.firstName} ${q.contact.lastName}` : ""),
          buyerAddress: q.company?.address,
          notes: q.notes,
          terms: q.terms,
        }}
      />
    </>
  );
}

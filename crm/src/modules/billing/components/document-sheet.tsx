import type { T } from "@/core/i18n";
import type { CompanyProfile } from "../profile";
import { calcTotals, lineAmounts } from "../totals";

// Saudi tax documents are bilingual (Arabic is required), so this sheet always shows English / Arabic labels
// regardless of the user's UI language.
const L = {
  taxInvoice: ["Tax Invoice", "فاتورة ضريبية"],
  quote: ["Quotation", "عرض سعر"],
  number: ["Number", "الرقم"],
  issueDate: ["Issue date", "تاريخ الإصدار"],
  dueDate: ["Due date", "تاريخ الاستحقاق"],
  validUntil: ["Valid until", "صالح حتى"],
  seller: ["Seller", "البائع"],
  buyer: ["Buyer", "المشتري"],
  vatNo: ["VAT No.", "الرقم الضريبي"],
  crNo: ["CR No.", "السجل التجاري"],
  address: ["Address", "العنوان"],
  description: ["Description", "الوصف"],
  qty: ["Qty", "الكمية"],
  unit: ["Unit price", "سعر الوحدة"],
  disc: ["Disc. %", "خصم %"],
  net: ["Net", "الصافي"],
  vatPct: ["VAT %", "الضريبة %"],
  vat: ["VAT", "الضريبة"],
  total: ["Total", "الإجمالي"],
  subtotal: ["Subtotal (excl. VAT)", "المجموع قبل الضريبة"],
  vatTotal: ["Total VAT", "إجمالي الضريبة"],
  grand: ["Total (incl. VAT)", "الإجمالي شامل الضريبة"],
  notes: ["Notes", "ملاحظات"],
  terms: ["Terms", "الشروط"],
  bank: ["Bank details", "البيانات البنكية"],
  draft: ["DRAFT", "مسودة"],
  cancelled: ["CANCELLED", "ملغاة"],
} as const;

function Bi({ k, className }: { k: keyof typeof L; className?: string }) {
  return (
    <span className={className}>
      {L[k][0]} <span className="text-neutral-500">/</span> <span dir="rtl">{L[k][1]}</span>
    </span>
  );
}

export type SheetDoc = {
  kind: "quote" | "invoice";
  number: string;
  status: string;
  issueDate: Date;
  secondDate: Date | null; // valid until (quote) or due date (invoice)
  buyerName: string;
  buyerVat?: string | null;
  buyerAddress?: string | null;
  notes?: string | null;
  terms?: string | null;
};

export function DocumentSheet({
  doc,
  lines,
  profile,
  qr,
  t,
}: {
  doc: SheetDoc;
  lines: { id: string; description: string; qty: number; unitPrice: number; discountPct: number; vatRate: number }[];
  profile: CompanyProfile;
  qr?: { svg: string; payload: string } | null;
  t: T;
}) {
  const totals = calcTotals(lines);
  const draft = doc.status === "DRAFT" && doc.kind === "invoice";
  const cancelled = doc.status === "CANCELLED";
  const sellerName = [profile.nameEn, profile.nameAr].filter(Boolean);
  return (
    <article className="relative mx-auto w-full max-w-[820px] bg-white p-8 text-[13px] leading-relaxed text-neutral-900 shadow-lg print:max-w-none print:p-0 print:shadow-none" data-testid="document-sheet">
      {(draft || cancelled) && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-7xl font-black tracking-widest text-neutral-300/50 print:text-neutral-300/40">
          {cancelled ? `${L.cancelled[0]} ${L.cancelled[1]}` : `${L.draft[0]} ${L.draft[1]}`}
        </div>
      )}

      <header className="flex items-start justify-between gap-6 border-b pb-4">
        <div>
          {sellerName.length === 0 && <div className="text-lg font-bold text-neutral-400">—</div>}
          {profile.nameEn && <div className="text-lg font-bold">{profile.nameEn}</div>}
          {profile.nameAr && (
            <div dir="rtl" className="text-lg font-bold">
              {profile.nameAr}
            </div>
          )}
          {profile.address && <div className="mt-1 max-w-xs whitespace-pre-line text-neutral-600">{profile.address}</div>}
          <div className="mt-1 text-neutral-600">{[profile.phone, profile.email].filter(Boolean).join(" · ")}</div>
          {profile.vatNumber && (
            <div className="mt-1">
              <Bi k="vatNo" /> : <span dir="ltr">{profile.vatNumber}</span>
            </div>
          )}
          {profile.crNumber && (
            <div>
              <Bi k="crNo" /> : <span dir="ltr">{profile.crNumber}</span>
            </div>
          )}
        </div>
        <div className="text-end">
          <h1 className="text-xl font-extrabold">
            <Bi k={doc.kind === "invoice" ? "taxInvoice" : "quote"} />
          </h1>
          <dl className="mt-2 space-y-0.5">
            <div>
              <Bi k="number" /> : <span dir="ltr" className="font-semibold">{doc.number.startsWith("DRAFT-") ? "—" : doc.number}</span>
            </div>
            <div>
              <Bi k="issueDate" /> : <span dir="ltr">{t.date(doc.issueDate)}</span>
            </div>
            {doc.secondDate && (
              <div>
                <Bi k={doc.kind === "invoice" ? "dueDate" : "validUntil"} /> : <span dir="ltr">{t.date(doc.secondDate)}</span>
              </div>
            )}
          </dl>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-6 border-b py-4">
        <div>
          <div className="text-xs font-semibold uppercase text-neutral-500">
            <Bi k="buyer" />
          </div>
          <div className="font-semibold">{doc.buyerName || "—"}</div>
          {doc.buyerAddress && <div className="whitespace-pre-line text-neutral-600">{doc.buyerAddress}</div>}
          {doc.buyerVat && (
            <div>
              <Bi k="vatNo" /> : <span dir="ltr">{doc.buyerVat}</span>
            </div>
          )}
        </div>
      </section>

      <table className="mt-4 w-full border-collapse text-[12px]">
        <thead>
          <tr className="bg-neutral-100 text-start">
            {(["description", "qty", "unit", "disc", "net", "vatPct", "vat", "total"] as const).map((k, i) => (
              <th key={k} className={`border px-2 py-1.5 font-semibold ${i === 0 ? "text-start" : "text-end"}`}>
                {L[k][0]}
                <br />
                <span dir="rtl">{L[k][1]}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => {
            const a = lineAmounts(l);
            return (
              <tr key={l.id}>
                <td className="border px-2 py-1.5">{l.description}</td>
                <td className="border px-2 py-1.5 text-end tabular-nums" dir="ltr">{l.qty}</td>
                <td className="border px-2 py-1.5 text-end tabular-nums" dir="ltr">{l.unitPrice.toFixed(2)}</td>
                <td className="border px-2 py-1.5 text-end tabular-nums" dir="ltr">{l.discountPct}%</td>
                <td className="border px-2 py-1.5 text-end tabular-nums" dir="ltr">{a.net.toFixed(2)}</td>
                <td className="border px-2 py-1.5 text-end tabular-nums" dir="ltr">{l.vatRate}%</td>
                <td className="border px-2 py-1.5 text-end tabular-nums" dir="ltr">{a.vat.toFixed(2)}</td>
                <td className="border px-2 py-1.5 text-end tabular-nums" dir="ltr">{a.gross.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-4 flex items-start justify-between gap-6">
        {qr ? (
          <div className="text-center">
            <div className="mx-auto h-[140px] w-[140px] [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qr.svg }} />
            <div className="mt-1 max-w-[180px] text-[10px] text-neutral-500">{t.invoices.zatcaNote}</div>
          </div>
        ) : (
          <div />
        )}
        <dl className="w-72 space-y-1">
          <div className="flex justify-between">
            <dt><Bi k="subtotal" /></dt>
            <dd className="tabular-nums" dir="ltr">{totals.net.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between">
            <dt><Bi k="vatTotal" /></dt>
            <dd className="tabular-nums" dir="ltr">{totals.vat.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between border-t-2 border-neutral-900 pt-1 text-base font-extrabold">
            <dt><Bi k="grand" /></dt>
            <dd className="tabular-nums" dir="ltr" data-testid="sheet-total">{totals.total.toFixed(2)} SAR</dd>
          </div>
        </dl>
      </div>

      {(doc.notes || doc.terms || profile.bankDetails) && (
        <footer className="mt-6 grid grid-cols-1 gap-3 border-t pt-3 text-[12px] text-neutral-700">
          {doc.notes && (
            <div>
              <div className="font-semibold"><Bi k="notes" /></div>
              <div className="whitespace-pre-wrap">{doc.notes}</div>
            </div>
          )}
          {doc.terms && (
            <div>
              <div className="font-semibold"><Bi k="terms" /></div>
              <div className="whitespace-pre-wrap">{doc.terms}</div>
            </div>
          )}
          {profile.bankDetails && (
            <div>
              <div className="font-semibold"><Bi k="bank" /></div>
              <div className="whitespace-pre-wrap" dir="ltr">{profile.bankDetails}</div>
            </div>
          )}
        </footer>
      )}
      {profile.footerNote && <p className="mt-4 text-center text-[11px] text-neutral-500">{profile.footerNote}</p>}
    </article>
  );
}

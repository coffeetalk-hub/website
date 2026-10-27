import { getT } from "@/core/i18n/server";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { calcTotals, lineAmounts, type LineInput } from "../totals";

type Line = LineInput & { id: string; description: string };

/** Read-only line items with per-line amounts and a totals block (screen view; the print sheet has its own). */
export async function LinesTable({ lines }: { lines: Line[] }) {
  const t = await getT();
  const totals = calcTotals(lines);
  return (
    <div className="space-y-3">
      <Table>
        <THead>
          <TR>
            <TH>{t.billing.description}</TH>
            <TH className="text-end">{t.billing.qty}</TH>
            <TH className="text-end">{t.billing.unitPrice}</TH>
            <TH className="hidden text-end sm:table-cell">{t.billing.discount}</TH>
            <TH className="hidden text-end sm:table-cell">{t.billing.vat}</TH>
            <TH className="text-end">{t.billing.lineTotal}</TH>
          </TR>
        </THead>
        <TBody>
          {lines.map((l) => (
            <TR key={l.id}>
              <TD>{l.description}</TD>
              <TD className="text-end tabular-nums">{l.qty}</TD>
              <TD className="text-end tabular-nums">{t.money2(l.unitPrice)}</TD>
              <TD className="hidden text-end tabular-nums sm:table-cell">{l.discountPct}%</TD>
              <TD className="hidden text-end tabular-nums sm:table-cell">{l.vatRate}%</TD>
              <TD className="text-end tabular-nums">{t.money2(lineAmounts(l).gross)}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
      <dl className="ms-auto w-full max-w-xs space-y-1 text-sm">
        <div className="flex justify-between">
          <dt>{t.billing.subtotal}</dt>
          <dd className="tabular-nums" data-testid="subtotal">{t.money2(totals.net)}</dd>
        </div>
        {totals.byRate.map((r) => (
          <div key={r.rate} className="flex justify-between text-muted-foreground">
            <dt>
              {t.billing.vatTotal} {r.rate}%
            </dt>
            <dd className="tabular-nums">{t.money2(r.vat)}</dd>
          </div>
        ))}
        <div className="flex justify-between border-t pt-1 text-base font-bold">
          <dt>{t.billing.total}</dt>
          <dd className="tabular-nums" data-testid="grand-total">{t.money2(totals.total)}</dd>
        </div>
      </dl>
    </div>
  );
}

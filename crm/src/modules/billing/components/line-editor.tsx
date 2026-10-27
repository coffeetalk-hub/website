"use client";
import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useT } from "@/core/i18n/client";
import { calcTotals, lineAmounts } from "../totals";

export type EditorLine = { key: string; productId: string | null; description: string; qty: string; unitPrice: string; discountPct: string; vatRate: string };
export type EditorProduct = { id: string; name: string; unitPrice: number; vatRate: number; description: string | null };

let counter = 0;
const newKey = () => `l${Date.now()}_${counter++}`;
const num = (s: string) => (Number.isFinite(Number(s)) && s.trim() !== "" ? Number(s) : 0);

/** Line items table with live totals. Posts the lines as JSON in a hidden `lines` field. */
export function LineEditor({
  products,
  initial,
  defaultVat,
  readOnly,
}: {
  products: EditorProduct[];
  initial: { productId: string | null; description: string; qty: number; unitPrice: number; discountPct: number; vatRate: number }[];
  defaultVat: number;
  readOnly?: boolean;
}) {
  const t = useT();
  const blank = (): EditorLine => ({ key: newKey(), productId: null, description: "", qty: "1", unitPrice: "", discountPct: "0", vatRate: String(defaultVat) });
  const [lines, setLines] = useState<EditorLine[]>(() =>
    initial.length
      ? initial.map((l) => ({ key: newKey(), productId: l.productId, description: l.description, qty: String(l.qty), unitPrice: String(l.unitPrice), discountPct: String(l.discountPct), vatRate: String(l.vatRate) }))
      : [blank()],
  );
  const set = (key: string, patch: Partial<EditorLine>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const payload = JSON.stringify(lines.map(({ key: _k, ...l }) => ({ ...l, qty: num(l.qty), unitPrice: num(l.unitPrice), discountPct: num(l.discountPct), vatRate: num(l.vatRate) })));
  const totals = useMemo(() => calcTotals(lines.map((l) => ({ qty: num(l.qty), unitPrice: num(l.unitPrice), discountPct: num(l.discountPct), vatRate: num(l.vatRate) }))), [lines]);

  return (
    <div className="space-y-3">
      <input type="hidden" name="lines" value={payload} />
      <div className="space-y-3">
        {lines.map((l, i) => {
          const amt = lineAmounts({ qty: num(l.qty), unitPrice: num(l.unitPrice), discountPct: num(l.discountPct), vatRate: num(l.vatRate) });
          return (
            <div key={l.key} className="grid gap-2 rounded-xl border p-3 sm:grid-cols-12" data-testid="line-row">
              <div className="sm:col-span-12 lg:col-span-4">
                <Select
                  aria-label={t.billing.product}
                  disabled={readOnly}
                  value={l.productId ?? ""}
                  onChange={(e) => {
                    const p = products.find((x) => x.id === e.target.value);
                    set(l.key, p ? { productId: p.id, description: p.name, unitPrice: String(p.unitPrice), vatRate: String(p.vatRate) } : { productId: null });
                  }}
                >
                  <option value="">{t.billing.customItem}</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="sm:col-span-12 lg:col-span-8">
                <Input aria-label={t.billing.description} placeholder={t.billing.description} disabled={readOnly} value={l.description} onChange={(e) => set(l.key, { description: e.target.value })} />
              </div>
              <label className="space-y-0.5 text-xs text-muted-foreground sm:col-span-3">
                {t.billing.qty}
                <Input type="number" min="0" step="any" disabled={readOnly} value={l.qty} onChange={(e) => set(l.key, { qty: e.target.value })} className="text-foreground" />
              </label>
              <label className="space-y-0.5 text-xs text-muted-foreground sm:col-span-3">
                {t.billing.unitPrice}
                <Input type="number" min="0" step="0.01" disabled={readOnly} value={l.unitPrice} onChange={(e) => set(l.key, { unitPrice: e.target.value })} className="text-foreground" />
              </label>
              <label className="space-y-0.5 text-xs text-muted-foreground sm:col-span-2">
                {t.billing.discount}
                <Input type="number" min="0" max="100" step="any" disabled={readOnly} value={l.discountPct} onChange={(e) => set(l.key, { discountPct: e.target.value })} className="text-foreground" />
              </label>
              <label className="space-y-0.5 text-xs text-muted-foreground sm:col-span-2">
                {t.billing.vat}
                <Input type="number" min="0" max="100" step="any" disabled={readOnly} value={l.vatRate} onChange={(e) => set(l.key, { vatRate: e.target.value })} className="text-foreground" />
              </label>
              <div className="flex items-end justify-between gap-2 sm:col-span-2">
                <div className="text-end text-sm">
                  <div className="text-xs text-muted-foreground">{t.billing.lineTotal}</div>
                  <div className="font-semibold tabular-nums">{t.money2(amt.gross)}</div>
                </div>
                {!readOnly && lines.length > 1 && (
                  <button type="button" aria-label={`${t.billing.removeLine} ${i + 1}`} title={t.billing.removeLine} onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))} className="rounded-lg p-2 text-destructive hover:bg-accent">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {!readOnly && (
        <Button type="button" variant="outline" size="sm" onClick={() => setLines((ls) => [...ls, blank()])}>
          <Plus className="h-4 w-4" />
          {t.billing.addLine}
        </Button>
      )}
      <dl className="ms-auto w-full max-w-xs space-y-1 rounded-xl bg-secondary/60 p-3 text-sm">
        <div className="flex justify-between">
          <dt>{t.billing.subtotal}</dt>
          <dd className="tabular-nums" data-testid="subtotal">{t.money2(totals.net)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>{t.billing.vatTotal}</dt>
          <dd className="tabular-nums" data-testid="vat-total">{t.money2(totals.vat)}</dd>
        </div>
        <div className="flex justify-between border-t pt-1 font-bold">
          <dt>{t.billing.total}</dt>
          <dd className="tabular-nums" data-testid="grand-total">{t.money2(totals.total)}</dd>
        </div>
      </dl>
    </div>
  );
}

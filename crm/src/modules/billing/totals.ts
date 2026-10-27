export type LineInput = { qty: number; unitPrice: number; discountPct: number; vatRate: number };

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Per-line amounts, rounded to halalas line by line (the way e-invoices are computed). */
export function lineAmounts(l: LineInput) {
  const net = round2(l.qty * l.unitPrice * (1 - l.discountPct / 100));
  const vat = round2((net * l.vatRate) / 100);
  return { net, vat, gross: round2(net + vat) };
}

export function calcTotals(lines: LineInput[]) {
  let net = 0;
  let vat = 0;
  const byRate = new Map<number, { net: number; vat: number }>();
  for (const l of lines) {
    const a = lineAmounts(l);
    net += a.net;
    vat += a.vat;
    const r = byRate.get(l.vatRate) ?? { net: 0, vat: 0 };
    r.net += a.net;
    r.vat += a.vat;
    byRate.set(l.vatRate, r);
  }
  return {
    net: round2(net),
    vat: round2(vat),
    total: round2(net + vat),
    byRate: [...byRate.entries()].map(([rate, v]) => ({ rate, net: round2(v.net), vat: round2(v.vat) })).sort((a, b) => a.rate - b.rate),
  };
}

// Date ranges for reports. All boundaries are server-local midnight (same convention as due dates).
export const RANGES = ["thisMonth", "lastMonth", "thisQuarter", "thisYear", "last12", "custom"] as const;
export type RangeKey = (typeof RANGES)[number];
export type Range = { key: RangeKey; from: Date; to: Date; fromStr: string; toStr: string };

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function resolveRange(key: string | undefined, fromStr?: string, toStr?: string): Range {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  let k: RangeKey = (RANGES as readonly string[]).includes(key ?? "") ? (key as RangeKey) : "thisYear";
  let from: Date;
  let to: Date;
  switch (k) {
    case "thisMonth":
      from = new Date(y, m, 1);
      to = endOfDay(new Date(y, m + 1, 0));
      break;
    case "lastMonth":
      from = new Date(y, m - 1, 1);
      to = endOfDay(new Date(y, m, 0));
      break;
    case "thisQuarter": {
      const q = Math.floor(m / 3) * 3;
      from = new Date(y, q, 1);
      to = endOfDay(new Date(y, q + 3, 0));
      break;
    }
    case "last12":
      from = new Date(y, m - 11, 1);
      to = endOfDay(new Date(y, m + 1, 0));
      break;
    case "custom": {
      const f = fromStr ? new Date(fromStr) : null;
      const t = toStr ? new Date(toStr) : null;
      if (f && t && !Number.isNaN(+f) && !Number.isNaN(+t) && f <= t) {
        from = startOfDay(new Date(f.getFullYear(), f.getMonth(), f.getDate()));
        to = endOfDay(new Date(t.getFullYear(), t.getMonth(), t.getDate()));
        // keep queries sane: at most 5 years
        if (to.getTime() - from.getTime() > 5 * 366 * 86400000) from = new Date(to.getFullYear() - 5, to.getMonth(), to.getDate());
        break;
      }
      k = "thisYear"; // invalid custom range → default
      from = new Date(y, 0, 1);
      to = endOfDay(new Date(y, 11, 31));
      break;
    }
    default: // thisYear
      from = new Date(y, 0, 1);
      to = endOfDay(new Date(y, 11, 31));
  }
  return { key: k, from, to, fromStr: iso(from), toStr: iso(to) };
}

/** One bucket per calendar month overlapping the range (max 60). */
export function monthsIn(range: Range) {
  const out: { key: string; date: Date }[] = [];
  const d = new Date(range.from.getFullYear(), range.from.getMonth(), 1);
  while (d <= range.to && out.length < 60) {
    out.push({ key: `${d.getFullYear()}-${d.getMonth()}`, date: new Date(d) });
    d.setMonth(d.getMonth() + 1);
  }
  return out;
}
export const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;

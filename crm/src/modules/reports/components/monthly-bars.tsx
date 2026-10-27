import { getT } from "@/core/i18n/server";

type Series = { label: string; className: string };
type Month = { key: string; date: Date; values: number[] };

function niceMax(v: number) {
  if (v <= 0) return 100;
  const p = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / p) * p;
}
const short = (n: number) => (n >= 1e6 ? `${+(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n));

/** Pure CSS grouped bar chart (one bar per series per month). The time axis stays left-to-right in every language. */
export async function MonthlyBars({ months, series }: { months: Month[]; series: Series[] }) {
  const t = await getT();
  const max = niceMax(Math.max(0, ...months.flatMap((m) => m.values)));
  const ticks = [1, 0.75, 0.5, 0.25, 0];
  const showYear = months.length > 12;
  const label = (d: Date) => (showYear ? `${t.monthShort(d)} ${String(d.getFullYear()).slice(2)}` : t.monthShort(d));
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {series.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-sm ${s.className}`} /> {s.label}
          </span>
        ))}
      </div>
      <div dir="ltr" className="flex gap-2">
        <div className="flex h-52 flex-col justify-between pb-0.5 text-[10px] text-muted-foreground">
          {ticks.map((tick) => (
            <span key={tick} className="text-end leading-none">
              {short(max * tick)}
            </span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-0 flex h-52 flex-col justify-between">
            {ticks.map((tick) => (
              <div key={tick} className="border-t border-dashed border-border" />
            ))}
          </div>
          <div className="relative flex h-52 items-end justify-between gap-1">
            {months.map((m) => (
              <div key={m.key} className="flex h-full min-w-0 flex-1 items-end justify-center gap-0.5">
                {m.values.map((v, i) => (
                  <div key={i} className={`w-full max-w-5 rounded-t-md ${series[i].className}`} style={{ height: `${(v / max) * 100}%` }} title={`${label(m.date)} · ${series[i].label}: ${t.money(v)}`} />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between gap-1">
            {months.map((m) => (
              <span key={m.key} className="flex-1 truncate text-center text-[10px] text-muted-foreground sm:text-xs">
                {label(m.date)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

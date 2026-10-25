import { formatMoney } from "@/lib/utils";

type Month = { key: string; label: string; won: number; open: number; current: boolean };

function niceMax(v: number) {
  if (v <= 0) return 100;
  const p = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / p) * p;
}
const short = (n: number) => (n >= 1e6 ? `${+(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n));

/** Pure CSS grouped bar chart: won revenue (navy) vs expected open pipeline (coral). */
export function RevenueChart({ months }: { months: Month[] }) {
  const max = niceMax(Math.max(...months.map((m) => Math.max(m.won, m.open))));
  const ticks = [1, 0.75, 0.5, 0.25, 0];
  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-chart-1" /> Won revenue
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-chart-2" /> Expected (open deals)
        </span>
      </div>
      <div className="flex gap-2">
        <div className="flex h-52 flex-col justify-between pb-0.5 text-[10px] text-muted-foreground">
          {ticks.map((t) => (
            <span key={t} className="text-end leading-none">
              {short(max * t)}
            </span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-0 flex h-52 flex-col justify-between">
            {ticks.map((t) => (
              <div key={t} className="border-t border-dashed border-border" />
            ))}
          </div>
          <div className="relative flex h-52 items-end justify-between gap-1 sm:gap-2">
            {months.map((m) => (
              <div key={m.key} className="flex h-full min-w-0 flex-1 items-end justify-center gap-0.5">
                <div className="w-full max-w-5 rounded-t-md bg-chart-1" style={{ height: `${(m.won / max) * 100}%` }} title={`${m.label} won: ${formatMoney(m.won)}`} />
                <div className="w-full max-w-5 rounded-t-md bg-chart-2" style={{ height: `${(m.open / max) * 100}%` }} title={`${m.label} expected: ${formatMoney(m.open)}`} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between gap-1 sm:gap-2">
            {months.map((m) => (
              <span key={m.key} className={`flex-1 text-center text-[10px] sm:text-xs ${m.current ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                {m.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const C = 2 * Math.PI * 40;

export function OutcomeDonut({ won, open, lost }: { won: number; open: number; lost: number }) {
  const total = won + open + lost || 1;
  const segs = [
    { label: "Won", n: won, color: "hsl(var(--chart-1))" },
    { label: "Open", n: open, color: "hsl(var(--chart-2))" },
    { label: "Lost", n: lost, color: "hsl(var(--muted-foreground) / 0.35)" },
  ];
  let offset = 0;
  const closed = won + lost;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-around">
      <div className="relative h-36 w-36">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" role="img" aria-label="Deals by outcome">
          <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--secondary))" strokeWidth="16" />
          {segs.map((s) => {
            const len = (s.n / total) * C;
            const el = <circle key={s.label} cx="50" cy="50" r="40" fill="none" stroke={s.color} strokeWidth="16" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} />;
            offset += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{closed ? Math.round((won / closed) * 100) : 0}%</span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">win rate</span>
        </div>
      </div>
      <ul className="space-y-2 text-sm">
        {segs.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm" style={{ background: s.color }} />
            <span className="w-12">{s.label}</span>
            <span className="font-semibold">{s.n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

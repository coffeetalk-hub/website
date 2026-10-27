import { Card, CardContent } from "@/components/ui/card";

export function ReportStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="h-full">
      <CardContent className="pt-5">
        <div className="text-xl font-bold tracking-tight sm:text-2xl">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
        {hint && <div className="mt-1 text-xs text-muted-foreground/80">{hint}</div>}
      </CardContent>
    </Card>
  );
}

export const pct = (x: number | null) => (x == null ? "—" : `${Math.round(x * 100)}%`);

/** Right-aligned numeric column header/cell helpers keep tables readable in both directions. */
export const num = "text-end tabular-nums";

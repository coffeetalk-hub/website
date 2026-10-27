import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { getT } from "@/core/i18n/server";
import { RANGES, type Range } from "../range";

export async function ReportFilters({
  tab,
  range,
  ownerId,
  owners,
  showDates,
}: {
  tab: string;
  range: Range;
  ownerId?: string;
  owners?: { id: string; name: string }[]; // only passed to managers/admins
  showDates: boolean;
}) {
  const t = await getT();
  return (
    <form method="get" action="/reports" className="mb-4 flex flex-wrap items-end gap-2">
      <input type="hidden" name="tab" value={tab} />
      {showDates && (
        <>
          <label className="space-y-1 text-xs text-muted-foreground">
            {t.reports.period}
            <Select name="range" defaultValue={range.key} className="w-44 text-foreground">
              {RANGES.map((r) => (
                <option key={r} value={r}>
                  {t.reports.ranges[r]}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            {t.reports.from}
            <Input type="date" name="from" defaultValue={range.fromStr} className="w-40 text-foreground" />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            {t.reports.to}
            <Input type="date" name="to" defaultValue={range.toStr} className="w-40 text-foreground" />
          </label>
        </>
      )}
      {owners && owners.length > 1 && (
        <label className="space-y-1 text-xs text-muted-foreground">
          {t.reports.owner}
          <Select name="ownerId" defaultValue={ownerId ?? ""} className="w-44 text-foreground">
            <option value="">{t.reports.allOwners}</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
        </label>
      )}
      <Button type="submit" variant="secondary">
        {t.reports.apply}
      </Button>
      <Button type="button" variant="ghost" asChild>
        <Link href={`/reports?tab=${tab}`}>{t.common.clear}</Link>
      </Button>
    </form>
  );
}

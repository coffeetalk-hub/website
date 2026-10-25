import { Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { t } from "@/core/i18n";

export type FilterSelect = { name: string; label: string; value?: string; options: { value: string; label: string }[] };

/** Plain GET form — filters live in the URL, no client JS needed. */
export function ListFilters({ basePath, q, selects = [], hidden = {} }: { basePath: string; q?: string; selects?: FilterSelect[]; hidden?: Record<string, string> }) {
  const active = q || selects.some((s) => s.value);
  return (
    <form method="get" action={basePath} className="mb-4 flex flex-wrap items-center gap-2">
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input name="q" defaultValue={q} placeholder={t.common.search} className="ps-8" />
      </div>
      {selects.map((s) => (
        <Select key={s.name} name={s.name} defaultValue={s.value ?? ""} aria-label={s.label} className="w-auto min-w-[150px]">
          <option value="">{s.label}</option>
          {s.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      ))}
      <Button type="submit" variant="secondary">
        Filter
      </Button>
      {active && (
        <Button variant="ghost" asChild>
          <Link href={hidden && Object.keys(hidden).length ? `${basePath}?${new URLSearchParams(hidden)}` : basePath}>Clear</Link>
        </Button>
      )}
    </form>
  );
}

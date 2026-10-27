import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PAGE_SIZE } from "@/core/forms";
import { getT } from "@/core/i18n/server";

export async function Pagination({ page, total, basePath, params }: { page: number; total: number; basePath: string; params: Record<string, string | undefined> }) {
  const t = await getT();
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    sp.set("page", String(p));
    return `${basePath}?${sp}`;
  };
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
      <span>
        {t.tpl(t.common.pageOf, { total, page: Math.min(page, pages), pages })}
      </span>
      <div className="flex gap-2">
        {page > 1 && (
          <Button variant="outline" size="sm" asChild>
            <Link href={href(page - 1)}>{t.common.previous}</Link>
          </Button>
        )}
        {page < pages && (
          <Button variant="outline" size="sm" asChild>
            <Link href={href(page + 1)}>{t.common.next}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

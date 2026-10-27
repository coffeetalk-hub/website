import { getT } from "@/core/i18n/server";
import Link from "next/link";
import { requireUser } from "@/core/auth/session";
import { strParam } from "@/core/forms";
import { globalSearch } from "@/modules/search/queries";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const t = await getT();
  const user = await requireUser();
  const q = strParam((await searchParams).q);
  const r = q ? await globalSearch(user, q) : { contacts: [], companies: [], deals: [] };
  const empty = !r.contacts.length && !r.companies.length && !r.deals.length;

  return (
    <>
      <PageHeader title={q ? t.tpl(t.search.resultsFor, { q }) : t.search.title} />
      {!q && <p className="text-muted-foreground">{t.search.hint}</p>}
      {q && empty && <p className="text-muted-foreground">{t.search.nothing}</p>}
      <div className="grid gap-4 lg:grid-cols-3">
        {r.contacts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t.nav.contacts}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y text-sm">
                {r.contacts.map((c) => (
                  <li key={c.id} className="py-2">
                    <Link href={`/contacts/${c.id}`} className="font-medium hover:underline">
                      {c.firstName} {c.lastName}
                    </Link>
                    <div className="text-xs text-muted-foreground">{c.company?.name ?? c.email ?? ""}</div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        {r.companies.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t.nav.companies}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y text-sm">
                {r.companies.map((c) => (
                  <li key={c.id} className="py-2">
                    <Link href={`/companies/${c.id}`} className="font-medium hover:underline">
                      {c.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">{c.industry ?? ""}</div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        {r.deals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t.nav.deals}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y text-sm">
                {r.deals.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2 py-2">
                    <Link href={`/deals/${d.id}`} className="font-medium hover:underline">
                      {d.title}
                    </Link>
                    <span className="flex items-center gap-2">
                      <Badge>{d.stage.name}</Badge>
                      {t.money(d.value)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

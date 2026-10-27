import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/core/db";
import { requireAccess } from "@/core/auth/session";
import { can } from "@/core/permissions";
import { getT } from "@/core/i18n/server";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export default async function ProductsPage() {
  const t = await getT();
  const user = await requireAccess("product");
  const products = await db.product.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] });
  const manage = can(user, "product", "create");
  return (
    <>
      <PageHeader title={t.products.title}>
        {manage && (
          <Button asChild>
            <Link href="/products/new">
              <Plus className="h-4 w-4" />
              {t.products.new}
            </Link>
          </Button>
        )}
      </PageHeader>
      <p className="mb-4 text-sm text-muted-foreground">{t.products.help}</p>
      <Card>
        <Table>
          <THead>
            <TR>
              <TH>{t.products.name}</TH>
              <TH className="hidden sm:table-cell">{t.products.sku}</TH>
              <TH className="text-end">{t.products.unitPrice}</TH>
              <TH className="text-end">{t.products.vatRate}</TH>
              <TH>{t.common.status}</TH>
            </TR>
          </THead>
          <TBody>
            {products.map((p) => (
              <TR key={p.id}>
                <TD>
                  {manage ? (
                    <Link href={`/products/${p.id}/edit`} className="font-medium hover:underline">
                      {p.name}
                    </Link>
                  ) : (
                    <span className="font-medium">{p.name}</span>
                  )}
                  {p.description && <div className="line-clamp-1 text-xs text-muted-foreground">{p.description}</div>}
                </TD>
                <TD className="hidden sm:table-cell">{p.sku ?? "—"}</TD>
                <TD className="text-end tabular-nums">{t.money2(p.unitPrice)}</TD>
                <TD className="text-end tabular-nums">{p.vatRate}%</TD>
                <TD>{p.active ? <Badge>{t.products.active}</Badge> : <span className="text-muted-foreground">{t.products.inactive}</span>}</TD>
              </TR>
            ))}
            {products.length === 0 && (
              <TR>
                <TD colSpan={5} className="py-8 text-center text-muted-foreground">
                  {t.common.noResults}
                </TD>
              </TR>
            )}
          </TBody>
        </Table>
      </Card>
    </>
  );
}

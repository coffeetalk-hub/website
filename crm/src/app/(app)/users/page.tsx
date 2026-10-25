import { getT } from "@/core/i18n/server";
import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/core/db";
import { requireAccess } from "@/core/auth/session";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export default async function UsersPage() {
  const t = await getT();
  await requireAccess("user", "manage");
  const users = await db.user.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] });
  return (
    <>
      <PageHeader title={t.users.title}>
        <Button asChild>
          <Link href="/users/new">
            <Plus className="h-4 w-4" />
            {t.users.new}
          </Link>
        </Button>
      </PageHeader>
      <Card>
        <Table>
          <THead>
            <TR>
              <TH>{t.common.name}</TH>
              <TH>{t.common.email}</TH>
              <TH>{t.users.role}</TH>
              <TH>{t.common.status}</TH>
              <TH className="hidden md:table-cell">{t.common.created}</TH>
            </TR>
          </THead>
          <TBody>
            {users.map((u) => (
              <TR key={u.id}>
                <TD>
                  <Link href={`/users/${u.id}/edit`} className="font-medium hover:underline">
                    {u.name}
                  </Link>
                </TD>
                <TD>{u.email}</TD>
                <TD>
                  <Badge>{t.roles[u.role as keyof typeof t.roles]}</Badge>
                </TD>
                <TD>{u.active ? t.common.active : <span className="text-muted-foreground">{t.common.disabled}</span>}</TD>
                <TD className="hidden md:table-cell">{t.date(u.createdAt)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </>
  );
}

import { getT } from "@/core/i18n/server";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser } from "@/core/auth/session";
import { assertCan, isPrivileged } from "@/core/permissions";
import { strParam } from "@/core/forms";
import { listBoardDeals, listStages } from "@/modules/deals/queries";
import { Board } from "@/modules/deals/components/board";
import { listAssignableUsers } from "@/modules/users/queries";
import { PageHeader } from "@/components/page-header";
import { ListFilters } from "@/components/list-filters";
import { Button } from "@/components/ui/button";

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function DealsPage({ searchParams }: { searchParams: SP }) {
  const t = await getT();
  const user = await requireUser();
  assertCan(user, "deal");
  const sp = await searchParams;
  const q = strParam(sp.q);
  const ownerId = strParam(sp.ownerId);
  const [stages, deals, owners] = await Promise.all([listStages(), listBoardDeals(user, { q, ownerId }), listAssignableUsers(user)]);

  const open = new Set(stages.filter((s) => s.kind === "OPEN").map((s) => s.id));
  const pipeline = deals.filter((d) => open.has(d.stageId)).reduce((s, d) => s + d.value, 0);

  return (
    <>
      <PageHeader title={t.deals.title}>
        <span className="hidden text-sm text-muted-foreground sm:inline">{t.tpl(t.deals.openPipeline, { amount: t.money(pipeline) })}</span>
        <Button asChild>
          <Link href="/deals/new">
            <Plus className="h-4 w-4" />
            {t.deals.new}
          </Link>
        </Button>
      </PageHeader>
      <ListFilters
        basePath="/deals"
        q={q}
        selects={isPrivileged(user) ? [{ name: "ownerId", label: t.common.owner, value: ownerId, options: owners.map((o) => ({ value: o.id, label: o.name })) }] : []}
      />
      <Board
        columns={stages.map((s) => ({ id: s.id, name: s.name, kind: s.kind, probability: s.probability }))}
        deals={deals.map((d) => ({
          id: d.id,
          title: d.title,
          value: d.value,
          currency: d.currency,
          stageId: d.stageId,
          companyName: d.company?.name ?? null,
          ownerName: d.owner.name,
          expectedCloseDate: d.expectedCloseDate?.toISOString() ?? null,
        }))}
      />
    </>
  );
}

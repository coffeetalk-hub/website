import { getT } from "@/core/i18n/server";
import Link from "next/link";
import { Check, Circle } from "lucide-react";
import { toggleActivityDone } from "../actions";
import { TR, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  type: string;
  subject: string;
  dueAt: Date | null;
  completedAt: Date | null;
  assignee: { name: string };
  contact: { id: string; firstName: string; lastName: string } | null;
  company: { id: string; name: string } | null;
  deal: { id: string; title: string } | null;
};

export async function TaskRow({ a }: { a: Row }) {
  const t = await getT();
  const overdue = !a.completedAt && a.dueAt && a.dueAt < new Date();
  const related = a.deal
    ? { href: `/deals/${a.deal.id}`, label: a.deal.title }
    : a.contact
      ? { href: `/contacts/${a.contact.id}`, label: `${a.contact.firstName} ${a.contact.lastName}` }
      : a.company
        ? { href: `/companies/${a.company.id}`, label: a.company.name }
        : null;
  return (
    <TR>
      <TD className="w-10">
        <form action={toggleActivityDone.bind(null, a.id)}>
          <button aria-label={t.tasks.markDone} title={t.tasks.markDone} className="text-muted-foreground hover:text-primary">
            {a.completedAt ? <Check className="h-5 w-5 text-green-600" /> : <Circle className="h-5 w-5" />}
          </button>
        </form>
      </TD>
      <TD>
        <Link href={`/tasks/${a.id}/edit`} className={cn("font-medium hover:underline", a.completedAt && "text-muted-foreground line-through")}>
          {a.subject}
        </Link>
      </TD>
      <TD>
        <Badge>{t.tasks.types[a.type as keyof typeof t.tasks.types] ?? a.type}</Badge>
      </TD>
      <TD className={cn("whitespace-nowrap", overdue && "text-destructive")}>{t.dateTime(a.dueAt)}</TD>
      <TD className="hidden md:table-cell">
        {related ? (
          <Link href={related.href} className="hover:underline">
            {related.label}
          </Link>
        ) : (
          "—"
        )}
      </TD>
      <TD className="hidden sm:table-cell">{a.assignee.name}</TD>
    </TR>
  );
}

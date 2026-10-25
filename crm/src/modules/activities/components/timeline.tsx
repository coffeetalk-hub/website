import { getT } from "@/core/i18n/server";
import Link from "next/link";
import { Phone, Users, StickyNote, CalendarClock, CheckCircle2 } from "lucide-react";

const icons = { CALL: Phone, MEETING: Users, NOTE: StickyNote, FOLLOW_UP: CalendarClock } as const;

export type TimelineItem = {
  id: string;
  type: string;
  subject: string;
  body: string | null;
  dueAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  assignee: { name: string };
};

export async function Timeline({ items }: { items: TimelineItem[] }) {
  const t = await getT();
  if (!items.length) return <p className="text-sm text-muted-foreground">{t.common.noResults}</p>;
  return (
    <ol className="space-y-4">
      {items.map((a) => {
        const Icon = icons[a.type as keyof typeof icons] ?? StickyNote;
        return (
          <li key={a.id} className="flex gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 text-sm">
                <Link href={`/tasks/${a.id}/edit`} dir="auto" className="font-medium hover:underline">{a.subject}</Link>
                {a.completedAt && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
              {a.body && <p className="mt-0.5 whitespace-pre-wrap text-sm text-muted-foreground">{a.body}</p>}
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t.tasks.types[a.type as keyof typeof t.tasks.types] ?? a.type} · {a.assignee.name} ·{" "}
                {a.dueAt ? `${t.tasks.due} ${t.dateTime(a.dueAt)}` : t.dateTime(a.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

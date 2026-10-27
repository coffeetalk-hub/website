import { getT } from "@/core/i18n/server";
import Link from "next/link";
import { Phone, Users, StickyNote, CalendarClock, CheckCircle2, Mail, MessageCircle } from "lucide-react";

const icons = { CALL: Phone, MEETING: Users, NOTE: StickyNote, FOLLOW_UP: CalendarClock, EMAIL: Mail, WHATSAPP: MessageCircle } as const;

type Meta = { direction?: "in" | "out"; sent?: boolean; to?: string; from?: string; status?: string; attachments?: string[] } | null;

export type TimelineItem = {
  id: string;
  type: string;
  subject: string;
  body: string | null;
  dueAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  meta?: unknown;
  assignee: { name: string };
};

export async function Timeline({ items }: { items: TimelineItem[] }) {
  const t = await getT();
  if (!items.length) return <p className="text-sm text-muted-foreground">{t.common.noResults}</p>;
  return (
    <ol className="space-y-4">
      {items.map((a) => {
        const Icon = icons[a.type as keyof typeof icons] ?? StickyNote;
        const meta = (a.meta ?? null) as Meta;
        // "Received" / "Sent" / "Logged" (+ delivery status for WhatsApp) for message-type entries
        const channel = meta?.direction
          ? (a.type === "EMAIL"
              ? [meta.direction === "in" ? t.email.received : meta.sent === false ? t.email.loggedLabel : t.email.sentLabel, meta.direction === "in" ? meta.from : meta.to]
              : [
                  // WhatsApp: received, or the latest delivery state of what we sent (sent → delivered → read, or failed)
                  meta.direction === "in" ? t.whatsapp.received : ((t.whatsapp.statusLabels as Record<string, string>)[meta.status ?? "sent"] ?? t.whatsapp.sentLabel),
                  meta.direction === "in" ? meta.from : meta.to,
                ]
            )
              .filter(Boolean)
              .join(" · ")
          : null;
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
              {meta?.attachments?.length ? <p dir="auto" className="mt-0.5 text-xs text-muted-foreground">📎 {meta.attachments.join(", ")}</p> : null}
              {a.body && <p dir="auto" className="mt-0.5 whitespace-pre-wrap text-sm text-muted-foreground">{a.body}</p>}
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t.tasks.types[a.type as keyof typeof t.tasks.types] ?? a.type} {channel && `(${channel})`} · {a.assignee.name} ·{" "}
                {a.dueAt ? `${t.tasks.due} ${t.dateTime(a.dueAt)}` : t.dateTime(a.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

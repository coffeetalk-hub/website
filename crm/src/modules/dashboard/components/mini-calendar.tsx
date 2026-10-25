import { getT } from "@/core/i18n/server";

/** Month grid (week starts Sunday). Today is filled navy; days with open tasks get a coral dot. */
export async function MiniCalendar({ taskDays }: { taskDays: number[] }) {
  const t = await getT();
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(first.getDay()).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const tasks = new Set(taskDays);
  return (
    <div>
      <div className="mb-2 text-sm font-medium text-muted-foreground">{t.monthYear(now)}</div>
      <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
        {t.weekdays().map((d) => (
          <div key={d} className="py-1 font-medium text-muted-foreground">
            {d}
          </div>
        ))}
        {cells.map((d, i) => (
          <div key={i} className="flex justify-center">
            {d && (
              <span
                className={`relative flex h-7 w-7 items-center justify-center rounded-full ${d === now.getDate() ? "bg-primary font-bold text-primary-foreground" : ""}`}
                title={tasks.has(d) ? t.dashboard.tasksDue : undefined}
              >
                {d}
                {tasks.has(d) && <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-coral" />}
              </span>
            )}
          </div>
        ))}
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-coral" /> {t.dashboard.openTasksDue}
      </p>
    </div>
  );
}

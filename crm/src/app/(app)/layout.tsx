import Link from "next/link";
import { Bell, LogOut, Search } from "lucide-react";
import { db } from "@/core/db";
import { requireUser } from "@/core/auth/session";
import { scope } from "@/core/permissions";
import { modulesFor } from "@/modules/registry";
import { logoutAction } from "@/modules/users/auth-actions";
import { Nav } from "@/components/layout/nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { t } from "@/core/i18n";

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const keys = modulesFor(user).map((m) => m.key);

  // Bell: tasks due today or overdue.
  const end = new Date();
  end.setHours(24, 0, 0, 0);
  const pending = await db.activity.count({
    where: { ...scope(user, "activity", "assigneeId"), completedAt: null, dueAt: { lt: end } },
  });

  return (
    <div className="min-h-screen md:grid md:grid-cols-[250px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col bg-sidebar p-5 text-sidebar-foreground md:flex md:rounded-e-[2rem]">
        <div className="mb-8 px-3">
          <div className="text-3xl font-extrabold tracking-tight">{t.app.name}</div>
          <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-sidebar-muted">{t.app.tagline}</div>
        </div>
        <Nav keys={keys} />
        <form action={logoutAction} className="mt-auto">
          <button className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-sidebar-muted transition-colors hover:bg-white/10 hover:text-sidebar-foreground">
            <LogOut className="h-4 w-4" />
            {t.common.signOut}
          </button>
        </form>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="flex items-center gap-3 px-4 py-4 md:px-8">
          <MobileNav keys={keys} />
          <form action="/search" className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute start-4 top-3 h-4 w-4 text-muted-foreground" />
            <input
              name="q"
              placeholder="Search contacts, companies, deals…"
              aria-label="Search"
              className="h-10 w-full rounded-full border-0 bg-card ps-10 pe-4 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </form>
          <div className="ms-auto flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link
              href="/tasks?view=today"
              aria-label={`${pending} tasks due or overdue`}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm hover:bg-accent"
            >
              <Bell className="h-4 w-4" />
              {pending > 0 && (
                <span className="absolute -end-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-coral px-1 text-[10px] font-bold text-white">
                  {pending > 9 ? "9+" : pending}
                </span>
              )}
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{initials(user.name)}</div>
              <div className="hidden text-sm leading-tight lg:block">
                <div className="font-semibold">{user.name}</div>
                <div className="text-xs text-muted-foreground">{t.roles[user.role]}</div>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 pb-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}

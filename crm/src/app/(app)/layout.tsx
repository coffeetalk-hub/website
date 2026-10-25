import { LogOut } from "lucide-react";
import { requireUser } from "@/core/auth/session";
import { modulesFor } from "@/modules/registry";
import { logoutAction } from "@/modules/users/auth-actions";
import { Nav } from "@/components/layout/nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { t } from "@/core/i18n";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const keys = modulesFor(user).map((m) => m.key);
  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="hidden border-e bg-card p-4 md:block">
        <div className="mb-6 px-3 text-lg font-bold text-primary">{t.app.name}</div>
        <Nav keys={keys} />
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="flex h-14 items-center justify-between gap-2 border-b bg-card px-4">
          <MobileNav keys={keys} />
          <div className="ms-auto flex items-center gap-3">
            <div className="hidden text-end text-sm leading-tight sm:block">
              <div className="font-medium">{user.name}</div>
              <Badge className="mt-0.5">{t.roles[user.role]}</Badge>
            </div>
            <ThemeToggle />
            <form action={logoutAction}>
              <Button variant="ghost" size="icon" aria-label={t.common.signOut} title={t.common.signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

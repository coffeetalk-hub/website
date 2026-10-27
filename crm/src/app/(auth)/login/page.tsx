import { getT } from "@/core/i18n/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/core/auth/session";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const t = await getT();
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <main className="flex min-h-screen items-center justify-center bg-sidebar p-4">
      <div className="w-full max-w-sm">
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher />
        </div>
        <div className="mb-6 text-center text-sidebar-foreground">
          <div className="text-4xl font-extrabold tracking-tight">{t.app.name}</div>
          <div className="text-[10px] font-medium uppercase tracking-[0.25em] text-sidebar-muted">{t.app.tagline}</div>
        </div>
        <div className="rounded-3xl bg-card p-6 text-card-foreground shadow-2xl">
          <h1 className="mb-4 text-lg font-bold">{t.auth.signInTitle}</h1>
          <LoginForm />
          <p className="mt-4 rounded-xl bg-coral-soft p-2 text-center text-xs text-muted-foreground">{t.auth.demo}: admin@demo.com / password123</p>
        </div>
      </div>
    </main>
  );
}

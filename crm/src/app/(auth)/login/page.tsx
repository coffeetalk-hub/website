import { LoginForm } from "./login-form";
import { t } from "@/core/i18n";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-sidebar p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center text-sidebar-foreground">
          <div className="text-4xl font-extrabold tracking-tight">{t.app.name}</div>
          <div className="text-[10px] font-medium uppercase tracking-[0.25em] text-sidebar-muted">{t.app.tagline}</div>
        </div>
        <div className="rounded-3xl bg-card p-6 text-card-foreground shadow-2xl">
          <h1 className="mb-4 text-lg font-bold">{t.auth.signInTitle}</h1>
          <LoginForm />
          <p className="mt-4 rounded-xl bg-coral-soft p-2 text-center text-xs text-muted-foreground">Demo: admin@demo.com / password123</p>
        </div>
      </div>
    </main>
  );
}

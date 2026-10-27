import { redirect } from "next/navigation";
import { getCurrentUser } from "@/core/auth/session";
import { getT } from "@/core/i18n/server";
import { LanguageSwitcher } from "@/components/language-switcher";
import { logoutAction } from "@/modules/users/auth-actions";
import { ChangePasswordForm } from "./change-password-form";

export default async function ChangePasswordPage() {
  const t = await getT();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <main className="flex min-h-screen items-center justify-center bg-sidebar p-4">
      <div className="w-full max-w-sm">
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher />
        </div>
        <div className="rounded-3xl bg-card p-6 text-card-foreground shadow-2xl">
          <h1 className="mb-1 text-lg font-bold">{t.auth.changePassword}</h1>
          <p className="mb-4 text-sm text-muted-foreground">{user.mustChangePassword ? t.auth.changePasswordForced : user.email}</p>
          <ChangePasswordForm forced={user.mustChangePassword} />
          {user.mustChangePassword && (
            <form action={logoutAction} className="mt-4 text-center">
              <button className="text-xs text-muted-foreground underline">{t.common.signOut}</button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

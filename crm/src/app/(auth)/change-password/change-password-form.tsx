"use client";
import { ActionForm, Field } from "@/components/forms/action-form";
import { Input } from "@/components/ui/input";
import { changePasswordAction } from "@/modules/users/password-actions";
import { useT } from "@/core/i18n/client";

export function ChangePasswordForm({ forced }: { forced: boolean }) {
  const t = useT();
  return (
    <ActionForm action={changePasswordAction} submitLabel={t.auth.changePassword} cancelHref={forced ? undefined : "/dashboard"}>
      <Field name="current" label={t.auth.currentPassword} required>
        <Input id="current" name="current" type="password" autoComplete="current-password" />
      </Field>
      <Field name="next" label={t.auth.newPassword} required>
        <Input id="next" name="next" type="password" autoComplete="new-password" />
      </Field>
      <Field name="confirm" label={t.auth.confirmPassword} required>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" />
      </Field>
      <p className="text-xs text-muted-foreground">{t.auth.passwordHint}</p>
    </ActionForm>
  );
}

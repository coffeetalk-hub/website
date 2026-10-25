import { ActionForm, Field } from "@/components/forms/action-form";
import { Input, Select } from "@/components/ui/input";
import { ROLES } from "@/core/permissions";
import type { ActionState } from "@/core/forms";
import { t } from "@/core/i18n";

export function UserForm({
  action,
  initial,
  editing,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  initial?: { name: string; email: string; role: string; active: boolean };
  editing?: boolean;
}) {
  return (
    <ActionForm action={action} cancelHref="/users">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="name" label={t.common.name} required>
          <Input id="name" name="name" defaultValue={initial?.name ?? ""} />
        </Field>
        <Field name="email" label={t.common.email} required>
          <Input id="email" name="email" type="email" defaultValue={initial?.email ?? ""} />
        </Field>
        <Field name="role" label={t.users.role} required>
          <Select id="role" name="role" defaultValue={initial?.role ?? "REP"}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {t.roles[r]}
              </option>
            ))}
          </Select>
        </Field>
        <Field name="password" label={editing ? "New password (leave blank to keep)" : t.auth.password} required={!editing}>
          <Input id="password" name="password" type="password" autoComplete="new-password" />
        </Field>
        {editing && (
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="active" defaultChecked={initial?.active} className="h-4 w-4 accent-[hsl(var(--coral))]" />
            {t.users.active} (can sign in)
          </label>
        )}
      </div>
    </ActionForm>
  );
}

import { ActionForm, Field } from "@/components/forms/action-form";
import { Input, Select } from "@/components/ui/input";
import { CustomFieldInputs } from "@/components/custom-fields";
import type { CustomValues, FieldDef } from "@/core/custom-fields";
import type { ActionState } from "@/core/forms";
import { t } from "@/core/i18n";

type Initial = { name?: string; industry?: string | null; website?: string | null; phone?: string | null; address?: string | null; ownerId?: string };

export function CompanyForm({
  action,
  initial = {},
  owners,
  defs,
  customValues,
  cancelHref,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  initial?: Initial;
  owners: { id: string; name: string }[];
  defs: FieldDef[];
  customValues?: CustomValues;
  cancelHref: string;
}) {
  return (
    <ActionForm action={action} cancelHref={cancelHref}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="name" label={t.common.name} required>
          <Input id="name" name="name" defaultValue={initial.name ?? ""} />
        </Field>
        <Field name="industry" label={t.companies.industry}>
          <Input id="industry" name="industry" defaultValue={initial.industry ?? ""} />
        </Field>
        <Field name="website" label={t.companies.website}>
          <Input id="website" name="website" defaultValue={initial.website ?? ""} />
        </Field>
        <Field name="phone" label={t.common.phone}>
          <Input id="phone" name="phone" defaultValue={initial.phone ?? ""} />
        </Field>
        <Field name="address" label={t.companies.address}>
          <Input id="address" name="address" defaultValue={initial.address ?? ""} />
        </Field>
        {owners.length > 1 && (
          <Field name="ownerId" label={t.common.owner}>
            <Select id="ownerId" name="ownerId" defaultValue={initial.ownerId}>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <CustomFieldInputs defs={defs} values={customValues} />
      </div>
    </ActionForm>
  );
}

import { ActionForm, Field } from "@/components/forms/action-form";
import { Input, Select } from "@/components/ui/input";
import { CustomFieldInputs } from "@/components/custom-fields";
import type { CustomValues, FieldDef } from "@/core/custom-fields";
import type { ActionState } from "@/core/forms";
import { t } from "@/core/i18n";
import { SOURCES } from "../schema";

type Initial = {
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  jobTitle?: string | null;
  source?: string | null;
  companyId?: string | null;
  ownerId?: string;
};

export function ContactForm({
  action,
  initial = {},
  owners,
  companies,
  defs,
  customValues,
  cancelHref,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  initial?: Initial;
  owners: { id: string; name: string }[];
  companies: { id: string; name: string }[];
  defs: FieldDef[];
  customValues?: CustomValues;
  cancelHref: string;
}) {
  return (
    <ActionForm action={action} cancelHref={cancelHref}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="firstName" label={t.contacts.firstName} required>
          <Input id="firstName" name="firstName" defaultValue={initial.firstName ?? ""} />
        </Field>
        <Field name="lastName" label={t.contacts.lastName} required>
          <Input id="lastName" name="lastName" defaultValue={initial.lastName ?? ""} />
        </Field>
        <Field name="email" label={t.common.email}>
          <Input id="email" name="email" type="email" defaultValue={initial.email ?? ""} />
        </Field>
        <Field name="phone" label={t.common.phone}>
          <Input id="phone" name="phone" defaultValue={initial.phone ?? ""} />
        </Field>
        <Field name="jobTitle" label={t.contacts.jobTitle}>
          <Input id="jobTitle" name="jobTitle" defaultValue={initial.jobTitle ?? ""} />
        </Field>
        <Field name="companyId" label={t.contacts.company}>
          <Select id="companyId" name="companyId" defaultValue={initial.companyId ?? ""}>
            <option value="">{t.common.none}</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field name="source" label={t.contacts.source}>
          <Select id="source" name="source" defaultValue={initial.source ?? ""}>
            <option value="">{t.common.none}</option>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
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

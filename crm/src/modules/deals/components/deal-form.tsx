import { ActionForm, Field } from "@/components/forms/action-form";
import { Input, Select } from "@/components/ui/input";
import { CustomFieldInputs } from "@/components/custom-fields";
import type { CustomValues, FieldDef } from "@/core/custom-fields";
import type { ActionState } from "@/core/forms";
import { t } from "@/core/i18n";

type Initial = {
  title?: string;
  value?: number;
  stageId?: string;
  expectedCloseDate?: Date | null;
  companyId?: string | null;
  contactId?: string | null;
  ownerId?: string;
};

export function DealForm({
  action,
  initial = {},
  stages,
  owners,
  companies,
  contacts,
  defs,
  customValues,
  cancelHref,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  initial?: Initial;
  stages: { id: string; name: string }[];
  owners: { id: string; name: string }[];
  companies: { id: string; name: string }[];
  contacts: { id: string; firstName: string; lastName: string }[];
  defs: FieldDef[];
  customValues?: CustomValues;
  cancelHref: string;
}) {
  return (
    <ActionForm action={action} cancelHref={cancelHref}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field name="title" label="Title" required>
            <Input id="title" name="title" defaultValue={initial.title ?? ""} />
          </Field>
        </div>
        <Field name="value" label={`${t.deals.value} (SAR)`} required>
          <Input id="value" name="value" type="number" min="0" step="any" defaultValue={initial.value ?? ""} />
        </Field>
        <Field name="stageId" label={t.deals.stage} required>
          <Select id="stageId" name="stageId" defaultValue={initial.stageId ?? stages[0]?.id}>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field name="expectedCloseDate" label={t.deals.expectedClose}>
          <Input id="expectedCloseDate" name="expectedCloseDate" type="date" defaultValue={initial.expectedCloseDate ? initial.expectedCloseDate.toISOString().slice(0, 10) : ""} />
        </Field>
        <Field name="companyId" label={t.deals.company}>
          <Select id="companyId" name="companyId" defaultValue={initial.companyId ?? ""}>
            <option value="">{t.common.none}</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field name="contactId" label={t.deals.contact}>
          <Select id="contactId" name="contactId" defaultValue={initial.contactId ?? ""}>
            <option value="">{t.common.none}</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName}
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

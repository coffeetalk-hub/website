import { Input, Select } from "@/components/ui/input";
import { Field } from "@/components/forms/action-form";
import { customFieldInputName, type CustomValues, type FieldDef } from "@/core/custom-fields";
import { formatDate } from "@/lib/utils";

/** Renders inputs for every custom field definition of an entity (server component). */
export function CustomFieldInputs({ defs, values = {} }: { defs: FieldDef[]; values?: CustomValues }) {
  if (!defs.length) return null;
  return (
    <>
      {defs.map((d) => {
        const name = customFieldInputName(d.key);
        const v = values[d.key];
        return (
          <Field key={d.id} name={name} label={d.label} required={d.required}>
            {d.type === "DROPDOWN" ? (
              <Select id={name} name={name} defaultValue={v == null ? "" : String(v)}>
                <option value="">—</option>
                {d.options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                id={name}
                name={name}
                type={d.type === "NUMBER" ? "number" : d.type === "DATE" ? "date" : "text"}
                step={d.type === "NUMBER" ? "any" : undefined}
                defaultValue={v == null ? "" : String(v)}
              />
            )}
          </Field>
        );
      })}
    </>
  );
}

export function CustomFieldsView({ defs, values }: { defs: FieldDef[]; values: CustomValues }) {
  if (!defs.length) return null;
  return (
    <>
      {defs.map((d) => {
        const v = values[d.key];
        return (
          <DetailItem key={d.id} label={d.label}>
            {v == null ? "—" : d.type === "DATE" ? formatDate(String(v)) : String(v)}
          </DetailItem>
        );
      })}
    </>
  );
}

export function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{children}</dd>
    </div>
  );
}

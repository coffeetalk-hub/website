import { ActionForm, Field } from "@/components/forms/action-form";
import { Input, Textarea } from "@/components/ui/input";
import type { ActionState } from "@/core/forms";
import { getT } from "@/core/i18n/server";

type Initial = { name?: string; sku?: string | null; description?: string | null; unitPrice?: number; vatRate?: number; active?: boolean };

export async function ProductForm({ action, initial = {}, defaultVat = 15 }: { action: (prev: ActionState, fd: FormData) => Promise<ActionState>; initial?: Initial; defaultVat?: number }) {
  const t = await getT();
  return (
    <ActionForm action={action} cancelHref="/products">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="name" label={t.products.name} required>
          <Input id="name" name="name" defaultValue={initial.name ?? ""} />
        </Field>
        <Field name="sku" label={t.products.sku}>
          <Input id="sku" name="sku" dir="ltr" defaultValue={initial.sku ?? ""} />
        </Field>
        <Field name="unitPrice" label={t.products.unitPrice} required>
          <Input id="unitPrice" name="unitPrice" type="number" min="0" step="0.01" defaultValue={initial.unitPrice ?? ""} />
        </Field>
        <Field name="vatRate" label={t.products.vatRate} required>
          <Input id="vatRate" name="vatRate" type="number" min="0" max="100" step="0.01" defaultValue={initial.vatRate ?? defaultVat} />
        </Field>
        <div className="sm:col-span-2">
          <Field name="description" label={t.products.description}>
            <Textarea id="description" name="description" rows={3} defaultValue={initial.description ?? ""} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" name="active" defaultChecked={initial.active ?? true} className="h-4 w-4 accent-[hsl(var(--coral))]" />
          {t.products.active}
        </label>
      </div>
    </ActionForm>
  );
}

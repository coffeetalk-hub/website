import { ActionForm, Field } from "@/components/forms/action-form";
import { Input, Select, Textarea } from "@/components/ui/input";
import type { ActionState } from "@/core/forms";
import { getT } from "@/core/i18n/server";
import { LineEditor, type EditorProduct } from "@/modules/billing/components/line-editor";
import { iso } from "@/modules/reports/range";

type Opt = { id: string; label: string };
type Initial = {
  buyerName?: string;
  buyerVat?: string | null;
  buyerAddress?: string | null;
  companyId?: string | null;
  contactId?: string | null;
  dealId?: string | null;
  issueDate?: Date;
  dueDate?: Date | null;
  notes?: string | null;
  lines?: { productId: string | null; description: string; qty: number; unitPrice: number; discountPct: number; vatRate: number }[];
};

export async function InvoiceForm({
  action,
  initial = {},
  companies,
  contacts,
  deals,
  products,
  defaultVat,
  defaultDueDays,
  cancelHref,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  initial?: Initial;
  companies: Opt[];
  contacts: Opt[];
  deals: Opt[];
  products: EditorProduct[];
  defaultVat: number;
  defaultDueDays: number;
  cancelHref: string;
}) {
  const t = await getT();
  const issue = initial.issueDate ?? new Date();
  const due = initial.dueDate ?? new Date(issue.getTime() + defaultDueDays * 86400000);
  const select = (name: string, label: string, value: string | null | undefined, options: Opt[]) => (
    <Field name={name} label={label}>
      <Select id={name} name={name} defaultValue={value ?? ""}>
        <option value="">{t.common.none}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </Select>
    </Field>
  );
  return (
    <ActionForm action={action} cancelHref={cancelHref}>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field name="buyerName" label={t.invoices.buyerName} required>
          <Input id="buyerName" name="buyerName" defaultValue={initial.buyerName ?? ""} />
        </Field>
        <Field name="buyerVat" label={t.invoices.buyerVat}>
          <Input id="buyerVat" name="buyerVat" dir="ltr" inputMode="numeric" defaultValue={initial.buyerVat ?? ""} />
        </Field>
        <Field name="buyerAddress" label={t.invoices.buyerAddress}>
          <Input id="buyerAddress" name="buyerAddress" defaultValue={initial.buyerAddress ?? ""} />
        </Field>
        {select("companyId", t.billing.company, initial.companyId, companies)}
        {select("contactId", t.billing.contact, initial.contactId, contacts)}
        {select("dealId", t.billing.deal, initial.dealId, deals)}
        <Field name="issueDate" label={t.billing.issueDate} required>
          <Input id="issueDate" name="issueDate" type="date" defaultValue={iso(issue)} />
        </Field>
        <Field name="dueDate" label={t.billing.dueDate}>
          <Input id="dueDate" name="dueDate" type="date" defaultValue={iso(due)} />
        </Field>
      </div>
      <h2 className="pt-2 text-sm font-semibold">{t.billing.lines}</h2>
      <LineEditor products={products} initial={initial.lines ?? []} defaultVat={defaultVat} />
      <Field name="notes" label={t.billing.notes}>
        <Textarea id="notes" name="notes" rows={3} defaultValue={initial.notes ?? ""} />
      </Field>
    </ActionForm>
  );
}

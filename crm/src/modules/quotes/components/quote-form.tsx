import { ActionForm, Field } from "@/components/forms/action-form";
import { Input, Select, Textarea } from "@/components/ui/input";
import type { ActionState } from "@/core/forms";
import { getT } from "@/core/i18n/server";
import { LineEditor, type EditorProduct } from "@/modules/billing/components/line-editor";
import { iso } from "@/modules/reports/range";

type Opt = { id: string; label: string };
type Initial = {
  companyId?: string | null;
  contactId?: string | null;
  dealId?: string | null;
  issueDate?: Date;
  validUntil?: Date | null;
  notes?: string | null;
  terms?: string | null;
  lines?: { productId: string | null; description: string; qty: number; unitPrice: number; discountPct: number; vatRate: number }[];
};

export async function QuoteForm({
  action,
  initial = {},
  companies,
  contacts,
  deals,
  products,
  defaultVat,
  defaultValidDays,
  defaultTerms,
  cancelHref,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  initial?: Initial;
  companies: Opt[];
  contacts: Opt[];
  deals: Opt[];
  products: EditorProduct[];
  defaultVat: number;
  defaultValidDays: number;
  defaultTerms?: string;
  cancelHref: string;
}) {
  const t = await getT();
  const issue = initial.issueDate ?? new Date();
  const valid = initial.validUntil ?? new Date(issue.getTime() + defaultValidDays * 86400000);
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
        {select("companyId", t.billing.company, initial.companyId, companies)}
        {select("contactId", t.billing.contact, initial.contactId, contacts)}
        {select("dealId", t.billing.deal, initial.dealId, deals)}
        <Field name="issueDate" label={t.billing.issueDate} required>
          <Input id="issueDate" name="issueDate" type="date" defaultValue={iso(issue)} />
        </Field>
        <Field name="validUntil" label={t.billing.validUntil}>
          <Input id="validUntil" name="validUntil" type="date" defaultValue={iso(valid)} />
        </Field>
      </div>
      <h2 className="pt-2 text-sm font-semibold">{t.billing.lines}</h2>
      <LineEditor products={products} initial={initial.lines ?? []} defaultVat={defaultVat} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="notes" label={t.billing.notes}>
          <Textarea id="notes" name="notes" rows={3} defaultValue={initial.notes ?? ""} />
        </Field>
        <Field name="terms" label={t.billing.terms}>
          <Textarea id="terms" name="terms" rows={3} defaultValue={initial.terms ?? defaultTerms ?? ""} />
        </Field>
      </div>
    </ActionForm>
  );
}

import { ActionForm, Field } from "@/components/forms/action-form";
import { Input, Select, Textarea } from "@/components/ui/input";
import type { ActionState } from "@/core/forms";
import { t } from "@/core/i18n";
import { ACTIVITY_TYPES, toLocalInput } from "../schema";

type Initial = { type?: string; subject?: string; body?: string | null; dueAt?: Date | null; assigneeId?: string };
type Links = { contactId?: string; companyId?: string; dealId?: string };

export function ActivityForm({
  action,
  initial = {},
  assignees,
  links = {},
  returnTo,
  cancelHref,
  compact,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  initial?: Initial;
  assignees: { id: string; name: string }[];
  links?: Links;
  returnTo?: string;
  cancelHref?: string;
  /** Compact variant for embedding in detail pages. */
  compact?: boolean;
}) {
  return (
    <ActionForm action={action} cancelHref={cancelHref} submitLabel={compact ? "Add" : t.common.save}>
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
      {Object.entries(links).map(([k, v]) => v && <input key={k} type="hidden" name={k} value={v} />)}
      <div className={compact ? "grid gap-3 sm:grid-cols-2" : "grid gap-4 sm:grid-cols-2"}>
        <Field name="type" label={t.tasks.type} required>
          <Select id="type" name="type" defaultValue={initial.type ?? "NOTE"}>
            {ACTIVITY_TYPES.map((x) => (
              <option key={x} value={x}>
                {t.tasks.types[x]}
              </option>
            ))}
          </Select>
        </Field>
        <Field name="dueAt" label={t.tasks.due}>
          <Input id="dueAt" name="dueAt" type="datetime-local" defaultValue={toLocalInput(initial.dueAt)} />
        </Field>
        <div className="sm:col-span-2">
          <Field name="subject" label={t.tasks.subject} required>
            <Input id="subject" name="subject" defaultValue={initial.subject ?? ""} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field name="body" label={t.tasks.details}>
            <Textarea id="body" name="body" rows={compact ? 2 : 4} defaultValue={initial.body ?? ""} />
          </Field>
        </div>
        {assignees.length > 1 && (
          <Field name="assigneeId" label={t.tasks.assignee}>
            <Select id="assigneeId" name="assigneeId" defaultValue={initial.assigneeId}>
              {assignees.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </div>
    </ActionForm>
  );
}

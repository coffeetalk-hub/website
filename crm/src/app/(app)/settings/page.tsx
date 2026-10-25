import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { db } from "@/core/db";
import { requireAccess } from "@/core/auth/session";
import { strParam } from "@/core/forms";
import { ENTITIES, FIELD_TYPES, getFieldDefs, type Entity } from "@/core/custom-fields";
import { createField, createStage, deleteField, deleteStage, moveField, moveStage, updateField, updateStage } from "@/modules/settings/actions";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { t } from "@/core/i18n";

const ENTITY_LABEL: Record<Entity, string> = { CONTACT: "Contacts", COMPANY: "Companies", DEAL: "Deals" };
const TYPE_LABEL = { TEXT: "Text", NUMBER: "Number", DATE: "Date", DROPDOWN: "Dropdown" } as const;
const KIND_LABEL = { OPEN: "Open", WON: "Won", LOST: "Lost" } as const;

function IconBtn({ label, danger, children, ...rest }: { label: string; danger?: boolean; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button aria-label={label} title={label} className={`rounded-lg p-1.5 hover:bg-accent ${danger ? "text-destructive" : "text-muted-foreground"}`} {...rest}>
      {children}
    </button>
  );
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAccess("settings", "manage");
  const sp = await searchParams;
  const ok = strParam(sp.ok);
  const error = strParam(sp.error);
  const [stages, ...fieldSets] = await Promise.all([
    db.stage.findMany({ orderBy: { position: "asc" }, include: { _count: { select: { deals: true } } } }),
    ...ENTITIES.map((e) => getFieldDefs(e)),
  ]);

  return (
    <>
      <PageHeader title={t.settings.title} />
      {ok && <p className="mb-4 rounded-xl bg-secondary p-3 text-sm">{ok}</p>}
      {error && <p className="mb-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{t.settings.stages}</CardTitle>
          <p className="text-sm text-muted-foreground">Columns of the deals board, in order. “Won” and “Lost” stages close a deal; probability drives weighted value.</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {stages.map((s, i) => (
            <div key={s.id} className="flex flex-wrap items-center gap-2 rounded-xl border p-2">
              <form action={updateStage.bind(null, s.id)} className="flex flex-1 flex-wrap items-center gap-2">
                <Input name="name" defaultValue={s.name} aria-label="Stage name" className="w-40 flex-1" />
                <Input name="probability" type="number" min={0} max={100} defaultValue={s.probability} aria-label="Probability %" className="w-20" title="Probability %" />
                <Select name="kind" defaultValue={s.kind} aria-label="Kind" className="w-24">
                  {Object.entries(KIND_LABEL).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </Select>
                <Button size="sm" variant="secondary">
                  {t.common.save}
                </Button>
                <span className="text-xs text-muted-foreground">{s._count.deals} deals</span>
              </form>
              <div className="flex">
                <form action={moveStage.bind(null, s.id, "up")}>
                  <IconBtn label="Move up" disabled={i === 0}>
                    <ArrowUp className="h-4 w-4" />
                  </IconBtn>
                </form>
                <form action={moveStage.bind(null, s.id, "down")}>
                  <IconBtn label="Move down" disabled={i === stages.length - 1}>
                    <ArrowDown className="h-4 w-4" />
                  </IconBtn>
                </form>
                <form action={deleteStage.bind(null, s.id)}>
                  <IconBtn label={t.common.delete} danger>
                    <Trash2 className="h-4 w-4" />
                  </IconBtn>
                </form>
              </div>
            </div>
          ))}
          <form action={createStage} className="flex flex-wrap items-center gap-2 pt-2">
            <Input name="name" placeholder="New stage name" aria-label="New stage name" className="w-48" required />
            <Input name="probability" type="number" min={0} max={100} defaultValue={50} aria-label="Probability %" className="w-20" />
            <Select name="kind" defaultValue="OPEN" aria-label="Kind" className="w-24">
              {Object.entries(KIND_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
            <Button size="sm">Add stage</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.settings.customFields}</CardTitle>
          <p className="text-sm text-muted-foreground">Extra fields shown on forms and detail pages. Stored as data, so no code or migration is needed.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {ENTITIES.map((entity, k) => {
            const defs = fieldSets[k];
            return (
              <section key={entity}>
                <h3 className="mb-2 text-sm font-semibold">{ENTITY_LABEL[entity]}</h3>
                <div className="space-y-2">
                  {defs.length === 0 && <p className="text-sm text-muted-foreground">No custom fields yet.</p>}
                  {defs.map((f, i) => (
                    <div key={f.id} className="flex flex-wrap items-start gap-2 rounded-xl border p-2">
                      <form action={updateField.bind(null, f.id)} className="flex flex-1 flex-wrap items-start gap-2">
                        <Input name="label" defaultValue={f.label} aria-label="Label" className="w-48" />
                        <Badge className="mt-1.5">{TYPE_LABEL[f.type]}</Badge>
                        {f.type === "DROPDOWN" && <Textarea name="options" rows={2} defaultValue={f.options.join("\n")} aria-label="Options (one per line)" className="min-h-0 w-48" />}
                        <label className="mt-2 flex items-center gap-1.5 text-sm">
                          <input type="checkbox" name="required" defaultChecked={f.required} className="h-4 w-4 accent-[hsl(var(--coral))]" /> Required
                        </label>
                        <Button size="sm" variant="secondary">
                          {t.common.save}
                        </Button>
                      </form>
                      <div className="flex">
                        <form action={moveField.bind(null, f.id, "up")}>
                          <IconBtn label="Move up" disabled={i === 0}>
                            <ArrowUp className="h-4 w-4" />
                          </IconBtn>
                        </form>
                        <form action={moveField.bind(null, f.id, "down")}>
                          <IconBtn label="Move down" disabled={i === defs.length - 1}>
                            <ArrowDown className="h-4 w-4" />
                          </IconBtn>
                        </form>
                        <form action={deleteField.bind(null, f.id)}>
                          <IconBtn label={t.common.delete} danger>
                            <Trash2 className="h-4 w-4" />
                          </IconBtn>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-medium text-coral">+ Add field to {ENTITY_LABEL[entity].toLowerCase()}</summary>
                  <form action={createField} className="mt-2 flex flex-wrap items-start gap-2">
                    <input type="hidden" name="entity" value={entity} />
                    <Input name="label" placeholder="Label" aria-label="Label" className="w-48" required />
                    <Select name="type" defaultValue="TEXT" aria-label="Type" className="w-32">
                      {FIELD_TYPES.map((tp) => (
                        <option key={tp} value={tp}>
                          {TYPE_LABEL[tp]}
                        </option>
                      ))}
                    </Select>
                    <Textarea name="options" rows={2} placeholder="Dropdown options, one per line" aria-label="Options" className="min-h-0 w-56" />
                    <label className="mt-2 flex items-center gap-1.5 text-sm">
                      <input type="checkbox" name="required" className="h-4 w-4 accent-[hsl(var(--coral))]" /> Required
                    </label>
                    <Button size="sm">Add field</Button>
                  </form>
                </details>
              </section>
            );
          })}
        </CardContent>
      </Card>
    </>
  );
}

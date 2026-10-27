"use client";
import { startTransition, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { useT } from "@/core/i18n/client";
import { WEBHOOK_EVENTS } from "@/core/webhooks-events";
import { createApiKey, createWebhook, type SecretState } from "../admin-actions";

function SecretBox({ label, secret }: { label: string; secret: string }) {
  return (
    <div className="mt-3 rounded-xl border border-coral/40 bg-coral-soft p-3 text-sm" role="status" data-testid="secret-box">
      <p className="font-medium">{label}</p>
      <code dir="ltr" className="mt-1 block break-all rounded-lg bg-background p-2 text-xs" data-testid="secret-value">
        {secret}
      </code>
    </div>
  );
}

export function ApiKeyCreator({ users }: { users: { id: string; name: string; email: string }[] }) {
  const t = useT();
  const [state, run, pending] = useActionState(createApiKey, {} as SecretState);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => run(fd));
      }}
      className="space-y-2"
    >
      <div className="flex flex-wrap items-end gap-2">
        <Input name="name" placeholder={t.api.keyName} aria-label={t.api.keyName} className="w-52" required />
        <Select name="userId" aria-label={t.api.keyUser} className="w-56">
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.email})
            </option>
          ))}
        </Select>
        <Select name="scope" defaultValue="READ" aria-label={t.api.keyScope} className="w-40">
          <option value="READ">{t.api.scopes.READ}</option>
          <option value="WRITE">{t.api.scopes.WRITE}</option>
        </Select>
        <Button size="sm" disabled={pending}>
          {t.api.createKey}
        </Button>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.secret && <SecretBox label={t.api.keyCreated} secret={state.secret} />}
    </form>
  );
}

export function WebhookCreator() {
  const t = useT();
  const [state, run, pending] = useActionState(createWebhook, {} as SecretState);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => run(fd));
      }}
      className="space-y-2"
    >
      <div className="flex flex-wrap items-end gap-2">
        <Input name="url" type="url" placeholder="https://example.com/crm-webhook" aria-label={t.api.url} className="w-80" required />
        <Button size="sm" disabled={pending}>
          {t.api.createWebhook}
        </Button>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="all" defaultChecked className="h-4 w-4 accent-[hsl(var(--coral))]" />
        {t.api.allEvents}
      </label>
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground">{t.api.events}</summary>
        <div className="mt-2 grid gap-1 sm:grid-cols-3">
          {WEBHOOK_EVENTS.map((ev) => (
            <label key={ev} className="flex items-center gap-2" dir="ltr">
              <input type="checkbox" name="events" value={ev} className="h-3.5 w-3.5 accent-[hsl(var(--coral))]" />
              {ev}
            </label>
          ))}
        </div>
      </details>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.secret && <SecretBox label={t.api.secretCreated} secret={state.secret} />}
    </form>
  );
}

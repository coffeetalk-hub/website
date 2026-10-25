"use client";
import { useT } from "@/core/i18n/client";
import { createContext, startTransition, useActionState, useContext } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/core/forms";

const ErrorsContext = createContext<Record<string, string>>({});

/**
 * Wraps a server action. Submits via onSubmit (not the `action` prop) so React 19
 * does not reset the inputs when validation fails.
 */
export function ActionForm({
  action,
  children,
  submitLabel,
  cancelHref,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  submitLabel?: string;
  cancelHref?: string;
}) {
  const t = useT();
  const [state, run, pending] = useActionState(action, {} as ActionState);
  return (
    <ErrorsContext.Provider value={state.fieldErrors ?? {}}>
      <form
        noValidate
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(() => run(fd));
        }}
      >
        {children}
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {submitLabel ?? t.common.save}
          </Button>
          {cancelHref && (
            <Button variant="outline" asChild>
              <Link href={cancelHref}>{t.common.cancel}</Link>
            </Button>
          )}
        </div>
      </form>
    </ErrorsContext.Provider>
  );
}

export function Field({ name, label, required, children }: { name: string; label: string; required?: boolean; children: React.ReactNode }) {
  const error = useContext(ErrorsContext)[name];
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

"use client";
import { useT } from "@/core/i18n/client";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** `action` is a server action already bound to the record id. */
export function DeleteButton({ action, label }: { action: () => Promise<void>; label?: string }) {
  const t = useT();
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(t.common.confirmDelete)) e.preventDefault();
      }}
    >
      <Button variant="outline" size="sm" className="text-destructive">
        <Trash2 className="h-4 w-4" />
        {label ?? t.common.delete}
      </Button>
    </form>
  );
}

"use client";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t } from "@/core/i18n";

/** `action` is a server action already bound to the record id. */
export function DeleteButton({ action, label = t.common.delete }: { action: () => Promise<void>; label?: string }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(t.common.confirmDelete)) e.preventDefault();
      }}
    >
      <Button variant="outline" size="sm" className="text-destructive">
        <Trash2 className="h-4 w-4" />
        {label}
      </Button>
    </form>
  );
}

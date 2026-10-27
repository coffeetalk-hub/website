"use client";
import { Button, type ButtonProps } from "@/components/ui/button";

/** A one-click server action, optionally behind a confirm() prompt. `action` is already bound to its record id. */
export function ActionButton({
  action,
  children,
  confirmText,
  variant = "outline",
  size = "sm",
  className,
}: {
  action: () => Promise<void>;
  children: React.ReactNode;
  confirmText?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (confirmText && !confirm(confirmText)) e.preventDefault();
      }}
    >
      <Button variant={variant} size={size} className={className}>
        {children}
      </Button>
    </form>
  );
}

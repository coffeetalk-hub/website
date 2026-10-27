import * as React from "react";
import { cn } from "@/lib/utils";

const field =
  "flex w-full rounded-xl border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

/** Emails, phones, URLs, numbers and dates are always left-to-right; free text follows what the user types. */
const LTR_TYPES = ["email", "tel", "url", "number", "date", "datetime-local", "password"];

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, dir, ...props }, ref) => (
    <input ref={ref} type={type} dir={dir ?? (type && LTR_TYPES.includes(type) ? "ltr" : "auto")} className={cn(field, "h-9", className)} {...props} />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, dir, ...props }, ref) => <textarea ref={ref} dir={dir ?? "auto"} className={cn(field, "min-h-[80px] py-2", className)} {...props} />,
);
Textarea.displayName = "Textarea";

/** Native <select> styled like shadcn: works in plain <form> posts and server actions. */
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => <select ref={ref} className={cn(field, "h-9", className)} {...props} />,
);
Select.displayName = "Select";

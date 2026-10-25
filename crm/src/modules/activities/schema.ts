import { z } from "zod";

export const ACTIVITY_TYPES = ["CALL", "MEETING", "NOTE", "FOLLOW_UP"] as const;

export const activitySchema = z.object({
  type: z.enum(ACTIVITY_TYPES),
  subject: z.string().min(1, "err:subjectRequired").max(200),
  body: z.string().max(5000).optional(),
  dueAt: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "err:invalidDate")
    .optional(),
  assigneeId: z.string().optional(),
  contactId: z.string().optional(),
  companyId: z.string().optional(),
  dealId: z.string().optional(),
  returnTo: z.string().optional(),
});
export type ActivityInput = z.infer<typeof activitySchema>;

/** Only allow redirects back into the app. */
export function safeReturnTo(v: string | undefined, fallback: string) {
  return v && v.startsWith("/") && !v.startsWith("//") ? v : fallback;
}

/** <input type="datetime-local"> value in server-local time. */
export function toLocalInput(d: Date | null | undefined) {
  if (!d) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

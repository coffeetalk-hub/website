import { z } from "zod";

export const dealSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  value: z
    .string()
    .min(1, "Value is required")
    .transform(Number)
    .refine((n) => Number.isFinite(n) && n >= 0, "Enter a valid amount"),
  stageId: z.string().min(1, "Stage is required"),
  expectedCloseDate: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date")
    .optional(),
  companyId: z.string().optional(),
  contactId: z.string().optional(),
  ownerId: z.string().optional(),
});
export type DealInput = z.infer<typeof dealSchema>;

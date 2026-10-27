import { z } from "zod";

export const dealSchema = z.object({
  title: z.string().min(1, "err:titleRequired").max(200),
  value: z
    .string()
    .min(1, "err:valueRequired")
    .transform(Number)
    .refine((n) => Number.isFinite(n) && n >= 0, "err:invalidAmount"),
  stageId: z.string().min(1, "err:stageRequired"),
  expectedCloseDate: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "err:invalidDate")
    .optional(),
  companyId: z.string().optional(),
  contactId: z.string().optional(),
  ownerId: z.string().optional(),
});
export type DealInput = z.infer<typeof dealSchema>;

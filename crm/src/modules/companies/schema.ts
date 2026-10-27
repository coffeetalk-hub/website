import { z } from "zod";

const url = z
  .string()
  .max(200)
  .refine((v) => /^(https?:\/\/)?[^\s.]+\.[^\s]+$/.test(v), "err:invalidWebsite");

export const companySchema = z.object({
  name: z.string().min(1, "err:nameRequired").max(200),
  industry: z.string().max(100).optional(),
  website: url.optional(),
  phone: z.string().max(50).optional(),
  address: z.string().max(300).optional(),
  ownerId: z.string().optional(),
});
export type CompanyInput = z.infer<typeof companySchema>;

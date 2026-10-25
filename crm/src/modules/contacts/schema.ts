import { z } from "zod";

export const SOURCES = ["Website", "Referral", "Event", "Cold outreach", "Partner", "Other"];

export const contactSchema = z.object({
  firstName: z.string().min(1, "err:firstNameRequired").max(100),
  lastName: z.string().min(1, "err:lastNameRequired").max(100),
  email: z.string().email("err:invalidEmail").max(200).optional(),
  phone: z.string().max(50).optional(),
  jobTitle: z.string().max(100).optional(),
  source: z.string().max(100).optional(),
  companyId: z.string().optional(),
  ownerId: z.string().optional(),
});
export type ContactInput = z.infer<typeof contactSchema>;

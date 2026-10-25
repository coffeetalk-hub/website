import { z } from "zod";

export const SOURCES = ["Website", "Referral", "Event", "Cold outreach", "Partner", "Other"];

export const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Enter a valid email").max(200).optional(),
  phone: z.string().max(50).optional(),
  jobTitle: z.string().max(100).optional(),
  source: z.string().max(100).optional(),
  companyId: z.string().optional(),
  ownerId: z.string().optional(),
});
export type ContactInput = z.infer<typeof contactSchema>;

import { z } from "zod";

export const QUOTE_STATUSES = ["DRAFT", "SENT", "ACCEPTED", "REJECTED"] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

const date = z.string().refine((v) => !Number.isNaN(Date.parse(v)), "err:invalidDate");

export const quoteSchema = z.object({
  companyId: z.string().optional(),
  contactId: z.string().optional(),
  dealId: z.string().optional(),
  issueDate: date,
  validUntil: date.optional(),
  notes: z.string().max(3000).optional(),
  terms: z.string().max(3000).optional(),
});

/** Allowed status moves. */
export const QUOTE_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  DRAFT: ["SENT"],
  SENT: ["ACCEPTED", "REJECTED", "DRAFT"],
  ACCEPTED: ["DRAFT"],
  REJECTED: ["DRAFT"],
};

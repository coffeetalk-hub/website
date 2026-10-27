import { z } from "zod";

export const INVOICE_STATUSES = ["DRAFT", "ISSUED", "PAID", "CANCELLED"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

const date = z.string().refine((v) => !Number.isNaN(Date.parse(v)), "err:invalidDate");

export const invoiceSchema = z.object({
  buyerName: z.string().min(1, "err:nameRequired").max(200),
  buyerVat: z.string().regex(/^\d{15}$/, "err:invalidVatNumber").optional(),
  buyerAddress: z.string().max(500).optional(),
  companyId: z.string().optional(),
  contactId: z.string().optional(),
  dealId: z.string().optional(),
  issueDate: date,
  dueDate: date.optional(),
  notes: z.string().max(3000).optional(),
});

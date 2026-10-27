// Event names, kept in their own file so client components can import them without pulling in server-only code.
export const WEBHOOK_EVENTS = [
  "contact.created", "contact.updated", "contact.deleted",
  "company.created", "company.updated", "company.deleted",
  "deal.created", "deal.updated", "deal.deleted", "deal.moved",
  "task.created", "task.updated", "task.deleted",
  "quote.created", "quote.updated", "quote.sent", "quote.accepted", "quote.rejected",
  "invoice.created", "invoice.updated", "invoice.issued", "invoice.paid", "invoice.cancelled",
] as const;

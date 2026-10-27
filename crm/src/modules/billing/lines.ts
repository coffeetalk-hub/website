import { z } from "zod";
import { round2 } from "./totals";

const n = (min: number, max = Number.MAX_SAFE_INTEGER) => z.coerce.number().refine((v) => Number.isFinite(v) && v >= min && v <= max);

export const lineSchema = z.object({
  productId: z.string().optional().nullable(),
  description: z.string().trim().min(1).max(500),
  qty: n(0.0001, 1_000_000),
  unitPrice: n(0, 1_000_000_000),
  discountPct: n(0, 100),
  vatRate: n(0, 100),
});
export const linesSchema = z.array(lineSchema).min(1).max(200);
export type LineData = z.infer<typeof lineSchema>;

/** The form posts line items as a JSON string in the `lines` field. */
export function parseLines(raw: FormDataEntryValue | null) {
  try {
    const parsed = linesSchema.safeParse(JSON.parse(String(raw ?? "[]")));
    return parsed.success ? parsed.data.map((l) => ({ ...l, qty: round2(l.qty * 10000) / 10000, unitPrice: round2(l.unitPrice), discountPct: round2(l.discountPct), vatRate: round2(l.vatRate) })) : null;
  } catch {
    return null;
  }
}

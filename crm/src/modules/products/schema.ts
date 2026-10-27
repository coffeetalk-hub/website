import { z } from "zod";

const number = (msg: string) =>
  z
    .string()
    .transform(Number)
    .refine((n) => Number.isFinite(n) && n >= 0, msg);

export const productSchema = z.object({
  name: z.string().min(1, "err:nameRequired").max(200),
  sku: z.string().max(60).optional(),
  description: z.string().max(1000).optional(),
  unitPrice: number("err:priceInvalid"),
  vatRate: number("err:priceInvalid").refine((n) => n <= 100, "err:priceInvalid"),
});

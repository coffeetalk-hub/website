import { db } from "@/core/db";

/** Gap-free, per-year document numbers, e.g. nextNumber("INV", "invoice") → "INV-2026-0001". Atomic. */
export async function nextNumber(prefix: string, counter: string, date = new Date()) {
  const year = date.getFullYear();
  const key = `${counter}:${year}`;
  const row = await db.counter.upsert({ where: { key }, update: { value: { increment: 1 } }, create: { key, value: 1 } });
  return `${prefix}-${year}-${String(row.value).padStart(4, "0")}`;
}

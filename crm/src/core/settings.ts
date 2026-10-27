import { db } from "@/core/db";

/** Typed key/value settings stored in the `Setting` table (JSON). */
export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await db.setting.findUnique({ where: { key } });
  return row ? ({ ...(fallback as object), ...(row.value as object) } as T) : fallback;
}

export async function setSetting(key: string, value: unknown) {
  await db.setting.upsert({ where: { key }, update: { value: value as never }, create: { key, value: value as never } });
}

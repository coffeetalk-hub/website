import { createHash, randomBytes } from "node:crypto";

export const KEY_PREFIX = "crm_live_";
export const hashKey = (key: string) => createHash("sha256").update(key).digest("hex");

/** A new random key (shown to the admin once; only its hash is stored). */
export function generateApiKey() {
  const key = KEY_PREFIX + randomBytes(24).toString("base64url");
  return { key, prefix: key.slice(0, KEY_PREFIX.length + 6), hash: hashKey(key) };
}

import { db } from "@/core/db";
import { ForbiddenError, type Role, type SessionUser } from "@/core/permissions";
import { ApiError } from "./errors";
import { hashKey, KEY_PREFIX } from "./keys";

export type ApiContext = { user: SessionUser; scope: "READ" | "WRITE"; keyId: string };

// Per-key request limit (in memory: fine for one server; use Redis if you run several).
const LIMIT = 120;
const WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();

function rateLimit(keyId: string) {
  const now = Date.now();
  const recent = (hits.get(keyId) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) throw new ApiError(429, "rate_limited", `Rate limit of ${LIMIT} requests per minute exceeded.`);
  recent.push(now);
  hits.set(keyId, recent);
}

/** Authenticates `Authorization: Bearer crm_live_…`. The key acts as its user: same role, same record scope. */
export async function authenticate(req: Request): Promise<ApiContext> {
  const header = req.headers.get("authorization") ?? "";
  const key = header.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!key || !key.startsWith(KEY_PREFIX)) throw new ApiError(401, "unauthorized", "Missing or invalid API key. Send 'Authorization: Bearer <key>'.");
  const row = await db.apiKey.findUnique({ where: { hash: hashKey(key) }, include: { user: true } });
  if (!row || row.revokedAt || !row.user.active) throw new ApiError(401, "unauthorized", "Invalid, revoked or disabled API key.");
  if (row.user.mustChangePassword) throw new ApiError(403, "forbidden", "The key's user must change their password first.");
  rateLimit(row.id);
  // update lastUsedAt at most once a minute (avoid a write per request)
  if (!row.lastUsedAt || Date.now() - row.lastUsedAt.getTime() > 60_000) await db.apiKey.update({ where: { id: row.id }, data: { lastUsedAt: new Date() } });
  const u = row.user;
  return { user: { id: u.id, email: u.email, name: u.name, role: u.role as Role, mustChangePassword: false }, scope: row.scope === "WRITE" ? "WRITE" : "READ", keyId: row.id };
}

export function requireWrite(ctx: ApiContext) {
  if (ctx.scope !== "WRITE") throw new ApiError(403, "read_only_key", "This API key is read-only.");
}

/** Maps permission failures to API errors. */
export function asApiError(e: unknown): unknown {
  return e instanceof ForbiddenError ? new ApiError(403, "forbidden", "You do not have permission to do that.") : e;
}

import { headers } from "next/headers";
import { db } from "@/core/db";

// Sign-in throttling, stored in the database (fine for a single server; use Redis if you scale out).
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS_PER_EMAIL = 5;
const MAX_FAILS_PER_IP = 25;

/** Best-effort client IP. Only trustworthy behind a proxy that sets/overwrites x-forwarded-for. */
export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
}

/** Returns minutes until the next attempt is allowed, or null if sign-in is allowed now. */
export async function loginLockMinutes(email: string, ip: string | null): Promise<number | null> {
  const since = new Date(Date.now() - WINDOW_MS);
  const checks: { where: object; max: number }[] = [{ where: { email }, max: MAX_FAILS_PER_EMAIL }];
  if (ip) checks.push({ where: { ip }, max: MAX_FAILS_PER_IP });
  let unlockAt = 0;
  for (const c of checks) {
    const fails = await db.loginAttempt.findMany({
      where: { ...c.where, success: false, createdAt: { gt: since } },
      orderBy: { createdAt: "desc" },
      take: c.max,
      select: { createdAt: true },
    });
    if (fails.length >= c.max) unlockAt = Math.max(unlockAt, fails[c.max - 1].createdAt.getTime() + WINDOW_MS);
  }
  return unlockAt > Date.now() ? Math.max(1, Math.ceil((unlockAt - Date.now()) / 60000)) : null;
}

export async function recordLoginAttempt(email: string, ip: string | null, success: boolean) {
  await db.loginAttempt.create({ data: { email, ip, success } });
  if (success) await db.loginAttempt.deleteMany({ where: { email, success: false } }); // a good sign-in resets the counter
  // housekeeping: failures older than the window are irrelevant; keep successes for the "recent sign-ins" list for 90 days
  if (Math.random() < 0.05) {
    await db.loginAttempt.deleteMany({ where: { success: false, createdAt: { lt: new Date(Date.now() - WINDOW_MS) } } });
    await db.loginAttempt.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 90 * 24 * 3600 * 1000) } } });
  }
}

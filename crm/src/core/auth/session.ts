import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/core/db";
import { can, type Action, type Resource, type Role, type SessionUser } from "@/core/permissions";

const COOKIE = "crm_session";
const MAX_AGE = 60 * 60 * 24 * 7;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set (see .env.example)");
  return new TextEncoder().encode(s);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

/** Current user, re-read from the DB on every request so role/active changes apply immediately. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const user = await db.user.findUnique({ where: { id: String(payload.uid) } });
    if (!user || !user.active) return null;
    return { id: user.id, email: user.email, name: user.name, role: user.role as Role };
  } catch {
    return null;
  }
});

/** Use at the top of every page and server action. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** For pages restricted by role: signed-in users without access get a 404 (not a 500). */
export async function requireAccess(resource: Resource, action: Action = "read"): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user, resource, action)) notFound();
  return user;
}

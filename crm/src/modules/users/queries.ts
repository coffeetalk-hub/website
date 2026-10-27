import { db } from "@/core/db";
import { isPrivileged, type SessionUser } from "@/core/permissions";

/** Users that may be picked as record owner / assignee. Reps can only pick themselves. */
export async function listAssignableUsers(user: SessionUser) {
  if (!isPrivileged(user)) return [{ id: user.id, name: user.name }];
  return db.user.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } });
}

/** Resolve an owner id from form input: reps are always themselves; others must pick an active user. */
export async function resolveOwnerId(user: SessionUser, requested?: string) {
  if (!isPrivileged(user) || !requested) return user.id;
  const u = await db.user.findFirst({ where: { id: requested, active: true }, select: { id: true } });
  return u?.id ?? user.id;
}

import type { Prisma } from "@prisma/client";

export type Role = "ADMIN" | "MANAGER" | "REP";
export const ROLES: Role[] = ["ADMIN", "MANAGER", "REP"];

export type SessionUser = { id: string; email: string; name: string; role: Role; mustChangePassword: boolean };

export type Resource =
  | "contact"
  | "company"
  | "deal"
  | "activity"
  | "user"
  | "settings"
  | "import"
  | "export";
export type Action = "read" | "create" | "update" | "delete" | "manage";

/**
 * Role → what the role may do per resource.
 * "own" = only records the user owns / is assigned to (enforced by `ownedBy`/`assertCanAccess`).
 * "all" = every record.
 */
type Grant = "own" | "all" | false;
const matrix: Record<Role, Record<Resource, Grant>> = {
  ADMIN: { contact: "all", company: "all", deal: "all", activity: "all", user: "all", settings: "all", import: "all", export: "all" },
  MANAGER: { contact: "all", company: "all", deal: "all", activity: "all", user: false, settings: false, import: "all", export: "all" },
  REP: { contact: "own", company: "own", deal: "own", activity: "own", user: false, settings: false, import: "own", export: "own" },
};

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function grantFor(user: SessionUser, resource: Resource): Grant {
  return matrix[user.role][resource];
}

/** Can the user perform this kind of operation on the resource at all? */
export function can(user: SessionUser, resource: Resource, _action: Action = "read"): boolean {
  return grantFor(user, resource) !== false;
}

export function assertCan(user: SessionUser, resource: Resource, action: Action = "read") {
  if (!can(user, resource, action)) throw new ForbiddenError();
}

export function isPrivileged(user: SessionUser) {
  return user.role === "ADMIN" || user.role === "MANAGER";
}

/**
 * Prisma `where` fragment restricting a query to what the user may see.
 * `ownerField` is the column holding the owning user id (ownerId / assigneeId).
 */
export function scope(user: SessionUser, resource: Resource, ownerField = "ownerId") {
  assertCan(user, resource);
  return grantFor(user, resource) === "all" ? {} : { [ownerField]: user.id };
}

/** Throw unless the user may touch this specific record. */
export function assertOwns(user: SessionUser, resource: Resource, record: { ownerId?: string; assigneeId?: string }) {
  assertCan(user, resource);
  if (grantFor(user, resource) === "all") return;
  const owner = record.ownerId ?? record.assigneeId;
  if (owner !== user.id) throw new ForbiddenError();
}

/** Boolean form of assertOwns for read paths that should 404 instead of throwing. */
export function canAccess(user: SessionUser, resource: Resource, record: { ownerId?: string; assigneeId?: string }) {
  try {
    assertOwns(user, resource, record);
    return true;
  } catch {
    return false;
  }
}

export type { Prisma };

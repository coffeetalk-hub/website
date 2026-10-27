import { db } from "@/core/db";
import type { SessionUser } from "@/core/permissions";
import { dispatchFromAudit } from "@/core/webhooks";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "IMPORT" | "EXPORT" | "MOVE" | "LOGIN" | "PASSWORD";

type Json = Record<string, unknown>;

/** Compute {field: {from, to}} for fields that differ. */
export function diff(before: Json, after: Json): Json {
  const out: Json = {};
  for (const k of Object.keys(after)) {
    if (k === "updatedAt" || k === "createdAt") continue;
    const a = JSON.stringify(before[k] ?? null);
    const b = JSON.stringify(after[k] ?? null);
    if (a !== b) out[k] = { from: before[k] ?? null, to: after[k] ?? null };
  }
  return out;
}

export async function logAudit(
  user: SessionUser | null,
  entity: string,
  recordId: string,
  action: AuditAction,
  changes?: unknown,
) {
  await db.auditLog.create({
    data: {
      userId: user?.id ?? null,
      entity,
      recordId,
      action,
      changes: (changes ?? undefined) as never,
    },
  });
  // Webhooks are driven by the audit trail, so every code path that is audited also notifies subscribers.
  void dispatchFromAudit(entity, recordId, action, changes, user?.id ?? null).catch(() => {});
}

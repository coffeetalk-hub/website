import { db } from "@/core/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";

const VERBS: Record<string, string> = { CREATE: "created", UPDATE: "updated", DELETE: "deleted", IMPORT: "imported", MOVE: "moved" };

/** "Change history" card for a record. Callers must already have verified read access. */
export async function AuditHistory({ entity, recordId }: { entity: string; recordId: string }) {
  const logs = await db.auditLog.findMany({
    where: { entity, recordId },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 15,
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Change history</CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No changes recorded.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {logs.map((l) => {
              const fields = l.changes && typeof l.changes === "object" ? Object.keys(l.changes as object) : [];
              return (
                <li key={l.id}>
                  <span className="font-medium">{l.user?.name ?? "System"}</span> {VERBS[l.action] ?? l.action.toLowerCase()}
                  {fields.length > 0 && l.action === "UPDATE" && <span className="text-muted-foreground"> ({fields.join(", ")})</span>}
                  <span className="block text-xs text-muted-foreground">{formatDateTime(l.createdAt)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

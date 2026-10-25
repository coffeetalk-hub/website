"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/core/db";
import { requireUser } from "@/core/auth/session";
import { assertCan, assertOwns, type SessionUser } from "@/core/permissions";
import { logAudit, diff } from "@/core/audit";
import { formToObject, toActionError, zodErrors, type ActionState } from "@/core/forms";
import { resolveOwnerId } from "@/modules/users/queries";
import { activitySchema, safeReturnTo } from "./schema";

/** Linked records must be ones the user can access. */
async function checkLinks(user: SessionUser, ids: { contactId?: string; companyId?: string; dealId?: string }) {
  const out = { contactId: null as string | null, companyId: null as string | null, dealId: null as string | null };
  if (ids.contactId) {
    const r = await db.contact.findUnique({ where: { id: ids.contactId } });
    if (r) (assertOwns(user, "contact", r), (out.contactId = r.id));
  }
  if (ids.companyId) {
    const r = await db.company.findUnique({ where: { id: ids.companyId } });
    if (r) (assertOwns(user, "company", r), (out.companyId = r.id));
  }
  if (ids.dealId) {
    const r = await db.deal.findUnique({ where: { id: ids.dealId } });
    if (r) (assertOwns(user, "deal", r), (out.dealId = r.id));
  }
  return out;
}

export async function createActivity(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  let returnTo: string;
  try {
    assertCan(user, "activity", "create");
    const parsed = activitySchema.safeParse(formToObject(fd));
    if (!parsed.success) return zodErrors(parsed.error);
    const { assigneeId, returnTo: rt, contactId, companyId, dealId, dueAt, ...data } = parsed.data;
    const links = await checkLinks(user, { contactId, companyId, dealId });
    const rec = await db.activity.create({
      data: {
        ...data,
        ...links,
        dueAt: dueAt ? new Date(dueAt) : null,
        assigneeId: await resolveOwnerId(user, assigneeId),
        creatorId: user.id,
      },
    });
    await logAudit(user, "Activity", rec.id, "CREATE", { type: rec.type, subject: rec.subject });
    returnTo = safeReturnTo(rt, "/tasks");
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/tasks");
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function updateActivity(id: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  try {
    const existing = await db.activity.findUnique({ where: { id } });
    if (!existing) return { error: "Record not found." };
    assertOwns(user, "activity", existing);
    assertCan(user, "activity", "update");
    const parsed = activitySchema.safeParse(formToObject(fd));
    if (!parsed.success) return zodErrors(parsed.error);
    const { assigneeId, dueAt, body, type, subject } = parsed.data;
    const updated = await db.activity.update({
      where: { id },
      data: { type, subject, body: body ?? null, dueAt: dueAt ? new Date(dueAt) : null, assigneeId: await resolveOwnerId(user, assigneeId ?? existing.assigneeId) },
    });
    const changes = diff(existing, updated);
    if (Object.keys(changes).length) await logAudit(user, "Activity", id, "UPDATE", changes);
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/tasks");
  redirect("/tasks");
}

export async function toggleActivityDone(id: string) {
  const user = await requireUser();
  const a = await db.activity.findUnique({ where: { id } });
  if (!a) return;
  assertOwns(user, "activity", a);
  assertCan(user, "activity", "update");
  const completedAt = a.completedAt ? null : new Date();
  await db.activity.update({ where: { id }, data: { completedAt } });
  await logAudit(user, "Activity", id, "UPDATE", { completedAt: { from: a.completedAt, to: completedAt } });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function deleteActivity(id: string) {
  const user = await requireUser();
  const a = await db.activity.findUnique({ where: { id } });
  if (!a) redirect("/tasks");
  assertOwns(user, "activity", a);
  assertCan(user, "activity", "delete");
  await db.activity.delete({ where: { id } });
  await logAudit(user, "Activity", id, "DELETE", { subject: a.subject });
  revalidatePath("/tasks");
  redirect("/tasks");
}

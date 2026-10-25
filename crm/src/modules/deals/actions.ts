"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/core/db";
import { requireUser } from "@/core/auth/session";
import { assertCan, assertOwns, scope, type SessionUser } from "@/core/permissions";
import { logAudit, diff } from "@/core/audit";
import { formToObject, toActionError, zodErrors, type ActionState } from "@/core/forms";
import { deleteFieldValues, getFieldDefs, parseCustomFields, saveFieldValues } from "@/core/custom-fields";
import { resolveOwnerId } from "@/modules/users/queries";
import { dealSchema } from "./schema";

/** Linked company/contact must be ones the user may access. Returns the ids to store. */
async function checkLinks(user: SessionUser, companyId?: string, contactId?: string) {
  let cId: string | null = null;
  let kId: string | null = null;
  if (companyId) {
    const c = await db.company.findUnique({ where: { id: companyId } });
    if (c) {
      assertOwns(user, "company", c);
      cId = c.id;
    }
  }
  if (contactId) {
    const k = await db.contact.findUnique({ where: { id: contactId } });
    if (k) {
      assertOwns(user, "contact", k);
      kId = k.id;
    }
  }
  return { companyId: cId, contactId: kId };
}

async function validate(fd: FormData) {
  const parsed = dealSchema.safeParse(formToObject(fd));
  const defs = await getFieldDefs("DEAL");
  const cf = parseCustomFields(defs, fd);
  if (!parsed.success || Object.keys(cf.errors).length) {
    const base = parsed.success ? {} : zodErrors(parsed.error).fieldErrors;
    return { error: { error: "Please fix the highlighted fields.", fieldErrors: { ...base, ...cf.errors } } as ActionState };
  }
  const stage = await db.stage.findUnique({ where: { id: parsed.data.stageId } });
  if (!stage) return { error: { error: "Please fix the highlighted fields.", fieldErrors: { stageId: "Unknown stage" } } as ActionState };
  return { data: parsed.data, defs, cf };
}

async function nextPosition(stageId: string) {
  const last = await db.deal.aggregate({ where: { stageId }, _max: { position: true } });
  return (last._max.position ?? -1) + 1;
}

export async function createDeal(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  let id: string;
  try {
    assertCan(user, "deal", "create");
    const v = await validate(fd);
    if (v.error) return v.error;
    const { ownerId: requestedOwner, companyId, contactId, expectedCloseDate, ...data } = v.data;
    const rec = await db.deal.create({
      data: {
        ...data,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        ...(await checkLinks(user, companyId, contactId)),
        ownerId: await resolveOwnerId(user, requestedOwner),
        position: await nextPosition(data.stageId),
      },
    });
    await saveFieldValues("DEAL", rec.id, v.defs, v.cf.values);
    await logAudit(user, "Deal", rec.id, "CREATE", { title: rec.title, value: rec.value });
    id = rec.id;
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/deals");
  redirect(`/deals/${id}`);
}

export async function updateDeal(id: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  try {
    const existing = await db.deal.findUnique({ where: { id } });
    if (!existing) return { error: "Record not found." };
    assertOwns(user, "deal", existing);
    assertCan(user, "deal", "update");
    const v = await validate(fd);
    if (v.error) return v.error;
    const { ownerId: requestedOwner, companyId, contactId, expectedCloseDate, ...data } = v.data;
    const updated = await db.deal.update({
      where: { id },
      data: {
        ...data,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        ...(await checkLinks(user, companyId, contactId)),
        ownerId: await resolveOwnerId(user, requestedOwner ?? existing.ownerId),
        ...(data.stageId !== existing.stageId ? { position: await nextPosition(data.stageId) } : {}),
      },
    });
    const customDiff = await saveFieldValues("DEAL", id, v.defs, v.cf.values);
    const changes = { ...diff(existing, updated), ...customDiff };
    delete (changes as Record<string, unknown>).position;
    if (Object.keys(changes).length) await logAudit(user, "Deal", id, "UPDATE", changes);
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/deals");
  redirect(`/deals/${id}`);
}

export async function deleteDeal(id: string) {
  const user = await requireUser();
  const existing = await db.deal.findUnique({ where: { id } });
  if (!existing) redirect("/deals");
  assertOwns(user, "deal", existing);
  assertCan(user, "deal", "delete");
  await db.deal.delete({ where: { id } });
  await deleteFieldValues("DEAL", id);
  await logAudit(user, "Deal", id, "DELETE", { title: existing.title });
  revalidatePath("/deals");
  redirect("/deals");
}

/** Drag-and-drop: put a deal into `stageId` at `index` within that column. */
export async function moveDeal(dealId: string, stageId: string, index: number): Promise<{ error?: string }> {
  const user = await requireUser();
  const deal = await db.deal.findUnique({ where: { id: dealId }, include: { stage: true } });
  if (!deal) return { error: "Deal not found." };
  try {
    assertOwns(user, "deal", deal);
    assertCan(user, "deal", "update");
  } catch {
    return { error: "You do not have permission to move this deal." };
  }
  const stage = await db.stage.findUnique({ where: { id: stageId } });
  if (!stage) return { error: "Unknown stage." };

  await db.$transaction(async (tx) => {
    const others = await tx.deal.findMany({
      where: { stageId, id: { not: dealId }, ...scope(user, "deal") },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      select: { id: true },
    });
    const at = Math.max(0, Math.min(Number.isFinite(index) ? Math.trunc(index) : others.length, others.length));
    others.splice(at, 0, { id: dealId });
    for (const [i, o] of others.entries()) {
      await tx.deal.update({ where: { id: o.id }, data: o.id === dealId ? { position: i, stageId } : { position: i } });
    }
  });
  if (deal.stageId !== stageId) {
    await logAudit(user, "Deal", dealId, "MOVE", { stage: { from: deal.stage.name, to: stage.name } });
  }
  revalidatePath("/deals");
  return {};
}

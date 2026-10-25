"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/core/db";
import { requireUser } from "@/core/auth/session";
import { assertCan, assertOwns, type SessionUser } from "@/core/permissions";
import { logAudit, diff } from "@/core/audit";
import { formToObject, toActionError, zodErrors, type ActionState } from "@/core/forms";
import { deleteFieldValues, getFieldDefs, parseCustomFields, saveFieldValues } from "@/core/custom-fields";
import { resolveOwnerId } from "@/modules/users/queries";
import { contactSchema } from "./schema";

/** A rep may only link a contact to a company they can access. */
async function checkCompany(user: SessionUser, companyId?: string) {
  if (!companyId) return null;
  const c = await db.company.findUnique({ where: { id: companyId } });
  if (!c) return null;
  assertOwns(user, "company", c);
  return c.id;
}

async function validate(fd: FormData) {
  const parsed = contactSchema.safeParse(formToObject(fd));
  const defs = await getFieldDefs("CONTACT");
  const cf = parseCustomFields(defs, fd);
  if (!parsed.success || Object.keys(cf.errors).length) {
    const base = parsed.success ? {} : zodErrors(parsed.error).fieldErrors;
    return { error: { error: "Please fix the highlighted fields.", fieldErrors: { ...base, ...cf.errors } } as ActionState };
  }
  return { data: parsed.data, defs, cf };
}

export async function createContact(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  let id: string;
  try {
    assertCan(user, "contact", "create");
    const v = await validate(fd);
    if (v.error) return v.error;
    const { ownerId: requestedOwner, companyId, ...data } = v.data;
    const rec = await db.contact.create({
      data: { ...data, companyId: await checkCompany(user, companyId), ownerId: await resolveOwnerId(user, requestedOwner) },
    });
    await saveFieldValues("CONTACT", rec.id, v.defs, v.cf.values);
    await logAudit(user, "Contact", rec.id, "CREATE", { name: `${rec.firstName} ${rec.lastName}` });
    id = rec.id;
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/contacts");
  redirect(`/contacts/${id}`);
}

export async function updateContact(id: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  try {
    const existing = await db.contact.findUnique({ where: { id } });
    if (!existing) return { error: "Record not found." };
    assertOwns(user, "contact", existing);
    assertCan(user, "contact", "update");
    const v = await validate(fd);
    if (v.error) return v.error;
    const { ownerId: requestedOwner, companyId, ...rest } = v.data;
    const updated = await db.contact.update({
      where: { id },
      data: {
        firstName: rest.firstName,
        lastName: rest.lastName,
        email: rest.email ?? null,
        phone: rest.phone ?? null,
        jobTitle: rest.jobTitle ?? null,
        source: rest.source ?? null,
        companyId: await checkCompany(user, companyId),
        ownerId: await resolveOwnerId(user, requestedOwner ?? existing.ownerId),
      },
    });
    const customDiff = await saveFieldValues("CONTACT", id, v.defs, v.cf.values);
    const changes = { ...diff(existing, updated), ...customDiff };
    if (Object.keys(changes).length) await logAudit(user, "Contact", id, "UPDATE", changes);
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/contacts");
  redirect(`/contacts/${id}`);
}

export async function deleteContact(id: string) {
  const user = await requireUser();
  const existing = await db.contact.findUnique({ where: { id } });
  if (!existing) redirect("/contacts");
  assertOwns(user, "contact", existing);
  assertCan(user, "contact", "delete");
  await db.contact.delete({ where: { id } });
  await deleteFieldValues("CONTACT", id);
  await logAudit(user, "Contact", id, "DELETE", { name: `${existing.firstName} ${existing.lastName}` });
  revalidatePath("/contacts");
  redirect("/contacts");
}

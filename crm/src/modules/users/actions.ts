"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/core/db";
import { requireUser } from "@/core/auth/session";
import { getT } from "@/core/i18n/server";
import { hashPassword } from "@/core/auth/password";
import { assertCan } from "@/core/permissions";
import { logAudit, diff } from "@/core/audit";
import { formToObject, toActionError, zodErrors, type ActionState } from "@/core/forms";
import { createUserSchema, updateUserSchema } from "./schema";

export async function createUser(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireUser();
  const t = await getT();
  let id: string;
  try {
    assertCan(admin, "user", "manage");
    const parsed = createUserSchema.safeParse(formToObject(fd));
    if (!parsed.success) return zodErrors(parsed.error, t);
    const email = parsed.data.email.toLowerCase();
    if (await db.user.findUnique({ where: { email } })) return { error: t.errors.pleaseFix, fieldErrors: { email: t.errors.emailInUse } };
    const rec = await db.user.create({
      data: { name: parsed.data.name, email, role: parsed.data.role, passwordHash: await hashPassword(parsed.data.password) },
    });
    await logAudit(admin, "User", rec.id, "CREATE", { name: rec.name, role: rec.role });
    id = rec.id;
  } catch (e) {
    return toActionError(e, t);
  }
  revalidatePath("/users");
  redirect("/users?saved=" + id);
}

export async function updateUser(id: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireUser();
  const t = await getT();
  try {
    assertCan(admin, "user", "manage");
    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) return { error: t.errors.userNotFound };
    const parsed = updateUserSchema.safeParse(formToObject(fd));
    if (!parsed.success) return zodErrors(parsed.error, t);
    const active = fd.get("active") === "on";
    const email = parsed.data.email.toLowerCase();

    const clash = await db.user.findFirst({ where: { email, id: { not: id } } });
    if (clash) return { error: t.errors.pleaseFix, fieldErrors: { email: t.errors.emailInUse } };

    // Never lock everyone out: keep at least one active admin, and don't let admins demote/deactivate themselves.
    const losingAdmin = existing.role === "ADMIN" && existing.active && (parsed.data.role !== "ADMIN" || !active);
    if (losingAdmin) {
      if (id === admin.id) return { error: t.errors.selfLockout };
      const others = await db.user.count({ where: { role: "ADMIN", active: true, id: { not: id } } });
      if (others === 0) return { error: t.errors.lastAdmin };
    }

    const updated = await db.user.update({
      where: { id },
      data: {
        name: parsed.data.name,
        email,
        role: parsed.data.role,
        active,
        ...(parsed.data.password ? { passwordHash: await hashPassword(parsed.data.password) } : {}),
      },
    });
    const changes: Record<string, unknown> = diff(existing, updated);
    delete changes.passwordHash;
    if (parsed.data.password) changes.password = "changed";
    if (Object.keys(changes).length) await logAudit(admin, "User", id, "UPDATE", changes);
  } catch (e) {
    return toActionError(e, t);
  }
  revalidatePath("/users");
  redirect("/users?saved=" + id);
}

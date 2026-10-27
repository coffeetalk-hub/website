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
import { passwordProblem } from "@/core/auth/password-policy";
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
    const problem = passwordProblem(parsed.data.password, { email });
    if (problem) return { error: t.errors.pleaseFix, fieldErrors: { password: t.errors[problem] } };
    if (await db.user.findUnique({ where: { email } })) return { error: t.errors.pleaseFix, fieldErrors: { email: t.errors.emailInUse } };
    const rec = await db.user.create({
      data: { name: parsed.data.name, email, role: parsed.data.role, passwordHash: await hashPassword(parsed.data.password), mustChangePassword: fd.get("mustChange") === "on" },
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

    if (parsed.data.password) {
      const problem = passwordProblem(parsed.data.password, { email });
      if (problem) return { error: t.errors.pleaseFix, fieldErrors: { password: t.errors[problem] } };
    }

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
        // An admin-set password signs the user out everywhere and (optionally) forces a change at next sign-in.
        ...(parsed.data.password
          ? { passwordHash: await hashPassword(parsed.data.password), mustChangePassword: fd.get("mustChange") === "on", sessionVersion: { increment: 1 } }
          : {}),
      },
    });
    const changes: Record<string, unknown> = diff(existing, updated);
    delete changes.passwordHash;
    if (parsed.data.password) changes.password = "reset by admin";
    if (Object.keys(changes).length) await logAudit(admin, "User", id, "UPDATE", changes);
  } catch (e) {
    return toActionError(e, t);
  }
  revalidatePath("/users");
  redirect("/users?saved=" + id);
}

/** Sign a user out of every device (invalidates all their session cookies). */
export async function revokeSessions(id: string) {
  const admin = await requireUser();
  assertCan(admin, "user", "manage");
  const u = await db.user.update({ where: { id }, data: { sessionVersion: { increment: 1 } } });
  await logAudit(admin, "User", u.id, "UPDATE", { sessions: "revoked" });
  revalidatePath(`/users/${id}/edit`);
  redirect(`/users/${id}/edit?revoked=1`);
}

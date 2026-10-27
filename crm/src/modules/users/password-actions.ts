"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/core/db";
import { createSession, getCurrentUser } from "@/core/auth/session";
import { hashPassword, verifyPassword } from "@/core/auth/password";
import { passwordProblem } from "@/core/auth/password-policy";
import { logAudit } from "@/core/audit";
import { getT } from "@/core/i18n/server";
import type { ActionState } from "@/core/forms";

const schema = z.object({ current: z.string().min(1), next: z.string().min(1), confirm: z.string().min(1) });

/** Self-service password change (also the forced change after an admin sets a temporary password). */
export async function changePasswordAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const t = await getT();
  const me = await getCurrentUser(); // not requireUser(): that would bounce users who must change their password
  if (!me) redirect("/login");
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: t.errors.pleaseFix, fieldErrors: { current: t.errors.required, next: t.errors.required, confirm: t.errors.required } };
  const { current, next, confirm } = parsed.data;

  const user = await db.user.findUnique({ where: { id: me.id } });
  if (!user) redirect("/login");
  if (!(await verifyPassword(current, user.passwordHash))) return { error: t.errors.pleaseFix, fieldErrors: { current: t.errors.wrongCurrent } };
  const problem = passwordProblem(next, { email: user.email });
  if (problem) return { error: t.errors.pleaseFix, fieldErrors: { next: t.errors[problem] } };
  if (next === current) return { error: t.errors.pleaseFix, fieldErrors: { next: t.errors.passwordSame } };
  if (next !== confirm) return { error: t.errors.pleaseFix, fieldErrors: { confirm: t.errors.passwordMismatch } };

  const updated = await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(next), mustChangePassword: false, sessionVersion: { increment: 1 } }, // signs out every other device
  });
  await createSession(updated.id, updated.sessionVersion); // keep this device signed in
  await logAudit({ ...me, mustChangePassword: false }, "User", user.id, "PASSWORD", { password: "changed by user" });
  redirect("/dashboard");
}

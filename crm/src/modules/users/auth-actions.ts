"use server";
import { getT } from "@/core/i18n/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/core/db";
import { createSession, destroySession } from "@/core/auth/session";
import { verifyPassword } from "@/core/auth/password";
import { clientIp, loginLockMinutes, recordLoginAttempt } from "@/core/auth/rate-limit";
import { logAudit } from "@/core/audit";
import type { Role } from "@/core/permissions";

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
// Compared when the account doesn't exist, so response time doesn't reveal which emails are registered.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

export async function loginAction(_prev: { error?: string } | undefined, formData: FormData) {
  const t = await getT();
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: t.auth.invalid };
  const email = parsed.data.email.toLowerCase();
  const ip = await clientIp();

  const locked = await loginLockMinutes(email, ip);
  if (locked) return { error: t.tpl(t.auth.locked, { minutes: locked }) };

  const user = await db.user.findUnique({ where: { email } });
  const passwordOk = await verifyPassword(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  // Same message for unknown user / wrong password / disabled account.
  if (!user || !user.active || !passwordOk) {
    await recordLoginAttempt(email, ip, false);
    return { error: t.auth.invalid };
  }
  await recordLoginAttempt(email, ip, true);
  await createSession(user.id, user.sessionVersion);
  await logAudit({ id: user.id, email: user.email, name: user.name, role: user.role as Role, mustChangePassword: user.mustChangePassword }, "User", user.id, "LOGIN");
  redirect(user.mustChangePassword ? "/change-password" : "/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

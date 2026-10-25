"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/core/db";
import { createSession, destroySession } from "@/core/auth/session";
import { verifyPassword } from "@/core/auth/password";
import { t } from "@/core/i18n";

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function loginAction(_prev: { error?: string } | undefined, formData: FormData) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: t.auth.invalid };
  const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  // Same message for unknown user / wrong password / disabled account.
  if (!user || !user.active || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: t.auth.invalid };
  }
  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

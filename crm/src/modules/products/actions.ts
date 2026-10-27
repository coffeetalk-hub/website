"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/core/db";
import { requireUser } from "@/core/auth/session";
import { getT } from "@/core/i18n/server";
import { assertCan } from "@/core/permissions";
import { diff, logAudit } from "@/core/audit";
import { formToObject, toActionError, zodErrors, type ActionState } from "@/core/forms";
import { productSchema } from "./schema";

export async function createProduct(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const t = await getT();
  try {
    assertCan(user, "product", "create");
    const p = productSchema.safeParse(formToObject(fd));
    if (!p.success) return zodErrors(p.error, t);
    const rec = await db.product.create({ data: { ...p.data, sku: p.data.sku ?? null, description: p.data.description ?? null, active: fd.get("active") === "on" } });
    await logAudit(user, "Product", rec.id, "CREATE", { name: rec.name });
  } catch (e) {
    return toActionError(e, t);
  }
  revalidatePath("/products");
  redirect("/products");
}

export async function updateProduct(id: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const t = await getT();
  try {
    assertCan(user, "product", "update");
    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) return { error: t.errors.notFound };
    const p = productSchema.safeParse(formToObject(fd));
    if (!p.success) return zodErrors(p.error, t);
    const updated = await db.product.update({
      where: { id },
      data: { ...p.data, sku: p.data.sku ?? null, description: p.data.description ?? null, active: fd.get("active") === "on" },
    });
    const changes = diff(existing, updated);
    if (Object.keys(changes).length) await logAudit(user, "Product", id, "UPDATE", changes);
  } catch (e) {
    return toActionError(e, t);
  }
  revalidatePath("/products");
  redirect("/products");
}

export async function deleteProduct(id: string) {
  const user = await requireUser();
  assertCan(user, "product", "delete");
  const existing = await db.product.findUnique({ where: { id } });
  if (existing) {
    await db.product.delete({ where: { id } }); // quote/invoice lines keep their own copy of description and price
    await logAudit(user, "Product", id, "DELETE", { name: existing.name });
  }
  revalidatePath("/products");
  redirect("/products");
}

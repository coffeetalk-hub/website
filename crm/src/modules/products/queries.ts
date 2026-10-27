import { db } from "@/core/db";

/** Active products for pickers (everyone may read the catalogue). */
export const listActiveProducts = () => db.product.findMany({ where: { active: true }, orderBy: { name: "asc" } });

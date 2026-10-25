import Papa from "papaparse";
import { db } from "@/core/db";
import { getCurrentUser } from "@/core/auth/session";
import { can, scope } from "@/core/permissions";
import { getFieldDefs, getFieldValuesMany } from "@/core/custom-fields";
import { logAudit } from "@/core/audit";
import { getT } from "@/core/i18n/server";
import { fieldsFor, type CsvEntity } from "@/modules/import-export/fields";

// Permission is checked here (not just by hiding the button): reps export only their own records.
export async function GET(req: Request, { params }: { params: Promise<{ entity: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (!can(user, "export")) return new Response("Forbidden", { status: 403 });

  const { entity: slug } = await params;
  const entity: CsvEntity | null = slug === "contacts" ? "CONTACT" : slug === "companies" ? "COMPANY" : null;
  if (!entity) return new Response("Not found", { status: 404 });

  const t = await getT();
  const defs = await getFieldDefs(entity);
  const fields = fieldsFor(entity, defs, t);
  const header = fields.map((f) => f.label);
  const template = new URL(req.url).searchParams.has("template");

  let rows: (string | number)[][] = [];
  if (!template) {
    if (entity === "CONTACT") {
      const list = await db.contact.findMany({
        where: scope(user, "contact"),
        include: { company: { select: { name: true } }, owner: { select: { email: true } } },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      });
      const cf = await getFieldValuesMany("CONTACT", list.map((c) => c.id));
      rows = list.map((c) =>
        fields.map((f) => {
          if (f.key.startsWith("cf:")) return cf.get(c.id)?.[f.key.slice(3)] ?? "";
          if (f.key === "company") return c.company?.name ?? "";
          if (f.key === "owner") return c.owner.email;
          return (c[f.key as keyof typeof c] as string | null) ?? "";
        }),
      );
    } else {
      const list = await db.company.findMany({ where: scope(user, "company"), include: { owner: { select: { email: true } } }, orderBy: { name: "asc" } });
      const cf = await getFieldValuesMany("COMPANY", list.map((c) => c.id));
      rows = list.map((c) =>
        fields.map((f) => {
          if (f.key.startsWith("cf:")) return cf.get(c.id)?.[f.key.slice(3)] ?? "";
          if (f.key === "owner") return c.owner.email;
          return (c[f.key as keyof typeof c] as string | null) ?? "";
        }),
      );
    }
    await logAudit(user, entity === "CONTACT" ? "Contact" : "Company", "batch", "EXPORT", { rows: rows.length });
  }

  // escapeFormulae neutralises =,+,-,@ prefixes (CSV/formula injection); BOM keeps Arabic readable in Excel.
  const csv = "﻿" + Papa.unparse({ fields: header, data: rows }, { escapeFormulae: true });
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}${template ? "-template" : ""}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

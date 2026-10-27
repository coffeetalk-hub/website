import type { FieldDef } from "@/core/custom-fields";
import type { T } from "@/core/i18n";

export type CsvEntity = "CONTACT" | "COMPANY";
export type CsvField = { key: string; label: string; aliases: string[]; required?: boolean };

/** Built-in columns. Custom fields are appended at runtime with key `cf:<key>`. */
export const BASE_FIELDS: Record<CsvEntity, CsvField[]> = {
  CONTACT: [
    { key: "firstName", label: "First name", aliases: ["firstname", "given name", "first"], required: true },
    { key: "lastName", label: "Last name", aliases: ["lastname", "surname", "family name", "last"], required: true },
    { key: "email", label: "Email", aliases: ["e-mail", "email address"] },
    { key: "phone", label: "Phone", aliases: ["mobile", "tel", "telephone", "phone number"] },
    { key: "jobTitle", label: "Job title", aliases: ["title", "position", "role"] },
    { key: "source", label: "Source", aliases: ["lead source"] },
    { key: "company", label: "Company", aliases: ["company name", "organization", "organisation", "account"] },
    { key: "owner", label: "Owner email", aliases: ["owner"] },
  ],
  COMPANY: [
    { key: "name", label: "Name", aliases: ["company", "company name", "organization"], required: true },
    { key: "industry", label: "Industry", aliases: ["sector"] },
    { key: "website", label: "Website", aliases: ["url", "web", "site"] },
    { key: "phone", label: "Phone", aliases: ["tel", "telephone", "phone number"] },
    { key: "address", label: "Address", aliases: ["location", "city"] },
    { key: "owner", label: "Owner email", aliases: ["owner"] },
  ],
};

/** Labels are translated; the English label stays as an alias so English CSVs still auto-map in any UI language. */
export function fieldsFor(entity: CsvEntity, custom: FieldDef[], t: T): CsvField[] {
  const labels = t.importExport.fieldLabels as Record<string, string>;
  const base = BASE_FIELDS[entity].map((f) => ({ ...f, label: labels[f.key] ?? f.label, aliases: [f.label, ...f.aliases] }));
  return [...base, ...custom.map((d) => ({ key: `cf:${d.key}`, label: d.label, aliases: [d.key], required: d.required }))];
}

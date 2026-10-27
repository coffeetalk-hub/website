import { db } from "@/core/db";
import { assertOwns, type SessionUser } from "@/core/permissions";

/** Linked company/contact/deal must exist and be accessible to the user. Returns the ids to store (null when absent). */
export async function checkLinks(user: SessionUser, ids: { companyId?: string; contactId?: string; dealId?: string }) {
  const out = { companyId: null as string | null, contactId: null as string | null, dealId: null as string | null };
  if (ids.companyId) {
    const r = await db.company.findUnique({ where: { id: ids.companyId } });
    if (r) {
      assertOwns(user, "company", r);
      out.companyId = r.id;
    }
  }
  if (ids.contactId) {
    const r = await db.contact.findUnique({ where: { id: ids.contactId } });
    if (r) {
      assertOwns(user, "contact", r);
      out.contactId = r.id;
    }
  }
  if (ids.dealId) {
    const r = await db.deal.findUnique({ where: { id: ids.dealId } });
    if (r) {
      assertOwns(user, "deal", r);
      out.dealId = r.id;
    }
  }
  return out;
}

export const parseDate = (v?: string) => (v && !Number.isNaN(Date.parse(v)) ? new Date(v) : null);
export const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86400000);

import { db } from "@/core/db";
import { can, scope, type SessionUser } from "@/core/permissions";

/** Global search across the core records the user is allowed to see. */
export async function globalSearch(user: SessionUser, q: string) {
  const take = 8;
  const [contacts, companies, deals] = await Promise.all([
    can(user, "contact")
      ? db.contact.findMany({
          where: { ...scope(user, "contact"), OR: [{ firstName: { contains: q } }, { lastName: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }] },
          include: { company: { select: { name: true } } },
          take,
        })
      : [],
    can(user, "company")
      ? db.company.findMany({ where: { ...scope(user, "company"), OR: [{ name: { contains: q } }, { industry: { contains: q } }] }, take })
      : [],
    can(user, "deal")
      ? db.deal.findMany({ where: { ...scope(user, "deal"), OR: [{ title: { contains: q } }, { company: { name: { contains: q } } }] }, include: { stage: true }, take })
      : [],
  ]);
  return { contacts, companies, deals };
}

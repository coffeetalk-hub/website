import type { SessionUser } from "@/core/permissions";
import { listCompanyOptions } from "@/modules/companies/queries";
import { listContactOptions } from "@/modules/contacts/queries";
import { listDealOptions } from "@/modules/deals/queries";
import { listActiveProducts } from "@/modules/products/queries";
import { getCompanyProfile } from "./profile";

/** Everything the quote/invoice forms need for their pickers, scoped to what the user may link to. */
export async function getFormOptions(user: SessionUser) {
  const [companies, contacts, deals, products, profile] = await Promise.all([listCompanyOptions(user), listContactOptions(user), listDealOptions(user), listActiveProducts(), getCompanyProfile()]);
  return {
    companies: companies.map((c) => ({ id: c.id, label: c.name })),
    contacts: contacts.map((c) => ({ id: c.id, label: `${c.firstName} ${c.lastName}` })),
    deals: deals.map((d) => ({ id: d.id, label: d.title })),
    products: products.map((p) => ({ id: p.id, name: p.name, unitPrice: p.unitPrice, vatRate: p.vatRate, description: p.description })),
    profile,
  };
}

// Demo data: `npm run db:reset` wipes the database and re-seeds it.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// Deterministic pseudo-random so the demo looks the same every run.
let seed = 42;
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = <T,>(a: T[]) => a[Math.floor(rand() * a.length)];
const daysFromNow = (d: number, hour = 10) => {
  const x = new Date();
  x.setDate(x.getDate() + d);
  x.setHours(hour, 0, 0, 0);
  return x;
};

async function main() {
  await db.$transaction([
    db.webhookDelivery.deleteMany(),
    db.webhook.deleteMany(),
    db.apiKey.deleteMany(),
    db.mailbox.deleteMany(),
    db.invoiceLine.deleteMany(),
    db.invoice.deleteMany(),
    db.quoteLine.deleteMany(),
    db.quote.deleteMany(),
    db.product.deleteMany(),
    db.counter.deleteMany(),
    db.setting.deleteMany(),
    db.loginAttempt.deleteMany(),
    db.auditLog.deleteMany(),
    db.customFieldValue.deleteMany(),
    db.customFieldDef.deleteMany(),
    db.activity.deleteMany(),
    db.deal.deleteMany(),
    db.contact.deleteMany(),
    db.company.deleteMany(),
    db.stage.deleteMany(),
    db.user.deleteMany(),
  ]);

  const passwordHash = await bcrypt.hash("password123", 10);
  const mk = (email: string, name: string, role: string) => db.user.create({ data: { email, name, role, passwordHash } });
  const admin = await mk("admin@demo.com", "Amal Al-Harbi", "ADMIN");
  const manager = await mk("manager@demo.com", "Mansour Al-Otaibi", "MANAGER");
  const rep1 = await mk("rep1@demo.com", "Reem Al-Qahtani", "REP");
  const rep2 = await mk("rep2@demo.com", "Rakan Al-Dosari", "REP");
  const owners = [rep1, rep2, manager];

  const stageDefs = [
    { name: "Lead", probability: 10, kind: "OPEN" },
    { name: "Qualified", probability: 30, kind: "OPEN" },
    { name: "Proposal", probability: 55, kind: "OPEN" },
    { name: "Negotiation", probability: 80, kind: "OPEN" },
    { name: "Won", probability: 100, kind: "WON" },
    { name: "Lost", probability: 0, kind: "LOST" },
  ];
  const stages = [];
  for (const [i, s] of stageDefs.entries()) stages.push(await db.stage.create({ data: { ...s, position: i } }));

  // custom fields
  const fields = [
    { entity: "CONTACT", key: "preferred_language", label: "Preferred language", type: "DROPDOWN", options: ["Arabic", "English"] },
    { entity: "CONTACT", key: "birthday", label: "Birthday", type: "DATE" },
    { entity: "COMPANY", key: "employees", label: "Employees", type: "NUMBER" },
    { entity: "COMPANY", key: "tier", label: "Account tier", type: "DROPDOWN", options: ["Strategic", "Key", "Standard"] },
    { entity: "DEAL", key: "contract_months", label: "Contract term (months)", type: "NUMBER" },
    { entity: "DEAL", key: "competitor", label: "Main competitor", type: "TEXT" },
  ];
  const defs: Record<string, { id: string }> = {};
  for (const [i, f] of fields.entries()) {
    defs[`${f.entity}.${f.key}`] = await db.customFieldDef.create({
      data: { entity: f.entity, key: f.key, label: f.label, type: f.type, options: f.options as never, position: i },
    });
  }
  const setCF = (entity: string, key: string, recordId: string, value: string | number) =>
    db.customFieldValue.create({ data: { fieldId: defs[`${entity}.${key}`].id, entity, recordId, value } });

  const companyNames = [
    ["Al Rajhi Logistics", "Logistics", "Riyadh"],
    ["Nakheel Trading Co.", "Retail", "Jeddah"],
    ["Tuwaiq Software", "Technology", "Riyadh"],
    ["Red Sea Hospitality", "Hospitality", "Jeddah"],
    ["Eastern Petrochem", "Energy", "Dammam"],
    ["Falcon Construction", "Construction", "Riyadh"],
    ["Madar Healthcare", "Healthcare", "Khobar"],
    ["Najd Foods", "Food & Beverage", "Buraidah"],
    ["Hejaz Telecom Services", "Telecom", "Madinah"],
    ["Oasis Education Group", "Education", "Riyadh"],
    ["Gulf Marine Works", "Maritime", "Jubail"],
    ["Sahara Real Estate", "Real Estate", "Riyadh"],
  ];
  const companies = [];
  for (const [i, [name, industry, city]] of companyNames.entries()) {
    const c = await db.company.create({
      data: {
        name,
        industry,
        website: `www.${name.toLowerCase().replace(/[^a-z]+/g, "")}.sa`,
        phone: `+966 11 ${400 + i} ${1000 + i * 37}`,
        address: `${city}, Saudi Arabia`,
        ownerId: owners[i % owners.length].id,
      },
    });
    companies.push(c);
    await setCF("COMPANY", "employees", c.id, pick([40, 120, 300, 850, 2000]));
    await setCF("COMPANY", "tier", c.id, pick(["Strategic", "Key", "Standard"]));
  }

  const first = ["Abdullah", "Fahad", "Sara", "Noura", "Khalid", "Layla", "Omar", "Huda", "Turki", "Maha", "Saud", "Dalal", "Yousef", "Lama", "Faisal"];
  const last = ["Al-Shehri", "Al-Ghamdi", "Al-Mutairi", "Al-Zahrani", "Al-Subaie", "Al-Anazi", "Al-Harthi", "Al-Shammari", "Bakr", "Hakeem"];
  const titles = ["CEO", "Procurement Manager", "Operations Director", "IT Manager", "Finance Director", "Head of Sales", "Facilities Manager"];
  const sources = ["Website", "Referral", "Event", "Cold outreach", "Partner"];
  const contacts = [];
  for (let i = 0; i < 32; i++) {
    const co = companies[i % companies.length];
    const f = first[i % first.length];
    const l = last[(i * 3) % last.length];
    const c = await db.contact.create({
      data: {
        firstName: f,
        lastName: l,
        email: `${f}.${l}`.toLowerCase().replace(/[^a-z.]/g, "") + `@${co.website!.replace("www.", "")}`,
        phone: `+966 5${Math.floor(rand() * 9)} ${Math.floor(1000000 + rand() * 8999999)}`,
        jobTitle: pick(titles),
        source: pick(sources),
        companyId: co.id,
        ownerId: co.ownerId,
      },
    });
    contacts.push(c);
    await setCF("CONTACT", "preferred_language", c.id, pick(["Arabic", "English"]));
  }

  const dealNames = ["Fleet tracking rollout", "Annual maintenance contract", "ERP implementation", "Hotel booking platform", "Pipeline monitoring", "Site safety system", "Clinic management suite", "Supply chain portal", "Network upgrade", "E-learning platform", "Vessel tracking", "Property CRM", "Warehouse automation", "Kiosk deployment", "Data analytics pilot", "Customer app", "IoT sensors", "Training programme", "Security audit", "Cloud migration"];
  const openStages = stages.slice(0, 4);
  const deals = [];
  for (const [i, title] of dealNames.entries()) {
    const co = companies[i % companies.length];
    const stage = i < 14 ? openStages[i % 4] : i < 18 ? stages[4] : stages[5];
    const same = contacts.filter((c) => c.companyId === co.id);
    const d = await db.deal.create({
      data: {
        title,
        value: Math.round((20000 + rand() * 480000) / 1000) * 1000,
        currency: "SAR",
        stageId: stage.id,
        position: i,
        expectedCloseDate: daysFromNow(
          stage.kind === "WON" ? -Math.floor(10 + rand() * 150) : stage.kind === "LOST" ? -Math.floor(5 + rand() * 100) : Math.floor(3 + rand() * 170),
        ),
        companyId: co.id,
        contactId: same.length ? pick(same).id : null,
        ownerId: co.ownerId,
      },
    });
    deals.push(d);
    await setCF("DEAL", "contract_months", d.id, pick([6, 12, 24, 36]));
  }

  const subjects: Record<string, string[]> = {
    CALL: ["Intro call", "Discovery call", "Pricing discussion", "Check-in call"],
    MEETING: ["On-site demo", "Kick-off meeting", "Stakeholder review", "Proposal walkthrough"],
    NOTE: ["Needs update on integration scope", "Budget approved for Q4", "Competitor mentioned in talks", "Decision maker is the CFO"],
    FOLLOW_UP: ["Send proposal", "Follow up on contract", "Share case study", "Confirm meeting time"],
  };
  const types = Object.keys(subjects);
  for (let i = 0; i < 40; i++) {
    const deal = pick(deals);
    const type = i < 8 ? "FOLLOW_UP" : pick(types);
    const past = rand() < 0.5;
    const isTask = type === "FOLLOW_UP" || type === "MEETING" || type === "CALL";
    const dueOffset = past ? -Math.floor(rand() * 20) : Math.floor(rand() * 10);
    const today = i < 8; // guarantee tasks due today for each rep
    const dueAt = isTask || today ? daysFromNow(today ? 0 : dueOffset, 9 + (i % 8)) : null;
    const assignee = today ? [rep1, rep2][i % 2].id : deal.ownerId;
    await db.activity.create({
      data: {
        type,
        subject: pick(subjects[type]),
        body: type === "NOTE" ? "Discussed on the last visit; agreed to revisit next week." : null,
        dueAt,
        completedAt: !today && dueAt && dueAt < new Date() && rand() < 0.45 ? dueAt : null,
        assigneeId: assignee,
        creatorId: assignee,
        dealId: deal.id,
        companyId: deal.companyId,
        contactId: deal.contactId,
      },
    });
  }


  // ── billing demo data: seller profile, product catalogue, quotes and invoices ──
  const yr = new Date().getFullYear();
  await db.setting.create({
    data: {
      key: "company",
      value: {
        nameEn: "Demo Trading Co.",
        nameAr: "شركة العرض التجارية",
        vatNumber: "300000000000003", // demo value, replace with your real 15-digit VAT number
        crNumber: "1010000000",
        address: "King Fahd Road, Riyadh 12211, Saudi Arabia",
        phone: "+966 11 400 0000",
        email: "billing@demo-trading.sa",
        bankDetails: "Demo Bank\nIBAN: SA0380000000608010167519",
        defaultVatRate: 15,
        quoteValidityDays: 30,
        paymentTermsDays: 30,
        footerNote: "Thank you for your business",
      },
    },
  });
  const productDefs = [
    ["Implementation service (per day)", "SRV-IMP", 3500],
    ["Annual support plan", "SUP-ANN", 12000],
    ["Software licence (per user)", "LIC-USR", 900],
    ["Training session", "TRN-001", 2500],
    ["IoT sensor kit", "HW-IOT", 1800],
    ["Consulting (per hour)", "SRV-CON", 450],
  ] as const;
  const products = [];
  for (const [name, sku, unitPrice] of productDefs) products.push(await db.product.create({ data: { name, sku, unitPrice, vatRate: 15 } }));

  const quoteStatuses = ["DRAFT", "SENT", "ACCEPTED", "ACCEPTED", "REJECTED", "SENT", "ACCEPTED", "DRAFT"];
  const quotes = [];
  for (const [i, status] of quoteStatuses.entries()) {
    const deal = deals[i * 2 % deals.length];
    const picks = [products[i % products.length], products[(i + 2) % products.length]];
    const issue = daysFromNow(-20 + i * 2);
    quotes.push(
      await db.quote.create({
        data: {
          number: `Q-${yr}-${String(i + 1).padStart(4, "0")}`,
          status,
          issueDate: issue,
          validUntil: new Date(issue.getTime() + 30 * 86400000),
          companyId: deal.companyId,
          contactId: deal.contactId,
          dealId: deal.id,
          ownerId: deal.ownerId,
          terms: "Prices are in SAR and exclude VAT. Payment within 30 days of invoice.",
          lines: { create: picks.map((p, j) => ({ productId: p.id, description: p.name, qty: j === 0 ? 2 : 1, unitPrice: p.unitPrice, discountPct: j === 0 && i % 3 === 0 ? 10 : 0, vatRate: 15, position: j })) },
        },
      }),
    );
  }
  await db.counter.create({ data: { key: `quote:${yr}`, value: quotes.length } });

  // invoices from accepted quotes: one paid, one issued, one draft
  const accepted = quotes.filter((q) => q.status === "ACCEPTED");
  const invStatuses = ["PAID", "ISSUED", "DRAFT"];
  let invoiceNo = 0;
  for (const [i, q] of accepted.entries()) {
    const status = invStatuses[i] ?? "DRAFT";
    const qLines = await db.quoteLine.findMany({ where: { quoteId: q.id }, orderBy: { position: "asc" } });
    const company = q.companyId ? await db.company.findUnique({ where: { id: q.companyId } }) : null;
    const issued = status !== "DRAFT";
    if (issued) invoiceNo++;
    await db.invoice.create({
      data: {
        number: issued ? `INV-${yr}-${String(invoiceNo).padStart(4, "0")}` : `DRAFT-DEMO${i}`,
        status,
        issueDate: daysFromNow(-10 + i),
        issuedAt: issued ? daysFromNow(-10 + i, 12) : null,
        dueDate: daysFromNow(20 + i),
        paidAt: status === "PAID" ? daysFromNow(-2) : null,
        quoteId: q.id,
        dealId: q.dealId,
        companyId: q.companyId,
        contactId: q.contactId,
        ownerId: q.ownerId,
        buyerName: company?.name ?? "Customer",
        buyerVat: i === 0 ? "310000000000003" : null,
        buyerAddress: company?.address ?? null,
        lines: { create: qLines.map((l, j) => ({ description: l.description, qty: l.qty, unitPrice: l.unitPrice, discountPct: l.discountPct, vatRate: l.vatRate, position: j })) },
      },
    });
  }
  await db.counter.create({ data: { key: `invoice:${yr}`, value: invoiceNo } });

  // Demo audit trail so "recent activity" is not empty.
  for (const [i, c] of companies.entries()) {
    await db.auditLog.create({ data: { userId: c.ownerId, entity: "Company", recordId: c.id, action: "CREATE", changes: { name: c.name }, createdAt: daysFromNow(-20 + i, 9) } });
  }
  for (const [i, d] of deals.entries()) {
    await db.auditLog.create({ data: { userId: d.ownerId, entity: "Deal", recordId: d.id, action: "CREATE", changes: { title: d.title, value: d.value }, createdAt: daysFromNow(-14 + (i % 14), 11) } });
  }

  await db.auditLog.create({ data: { userId: admin.id, entity: "System", recordId: "seed", action: "CREATE", changes: { note: "Demo data seeded" } } });
  console.log("Seeded. Log in as admin@demo.com / manager@demo.com / rep1@demo.com / rep2@demo.com, password: password123");
}

main().finally(() => db.$disconnect());

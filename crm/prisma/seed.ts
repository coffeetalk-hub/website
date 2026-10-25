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
        expectedCloseDate: daysFromNow(Math.floor(rand() * 90) - 10),
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
    const type = pick(types);
    const past = rand() < 0.5;
    const isTask = type === "FOLLOW_UP" || type === "MEETING" || type === "CALL";
    const dueOffset = past ? -Math.floor(rand() * 20) : Math.floor(rand() * 10);
    const dueAt = isTask ? daysFromNow(i < 6 ? 0 : dueOffset, 9 + (i % 8)) : null;
    await db.activity.create({
      data: {
        type,
        subject: pick(subjects[type]),
        body: type === "NOTE" ? "Discussed on the last visit; agreed to revisit next week." : null,
        dueAt,
        completedAt: dueAt && dueAt < new Date() && rand() < 0.7 ? dueAt : null,
        assigneeId: deal.ownerId,
        creatorId: deal.ownerId,
        dealId: deal.id,
        companyId: deal.companyId,
        contactId: deal.contactId,
      },
    });
  }

  await db.auditLog.create({ data: { userId: admin.id, entity: "System", recordId: "seed", action: "CREATE", changes: { note: "Demo data seeded" } } });
  console.log("Seeded. Log in as admin@demo.com / manager@demo.com / rep1@demo.com / rep2@demo.com, password: password123");
}

main().finally(() => db.$disconnect());

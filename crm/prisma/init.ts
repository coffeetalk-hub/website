// Empty start: wipes ALL data, then creates one admin and the default pipeline stages.
// Usage: ADMIN_EMAIL=you@company.com ADMIN_PASSWORD='a long password' ADMIN_NAME='Your Name' npm run db:init
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 10) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD (10+ characters).");
  const order = ["webhookDelivery", "webhook", "apiKey", "mailbox", "invoiceLine", "invoice", "quoteLine", "quote", "product", "counter", "setting", "loginAttempt", "auditLog", "activity", "deal", "contact", "company", "stage", "customField", "user"];
  for (const t of order) if ((db as any)[t]) await (db as any)[t].deleteMany();
  await db.user.create({ data: { email, name: process.env.ADMIN_NAME || "Admin", role: "ADMIN", passwordHash: await bcrypt.hash(password, 10) } });
  const stages = [["Lead", 10, "OPEN"], ["Qualified", 30, "OPEN"], ["Proposal", 60, "OPEN"], ["Negotiation", 80, "OPEN"], ["Won", 100, "WON"], ["Lost", 0, "LOST"]] as const;
  for (const [i, [name, probability, kind]] of stages.entries()) await db.stage.create({ data: { name, probability, kind, position: i } });
  console.log(`Empty CRM ready. Sign in as ${email}.`);
}
main().finally(() => db.$disconnect());

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);
  for (const u of [
    { email: "admin@demo.com", name: "Amal Admin", role: "ADMIN" },
    { email: "manager@demo.com", name: "Mansour Manager", role: "MANAGER" },
    { email: "rep1@demo.com", name: "Reem Rep", role: "REP" },
    { email: "rep2@demo.com", name: "Rakan Rep", role: "REP" },
  ]) {
    await db.user.upsert({ where: { email: u.email }, update: {}, create: { ...u, passwordHash } });
  }
}
main().finally(() => db.$disconnect());

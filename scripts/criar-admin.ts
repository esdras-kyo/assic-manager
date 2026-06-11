// Cria um admin do dashboard.
// Uso: npx tsx scripts/criar-admin.ts "Nome" email@dominio.com "senha-forte"
import dotenv from "dotenv";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../src/generated/prisma/client";

dotenv.config({ path: ".env.local" });

const [nome, email, senha] = process.argv.slice(2);

if (!nome || !email || !senha) {
  console.error(
    'Uso: npx tsx scripts/criar-admin.ts "Nome" email@dominio.com "senha-forte"',
  );
  process.exit(1);
}
if (senha.length < 10) {
  console.error("Senha precisa de pelo menos 10 caracteres.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const senhaHash = await bcrypt.hash(senha, 12);
  const admin = await prisma.admin.upsert({
    where: { email },
    update: { nome, senhaHash },
    create: { nome, email, senhaHash },
  });
  console.info(`Admin ok: ${admin.nome} <${admin.email}>`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

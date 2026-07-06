// Atualiza SÓ o conteudo + local do evento ASSIC 2026 no banco, sem tocar em
// preço, datas, status ou inscrições. Idempotente.
// Uso: npx tsx scripts/atualizar-conteudo-assic.ts
import dotenv from "dotenv";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { conteudoSchema } from "../src/lib/validations";
import { conteudoAssic, localAssic } from "../prisma/dados-assic-2026";

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  // Valida antes de tocar o banco — quebra alto se malformado.
  conteudoSchema.parse(conteudoAssic);

  const evento = await prisma.evento.update({
    where: { slug: "assic-2026" },
    data: { conteudo: conteudoAssic, local: localAssic },
  });

  console.info(`Conteúdo e local atualizados: ${evento.nome}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

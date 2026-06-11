import dotenv from "dotenv";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

// Seed de DESENVOLVIMENTO: evento de exemplo para enxergar as telas.
// Idempotente (upsert por slug). Rodar: npx prisma db seed

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const daquiUmMes = new Date();
  daquiUmMes.setMonth(daquiUmMes.getMonth() + 1);
  daquiUmMes.setHours(19, 0, 0, 0);

  const evento = await prisma.evento.upsert({
    where: { slug: "encontro-de-exemplo" },
    update: {},
    create: {
      slug: "encontro-de-exemplo",
      nome: "Encontro de Exemplo",
      descricao:
        "Um evento de exemplo para desenvolvimento.\n\nVenha passar uma tarde especial com a gente: música, boa companhia e um lanche caprichado no final.",
      local: "Salão Principal — Rua das Flores, 123",
      dataInicio: daquiUmMes,
      precoEmCentavos: 5000,
      vagas: 30,
      status: "ABERTO",
    },
  });

  console.info(`Seed ok: evento "${evento.nome}" (${evento.status})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

// Runtime sempre via conexão pooled (pgbouncer). Migrations usam a direta
// (DIRECT_URL) configurada em prisma.config.ts.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

// Singleton: evita esgotar conexões com o hot-reload do dev server.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

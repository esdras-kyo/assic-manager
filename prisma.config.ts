import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

// Next usa .env.local; o CLI do Prisma não carrega env sozinho no v7.
dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Conexão DIRETA: migrations/CLI não funcionam atrás do pgbouncer.
    // O runtime usa a pooled (DATABASE_URL) via adapter em src/lib/db.ts.
    url: env("DIRECT_URL"),
  },
});

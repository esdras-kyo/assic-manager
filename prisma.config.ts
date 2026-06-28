import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

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
    // process.env (não o env() do Prisma, que lança quando ausente):
    // `prisma generate` não conecta, então não pode exigir DIRECT_URL —
    // na Vercel a var pode não existir no build (postinstall).
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});

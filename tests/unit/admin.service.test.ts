import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db";
import { autenticarAdmin, criarAdmin } from "@/services/admin.service";

vi.mock("@/lib/db", () => ({
  prisma: { admin: { findUnique: vi.fn(), create: vi.fn() } },
}));

const mocked = vi.mocked(prisma, true);

const senhaCerta = "senha-forte-123";
let adminDb: {
  id: string;
  email: string;
  senhaHash: string;
  nome: string;
  criadoEm: Date;
};

beforeEach(async () => {
  vi.clearAllMocks();
  adminDb = {
    id: "adm1",
    email: "org@assic.com",
    senhaHash: await bcrypt.hash(senhaCerta, 4), // cost baixo só p/ teste rápido
    nome: "Organizador",
    criadoEm: new Date(),
  };
});

describe("autenticarAdmin", () => {
  it("credenciais corretas devolvem o admin", async () => {
    mocked.admin.findUnique.mockResolvedValue(adminDb);
    const r = await autenticarAdmin("org@assic.com", senhaCerta);
    expect(r?.id).toBe("adm1");
  });

  it("senha errada devolve null", async () => {
    mocked.admin.findUnique.mockResolvedValue(adminDb);
    expect(await autenticarAdmin("org@assic.com", "errada")).toBeNull();
  });

  it("email inexistente devolve null (mesma resposta — sem enumeração)", async () => {
    mocked.admin.findUnique.mockResolvedValue(null);
    expect(await autenticarAdmin("x@x.com", senhaCerta)).toBeNull();
  });
});

describe("criarAdmin", () => {
  it("persiste hash bcrypt, nunca a senha em claro", async () => {
    mocked.admin.create.mockResolvedValue(adminDb);
    await criarAdmin({
      nome: "Organizador",
      email: "org@assic.com",
      senha: senhaCerta,
    });

    const data = mocked.admin.create.mock.calls[0][0].data as {
      senhaHash: string;
    };
    expect(data.senhaHash).not.toBe(senhaCerta);
    expect(await bcrypt.compare(senhaCerta, data.senhaHash)).toBe(true);
  });
});

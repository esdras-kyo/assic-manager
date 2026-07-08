import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db";
import {
  criarTokenConsulta,
  listarInscricoesPorEmail,
  montarLinkConsulta,
  resolverTokenConsulta,
} from "@/services/consulta.service";

vi.mock("@/lib/db", () => ({
  prisma: {
    tokenConsulta: { create: vi.fn(), findUnique: vi.fn() },
    inscricao: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/env", () => ({
  getEnv: () => ({ APP_URL: "https://assic.example.com" }),
}));

const mocked = vi.mocked(prisma, true);

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-07-08T12:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("criarTokenConsulta", () => {
  it("cria token com validade de 7 dias e retorna o token", async () => {
    mocked.tokenConsulta.create.mockResolvedValue({} as never);
    const token = await criarTokenConsulta("maria@example.com");

    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(16);
    const data = mocked.tokenConsulta.create.mock.calls[0][0].data;
    expect(data.email).toBe("maria@example.com");
    expect(data.token).toBe(token);
    expect((data.expiraEm as Date).toISOString()).toBe(
      "2026-07-15T12:00:00.000Z",
    );
  });
});

describe("montarLinkConsulta", () => {
  it("monta URL absoluta com o token", () => {
    expect(montarLinkConsulta("abc123")).toBe(
      "https://assic.example.com/minhas-inscricoes/abc123",
    );
  });
});

describe("resolverTokenConsulta", () => {
  it("retorna o email quando o token é válido", async () => {
    mocked.tokenConsulta.findUnique.mockResolvedValue({
      email: "maria@example.com",
      expiraEm: new Date("2026-07-15T12:00:00.000Z"),
    } as never);
    expect(await resolverTokenConsulta("abc")).toBe("maria@example.com");
  });

  it("retorna null quando o token não existe", async () => {
    mocked.tokenConsulta.findUnique.mockResolvedValue(null);
    expect(await resolverTokenConsulta("nada")).toBeNull();
  });

  it("retorna null quando o token expirou", async () => {
    mocked.tokenConsulta.findUnique.mockResolvedValue({
      email: "maria@example.com",
      expiraEm: new Date("2026-07-01T12:00:00.000Z"),
    } as never);
    expect(await resolverTokenConsulta("velho")).toBeNull();
  });
});

describe("listarInscricoesPorEmail", () => {
  it("busca PENDENTE e CONFIRMADA do email, com evento, mais recentes primeiro", async () => {
    mocked.inscricao.findMany.mockResolvedValue([] as never);
    await listarInscricoesPorEmail("maria@example.com");

    expect(mocked.inscricao.findMany).toHaveBeenCalledWith({
      where: {
        email: "maria@example.com",
        status: { in: ["PENDENTE", "CONFIRMADA"] },
      },
      include: { evento: true },
      orderBy: { criadoEm: "desc" },
    });
  });
});

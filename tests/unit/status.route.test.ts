import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/inscricoes/[id]/status/route";
import { prisma } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  prisma: { inscricao: { findUnique: vi.fn() } },
}));

const mocked = vi.mocked(prisma, true);

function chamar(id: string) {
  return GET(new Request(`http://localhost/api/inscricoes/${id}/status`), {
    params: Promise.resolve({ id }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/inscricoes/[id]/status", () => {
  it("devolve só status — nenhum dado pessoal", async () => {
    mocked.inscricao.findUnique.mockResolvedValue({
      id: "insc1",
      status: "PENDENTE",
      nome: "Maria",
      email: "maria@example.com",
      pagamentos: [{ status: "PENDING" }],
    } as never);

    const res = await chamar("insc1");
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({
      inscricao: "PENDENTE",
      pagamento: "PENDING",
    });
    expect(JSON.stringify(json)).not.toMatch(/maria/i);
  });

  it("404 para inscrição inexistente", async () => {
    mocked.inscricao.findUnique.mockResolvedValue(null);
    const res = await chamar("nada");
    expect(res.status).toBe(404);
  });

  it("sem pagamentos devolve pagamento null", async () => {
    mocked.inscricao.findUnique.mockResolvedValue({
      id: "insc1",
      status: "PENDENTE",
      pagamentos: [],
    } as never);

    const json = await (await chamar("insc1")).json();
    expect(json.pagamento).toBeNull();
  });
});

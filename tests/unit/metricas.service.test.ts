import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db";
import { obterMetricas } from "@/services/metricas.service";

vi.mock("@/lib/db", () => ({
  prisma: {
    evento: { count: vi.fn() },
    inscricao: { count: vi.fn() },
    pagamento: { aggregate: vi.fn() },
  },
}));

const mocked = vi.mocked(prisma, true);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("obterMetricas", () => {
  it("agrega contagens e receita PAID em centavos", async () => {
    mocked.evento.count.mockResolvedValue(2);
    mocked.inscricao.count
      .mockResolvedValueOnce(15) // confirmadas
      .mockResolvedValueOnce(4); // pendentes
    mocked.pagamento.aggregate.mockResolvedValue({
      _sum: { amountInCents: 75000 },
    } as never);

    const m = await obterMetricas();

    expect(m).toEqual({
      eventosAbertos: 2,
      inscricoesConfirmadas: 15,
      inscricoesPendentes: 4,
      receitaCentavos: 75000,
    });
    expect(mocked.pagamento.aggregate).toHaveBeenCalledWith({
      _sum: { amountInCents: true },
      where: { status: "PAID" },
    });
  });

  it("sem pagamentos: receita zero (não null)", async () => {
    mocked.evento.count.mockResolvedValue(0);
    mocked.inscricao.count.mockResolvedValue(0);
    mocked.pagamento.aggregate.mockResolvedValue({
      _sum: { amountInCents: null },
    } as never);

    const m = await obterMetricas();
    expect(m.receitaCentavos).toBe(0);
  });
});

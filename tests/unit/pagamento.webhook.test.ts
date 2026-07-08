import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db";
import { getPaymentGateway } from "@/services/payment";
import { processarWebhook } from "@/services/pagamento.service";

vi.mock("@/lib/db", () => ({
  prisma: {
    pagamento: { findUnique: vi.fn(), update: vi.fn() },
    inscricao: { update: vi.fn() },
  },
}));

vi.mock("@/services/payment", () => ({ getPaymentGateway: vi.fn() }));
vi.mock("@/services/email.service", () => ({
  enviarConfirmacaoInscricao: vi.fn(),
}));

const mocked = vi.mocked(prisma, true);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getPaymentGateway).mockReturnValue({
    name: "fake",
    parseWebhook: vi.fn().mockResolvedValue({
      gatewayPaymentId: "pay_1",
      status: "expired",
    }),
  } as never);
});

describe("processarWebhook — Pix expirado", () => {
  it("marca o Pagamento como EXPIRED mas mantém a Inscricao PENDENTE", async () => {
    mocked.pagamento.findUnique.mockResolvedValue({
      status: "PENDING",
      inscricaoId: "insc1",
      inscricao: { status: "PENDENTE" },
    } as never);

    await processarWebhook("{}", {});

    expect(mocked.pagamento.update).toHaveBeenCalledWith({
      where: { gatewayPaymentId: "pay_1" },
      data: { status: "EXPIRED" },
    });
    // A inscrição NÃO deve ser tocada — segue pagável.
    expect(mocked.inscricao.update).not.toHaveBeenCalled();
  });
});

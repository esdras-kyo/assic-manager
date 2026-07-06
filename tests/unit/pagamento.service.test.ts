import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db";
import { enviarConfirmacaoInscricao } from "@/services/email.service";
import { AssinaturaInvalidaError } from "@/services/payment/gateways/fake.gateway";
import {
  confirmarPagamento,
  iniciarPagamento,
  InscricaoNaoPagavelError,
  mapStatusGatewayParaDb,
  PagamentoNaoEncontradoError,
  processarWebhook,
} from "@/services/pagamento.service";

vi.mock("@/lib/db", () => ({
  prisma: {
    inscricao: { findUnique: vi.fn(), update: vi.fn() },
    pagamento: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  },
}));

const gatewayMock = {
  name: "fake",
  createPayment: vi.fn(),
  getPayment: vi.fn(),
  parseWebhook: vi.fn(),
};

vi.mock("@/services/payment", () => ({
  getPaymentGateway: () => gatewayMock,
}));

vi.mock("@/services/email.service", () => ({
  enviarConfirmacaoInscricao: vi.fn(),
}));

const mocked = vi.mocked(prisma, true);

const evento = {
  id: "evt1",
  nome: "Encontro de Junho",
  precoEmCentavos: 5000,
};

const inscricaoPendente = {
  id: "insc1",
  eventoId: "evt1",
  nome: "Maria da Silva",
  email: "maria@example.com",
  celular: "11987654321",
  documento: "52998224725",
  camposExtras: null,
  status: "PENDENTE" as const,
  criadoEm: new Date(),
  atualizadoEm: new Date(),
  evento,
};

const pagamentoDb = {
  id: "pag1",
  inscricaoId: "insc1",
  gateway: "fake",
  gatewayPaymentId: "fake_abc",
  metodo: "PIX" as const,
  status: "PENDING" as const,
  amountInCents: 5000,
  pixQrCode: null,
  pixExpiresAt: null,
  criadoEm: new Date(),
  atualizadoEm: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("mapStatusGatewayParaDb", () => {
  it.each([
    ["pending", "PENDING"],
    ["paid", "PAID"],
    ["failed", "FAILED"],
    ["refunded", "REFUNDED"],
    ["expired", "EXPIRED"],
  ] as const)("%s → %s", (gateway, db) => {
    expect(mapStatusGatewayParaDb(gateway)).toBe(db);
  });
});

describe("iniciarPagamento", () => {
  it("cria pagamento com snapshot do preço do evento", async () => {
    mocked.inscricao.findUnique.mockResolvedValue(inscricaoPendente as never);
    gatewayMock.createPayment.mockResolvedValue({
      gatewayPaymentId: "fake_abc",
      status: "pending",
      pix: { qrCode: "qr", expiresAt: new Date(Date.now() + 60_000) },
    });
    mocked.pagamento.create.mockResolvedValue(pagamentoDb);

    const r = await iniciarPagamento({ inscricaoId: "insc1", metodo: "pix" });

    expect(gatewayMock.createPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        amountInCents: 5000,
        method: "pix",
        customer: expect.objectContaining({ document: "52998224725" }),
        metadata: { inscricaoId: "insc1", eventoId: "evt1" },
      }),
    );
    expect(mocked.pagamento.create).toHaveBeenCalledWith({
      data: {
        inscricaoId: "insc1",
        gateway: "fake",
        gatewayPaymentId: "fake_abc",
        metodo: "PIX",
        status: "PENDING",
        amountInCents: 5000,
        pixQrCode: "qr",
        pixExpiresAt: expect.any(Date),
      },
    });
    expect(r.gatewayResult.pix?.qrCode).toBe("qr");
  });

  it("não paga inscrição que não está PENDENTE", async () => {
    mocked.inscricao.findUnique.mockResolvedValue({
      ...inscricaoPendente,
      status: "CONFIRMADA",
    } as never);
    await expect(
      iniciarPagamento({ inscricaoId: "insc1", metodo: "pix" }),
    ).rejects.toBeInstanceOf(InscricaoNaoPagavelError);
    expect(gatewayMock.createPayment).not.toHaveBeenCalled();
  });

  it("falha se inscrição não existe", async () => {
    mocked.inscricao.findUnique.mockResolvedValue(null);
    await expect(
      iniciarPagamento({ inscricaoId: "nada", metodo: "pix" }),
    ).rejects.toThrow(/não encontrada/i);
  });
});

describe("confirmarPagamento (idempotente — §4.5.1)", () => {
  it("marca PAID e confirma inscrição PENDENTE", async () => {
    mocked.pagamento.findUnique.mockResolvedValue({
      ...pagamentoDb,
      inscricao: inscricaoPendente,
    } as never);
    mocked.pagamento.update.mockResolvedValue({
      ...pagamentoDb,
      status: "PAID",
    });
    mocked.inscricao.update.mockResolvedValue({
      ...inscricaoPendente,
      status: "CONFIRMADA",
    } as never);

    const r = await confirmarPagamento("fake_abc");

    expect(r.jaConfirmado).toBe(false);
    expect(r.inscricaoConfirmada).toBe(true);
    expect(mocked.pagamento.update).toHaveBeenCalledWith({
      where: { gatewayPaymentId: "fake_abc" },
      data: { status: "PAID" },
    });
    expect(mocked.inscricao.update).toHaveBeenCalledWith({
      where: { id: "insc1" },
      data: { status: "CONFIRMADA" },
    });
  });

  it("segunda chamada é no-op (não atualiza nada de novo)", async () => {
    mocked.pagamento.findUnique.mockResolvedValue({
      ...pagamentoDb,
      status: "PAID",
      inscricao: { ...inscricaoPendente, status: "CONFIRMADA" },
    } as never);

    const r = await confirmarPagamento("fake_abc");

    expect(r.jaConfirmado).toBe(true);
    expect(mocked.pagamento.update).not.toHaveBeenCalled();
    expect(mocked.inscricao.update).not.toHaveBeenCalled();
  });

  it("pagamento desconhecido lança", async () => {
    mocked.pagamento.findUnique.mockResolvedValue(null);
    await expect(confirmarPagamento("nada")).rejects.toBeInstanceOf(
      PagamentoNaoEncontradoError,
    );
  });

  it("confirmação envia email exatamente uma vez", async () => {
    mocked.pagamento.findUnique.mockResolvedValue({
      ...pagamentoDb,
      inscricao: inscricaoPendente,
    } as never);
    mocked.pagamento.update.mockResolvedValue({
      ...pagamentoDb,
      status: "PAID",
    });
    mocked.inscricao.update.mockResolvedValue({
      ...inscricaoPendente,
      status: "CONFIRMADA",
    } as never);

    await confirmarPagamento("fake_abc");

    expect(enviarConfirmacaoInscricao).toHaveBeenCalledOnce();
    expect(enviarConfirmacaoInscricao).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "maria@example.com",
        eventoNome: "Encontro de Junho",
      }),
    );
  });

  it("repetição (já PAID) não reenvia email", async () => {
    mocked.pagamento.findUnique.mockResolvedValue({
      ...pagamentoDb,
      status: "PAID",
      inscricao: { ...inscricaoPendente, status: "CONFIRMADA" },
    } as never);

    await confirmarPagamento("fake_abc");
    expect(enviarConfirmacaoInscricao).not.toHaveBeenCalled();
  });

  it("falha no envio de email não derruba a confirmação", async () => {
    mocked.pagamento.findUnique.mockResolvedValue({
      ...pagamentoDb,
      inscricao: inscricaoPendente,
    } as never);
    mocked.pagamento.update.mockResolvedValue({
      ...pagamentoDb,
      status: "PAID",
    });
    mocked.inscricao.update.mockResolvedValue({
      ...inscricaoPendente,
      status: "CONFIRMADA",
    } as never);
    vi.mocked(enviarConfirmacaoInscricao).mockRejectedValueOnce(
      new Error("smtp caiu"),
    );

    const r = await confirmarPagamento("fake_abc");
    expect(r.inscricaoConfirmada).toBe(true);
  });

  it("inscrição EXPIRADA não volta: pagamento PAID, inscrição intocada", async () => {
    mocked.pagamento.findUnique.mockResolvedValue({
      ...pagamentoDb,
      inscricao: { ...inscricaoPendente, status: "EXPIRADA" },
    } as never);
    mocked.pagamento.update.mockResolvedValue({
      ...pagamentoDb,
      status: "PAID",
    });

    const r = await confirmarPagamento("fake_abc");

    expect(r.inscricaoConfirmada).toBe(false);
    expect(mocked.inscricao.update).not.toHaveBeenCalled();
  });
});

describe("processarWebhook", () => {
  it("paid confirma o pagamento", async () => {
    gatewayMock.parseWebhook.mockResolvedValue({
      gatewayPaymentId: "fake_abc",
      status: "paid",
    });
    mocked.pagamento.findUnique.mockResolvedValue({
      ...pagamentoDb,
      inscricao: inscricaoPendente,
    } as never);
    mocked.pagamento.update.mockResolvedValue({
      ...pagamentoDb,
      status: "PAID",
    });
    mocked.inscricao.update.mockResolvedValue({
      ...inscricaoPendente,
      status: "CONFIRMADA",
    } as never);

    await processarWebhook("body", { h: "1" });

    expect(gatewayMock.parseWebhook).toHaveBeenCalledWith(
      "body",
      { h: "1" },
      undefined,
    );
    expect(mocked.pagamento.update).toHaveBeenCalledWith({
      where: { gatewayPaymentId: "fake_abc" },
      data: { status: "PAID" },
    });
  });

  it("assinatura inválida propaga sem tocar o banco", async () => {
    gatewayMock.parseWebhook.mockRejectedValue(new AssinaturaInvalidaError());
    await expect(processarWebhook("body", {})).rejects.toBeInstanceOf(
      AssinaturaInvalidaError,
    );
    expect(mocked.pagamento.update).not.toHaveBeenCalled();
    expect(mocked.inscricao.update).not.toHaveBeenCalled();
  });

  it("expired marca pagamento EXPIRED e expira inscrição PENDENTE", async () => {
    gatewayMock.parseWebhook.mockResolvedValue({
      gatewayPaymentId: "fake_abc",
      status: "expired",
    });
    mocked.pagamento.findUnique.mockResolvedValue({
      ...pagamentoDb,
      inscricao: inscricaoPendente,
    } as never);

    await processarWebhook("body", {});

    expect(mocked.pagamento.update).toHaveBeenCalledWith({
      where: { gatewayPaymentId: "fake_abc" },
      data: { status: "EXPIRED" },
    });
    expect(mocked.inscricao.update).toHaveBeenCalledWith({
      where: { id: "insc1" },
      data: { status: "EXPIRADA" },
    });
  });

  it("failed marca só o pagamento (inscrição segue PENDENTE)", async () => {
    gatewayMock.parseWebhook.mockResolvedValue({
      gatewayPaymentId: "fake_abc",
      status: "failed",
    });
    mocked.pagamento.findUnique.mockResolvedValue({
      ...pagamentoDb,
      inscricao: inscricaoPendente,
    } as never);

    await processarWebhook("body", {});

    expect(mocked.pagamento.update).toHaveBeenCalledWith({
      where: { gatewayPaymentId: "fake_abc" },
      data: { status: "FAILED" },
    });
    expect(mocked.inscricao.update).not.toHaveBeenCalled();
  });

  it("pagamento já PAID não regride com webhook atrasado de failed", async () => {
    gatewayMock.parseWebhook.mockResolvedValue({
      gatewayPaymentId: "fake_abc",
      status: "failed",
    });
    mocked.pagamento.findUnique.mockResolvedValue({
      ...pagamentoDb,
      status: "PAID",
      inscricao: { ...inscricaoPendente, status: "CONFIRMADA" },
    } as never);

    await processarWebhook("body", {});

    expect(mocked.pagamento.update).not.toHaveBeenCalled();
    expect(mocked.inscricao.update).not.toHaveBeenCalled();
  });
});

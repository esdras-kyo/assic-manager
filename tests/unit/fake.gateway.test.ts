import { beforeEach, describe, expect, it } from "vitest";

import {
  AssinaturaInvalidaError,
  FakeGateway,
  gerarWebhookPago,
} from "@/services/payment/gateways/fake.gateway";
import type { CreatePaymentInput } from "@/services/payment/types";

const inputPix: CreatePaymentInput = {
  amountInCents: 5000,
  method: "pix",
  description: "Inscrição Encontro de Junho",
  customer: {
    name: "Maria da Silva",
    email: "maria@example.com",
    phone: "11987654321",
    document: "52998224725",
  },
  metadata: { inscricaoId: "insc1", eventoId: "evt1" },
};

let gateway: FakeGateway;

beforeEach(() => {
  gateway = new FakeGateway("segredo-teste");
});

describe("FakeGateway.createPayment", () => {
  it("pix devolve qrCode, expiração futura e status pending", async () => {
    const r = await gateway.createPayment(inputPix);
    expect(r.status).toBe("pending");
    expect(r.gatewayPaymentId).toMatch(/^fake_/);
    expect(r.pix?.qrCode).toBeTruthy();
    expect(r.pix!.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(r.checkoutUrl).toBeUndefined();
  });

  it("cartão devolve checkoutUrl e não devolve pix", async () => {
    const r = await gateway.createPayment({
      ...inputPix,
      method: "credit_card",
    });
    expect(r.checkoutUrl).toBeTruthy();
    expect(r.pix).toBeUndefined();
  });

  it("ids são únicos", async () => {
    const a = await gateway.createPayment(inputPix);
    const b = await gateway.createPayment(inputPix);
    expect(a.gatewayPaymentId).not.toBe(b.gatewayPaymentId);
  });
});

describe("FakeGateway.getPayment", () => {
  it("reflete o estado em memória", async () => {
    const { gatewayPaymentId } = await gateway.createPayment(inputPix);
    expect((await gateway.getPayment(gatewayPaymentId)).status).toBe("pending");
  });

  it("pagamento desconhecido lança", async () => {
    await expect(gateway.getPayment("fake_inexistente")).rejects.toThrow();
  });
});

describe("FakeGateway.parseWebhook", () => {
  it("assinatura válida devolve resultado normalizado", async () => {
    const { body, headers } = gerarWebhookPago("fake_abc", "segredo-teste", {
      inscricaoId: "insc1",
    });
    const r = await gateway.parseWebhook(body, headers);
    expect(r).toEqual({
      gatewayPaymentId: "fake_abc",
      status: "paid",
      inscricaoId: "insc1",
    });
  });

  it("assinatura errada lança AssinaturaInvalidaError", async () => {
    const { body } = gerarWebhookPago("fake_abc", "segredo-teste");
    await expect(
      gateway.parseWebhook(body, { "x-fake-signature": "errada" }),
    ).rejects.toBeInstanceOf(AssinaturaInvalidaError);
  });

  it("assinatura ausente lança AssinaturaInvalidaError", async () => {
    const { body } = gerarWebhookPago("fake_abc", "segredo-teste");
    await expect(gateway.parseWebhook(body, {})).rejects.toBeInstanceOf(
      AssinaturaInvalidaError,
    );
  });

  it("body sem gatewayPaymentId lança", async () => {
    const { headers } = gerarWebhookPago("fake_abc", "segredo-teste");
    await expect(
      gateway.parseWebhook(JSON.stringify({ status: "paid" }), headers),
    ).rejects.toThrow();
  });

  it("status bruto do fake é traduzido para o normalizado", async () => {
    const body = JSON.stringify({
      gatewayPaymentId: "fake_abc",
      status: "EXPIRADO_FAKE",
    });
    const r = await gateway.parseWebhook(body, {
      "x-fake-signature": "segredo-teste",
    });
    expect(r.status).toBe("expired");
  });
});

import { createHmac } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AssinaturaInvalidaError } from "@/services/payment/errors";
import { MercadoPagoGateway } from "@/services/payment/gateways/mercadopago.gateway";
import type { CreatePaymentInput } from "@/services/payment/types";

const SECRET = "segredo-teste";

const inputPix: CreatePaymentInput = {
  amountInCents: 3500,
  method: "pix",
  description: "Inscrição ASSIC 2026",
  customer: {
    name: "Maria da Silva",
    email: "maria@example.com",
    phone: "62999999999",
  },
  metadata: { inscricaoId: "insc1", eventoId: "evt1" },
};

function respostaOk(data: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => data,
    text: async () => "",
  } as Response;
}

// Recria a assinatura que o MP enviaria para um dado data.id.
function assinar(dataId: string, requestId: string, ts: string) {
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const v1 = createHmac("sha256", SECRET).update(manifest).digest("hex");
  return {
    "x-signature": `ts=${ts},v1=${v1}`,
    "x-request-id": requestId,
  };
}

let fetchMock: ReturnType<typeof vi.fn>;
let gateway: MercadoPagoGateway;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  gateway = new MercadoPagoGateway("TEST-token", SECRET);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("MercadoPagoGateway constructor", () => {
  it("lança sem access token", () => {
    expect(() => new MercadoPagoGateway(undefined, SECRET)).toThrow(
      /MERCADOPAGO_ACCESS_TOKEN/,
    );
  });

  it("lança sem webhook secret", () => {
    expect(() => new MercadoPagoGateway("TEST-token", undefined)).toThrow(
      /MERCADOPAGO_WEBHOOK_SECRET/,
    );
  });
});

describe("MercadoPagoGateway.createPayment", () => {
  it("monta o POST de Pix e devolve o copia-e-cola", async () => {
    fetchMock.mockResolvedValue(
      respostaOk({
        id: 123,
        status: "pending",
        point_of_interaction: {
          transaction_data: {
            qr_code: "00020126-PIX-COPIA-E-COLA",
            qr_code_base64: "QkFTRTY0",
          },
        },
        date_of_expiration: "2026-08-07T19:30:00.000-03:00",
      }),
    );

    const r = await gateway.createPayment(inputPix);

    expect(r.gatewayPaymentId).toBe("123");
    expect(r.status).toBe("pending");
    expect(r.pix?.qrCode).toBe("00020126-PIX-COPIA-E-COLA");
    expect(r.pix?.qrCodeImageUrl).toBe("data:image/png;base64,QkFTRTY0");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.mercadopago.com/v1/payments");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer TEST-token");
    expect(init.headers["X-Idempotency-Key"]).toBeTruthy();

    const enviado = JSON.parse(init.body);
    expect(enviado.payment_method_id).toBe("pix");
    expect(enviado.transaction_amount).toBe(35);
    expect(enviado.external_reference).toBe("insc1");
    expect(enviado.payer.email).toBe("maria@example.com");
    expect(enviado.payer.first_name).toBe("Maria");
    // Sem CPF coletado → não envia identification.
    expect(enviado.payer.identification).toBeUndefined();
  });

  it("envia CPF quando a inscrição coletou documento", async () => {
    fetchMock.mockResolvedValue(
      respostaOk({
        id: 1,
        status: "pending",
        point_of_interaction: { transaction_data: { qr_code: "x" } },
      }),
    );

    await gateway.createPayment({
      ...inputPix,
      customer: { ...inputPix.customer, document: "52998224725" },
    });

    const enviado = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(enviado.payer.identification).toEqual({
      type: "CPF",
      number: "52998224725",
    });
  });

  it("lança se o MP não devolver o qr_code", async () => {
    fetchMock.mockResolvedValue(
      respostaOk({ id: 1, status: "pending", point_of_interaction: {} }),
    );
    await expect(gateway.createPayment(inputPix)).rejects.toThrow(/qr_code/);
  });

  it("propaga erro HTTP do MP", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => '{"message":"bad request"}',
    } as Response);
    await expect(gateway.createPayment(inputPix)).rejects.toThrow(/400/);
  });
});

describe("MercadoPagoGateway.getPayment", () => {
  it.each([
    ["approved", undefined, "paid"],
    ["pending", undefined, "pending"],
    ["in_process", undefined, "pending"],
    ["rejected", undefined, "failed"],
    ["cancelled", "expired", "expired"],
    ["cancelled", "by_collector", "failed"],
    ["refunded", undefined, "refunded"],
    ["charged_back", undefined, "refunded"],
  ])("status %s/%s → %s", async (status, detail, esperado) => {
    fetchMock.mockResolvedValue(
      respostaOk({ id: 9, status, status_detail: detail }),
    );
    expect((await gateway.getPayment("9")).status).toBe(esperado);
  });
});

describe("MercadoPagoGateway.parseWebhook", () => {
  it("assinatura válida busca o pagamento e normaliza", async () => {
    fetchMock.mockResolvedValue(
      respostaOk({ id: 123, status: "approved", external_reference: "insc1" }),
    );
    const body = JSON.stringify({ type: "payment", data: { id: "123" } });
    const headers = assinar("123", "req-1", "1700000000");

    const r = await gateway.parseWebhook(body, headers);

    expect(r).toEqual({
      gatewayPaymentId: "123",
      status: "paid",
      inscricaoId: "insc1",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.mercadopago.com/v1/payments/123",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("lê data.id/type da query com corpo vazio (caso do simulador)", async () => {
    fetchMock.mockResolvedValue(
      respostaOk({ id: 123, status: "approved", external_reference: "insc1" }),
    );
    const headers = assinar("123", "req-1", "1700000000");

    const r = await gateway.parseWebhook("", headers, {
      "data.id": "123",
      type: "payment",
    });

    expect(r).toEqual({
      gatewayPaymentId: "123",
      status: "paid",
      inscricaoId: "insc1",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.mercadopago.com/v1/payments/123",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("assinatura inválida lança e não chama a API", async () => {
    const body = JSON.stringify({ type: "payment", data: { id: "123" } });
    await expect(
      gateway.parseWebhook(body, {
        "x-signature": "ts=1700000000,v1=deadbeef",
        "x-request-id": "req-1",
      }),
    ).rejects.toBeInstanceOf(AssinaturaInvalidaError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("headers ausentes lançam AssinaturaInvalidaError", async () => {
    const body = JSON.stringify({ type: "payment", data: { id: "123" } });
    await expect(gateway.parseWebhook(body, {})).rejects.toBeInstanceOf(
      AssinaturaInvalidaError,
    );
  });

  it("notificação que não é pagamento vira no-op (pending) sem chamar a API", async () => {
    const body = JSON.stringify({
      type: "merchant_order",
      data: { id: "456" },
    });
    const headers = assinar("456", "req-2", "1700000001");

    const r = await gateway.parseWebhook(body, headers);

    expect(r).toEqual({ gatewayPaymentId: "456", status: "pending" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

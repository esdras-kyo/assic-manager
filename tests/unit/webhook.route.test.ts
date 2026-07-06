import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/pagamentos/webhook/route";
import { processarWebhook } from "@/services/pagamento.service";
import { AssinaturaInvalidaError } from "@/services/payment/gateways/fake.gateway";

vi.mock("@/services/pagamento.service", () => ({
  processarWebhook: vi.fn(),
}));

const mockProcessar = vi.mocked(processarWebhook);

function requisicao(body: string, headers?: Record<string, string>) {
  return new Request("http://localhost/api/pagamentos/webhook", {
    method: "POST",
    body,
    headers,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/pagamentos/webhook", () => {
  it("200 e repassa rawBody+headers ao service", async () => {
    mockProcessar.mockResolvedValue({
      gatewayPaymentId: "fake_abc",
      status: "paid",
    });

    const res = await POST(requisicao('{"a":1}', { "x-fake-signature": "s3" }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
    expect(mockProcessar).toHaveBeenCalledWith(
      '{"a":1}',
      expect.objectContaining({ "x-fake-signature": "s3" }),
      {},
    );
  });

  it("401 quando assinatura inválida — inscrição não muda", async () => {
    mockProcessar.mockRejectedValue(new AssinaturaInvalidaError());
    const res = await POST(requisicao("{}"));
    expect(res.status).toBe(401);
  });

  it("500 em erro interno (gateway vai reenviar; idempotência cobre)", async () => {
    mockProcessar.mockRejectedValue(new Error("db caiu"));
    const res = await POST(requisicao("{}"));
    expect(res.status).toBe(500);
  });
});

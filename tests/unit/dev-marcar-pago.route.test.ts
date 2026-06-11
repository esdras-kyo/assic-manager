import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/dev/marcar-pago/route";
import { prisma } from "@/lib/db";
import { processarWebhook } from "@/services/pagamento.service";

vi.mock("@/lib/db", () => ({
  prisma: { pagamento: { findFirst: vi.fn() } },
}));

vi.mock("@/services/pagamento.service", () => ({
  processarWebhook: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  getEnv: () => ({ FAKE_WEBHOOK_SECRET: "segredo-teste" }),
}));

const mocked = vi.mocked(prisma, true);

function chamar(body: unknown) {
  return POST(
    new Request("http://localhost/api/dev/marcar-pago", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NODE_ENV", "development");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/dev/marcar-pago", () => {
  it("acha pagamento pendente e processa webhook fake de pago", async () => {
    mocked.pagamento.findFirst.mockResolvedValue({
      gatewayPaymentId: "fake_abc",
    } as never);
    vi.mocked(processarWebhook).mockResolvedValue({
      gatewayPaymentId: "fake_abc",
      status: "paid",
    });

    const res = await chamar({ inscricaoId: "insc1" });

    expect(res.status).toBe(200);
    expect(mocked.pagamento.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { inscricaoId: "insc1", status: "PENDING" },
      }),
    );
    const [body, headers] = vi.mocked(processarWebhook).mock.calls[0];
    expect(JSON.parse(body).gatewayPaymentId).toBe("fake_abc");
    expect(headers["x-fake-signature"]).toBeTruthy();
  });

  it("404 em produção — rota não existe lá fora", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const res = await chamar({ inscricaoId: "insc1" });
    expect(res.status).toBe(404);
    expect(mocked.pagamento.findFirst).not.toHaveBeenCalled();
  });

  it("404 sem pagamento pendente", async () => {
    mocked.pagamento.findFirst.mockResolvedValue(null);
    const res = await chamar({ inscricaoId: "insc1" });
    expect(res.status).toBe(404);
  });
});

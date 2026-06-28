import { afterEach, describe, expect, it, vi } from "vitest";

// A fábrica lê a env validada — mockamos por cenário. Os gateways precisam
// vir da MESMA carga de módulos (resetModules duplica classes).
async function fabricaComProvider(
  provider: string,
  extraEnv: Record<string, string> = {},
) {
  vi.resetModules();
  vi.doMock("@/lib/env", () => ({
    getEnv: () => ({
      DATABASE_URL: "postgresql://x",
      PAYMENT_PROVIDER: provider,
      FAKE_WEBHOOK_SECRET: "segredo-teste",
      ...extraEnv,
    }),
  }));
  const [fabrica, fakeMod, mpMod] = await Promise.all([
    import("@/services/payment"),
    import("@/services/payment/gateways/fake.gateway"),
    import("@/services/payment/gateways/mercadopago.gateway"),
  ]);
  return {
    ...fabrica,
    FakeGateway: fakeMod.FakeGateway,
    MercadoPagoGateway: mpMod.MercadoPagoGateway,
  };
}

afterEach(() => {
  vi.doUnmock("@/lib/env");
});

describe("getPaymentGateway", () => {
  it("fake devolve FakeGateway (singleton)", async () => {
    const { getPaymentGateway, FakeGateway } = await fabricaComProvider("fake");
    const g1 = getPaymentGateway();
    expect(g1).toBeInstanceOf(FakeGateway);
    expect(getPaymentGateway()).toBe(g1);
  });

  it("pagarme lança não-implementado (Etapa 5)", async () => {
    const { getPaymentGateway } = await fabricaComProvider("pagarme");
    expect(() => getPaymentGateway()).toThrowError(/não implementado/i);
  });

  it("mercadopago devolve MercadoPagoGateway (singleton) com as keys", async () => {
    const { getPaymentGateway, MercadoPagoGateway } = await fabricaComProvider(
      "mercadopago",
      {
        MERCADOPAGO_ACCESS_TOKEN: "TEST-token",
        MERCADOPAGO_WEBHOOK_SECRET: "segredo-teste",
      },
    );
    const g1 = getPaymentGateway();
    expect(g1).toBeInstanceOf(MercadoPagoGateway);
    expect(getPaymentGateway()).toBe(g1);
  });

  it("mercadopago sem keys lança erro claro", async () => {
    const { getPaymentGateway } = await fabricaComProvider("mercadopago");
    expect(() => getPaymentGateway()).toThrowError(/MERCADOPAGO_ACCESS_TOKEN/);
  });
});

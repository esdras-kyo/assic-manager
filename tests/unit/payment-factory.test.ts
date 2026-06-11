import { afterEach, describe, expect, it, vi } from "vitest";

// A fábrica lê a env validada — mockamos por cenário. FakeGateway precisa
// vir da MESMA carga de módulos (resetModules duplica classes).
async function fabricaComProvider(provider: string) {
  vi.resetModules();
  vi.doMock("@/lib/env", () => ({
    getEnv: () => ({
      DATABASE_URL: "postgresql://x",
      PAYMENT_PROVIDER: provider,
      FAKE_WEBHOOK_SECRET: "segredo-teste",
    }),
  }));
  const [fabrica, fakeMod] = await Promise.all([
    import("@/services/payment"),
    import("@/services/payment/gateways/fake.gateway"),
  ]);
  return { ...fabrica, FakeGateway: fakeMod.FakeGateway };
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

  it.each(["pagarme", "mercadopago"])(
    "%s lança não-implementado (Etapa 5)",
    async (provider) => {
      const { getPaymentGateway } = await fabricaComProvider(provider);
      expect(() => getPaymentGateway()).toThrowError(/não implementado/i);
    },
  );
});

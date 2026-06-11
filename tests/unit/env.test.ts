import { describe, expect, it } from "vitest";

import { parseEnv } from "@/lib/env";

const envValida = {
  DATABASE_URL: "postgresql://user:pass@host:6543/db?pgbouncer=true",
  PAYMENT_PROVIDER: "fake",
};

describe("parseEnv", () => {
  it("aceita env válida", () => {
    const env = parseEnv(envValida);
    expect(env.DATABASE_URL).toBe(envValida.DATABASE_URL);
    expect(env.PAYMENT_PROVIDER).toBe("fake");
  });

  it("falha com mensagem citando a var quando DATABASE_URL falta", () => {
    expect(() => parseEnv({ PAYMENT_PROVIDER: "fake" })).toThrowError(
      /DATABASE_URL/,
    );
  });

  it("rejeita PAYMENT_PROVIDER desconhecido", () => {
    expect(() =>
      parseEnv({ ...envValida, PAYMENT_PROVIDER: "paypal" }),
    ).toThrowError(/PAYMENT_PROVIDER/);
  });

  it("PAYMENT_PROVIDER default é fake", () => {
    const env = parseEnv({ DATABASE_URL: envValida.DATABASE_URL });
    expect(env.PAYMENT_PROVIDER).toBe("fake");
  });
});

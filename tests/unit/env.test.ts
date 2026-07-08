import { describe, expect, it } from "vitest";

import { parseEnv } from "@/lib/env";

const envValida = {
  DATABASE_URL: "postgresql://user:pass@host:6543/db?pgbouncer=true",
  PAYMENT_PROVIDER: "fake",
  AUTH_SECRET: "um-segredo-de-teste-com-32-chars!!",
  APP_URL: "https://assic.example.com",
};

describe("parseEnv", () => {
  it("aceita env válida", () => {
    const env = parseEnv(envValida);
    expect(env.DATABASE_URL).toBe(envValida.DATABASE_URL);
    expect(env.PAYMENT_PROVIDER).toBe("fake");
  });

  it("falha com mensagem citando a var quando DATABASE_URL falta", () => {
    const sem: Record<string, string> = { ...envValida };
    delete sem.DATABASE_URL;
    expect(() => parseEnv(sem)).toThrowError(/DATABASE_URL/);
  });

  it("AUTH_SECRET ausente ou curta falha", () => {
    const sem: Record<string, string> = { ...envValida };
    delete sem.AUTH_SECRET;
    expect(() => parseEnv(sem)).toThrowError(/AUTH_SECRET/);
    expect(() => parseEnv({ ...envValida, AUTH_SECRET: "curta" })).toThrowError(
      /AUTH_SECRET/,
    );
  });

  it("rejeita PAYMENT_PROVIDER desconhecido", () => {
    expect(() =>
      parseEnv({ ...envValida, PAYMENT_PROVIDER: "paypal" }),
    ).toThrowError(/PAYMENT_PROVIDER/);
  });

  it("PAYMENT_PROVIDER default é fake", () => {
    const sem: Record<string, string> = { ...envValida };
    delete sem.PAYMENT_PROVIDER;
    const env = parseEnv(sem);
    expect(env.PAYMENT_PROVIDER).toBe("fake");
  });

  it("APP_URL ausente ou não-URL falha", () => {
    const sem: Record<string, string> = { ...envValida };
    delete sem.APP_URL;
    expect(() => parseEnv(sem)).toThrowError(/APP_URL/);
    expect(() => parseEnv({ ...envValida, APP_URL: "nao-e-url" })).toThrowError(
      /APP_URL/,
    );
  });

  it("expõe APP_URL válida", () => {
    expect(parseEnv(envValida).APP_URL).toBe("https://assic.example.com");
  });
});

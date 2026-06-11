import { describe, expect, it } from "vitest";

import {
  dataParaInputLocal,
  formatarDataExtensa,
  formatarPrecoBRL,
  gerarSlug,
  inputLocalParaData,
  mascararCelular,
  mascararCpf,
  reaisParaCentavos,
} from "@/lib/formatadores";

describe("formatarPrecoBRL", () => {
  it("formata centavos como reais", () => {
    expect(formatarPrecoBRL(5000)).toBe("R$ 50,00");
    expect(formatarPrecoBRL(123456)).toBe("R$ 1.234,56");
  });

  it("zero vira Gratuito", () => {
    expect(formatarPrecoBRL(0)).toBe("Gratuito");
  });
});

describe("formatarDataExtensa", () => {
  it("data por extenso em PT com hora", () => {
    const r = formatarDataExtensa(new Date("2026-07-10T19:00:00.000Z"));
    expect(r).toMatch(/julho/);
    expect(r).toMatch(/2026/);
    expect(r).toMatch(/16h/); // 19:00 UTC = 16:00 em São Paulo
  });
});

describe("gerarSlug", () => {
  it.each([
    ["Encontro de Junho", "encontro-de-junho"],
    ["São João 2026!", "sao-joao-2026"],
    ["  Café & Prosa  ", "cafe-prosa"],
    ["", ""],
  ] as const)("%s → %s", (entrada, saida) => {
    expect(gerarSlug(entrada)).toBe(saida);
  });
});

describe("datetime-local ↔ UTC (fuso fixo de São Paulo, -03:00)", () => {
  it("input local vira Date UTC correto independente do fuso do servidor", () => {
    const d = inputLocalParaData("2026-07-10T16:00");
    expect(d?.toISOString()).toBe("2026-07-10T19:00:00.000Z");
  });

  it("Date UTC vira string de input no horário de SP", () => {
    expect(dataParaInputLocal(new Date("2026-07-10T19:00:00.000Z"))).toBe(
      "2026-07-10T16:00",
    );
  });

  it("roundtrip é estável", () => {
    const original = "2026-12-25T08:30";
    expect(dataParaInputLocal(inputLocalParaData(original)!)).toBe(original);
  });

  it("entrada inválida vira null", () => {
    expect(inputLocalParaData("abc")).toBeNull();
    expect(inputLocalParaData("")).toBeNull();
  });
});

describe("reaisParaCentavos (entrada de formulário admin)", () => {
  it.each([
    ["50", 5000],
    ["50,00", 5000],
    ["50.5", 5050],
    ["1.234,56", 123456],
    ["0", 0],
  ] as const)("%s → %d", (entrada, saida) => {
    expect(reaisParaCentavos(entrada)).toBe(saida);
  });

  it.each(["abc", "", "-5", "10,5,5"])("%s → null", (entrada) => {
    expect(reaisParaCentavos(entrada)).toBeNull();
  });
});

describe("mascararCpf (incremental, enquanto digita)", () => {
  it.each([
    ["529", "529"],
    ["5299822", "529.982.2"],
    ["52998224725", "529.982.247-25"],
    ["529.982.247-25", "529.982.247-25"],
    ["52998224725999", "529.982.247-25"], // trava em 11 dígitos
  ])("%s → %s", (entrada, saida) => {
    expect(mascararCpf(entrada)).toBe(saida);
  });
});

describe("mascararCelular (incremental)", () => {
  it.each([
    ["11", "(11"],
    ["119876", "(11) 9876"],
    ["11987654321", "(11) 98765-4321"],
    ["(11) 98765-4321", "(11) 98765-4321"],
    ["119876543219999", "(11) 98765-4321"], // trava em 11 dígitos
  ])("%s → %s", (entrada, saida) => {
    expect(mascararCelular(entrada)).toBe(saida);
  });
});

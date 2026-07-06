import { describe, expect, it } from "vitest";

import {
  dataParaInputLocal,
  formatarDataExtensa,
  formatarPeriodoEvento,
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

describe("formatarPeriodoEvento", () => {
  it("fim null → igual a formatarDataExtensa", () => {
    const inicio = new Date("2026-07-10T19:00:00.000Z");
    expect(formatarPeriodoEvento(inicio, null)).toBe(
      formatarDataExtensa(inicio),
    );
  });

  it("fim no mesmo dia (SP) → single-day", () => {
    const inicio = new Date("2026-07-10T19:00:00.000Z"); // 16h SP, 10 jul
    const fim = new Date("2026-07-10T22:00:00.000Z"); // 19h SP, 10 jul
    expect(formatarPeriodoEvento(inicio, fim)).toBe(
      formatarDataExtensa(inicio),
    );
  });

  it("dias no mesmo mês → intervalo só datas", () => {
    const inicio = new Date("2026-07-10T13:00:00.000Z");
    const fim = new Date("2026-07-11T13:00:00.000Z");
    expect(formatarPeriodoEvento(inicio, fim)).toBe("10 a 11 de julho de 2026");
  });

  it("meses diferentes, mesmo ano", () => {
    const inicio = new Date("2026-07-30T13:00:00.000Z");
    const fim = new Date("2026-08-02T13:00:00.000Z");
    expect(formatarPeriodoEvento(inicio, fim)).toBe(
      "30 de julho a 2 de agosto de 2026",
    );
  });

  it("anos diferentes", () => {
    const inicio = new Date("2026-12-30T13:00:00.000Z");
    const fim = new Date("2027-01-02T13:00:00.000Z");
    expect(formatarPeriodoEvento(inicio, fim)).toBe(
      "30 de dezembro de 2026 a 2 de janeiro de 2027",
    );
  });

  it("mesmo dia local SP apesar de UTC diferente → single-day", () => {
    const inicio = new Date("2026-07-11T01:00:00.000Z"); // 22h SP, 10 jul
    const fim = new Date("2026-07-11T02:00:00.000Z"); // 23h SP, 10 jul
    expect(formatarPeriodoEvento(inicio, fim)).toBe(
      formatarDataExtensa(inicio),
    );
  });
});

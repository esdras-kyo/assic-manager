import { describe, expect, it } from "vitest";

import {
  formatarDataExtensa,
  formatarPrecoBRL,
  mascararCelular,
  mascararCpf,
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

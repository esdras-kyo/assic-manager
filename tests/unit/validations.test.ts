import { describe, expect, it } from "vitest";

import {
  cpfCompleto,
  eventoCreateSchema,
  inscricaoCreateSchema,
  normalizarDigitos,
} from "@/lib/validations";

describe("cpfCompleto", () => {
  it("aceita 11 dígitos sem máscara", () => {
    expect(cpfCompleto("52998224725")).toBe(true);
  });

  it("aceita fake com 11 dígitos (não valida DV)", () => {
    expect(cpfCompleto("11111111111")).toBe(true);
    expect(cpfCompleto("52998224724")).toBe(true);
  });

  it("rejeita tamanho errado", () => {
    expect(cpfCompleto("1234567890")).toBe(false);
  });
});

describe("normalizarDigitos", () => {
  it("remove máscara", () => {
    expect(normalizarDigitos("529.982.247-25")).toBe("52998224725");
    expect(normalizarDigitos("(11) 98765-4321")).toBe("11987654321");
  });
});

describe("inscricaoCreateSchema", () => {
  const valida = {
    eventoId: "ckxyz123",
    nome: "Maria da Silva",
    email: "maria@example.com",
    celular: "(11) 98765-4321",
    documento: "529.982.247-25",
  };

  it("aceita inscrição válida e normaliza celular/documento", () => {
    const r = inscricaoCreateSchema.parse(valida);
    expect(r.celular).toBe("11987654321");
    expect(r.documento).toBe("52998224725");
  });

  it("rejeita CPF com menos de 11 dígitos, com mensagem em PT", () => {
    const r = inscricaoCreateSchema.safeParse({
      ...valida,
      documento: "529.982.247",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].message).toMatch(/CPF/);
    }
  });

  it("rejeita celular sem DDD (10 dígitos)", () => {
    const r = inscricaoCreateSchema.safeParse({
      ...valida,
      celular: "8765-4321",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].message).toMatch(/DDD/);
    }
  });

  it("rejeita celular fixo (sem o 9)", () => {
    const r = inscricaoCreateSchema.safeParse({
      ...valida,
      celular: "(11) 3765-4321",
    });
    expect(r.success).toBe(false);
  });

  it("rejeita email inválido", () => {
    const r = inscricaoCreateSchema.safeParse({ ...valida, email: "maria" });
    expect(r.success).toBe(false);
  });

  it("rejeita nome muito curto", () => {
    const r = inscricaoCreateSchema.safeParse({ ...valida, nome: "Ma" });
    expect(r.success).toBe(false);
  });

  it("aceita inscrição sem CPF (documento opcional)", () => {
    const { documento: _omit, ...semCpf } = valida;
    void _omit;
    const r = inscricaoCreateSchema.safeParse(semCpf);
    expect(r.success).toBe(true);
  });

  it("aceita CPF fake com 11 dígitos (sem validar DV)", () => {
    const r = inscricaoCreateSchema.safeParse({
      ...valida,
      documento: "111.111.111-11",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.documento).toBe("11111111111");
  });
});

describe("eventoCreateSchema", () => {
  const valido = {
    nome: "Encontro de Junho",
    slug: "encontro-de-junho",
    local: "Salão Principal",
    dataInicio: "2026-07-10T19:00:00.000Z",
    precoEmCentavos: 5000,
  };

  it("aceita evento válido e coage data", () => {
    const r = eventoCreateSchema.parse(valido);
    expect(r.dataInicio).toBeInstanceOf(Date);
    expect(r.precoEmCentavos).toBe(5000);
  });

  it("rejeita preço float", () => {
    const r = eventoCreateSchema.safeParse({
      ...valido,
      precoEmCentavos: 50.5,
    });
    expect(r.success).toBe(false);
  });

  it("rejeita preço negativo", () => {
    const r = eventoCreateSchema.safeParse({
      ...valido,
      precoEmCentavos: -100,
    });
    expect(r.success).toBe(false);
  });

  it("rejeita slug com maiúsculas/espaços", () => {
    expect(
      eventoCreateSchema.safeParse({ ...valido, slug: "Encontro Junho" })
        .success,
    ).toBe(false);
  });

  it("rejeita dataFim antes de dataInicio", () => {
    const r = eventoCreateSchema.safeParse({
      ...valido,
      dataFim: "2026-07-09T19:00:00.000Z",
    });
    expect(r.success).toBe(false);
  });

  it("vagas precisa ser inteiro positivo quando presente", () => {
    expect(eventoCreateSchema.safeParse({ ...valido, vagas: 0 }).success).toBe(
      false,
    );
    expect(eventoCreateSchema.safeParse({ ...valido, vagas: 50 }).success).toBe(
      true,
    );
  });

  it("aceita inclui opcional e faz trim", () => {
    const r = eventoCreateSchema.parse({
      ...valido,
      inclui: "  café da manhã, material de apoio  ",
    });
    expect(r.inclui).toBe("café da manhã, material de apoio");

    const semCampo = eventoCreateSchema.parse(valido);
    expect(semCampo.inclui).toBeUndefined();
  });
});

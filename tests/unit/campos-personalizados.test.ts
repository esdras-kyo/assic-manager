import { describe, expect, it } from "vitest";

import {
  camposPersonalizadosSchema,
  conteudoSchema,
  construirSchemaCampos,
  type CampoPersonalizado,
} from "@/lib/validations";

const campos: CampoPersonalizado[] = [
  { id: "cidade", label: "Cidade", tipo: "texto", obrigatorio: true },
  {
    id: "cargo",
    label: "Cargo",
    tipo: "radio",
    obrigatorio: true,
    opcoes: ["Pastor Titular", "Outro"],
  },
  { id: "termo", label: "Concordo", tipo: "checkbox", obrigatorio: true },
  {
    id: "autorizaImagem",
    label: "Autoriza imagem",
    tipo: "radio",
    obrigatorio: false,
    opcoes: ["Sim", "Não"],
  },
];

describe("camposPersonalizadosSchema", () => {
  it("aceita uma config válida", () => {
    expect(camposPersonalizadosSchema.safeParse(campos).success).toBe(true);
  });

  it("rejeita radio sem opções", () => {
    const r = camposPersonalizadosSchema.safeParse([
      { id: "x", label: "X", tipo: "radio", obrigatorio: true },
    ]);
    expect(r.success).toBe(false);
  });
});

describe("construirSchemaCampos", () => {
  const schema = construirSchemaCampos(campos);

  it("valida respostas completas", () => {
    const r = schema.safeParse({
      cidade: "Goiânia",
      cargo: "Pastor Titular",
      termo: "on",
      autorizaImagem: "Sim",
    });
    expect(r.success).toBe(true);
  });

  it("exige campo de texto obrigatório", () => {
    const r = schema.safeParse({ cidade: "", cargo: "Outro", termo: "on" });
    expect(r.success).toBe(false);
  });

  it("exige checkbox obrigatório marcado", () => {
    const r = schema.safeParse({
      cidade: "Goiânia",
      cargo: "Outro",
      termo: "",
    });
    expect(r.success).toBe(false);
  });

  it("rejeita opção fora da lista do radio", () => {
    const r = schema.safeParse({
      cidade: "Goiânia",
      cargo: "Inexistente",
      termo: "on",
    });
    expect(r.success).toBe(false);
  });

  it("aceita radio opcional ausente", () => {
    const r = schema.safeParse({
      cidade: "Goiânia",
      cargo: "Outro",
      termo: "on",
    });
    expect(r.success).toBe(true);
  });
});

describe("conteudoSchema", () => {
  it("aceita conteúdo parcial", () => {
    expect(
      conteudoSchema.safeParse({
        subtitulo: "Atualizando para Crescer",
        oQueEncontrara: ["a", "b"],
      }).success,
    ).toBe(true);
  });
});

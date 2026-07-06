import { describe, expect, it } from "vitest";

import { montarCampos, type RascunhoCampo } from "@/lib/campos";

function rasc(over: Partial<RascunhoCampo>): RascunhoCampo {
  return {
    id: "",
    label: "",
    tipo: "texto",
    obrigatorio: false,
    ajuda: "",
    opcoes: [],
    ...over,
  };
}

describe("montarCampos", () => {
  it("novo campo gera id do label", () => {
    const [c] = montarCampos([rasc({ label: "Cidade" })]);
    expect(c.id).toBe("cidade");
    expect(c.label).toBe("Cidade");
    expect(c.tipo).toBe("texto");
  });

  it("preserva id existente mesmo mudando o label", () => {
    const [c] = montarCampos([
      rasc({ id: "cidadeNatal", label: "Cidade de origem" }),
    ]);
    expect(c.id).toBe("cidadeNatal");
  });

  it("ids únicos para labels iguais", () => {
    const cs = montarCampos([
      rasc({ label: "Cidade" }),
      rasc({ label: "Cidade" }),
    ]);
    expect(cs.map((c) => c.id)).toEqual(["cidade", "cidade2"]);
  });

  it("opcoes só p/ radio/select, limpando vazias", () => {
    const [radio] = montarCampos([
      rasc({
        label: "Cargo",
        tipo: "radio",
        opcoes: [" Pastor ", "", "Líder"],
      }),
    ]);
    expect(radio.opcoes).toEqual(["Pastor", "Líder"]);
    const [texto] = montarCampos([
      rasc({ label: "Nome", tipo: "texto", opcoes: ["x"] }),
    ]);
    expect(texto.opcoes).toBeUndefined();
  });

  it("descarta rascunho sem label; ajuda vazia omitida", () => {
    const cs = montarCampos([
      rasc({ label: "  " }),
      rasc({ label: "Igreja", ajuda: "" }),
    ]);
    expect(cs).toHaveLength(1);
    expect(cs[0].label).toBe("Igreja");
    expect(cs[0].ajuda).toBeUndefined();
  });

  it("label sem alfanumérico → id fallback 'campo'", () => {
    const [c] = montarCampos([rasc({ label: "??" })]);
    expect(c.id).toBe("campo");
  });

  it("ajuda preenchida entra", () => {
    const [c] = montarCampos([rasc({ label: "CPF", ajuda: "Só números" })]);
    expect(c.ajuda).toBe("Só números");
  });
});

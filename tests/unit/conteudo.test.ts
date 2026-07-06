import { describe, expect, it } from "vitest";

import {
  montarConteudo,
  mesclarProgramacao,
  type EntradaConteudo,
  type EntradaProgramacao,
} from "@/lib/conteudo";
import type { Conteudo } from "@/lib/validations";

const vazia: EntradaConteudo = {
  subtitulo: "",
  apresentacao: [],
  oQueEncontrara: [],
  destaques: [],
  inclui: "",
  textoFinalTitulo: "",
  textoFinalCorpo: "",
  contatos: [],
};

describe("montarConteudo", () => {
  it("preserva campos não editados (programacao, imagens)", () => {
    const atual: Conteudo = {
      imagemCapa: "capa.jpg",
      galeria: ["g1.jpg"],
      fotos: ["f1.jpg"],
      horarios: [{ dia: "Sáb", blocos: ["9h"] }],
      programacao: [{ dia: "Dia 1", periodos: [{ itens: ["Abertura"] }] }],
      subtitulo: "antigo",
    };
    const r = montarConteudo(atual, { ...vazia, subtitulo: "novo" });
    expect(r.imagemCapa).toBe("capa.jpg");
    expect(r.galeria).toEqual(["g1.jpg"]);
    expect(r.fotos).toEqual(["f1.jpg"]);
    expect(r.horarios).toEqual([{ dia: "Sáb", blocos: ["9h"] }]);
    expect(r.programacao).toHaveLength(1);
    expect(r.subtitulo).toBe("novo");
  });

  it("filtra itens vazios das listas e faz trim", () => {
    const r = montarConteudo(null, {
      ...vazia,
      apresentacao: ["  um  ", "", "  ", "dois"],
    });
    expect(r.apresentacao).toEqual(["um", "dois"]);
  });

  it("omite chave quando string/lista fica vazia", () => {
    const atual: Conteudo = { subtitulo: "x", oQueEncontrara: ["a"] };
    const r = montarConteudo(atual, vazia);
    expect(r.subtitulo).toBeUndefined();
    expect(r.oQueEncontrara).toBeUndefined();
    expect("subtitulo" in r).toBe(false);
  });

  it("investimento só com inclui; some quando vazio", () => {
    expect(
      montarConteudo(null, { ...vazia, inclui: "café" }).investimento,
    ).toEqual({
      inclui: "café",
    });
    expect(
      montarConteudo({ investimento: { inclui: "x" } }, vazia).investimento,
    ).toBeUndefined();
  });

  it("textoFinal só com titulo E corpo; contatos só quando não vazio", () => {
    const so = montarConteudo(null, {
      ...vazia,
      textoFinalTitulo: "Obrigado",
      textoFinalCorpo: "Até já",
    });
    expect(so.textoFinal).toEqual({ titulo: "Obrigado", corpo: "Até já" });

    const com = montarConteudo(null, {
      ...vazia,
      textoFinalTitulo: "Obrigado",
      textoFinalCorpo: "Até já",
      contatos: ["(62) 9999", ""],
    });
    expect(com.textoFinal).toEqual({
      titulo: "Obrigado",
      corpo: "Até já",
      contatos: ["(62) 9999"],
    });

    expect(
      montarConteudo(null, { ...vazia, textoFinalTitulo: "só" }).textoFinal,
    ).toBeUndefined();
  });
});

describe("mesclarProgramacao", () => {
  const vaziaP: EntradaProgramacao = { horarios: [], programacao: [] };

  it("preserva textos/imagens do atual", () => {
    const atual: Conteudo = {
      subtitulo: "sub",
      apresentacao: ["p1"],
      imagemCapa: "capa.jpg",
      galeria: ["g.jpg"],
    };
    const r = mesclarProgramacao(atual, vaziaP);
    expect(r.subtitulo).toBe("sub");
    expect(r.apresentacao).toEqual(["p1"]);
    expect(r.imagemCapa).toBe("capa.jpg");
    expect(r.galeria).toEqual(["g.jpg"]);
  });

  it("horarios: descarta blocos vazios; dia sem nome ou sem blocos some", () => {
    const r = mesclarProgramacao(null, {
      horarios: [
        { dia: "  Sábado  ", blocos: [" 9h ", "", "  "] },
        { dia: "", blocos: ["10h"] },
        { dia: "Domingo", blocos: ["", "  "] },
      ],
      programacao: [],
    });
    expect(r.horarios).toEqual([{ dia: "Sábado", blocos: ["9h"] }]);
  });

  it("horarios vazio → chave omitida", () => {
    const r = mesclarProgramacao(
      { horarios: [{ dia: "x", blocos: ["y"] }] },
      vaziaP,
    );
    expect(r.horarios).toBeUndefined();
    expect("horarios" in r).toBe(false);
  });

  it("programacao: limpa itens, período sem itens some, dia sem período/nome some, titulo vazio vira undefined", () => {
    const r = mesclarProgramacao(null, {
      horarios: [],
      programacao: [
        {
          dia: " Dia 1 ",
          periodos: [
            { titulo: " Manhã ", itens: [" Abertura ", ""] },
            { titulo: "", itens: ["Louvor"] },
            { titulo: "Tarde", itens: ["", "  "] },
          ],
        },
        { dia: "", periodos: [{ titulo: "x", itens: ["y"] }] },
        { dia: "Dia 3", periodos: [{ titulo: "z", itens: [] }] },
      ],
    });
    expect(r.programacao).toEqual([
      {
        dia: "Dia 1",
        periodos: [
          { titulo: "Manhã", itens: ["Abertura"] },
          { itens: ["Louvor"] },
        ],
      },
    ]);
  });

  it("substitui programacao antiga pela nova", () => {
    const atual: Conteudo = {
      programacao: [{ dia: "Velho", periodos: [{ itens: ["antigo"] }] }],
    };
    const r = mesclarProgramacao(atual, {
      horarios: [],
      programacao: [
        { dia: "Novo", periodos: [{ titulo: "", itens: ["item"] }] },
      ],
    });
    expect(r.programacao).toEqual([
      { dia: "Novo", periodos: [{ itens: ["item"] }] },
    ]);
  });
});

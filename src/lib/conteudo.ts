import type { Conteudo } from "@/lib/validations";

export interface EntradaConteudo {
  subtitulo: string;
  apresentacao: string[];
  oQueEncontrara: string[];
  destaques: string[];
  inclui: string;
  textoFinalTitulo: string;
  textoFinalCorpo: string;
  contatos: string[];
}

function limparLista(itens: string[]): string[] {
  return itens.map((s) => s.trim()).filter(Boolean);
}

/**
 * Mescla os campos textuais (bucket 1) sobre o conteudo atual, preservando o
 * resto (imagens, horarios, programacao). Trim + descarte de vazios: string ou
 * lista vazia → chave omitida. textoFinal só quando titulo E corpo presentes.
 */
export function montarConteudo(
  atual: Conteudo | null,
  e: EntradaConteudo,
): Conteudo {
  const base: Conteudo = { ...(atual ?? {}) };

  function set<K extends keyof Conteudo>(k: K, v: Conteudo[K] | undefined) {
    if (v === undefined) delete base[k];
    else base[k] = v;
  }

  const subtitulo = e.subtitulo.trim();
  set("subtitulo", subtitulo || undefined);

  const apresentacao = limparLista(e.apresentacao);
  set("apresentacao", apresentacao.length ? apresentacao : undefined);

  const oQueEncontrara = limparLista(e.oQueEncontrara);
  set("oQueEncontrara", oQueEncontrara.length ? oQueEncontrara : undefined);

  const destaques = limparLista(e.destaques);
  set("destaques", destaques.length ? destaques : undefined);

  const inclui = e.inclui.trim();
  set("investimento", inclui ? { inclui } : undefined);

  const titulo = e.textoFinalTitulo.trim();
  const corpo = e.textoFinalCorpo.trim();
  const contatos = limparLista(e.contatos);
  if (titulo && corpo) {
    set("textoFinal", {
      titulo,
      corpo,
      ...(contatos.length > 0 && { contatos }),
    });
  } else {
    set("textoFinal", undefined);
  }

  return base;
}

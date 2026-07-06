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

export interface HorarioEntrada {
  dia: string;
  blocos: string[];
}
export interface PeriodoEntrada {
  titulo: string;
  itens: string[];
}
export interface DiaEntrada {
  dia: string;
  periodos: PeriodoEntrada[];
}
export interface EntradaProgramacao {
  horarios: HorarioEntrada[];
  programacao: DiaEntrada[];
}

/**
 * Mescla programacao + horarios sobre o conteudo atual, preservando o resto
 * (textos, imagens). Limpeza: descarta blocos/itens vazios; período sem itens,
 * dia sem nome ou sem período/bloco são removidos; listas vazias → chave
 * omitida.
 */
export function mesclarProgramacao(
  atual: Conteudo | null,
  e: EntradaProgramacao,
): Conteudo {
  const base: Conteudo = { ...(atual ?? {}) };

  const horarios = e.horarios
    .map((h) => ({ dia: h.dia.trim(), blocos: limparLista(h.blocos) }))
    .filter((h) => h.dia && h.blocos.length > 0);
  if (horarios.length) base.horarios = horarios;
  else delete base.horarios;

  const programacao = e.programacao
    .map((d) => ({
      dia: d.dia.trim(),
      periodos: d.periodos
        .map((p) => {
          const titulo = p.titulo.trim();
          const itens = limparLista(p.itens);
          return titulo ? { titulo, itens } : { itens };
        })
        .filter((p) => p.itens.length > 0),
    }))
    .filter((d) => d.dia && d.periodos.length > 0);
  if (programacao.length) base.programacao = programacao;
  else delete base.programacao;

  return base;
}

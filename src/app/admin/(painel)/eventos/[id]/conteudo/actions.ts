"use server";

import { revalidatePath } from "next/cache";

import { exigirAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { montarConteudo, type EntradaConteudo } from "@/lib/conteudo";
import { conteudoSchema, type Conteudo } from "@/lib/validations";

export interface ConteudoFormState {
  erros?: Record<string, string[]>;
  mensagem?: string;
  sucesso?: boolean;
}

export async function salvarConteudoAction(
  _prev: ConteudoFormState | undefined,
  formData: FormData,
): Promise<ConteudoFormState> {
  await exigirAdmin();

  const eventoId = String(formData.get("eventoId") ?? "").trim();
  if (!eventoId) return { mensagem: "Evento inválido." };

  const entrada: EntradaConteudo = {
    subtitulo: String(formData.get("subtitulo") ?? ""),
    inclui: String(formData.get("inclui") ?? ""),
    textoFinalTitulo: String(formData.get("textoFinalTitulo") ?? ""),
    textoFinalCorpo: String(formData.get("textoFinalCorpo") ?? ""),
    apresentacao: formData.getAll("apresentacao").map(String),
    oQueEncontrara: formData.getAll("oQueEncontrara").map(String),
    destaques: formData.getAll("destaque").map(String),
    contatos: formData.getAll("contato").map(String),
  };

  // textoFinal: ambos (titulo+corpo) ou nenhum.
  const tfT = entrada.textoFinalTitulo.trim();
  const tfC = entrada.textoFinalCorpo.trim();
  if ((tfT && !tfC) || (!tfT && tfC)) {
    return {
      erros: {
        textoFinal: [
          "Preencha título e corpo do texto final, ou deixe os dois vazios.",
        ],
      },
    };
  }

  const evento = await prisma.evento.findUnique({ where: { id: eventoId } });
  if (!evento) return { mensagem: "Evento não encontrado." };

  let conteudo: Conteudo;
  try {
    conteudo = conteudoSchema.parse(
      montarConteudo(evento.conteudo as Conteudo | null, entrada),
    );
  } catch (erro) {
    console.error("Conteúdo inválido ao salvar:", erro);
    return { mensagem: "Conteúdo inválido. Revise os campos." };
  }

  await prisma.evento.update({
    where: { id: eventoId },
    data: { conteudo },
  });

  revalidatePath(`/eventos/${evento.slug}`);
  revalidatePath(`/admin/eventos/${eventoId}/conteudo`);
  return { sucesso: true };
}

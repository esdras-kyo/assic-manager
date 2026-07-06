"use server";

import { revalidatePath } from "next/cache";

import { exigirAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { mesclarProgramacao, type EntradaProgramacao } from "@/lib/conteudo";
import { conteudoSchema, type Conteudo } from "@/lib/validations";

export interface ProgramacaoFormState {
  mensagem?: string;
  sucesso?: boolean;
}

export async function salvarProgramacaoAction(
  eventoId: string,
  entrada: EntradaProgramacao,
): Promise<ProgramacaoFormState> {
  await exigirAdmin();

  if (!eventoId) return { mensagem: "Evento inválido." };

  const evento = await prisma.evento.findUnique({ where: { id: eventoId } });
  if (!evento) return { mensagem: "Evento não encontrado." };

  let conteudo: Conteudo;
  try {
    conteudo = conteudoSchema.parse(
      mesclarProgramacao(evento.conteudo as Conteudo | null, entrada),
    );
  } catch (erro) {
    console.error("Programação inválida ao salvar:", erro);
    return { mensagem: "Programação inválida. Revise os campos." };
  }

  await prisma.evento.update({
    where: { id: eventoId },
    data: { conteudo },
  });

  revalidatePath(`/eventos/${evento.slug}`);
  revalidatePath(`/admin/eventos/${eventoId}/programacao`);
  return { sucesso: true };
}

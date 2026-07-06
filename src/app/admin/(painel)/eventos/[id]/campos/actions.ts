"use server";

import { revalidatePath } from "next/cache";

import { exigirAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { montarCampos, type RascunhoCampo } from "@/lib/campos";
import {
  camposPersonalizadosSchema,
  type CampoPersonalizado,
} from "@/lib/validations";

export interface CamposFormState {
  mensagem?: string;
  sucesso?: boolean;
}

export async function salvarCamposAction(
  eventoId: string,
  rascunhos: RascunhoCampo[],
): Promise<CamposFormState> {
  await exigirAdmin();

  if (!eventoId) return { mensagem: "Evento inválido." };

  const evento = await prisma.evento.findUnique({ where: { id: eventoId } });
  if (!evento) return { mensagem: "Evento não encontrado." };

  let campos: CampoPersonalizado[];
  try {
    campos = camposPersonalizadosSchema.parse(montarCampos(rascunhos));
  } catch (erro) {
    console.error("Campos inválidos ao salvar:", erro);
    return {
      mensagem:
        "Revise os campos. Campos de escolha (única/lista) precisam de ao menos uma opção.",
    };
  }

  await prisma.evento.update({
    where: { id: eventoId },
    data: { camposPersonalizados: campos },
  });

  revalidatePath(`/eventos/${evento.slug}/inscricao`);
  revalidatePath(`/admin/eventos/${eventoId}/campos`);
  return { sucesso: true };
}

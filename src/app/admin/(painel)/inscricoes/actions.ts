"use server";

import { revalidatePath } from "next/cache";

import { exigirAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TransicaoInvalidaError } from "@/services/inscricao-maquina";
import {
  cancelarInscricao,
  confirmarInscricao,
} from "@/services/inscricao.service";

// Validação manual de status só vale para eventos MANUAL — em GATEWAY a
// confirmação vem do webhook (inscricao.service §96). O guard vive no
// servidor, não só na UI, para não permitir confirmar sem pagamento.
async function mudarStatusManual(
  id: string,
  acao: (id: string) => Promise<unknown>,
): Promise<void> {
  await exigirAdmin();

  const inscricao = await prisma.inscricao.findUnique({
    where: { id },
    select: { evento: { select: { modalidadePagamento: true } } },
  });
  if (inscricao?.evento.modalidadePagamento !== "MANUAL") {
    console.warn(`Mudança manual de status negada para inscrição ${id}`);
    return; // evento GATEWAY ou inexistente: nada a fazer
  }

  try {
    await acao(id);
  } catch (erro) {
    if (!(erro instanceof TransicaoInvalidaError)) throw erro;
    console.warn(erro.message); // corrida rara; botões são condicionais
  }
  revalidatePath("/admin/inscricoes");
}

export async function confirmarInscricaoAction(id: string): Promise<void> {
  await mudarStatusManual(id, confirmarInscricao);
}

export async function cancelarInscricaoAction(id: string): Promise<void> {
  await mudarStatusManual(id, cancelarInscricao);
}

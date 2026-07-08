"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { solicitarLinkConsulta } from "@/services/consulta.service";
import { iniciarPagamento } from "@/services/pagamento.service";

/** "Pagar depois": manda o link de consulta pro email da inscrição. */
export async function reenviarLinkAction(inscricaoId: string): Promise<void> {
  const inscricao = await prisma.inscricao.findUnique({
    where: { id: inscricaoId },
    select: { email: true },
  });
  if (inscricao) {
    try {
      await solicitarLinkConsulta(inscricao.email);
    } catch (erro) {
      console.error("Falha ao reenviar link de consulta:", erro);
    }
  }
  revalidatePath(`/pagamento/${inscricaoId}`);
}

/** Gera uma nova tentativa de Pix (código anterior expirou/falhou). */
export async function regerarPixAction(inscricaoId: string): Promise<void> {
  try {
    await iniciarPagamento({ inscricaoId, metodo: "pix" });
  } catch (erro) {
    console.error("Erro ao regerar Pix:", erro);
  }
  revalidatePath(`/pagamento/${inscricaoId}`);
}

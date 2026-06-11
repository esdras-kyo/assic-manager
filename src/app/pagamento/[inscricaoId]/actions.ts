"use server";

import { revalidatePath } from "next/cache";

import { iniciarPagamento } from "@/services/pagamento.service";

/** Gera uma nova tentativa de Pix (código anterior expirou/falhou). */
export async function regerarPixAction(inscricaoId: string): Promise<void> {
  try {
    await iniciarPagamento({ inscricaoId, metodo: "pix" });
  } catch (erro) {
    console.error("Erro ao regerar Pix:", erro);
  }
  revalidatePath(`/pagamento/${inscricaoId}`);
}

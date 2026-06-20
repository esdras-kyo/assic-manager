"use server";

import { revalidatePath } from "next/cache";

import { exigirAdmin } from "@/lib/auth";
import { TransicaoInvalidaError } from "@/services/inscricao-maquina";
import {
  cancelarInscricao,
  confirmarInscricao,
} from "@/services/inscricao.service";

export async function confirmarInscricaoAction(id: string): Promise<void> {
  await exigirAdmin();
  try {
    await confirmarInscricao(id);
  } catch (erro) {
    if (!(erro instanceof TransicaoInvalidaError)) throw erro;
    console.warn(erro.message); // corrida rara; botões são condicionais
  }
  revalidatePath("/admin/inscricoes");
}

export async function cancelarInscricaoAction(id: string): Promise<void> {
  await exigirAdmin();
  try {
    await cancelarInscricao(id);
  } catch (erro) {
    if (!(erro instanceof TransicaoInvalidaError)) throw erro;
    console.warn(erro.message);
  }
  revalidatePath("/admin/inscricoes");
}

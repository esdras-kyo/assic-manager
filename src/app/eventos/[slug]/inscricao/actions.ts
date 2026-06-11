"use server";

import { redirect } from "next/navigation";

import { inscricaoCreateSchema } from "@/lib/validations";
import { EventoNaoEncontradoError } from "@/services/evento.service";
import {
  criarInscricao,
  EventoNaoAbertoError,
  SemVagasError,
} from "@/services/inscricao.service";
import { iniciarPagamento } from "@/services/pagamento.service";

export interface InscricaoFormState {
  erros?: Record<string, string[]>;
  mensagem?: string;
  /** Eco dos valores digitados — o formulário não perde o que a pessoa preencheu. */
  valores?: Record<string, string>;
}

export async function criarInscricaoEPagarAction(
  _prevState: InscricaoFormState | undefined,
  formData: FormData,
): Promise<InscricaoFormState | undefined> {
  const valores = {
    eventoId: String(formData.get("eventoId") ?? ""),
    nome: String(formData.get("nome") ?? ""),
    email: String(formData.get("email") ?? ""),
    celular: String(formData.get("celular") ?? ""),
    documento: String(formData.get("documento") ?? ""),
  };

  const parsed = inscricaoCreateSchema.safeParse(valores);
  if (!parsed.success) {
    const erros: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const campo = String(issue.path[0] ?? "form");
      (erros[campo] ??= []).push(issue.message);
    }
    return { erros, valores };
  }

  let inscricaoId: string;
  try {
    const inscricao = await criarInscricao(parsed.data);
    inscricaoId = inscricao.id;
    await iniciarPagamento({ inscricaoId, metodo: "pix" });
  } catch (erro) {
    if (erro instanceof SemVagasError) {
      return { mensagem: erro.message, valores };
    }
    if (
      erro instanceof EventoNaoAbertoError ||
      erro instanceof EventoNaoEncontradoError
    ) {
      return {
        mensagem: "Este evento não está mais recebendo inscrições.",
        valores,
      };
    }
    console.error("Erro ao criar inscrição:", erro);
    return {
      mensagem:
        "Não conseguimos concluir sua inscrição agora. Tente novamente em instantes.",
      valores,
    };
  }

  redirect(`/pagamento/${inscricaoId}`);
}

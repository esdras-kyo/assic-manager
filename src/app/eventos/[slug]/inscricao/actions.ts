"use server";

import { redirect } from "next/navigation";

import {
  construirSchemaCampos,
  inscricaoCreateSchema,
  type CampoPersonalizado,
} from "@/lib/validations";
import {
  buscarEventoPorId,
  EventoNaoEncontradoError,
} from "@/services/evento.service";
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

const CAMPOS_NUCLEO = ["nome", "email", "celular", "documento"] as const;

export async function criarInscricaoEPagarAction(
  _prevState: InscricaoFormState | undefined,
  formData: FormData,
): Promise<InscricaoFormState | undefined> {
  const eventoId = String(formData.get("eventoId") ?? "");

  const evento = await buscarEventoPorId(eventoId);
  const campos = (evento?.camposPersonalizados ?? []) as CampoPersonalizado[];

  // Eco de TODOS os valores digitados (núcleo + dinâmicos) para não perder nada.
  const valores: Record<string, string> = { eventoId };
  for (const c of CAMPOS_NUCLEO) valores[c] = String(formData.get(c) ?? "");
  for (const campo of campos) {
    valores[campo.id] = String(formData.get(campo.id) ?? "");
  }

  if (!evento) {
    return {
      mensagem: "Este evento não está mais recebendo inscrições.",
      valores,
    };
  }

  // Validação do núcleo.
  const parsedNucleo = inscricaoCreateSchema.safeParse({
    eventoId,
    nome: valores.nome,
    email: valores.email,
    celular: valores.celular,
    documento: valores.documento || undefined,
  });

  // Validação dos campos dinâmicos.
  const valoresCampos: Record<string, string> = {};
  for (const campo of campos) valoresCampos[campo.id] = valores[campo.id];
  const parsedCampos = construirSchemaCampos(campos).safeParse(valoresCampos);

  if (!parsedNucleo.success || !parsedCampos.success) {
    const erros: Record<string, string[]> = {};
    if (!parsedNucleo.success) {
      for (const issue of parsedNucleo.error.issues) {
        const campo = String(issue.path[0] ?? "form");
        (erros[campo] ??= []).push(issue.message);
      }
    }
    if (!parsedCampos.success) {
      for (const issue of parsedCampos.error.issues) {
        const campo = String(issue.path[0] ?? "form");
        (erros[campo] ??= []).push(issue.message);
      }
    }
    return { erros, valores };
  }

  let inscricaoId: string;
  try {
    const inscricao = await criarInscricao({
      ...parsedNucleo.data,
      camposExtras: parsedCampos.data as Record<string, unknown>,
    });
    inscricaoId = inscricao.id;

    // Ramo de pagamento: só GATEWAY gera Pix automático.
    if (evento.modalidadePagamento === "GATEWAY") {
      await iniciarPagamento({ inscricaoId, metodo: "pix" });
    }
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

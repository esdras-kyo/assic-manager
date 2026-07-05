"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { exigirAdmin } from "@/lib/auth";
import { inputLocalParaData, reaisParaCentavos } from "@/lib/formatadores";
import type { PixManual } from "@/lib/validations";
import {
  atualizarEvento,
  cancelarEvento,
  criarEvento,
  encerrarEvento,
  publicarEvento,
  SlugEmUsoError,
  TransicaoEventoInvalidaError,
} from "@/services/evento.service";

export interface EventoFormState {
  erros?: Record<string, string[]>;
  mensagem?: string;
  valores?: Record<string, string>;
}

function lerCampos(formData: FormData): Record<string, string> {
  const campos = [
    "id",
    "nome",
    "slug",
    "descricao",
    "inclui",
    "local",
    "dataInicio",
    "dataFim",
    "precoReais",
    "vagas",
    "modalidadePagamento",
    "pixChave",
    "pixTipoChave",
    "pixBeneficiario",
    "pixInstrucoes",
  ];
  return Object.fromEntries(
    campos.map((c) => [c, String(formData.get(c) ?? "").trim()]),
  );
}

export async function salvarEventoAction(
  _prev: EventoFormState | undefined,
  formData: FormData,
): Promise<EventoFormState | undefined> {
  await exigirAdmin();

  const v = lerCampos(formData);
  const erros: Record<string, string[]> = {};

  const precoEmCentavos = reaisParaCentavos(v.precoReais);
  if (precoEmCentavos === null) {
    erros.precoReais = [
      "Informe um preço válido, como 50,00 (use 0 p/ gratuito)",
    ];
  }

  const dataInicio = inputLocalParaData(v.dataInicio);
  if (!dataInicio) erros.dataInicio = ["Informe a data e hora de início"];

  let dataFim: Date | undefined;
  if (v.dataFim) {
    const parsed = inputLocalParaData(v.dataFim);
    if (!parsed) erros.dataFim = ["Data de fim inválida"];
    else dataFim = parsed;
  }

  let vagas: number | undefined;
  if (v.vagas) {
    const n = Number(v.vagas);
    if (!Number.isInteger(n) || n <= 0) {
      erros.vagas = ["Vagas deve ser um número inteiro maior que zero"];
    } else {
      vagas = n;
    }
  }

  const modalidadePagamento: "MANUAL" | "GATEWAY" =
    v.modalidadePagamento === "MANUAL" ? "MANUAL" : "GATEWAY";

  let pixManual: PixManual | undefined;
  if (modalidadePagamento === "MANUAL") {
    if (!v.pixChave) erros.pixChave = ["Informe a chave PIX"];
    if (!v.pixBeneficiario) erros.pixBeneficiario = ["Informe o beneficiário"];
    const TIPOS_VALIDOS = [
      "cnpj",
      "cpf",
      "email",
      "telefone",
      "aleatoria",
    ] as const;
    type TipoChave = (typeof TIPOS_VALIDOS)[number];
    const tipoChave: TipoChave = TIPOS_VALIDOS.includes(
      v.pixTipoChave as TipoChave,
    )
      ? (v.pixTipoChave as TipoChave)
      : "cnpj";
    pixManual = {
      chave: v.pixChave,
      tipoChave,
      beneficiario: v.pixBeneficiario,
      ...(v.pixInstrucoes && { instrucoes: v.pixInstrucoes }),
    };
  }

  if (Object.keys(erros).length > 0) return { erros, valores: v };

  const input = {
    nome: v.nome,
    slug: v.slug,
    descricao: v.descricao || undefined,
    inclui: v.inclui || undefined,
    local: v.local,
    dataInicio: dataInicio!,
    dataFim,
    precoEmCentavos: precoEmCentavos!,
    vagas,
    modalidadePagamento,
    pixManual,
  };

  try {
    if (v.id) {
      await atualizarEvento(v.id, input);
    } else {
      await criarEvento(input);
    }
  } catch (erro) {
    if (erro instanceof SlugEmUsoError) {
      return { erros: { slug: [erro.message] }, valores: v };
    }
    if (erro && typeof erro === "object" && "issues" in erro) {
      // ZodError dos schemas de domínio
      const zodErros: Record<string, string[]> = {};
      for (const issue of (
        erro as { issues: { path: unknown[]; message: string }[] }
      ).issues) {
        const campo = String(issue.path[0] ?? "form");
        (zodErros[campo] ??= []).push(issue.message);
      }
      return { erros: zodErros, valores: v };
    }
    console.error("Erro ao salvar evento:", erro);
    return {
      mensagem: "Não foi possível salvar. Tente novamente.",
      valores: v,
    };
  }

  revalidatePath("/admin/eventos");
  revalidatePath("/eventos");
  redirect("/admin/eventos");
}

async function mudarStatusEvento(
  id: string,
  acao: (id: string) => Promise<unknown>,
): Promise<void> {
  await exigirAdmin();
  try {
    await acao(id);
  } catch (erro) {
    if (erro instanceof TransicaoEventoInvalidaError) {
      console.warn(erro.message); // botões são condicionais; corrida rara
    } else {
      throw erro;
    }
  }
  revalidatePath("/admin/eventos");
  revalidatePath("/eventos");
}

export async function publicarEventoAction(id: string): Promise<void> {
  await mudarStatusEvento(id, publicarEvento);
}

export async function encerrarEventoAction(id: string): Promise<void> {
  await mudarStatusEvento(id, encerrarEvento);
}

export async function cancelarEventoAction(id: string): Promise<void> {
  await mudarStatusEvento(id, cancelarEvento);
}

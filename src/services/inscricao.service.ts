import { prisma } from "@/lib/db";
import {
  inscricaoCreateSchema,
  type InscricaoCreateInput,
} from "@/lib/validations";
import { EventoNaoEncontradoError } from "@/services/evento.service";
import { transicionar } from "@/services/inscricao-maquina";
import type { Inscricao, InscricaoStatus } from "@/generated/prisma/client";

export class EventoNaoAbertoError extends Error {
  constructor(status: string) {
    super(`Evento não está aberto para inscrições (status: ${status})`);
    this.name = "EventoNaoAbertoError";
  }
}

export class SemVagasError extends Error {
  constructor() {
    super("As vagas deste evento já foram preenchidas");
    this.name = "SemVagasError";
  }
}

export class InscricaoNaoEncontradaError extends Error {
  constructor(id: string) {
    super(`Inscrição não encontrada: ${id}`);
    this.name = "InscricaoNaoEncontradaError";
  }
}

/** Inscrições que ocupam vaga: PENDENTE (reservada) + CONFIRMADA. */
export async function contarInscricoesAtivas(
  eventoId: string,
): Promise<number> {
  return prisma.inscricao.count({
    where: { eventoId, status: { in: ["PENDENTE", "CONFIRMADA"] } },
  });
}

export async function criarInscricao(
  input: InscricaoCreateInput,
): Promise<Inscricao> {
  const data = inscricaoCreateSchema.parse(input);

  // Transação Serializable: checagem de vagas + criação atômicas,
  // evita overbooking por corrida (volume esperado: dezenas de inscritos).
  return prisma.$transaction(
    async (tx) => {
      const evento = await tx.evento.findUnique({
        where: { id: data.eventoId },
      });
      if (!evento) throw new EventoNaoEncontradoError(data.eventoId);
      if (evento.status !== "ABERTO") {
        throw new EventoNaoAbertoError(evento.status);
      }

      if (evento.vagas !== null) {
        const ocupadas = await tx.inscricao.count({
          where: {
            eventoId: evento.id,
            status: { in: ["PENDENTE", "CONFIRMADA"] },
          },
        });
        if (ocupadas >= evento.vagas) throw new SemVagasError();
      }

      return tx.inscricao.create({
        data: {
          eventoId: data.eventoId,
          nome: data.nome,
          email: data.email,
          celular: data.celular,
          documento: data.documento ?? null,
          ...(data.camposExtras !== undefined && {
            camposExtras: data.camposExtras as object,
          }),
        },
      });
    },
    { isolationLevel: "Serializable" },
  );
}

async function mudarStatus(
  id: string,
  para: InscricaoStatus,
): Promise<Inscricao> {
  const inscricao = await prisma.inscricao.findUnique({ where: { id } });
  if (!inscricao) throw new InscricaoNaoEncontradaError(id);

  transicionar(inscricao.status, para); // lança TransicaoInvalidaError

  return prisma.inscricao.update({ where: { id }, data: { status: para } });
}

/**
 * Confirmação SÓ deve ser disparada pelo fluxo de webhook validado
 * (pagamento.service, Etapa 2) — nunca por redirect de navegador.
 */
export async function confirmarInscricao(id: string): Promise<Inscricao> {
  return mudarStatus(id, "CONFIRMADA");
}

export async function cancelarInscricao(id: string): Promise<Inscricao> {
  return mudarStatus(id, "CANCELADA");
}

/**
 * Transição manual para EXPIRADA. Sem chamador em produção hoje: o Pix
 * expirado NÃO expira mais a inscrição (ela segue PENDENTE e pagável).
 * Reservado para cancelamento/ação futura do admin.
 */
export async function expirarInscricao(id: string): Promise<Inscricao> {
  return mudarStatus(id, "EXPIRADA");
}

export async function listarInscricoesPorEvento(
  eventoId: string,
): Promise<Inscricao[]> {
  return prisma.inscricao.findMany({
    where: { eventoId },
    orderBy: { criadoEm: "desc" },
  });
}

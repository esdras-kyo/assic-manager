import { prisma } from "@/lib/db";
import {
  eventoCreateSchema,
  eventoUpdateSchema,
  type EventoCreateInput,
  type EventoUpdateInput,
} from "@/lib/validations";
import { EventoStatus, type Evento } from "@/generated/prisma/client";

// Máquina de estados do evento: RASCUNHO → ABERTO → ENCERRADO;
// RASCUNHO/ABERTO podem ser CANCELADOS. ENCERRADO e CANCELADO são terminais.
const TRANSICOES: Record<EventoStatus, readonly EventoStatus[]> = {
  RASCUNHO: ["ABERTO", "CANCELADO"],
  ABERTO: ["ENCERRADO", "CANCELADO"],
  ENCERRADO: [],
  CANCELADO: [],
};

export class EventoNaoEncontradoError extends Error {
  constructor(idOuSlug: string) {
    super(`Evento não encontrado: ${idOuSlug}`);
    this.name = "EventoNaoEncontradoError";
  }
}

export class SlugEmUsoError extends Error {
  constructor(slug: string) {
    super(`Já existe um evento com o slug "${slug}"`);
    this.name = "SlugEmUsoError";
  }
}

export class TransicaoEventoInvalidaError extends Error {
  constructor(de: EventoStatus, para: EventoStatus) {
    super(`Transição de evento inválida: ${de} → ${para}`);
    this.name = "TransicaoEventoInvalidaError";
  }
}

function ehViolacaoDeUnicidade(erro: unknown): boolean {
  return (
    typeof erro === "object" &&
    erro !== null &&
    "code" in erro &&
    (erro as { code: unknown }).code === "P2002"
  );
}

export async function criarEvento(input: EventoCreateInput): Promise<Evento> {
  const data = eventoCreateSchema.parse(input);
  try {
    return await prisma.evento.create({ data });
  } catch (erro) {
    if (ehViolacaoDeUnicidade(erro)) throw new SlugEmUsoError(data.slug);
    throw erro;
  }
}

async function buscarEventoOuFalhar(id: string): Promise<Evento> {
  const evento = await prisma.evento.findUnique({ where: { id } });
  if (!evento) throw new EventoNaoEncontradoError(id);
  return evento;
}

async function mudarStatus(id: string, para: EventoStatus): Promise<Evento> {
  const evento = await buscarEventoOuFalhar(id);
  if (!TRANSICOES[evento.status].includes(para)) {
    throw new TransicaoEventoInvalidaError(evento.status, para);
  }
  return prisma.evento.update({ where: { id }, data: { status: para } });
}

export async function publicarEvento(id: string): Promise<Evento> {
  const evento = await buscarEventoOuFalhar(id);
  if (!TRANSICOES[evento.status].includes("ABERTO")) {
    throw new TransicaoEventoInvalidaError(evento.status, "ABERTO");
  }
  if (evento.dataInicio.getTime() < Date.now()) {
    throw new Error("Não dá para publicar evento com data de início passada");
  }
  return prisma.evento.update({ where: { id }, data: { status: "ABERTO" } });
}

export async function encerrarEvento(id: string): Promise<Evento> {
  return mudarStatus(id, "ENCERRADO");
}

export async function cancelarEvento(id: string): Promise<Evento> {
  return mudarStatus(id, "CANCELADO");
}

export async function atualizarEvento(
  id: string,
  input: EventoUpdateInput,
): Promise<Evento> {
  const data = eventoUpdateSchema.parse(input);
  const existente = await buscarEventoOuFalhar(id);

  // Cruzamento data início × fim quando só um dos lados veio no update.
  const dataInicio = data.dataInicio ?? existente.dataInicio;
  const dataFim = data.dataFim ?? existente.dataFim;
  if (dataFim && dataFim < dataInicio) {
    throw new Error("Data de fim não pode ser antes da data de início");
  }

  return prisma.evento.update({ where: { id }, data });
}

export async function listarEventosAbertos(): Promise<Evento[]> {
  return prisma.evento.findMany({
    where: { status: "ABERTO" },
    orderBy: { dataInicio: "asc" },
  });
}

export async function buscarEventoPorSlug(
  slug: string,
): Promise<Evento | null> {
  return prisma.evento.findUnique({ where: { slug } });
}

import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/env";
import type { Inscricao, Evento } from "@/generated/prisma/client";
import { enviarLinkConsulta } from "@/services/email.service";

// Magic link de consulta: validade de 7 dias (planoassic — decisão de design).
const VALIDADE_MS = 7 * 24 * 60 * 60 * 1000;

/** Token opaco (sem hifens) usado na URL de consulta. */
export function gerarToken(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

/** Cria um token com escopo de email e devolve a string do token. */
export async function criarTokenConsulta(email: string): Promise<string> {
  const token = gerarToken();
  const expiraEm = new Date(Date.now() + VALIDADE_MS);
  await prisma.tokenConsulta.create({ data: { token, email, expiraEm } });
  return token;
}

/** URL absoluta da lista de inscrições para um token. */
export function montarLinkConsulta(token: string): string {
  const base = getEnv().APP_URL.replace(/\/$/, "");
  return `${base}/minhas-inscricoes/${token}`;
}

/** Resolve o token para o email dono; null se inexistente ou expirado. */
export async function resolverTokenConsulta(
  token: string,
): Promise<string | null> {
  const registro = await prisma.tokenConsulta.findUnique({ where: { token } });
  if (!registro) return null;
  if (registro.expiraEm.getTime() <= Date.now()) return null;
  return registro.email;
}

/** Inscrições visíveis na consulta: pendentes e confirmadas, com o evento. */
export async function listarInscricoesPorEmail(
  email: string,
): Promise<(Inscricao & { evento: Evento })[]> {
  return prisma.inscricao.findMany({
    where: { email, status: { in: ["PENDENTE", "CONFIRMADA"] } },
    include: { evento: true },
    orderBy: { criadoEm: "desc" },
  });
}

/**
 * Envia o link de consulta por email. Anti-enumeração: só envia se houver
 * inscrição para aquele email; a UI mostra sempre a mesma mensagem.
 */
export async function solicitarLinkConsulta(email: string): Promise<void> {
  const inscricoes = await prisma.inscricao.findMany({
    where: { email, status: { in: ["PENDENTE", "CONFIRMADA"] } },
    select: { id: true },
  });
  if (inscricoes.length === 0) return;

  const token = await criarTokenConsulta(email);
  await enviarLinkConsulta({ email, link: montarLinkConsulta(token) });
}

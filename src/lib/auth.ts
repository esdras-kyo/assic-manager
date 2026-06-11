import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getEnv } from "@/lib/env";

// Sessão admin: JWT assinado (HS256) em cookie httpOnly.
// Decisão registrada em docs/planejamento-execucao.md (Etapa 4): sem
// framework de auth — caso simples (1 organizador, email+senha), zero lock-in.

const COOKIE_SESSAO = "assic_sessao";
const DURACAO_PADRAO_SEGUNDOS = 60 * 60 * 24 * 7; // 7 dias

export interface Sessao {
  adminId: string;
}

function chave(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

/** Puro/testável: assina o token de sessão. */
export async function assinarSessao(
  sessao: Sessao,
  secret: string,
  opcoes?: { duracaoSegundos?: number },
): Promise<string> {
  const duracao = opcoes?.duracaoSegundos ?? DURACAO_PADRAO_SEGUNDOS;
  const agora = Math.floor(Date.now() / 1000);
  return new SignJWT({ adminId: sessao.adminId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(agora)
    .setExpirationTime(agora + duracao)
    .sign(chave(secret));
}

/** Puro/testável: verifica e devolve a sessão, ou null (nunca lança). */
export async function verificarSessaoToken(
  token: string,
  secret: string,
): Promise<Sessao | null> {
  try {
    const { payload } = await jwtVerify(token, chave(secret));
    if (typeof payload.adminId !== "string") return null;
    return { adminId: payload.adminId };
  } catch {
    return null;
  }
}

// ---- Camada Next (cookies) ----

export async function criarSessaoCookie(adminId: string): Promise<void> {
  const token = await assinarSessao({ adminId }, getEnv().AUTH_SECRET);
  const jarra = await cookies();
  jarra.set(COOKIE_SESSAO, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACAO_PADRAO_SEGUNDOS,
  });
}

export async function obterSessao(): Promise<Sessao | null> {
  const jarra = await cookies();
  const token = jarra.get(COOKIE_SESSAO)?.value;
  if (!token) return null;
  return verificarSessaoToken(token, getEnv().AUTH_SECRET);
}

export async function destruirSessao(): Promise<void> {
  const jarra = await cookies();
  jarra.delete(COOKIE_SESSAO);
}

/**
 * Autorização REAL — chamar no topo de TODA page/action/route admin.
 * O proxy.ts é só conveniência de redirect (server functions são
 * alcançáveis por POST direto; aviso oficial do Next).
 */
export async function exigirAdmin(): Promise<Sessao> {
  const sessao = await obterSessao();
  if (!sessao) redirect("/admin/login");
  return sessao;
}

export { COOKIE_SESSAO };

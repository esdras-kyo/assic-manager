import { jwtVerify, SignJWT } from "jose";

// Núcleo puro da sessão (sem next/headers) — usável no proxy (edge) e
// testável sem mock. A camada de cookies vive em lib/auth.ts.

export const COOKIE_SESSAO = "assic_sessao";
export const DURACAO_PADRAO_SEGUNDOS = 60 * 60 * 24 * 7; // 7 dias

export interface Sessao {
  adminId: string;
}

function chave(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

/** Assina o token de sessão. */
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

/** Verifica e devolve a sessão, ou null (nunca lança). */
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

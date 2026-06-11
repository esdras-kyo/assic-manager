import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getEnv } from "@/lib/env";
import {
  assinarSessao,
  COOKIE_SESSAO,
  DURACAO_PADRAO_SEGUNDOS,
  verificarSessaoToken,
  type Sessao,
} from "@/lib/sessao-token";

// Camada Next da sessão (cookies). Núcleo puro: lib/sessao-token.ts.
// Decisão registrada em docs/planejamento-execucao.md (Etapa 4): sessão
// própria — caso simples (1 organizador, email+senha), zero lock-in.

export { assinarSessao, verificarSessaoToken, COOKIE_SESSAO };
export type { Sessao };

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

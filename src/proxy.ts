import { NextResponse, type NextRequest } from "next/server";

import { COOKIE_SESSAO, verificarSessaoToken } from "@/lib/sessao-token";

// Checagem OTIMISTA (UX): redireciona cedo quem não tem sessão válida.
// A autorização real acontece dentro de cada page/action via exigirAdmin()
// — proxy não é solução de autorização (doc oficial do Next 16).
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") return NextResponse.next();

  const token = request.cookies.get(COOKIE_SESSAO)?.value;
  const sessao = token
    ? await verificarSessaoToken(token, process.env.AUTH_SECRET ?? "")
    : null;

  if (!sessao) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

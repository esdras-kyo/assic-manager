import { NextResponse } from "next/server";

import { obterSessao } from "@/lib/auth";
import { gerarCsv } from "@/lib/csv";
import { prisma } from "@/lib/db";
import { formatarPrecoBRL } from "@/lib/formatadores";
import type { InscricaoStatus } from "@/generated/prisma/client";

const dataCurta = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export async function GET(request: Request) {
  // Download autenticado: sem sessão é 401, não redirect.
  if (!(await obterSessao())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const eventoId = url.searchParams.get("evento") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;

  const inscricoes = await prisma.inscricao.findMany({
    where: {
      ...(eventoId && { eventoId }),
      ...(status && { status: status as InscricaoStatus }),
    },
    include: {
      evento: { select: { nome: true } },
      pagamentos: { orderBy: { criadoEm: "desc" }, take: 1 },
    },
    orderBy: { criadoEm: "desc" },
  });

  const csv = gerarCsv(
    [
      "Nome",
      "Email",
      "Celular",
      "CPF",
      "Evento",
      "Situação",
      "Pagamento",
      "Valor",
      "Inscrito em",
    ],
    inscricoes.map((i) => [
      i.nome,
      i.email,
      i.celular,
      i.documento ?? "",
      i.evento.nome,
      i.status,
      i.pagamentos[0]?.status ?? "",
      i.pagamentos[0] ? formatarPrecoBRL(i.pagamentos[0].amountInCents) : "",
      dataCurta.format(i.criadoEm),
    ]),
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inscricoes-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

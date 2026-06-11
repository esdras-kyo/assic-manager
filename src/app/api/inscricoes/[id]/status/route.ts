import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

// Polling da tela de pagamento. Devolve SÓ status — nunca dados pessoais (§6).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const inscricao = await prisma.inscricao.findUnique({
    where: { id },
    include: {
      pagamentos: { orderBy: { criadoEm: "desc" }, take: 1 },
    },
  });
  if (!inscricao) {
    return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
  }

  return NextResponse.json({
    inscricao: inscricao.status,
    pagamento: inscricao.pagamentos[0]?.status ?? null,
  });
}

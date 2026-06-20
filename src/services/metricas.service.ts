import { prisma } from "@/lib/db";

export interface Metricas {
  eventosAbertos: number;
  inscricoesConfirmadas: number;
  inscricoesPendentes: number;
  /** Soma dos pagamentos PAID — sempre centavos. */
  receitaCentavos: number;
}

export async function obterMetricas(): Promise<Metricas> {
  const [
    eventosAbertos,
    inscricoesConfirmadas,
    inscricoesPendentes,
    receitaGateway,
    confirmadasManuais,
  ] = await Promise.all([
    prisma.evento.count({ where: { status: "ABERTO" } }),
    prisma.inscricao.count({ where: { status: "CONFIRMADA" } }),
    prisma.inscricao.count({ where: { status: "PENDENTE" } }),
    prisma.pagamento.aggregate({
      _sum: { amountInCents: true },
      where: { status: "PAID" },
    }),
    // Eventos manuais não geram Pagamento: receita = confirmadas × preço.
    prisma.inscricao.findMany({
      where: {
        status: "CONFIRMADA",
        evento: { modalidadePagamento: "MANUAL" },
      },
      select: { evento: { select: { precoEmCentavos: true } } },
    }),
  ]);

  const receitaManual = confirmadasManuais.reduce(
    (soma, i) => soma + i.evento.precoEmCentavos,
    0,
  );

  return {
    eventosAbertos,
    inscricoesConfirmadas,
    inscricoesPendentes,
    receitaCentavos: (receitaGateway._sum.amountInCents ?? 0) + receitaManual,
  };
}

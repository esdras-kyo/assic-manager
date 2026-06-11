import { prisma } from "@/lib/db";

export interface Metricas {
  eventosAbertos: number;
  inscricoesConfirmadas: number;
  inscricoesPendentes: number;
  /** Soma dos pagamentos PAID — sempre centavos. */
  receitaCentavos: number;
}

export async function obterMetricas(): Promise<Metricas> {
  const [eventosAbertos, inscricoesConfirmadas, inscricoesPendentes, receita] =
    await Promise.all([
      prisma.evento.count({ where: { status: "ABERTO" } }),
      prisma.inscricao.count({ where: { status: "CONFIRMADA" } }),
      prisma.inscricao.count({ where: { status: "PENDENTE" } }),
      prisma.pagamento.aggregate({
        _sum: { amountInCents: true },
        where: { status: "PAID" },
      }),
    ]);

  return {
    eventosAbertos,
    inscricoesConfirmadas,
    inscricoesPendentes,
    receitaCentavos: receita._sum.amountInCents ?? 0,
  };
}

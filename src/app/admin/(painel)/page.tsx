import type { Metadata } from "next";

import { exigirAdmin } from "@/lib/auth";
import { formatarPrecoBRL } from "@/lib/formatadores";
import { obterMetricas } from "@/services/metricas.service";

export const metadata: Metadata = { title: "Visão geral — Admin" };

export default async function AdminDashboardPage() {
  await exigirAdmin();
  const m = await obterMetricas();

  const cartoes = [
    { rotulo: "Eventos abertos", valor: String(m.eventosAbertos) },
    {
      rotulo: "Inscrições confirmadas",
      valor: String(m.inscricoesConfirmadas),
    },
    { rotulo: "Aguardando pagamento", valor: String(m.inscricoesPendentes) },
    {
      rotulo: "Receita confirmada",
      valor:
        m.receitaCentavos === 0
          ? "R$ 0,00"
          : formatarPrecoBRL(m.receitaCentavos),
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Visão geral</h1>
      <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cartoes.map((c) => (
          <div
            key={c.rotulo}
            className="rounded-xl border border-border bg-card p-5"
          >
            <dt className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              {c.rotulo}
            </dt>
            <dd className="mt-2 font-heading text-3xl font-semibold">
              {c.valor}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

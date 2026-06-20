import type { Metadata } from "next";
import { Download } from "lucide-react";

import { AcoesInscricao } from "@/components/admin/acoes-inscricao";
import { BadgeStatus } from "@/components/admin/badge-status";
import { Button } from "@/components/ui/button";
import { exigirAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { InscricaoStatus } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Inscrições — Admin" };

const STATUS_VALIDOS = [
  "PENDENTE",
  "CONFIRMADA",
  "CANCELADA",
  "EXPIRADA",
] as const;

const dataCurta = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

interface Props {
  searchParams: Promise<{ evento?: string; status?: string }>;
}

export default async function AdminInscricoesPage({ searchParams }: Props) {
  await exigirAdmin();
  const { evento: eventoId, status } = await searchParams;

  const statusFiltro = STATUS_VALIDOS.includes(status as InscricaoStatus)
    ? (status as InscricaoStatus)
    : undefined;

  const [eventos, inscricoes] = await Promise.all([
    prisma.evento.findMany({ orderBy: { dataInicio: "desc" } }),
    prisma.inscricao.findMany({
      where: {
        ...(eventoId && { eventoId }),
        ...(statusFiltro && { status: statusFiltro }),
      },
      include: {
        evento: { select: { nome: true } },
        pagamentos: { orderBy: { criadoEm: "desc" }, take: 1 },
      },
      orderBy: { criadoEm: "desc" },
    }),
  ]);

  const csvParams = new URLSearchParams();
  if (eventoId) csvParams.set("evento", eventoId);
  if (statusFiltro) csvParams.set("status", statusFiltro);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          Inscrições{" "}
          <span className="text-xl text-muted-foreground">
            ({inscricoes.length})
          </span>
        </h1>
        <Button asChild variant="outline">
          <a href={`/admin/inscricoes/csv?${csvParams.toString()}`}>
            <Download aria-hidden className="size-4.5" />
            Exportar CSV
          </a>
        </Button>
      </div>

      {/* Filtros via GET — URL compartilhável */}
      <form method="get" className="mt-6 flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <label htmlFor="evento" className="block text-sm font-semibold">
            Evento
          </label>
          <select
            id="evento"
            name="evento"
            defaultValue={eventoId ?? ""}
            className="h-11 min-w-52 rounded-lg border border-input bg-card px-3"
          >
            <option value="">Todos</option>
            {eventos.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="status" className="block text-sm font-semibold">
            Situação
          </label>
          <select
            id="status"
            name="status"
            defaultValue={statusFiltro ?? ""}
            className="h-11 min-w-40 rounded-lg border border-input bg-card px-3"
          >
            <option value="">Todas</option>
            <option value="PENDENTE">Pendente</option>
            <option value="CONFIRMADA">Confirmada</option>
            <option value="CANCELADA">Cancelada</option>
            <option value="EXPIRADA">Expirada</option>
          </select>
        </div>
        <Button type="submit" variant="secondary" className="h-11">
          Filtrar
        </Button>
      </form>

      {inscricoes.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
          Nenhuma inscrição com esses filtros.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-200 bg-card text-left">
            <thead className="border-b border-border bg-secondary text-sm uppercase">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">Evento</th>
                <th className="px-4 py-3">Inscrição</th>
                <th className="px-4 py-3">Pagamento</th>
                <th className="px-4 py-3">Quando</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {inscricoes.map((i) => (
                <tr key={i.id} className="hover:bg-accent/30">
                  <td className="px-4 py-3 font-semibold">{i.nome}</td>
                  <td className="px-4 py-3">
                    <p>{i.email}</p>
                    <p className="text-sm text-muted-foreground">{i.celular}</p>
                  </td>
                  <td className="px-4 py-3">{i.evento.nome}</td>
                  <td className="px-4 py-3">
                    <BadgeStatus status={i.status} />
                  </td>
                  <td className="px-4 py-3">
                    {i.pagamentos[0] ? (
                      <BadgeStatus status={i.pagamentos[0].status} />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {dataCurta.format(i.criadoEm)}
                  </td>
                  <td className="px-4 py-3">
                    {i.status === "PENDENTE" ? (
                      <AcoesInscricao id={i.id} />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

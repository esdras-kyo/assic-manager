import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";

import { TabelaInscricoes } from "@/components/admin/tabela-inscricoes";
import { Button } from "@/components/ui/button";
import { exigirAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { InscricaoStatus } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Inscrições do evento — Admin" };

const STATUS_VALIDOS = [
  "PENDENTE",
  "CONFIRMADA",
  "CANCELADA",
  "EXPIRADA",
] as const;

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}

export default async function InscricoesDoEventoPage({
  params,
  searchParams,
}: Props) {
  await exigirAdmin();
  const { id } = await params;
  const { status } = await searchParams;

  const statusFiltro = STATUS_VALIDOS.includes(status as InscricaoStatus)
    ? (status as InscricaoStatus)
    : undefined;

  const evento = await prisma.evento.findUnique({ where: { id } });
  if (!evento) notFound();

  const inscricoes = await prisma.inscricao.findMany({
    where: {
      eventoId: id,
      ...(statusFiltro && { status: statusFiltro }),
    },
    include: {
      evento: { select: { nome: true, modalidadePagamento: true } },
      pagamentos: { orderBy: { criadoEm: "desc" }, take: 1 },
    },
    orderBy: { criadoEm: "desc" },
  });

  const csvParams = new URLSearchParams({ evento: id });
  if (statusFiltro) csvParams.set("status", statusFiltro);

  return (
    <div>
      <Link
        href={`/admin/eventos/${evento.id}`}
        className="inline-flex items-center gap-1 text-sm font-semibold text-primary underline-offset-4 hover:underline"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Voltar ao evento
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          Inscrições — {evento.nome}{" "}
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

      <form method="get" className="mt-6 flex flex-wrap items-end gap-4">
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
        <TabelaInscricoes inscricoes={inscricoes} mostrarEvento={false} />
      )}
    </div>
  );
}

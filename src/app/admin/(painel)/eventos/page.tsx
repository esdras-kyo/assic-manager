import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { BadgeStatus } from "@/components/admin/badge-status";
import { Button } from "@/components/ui/button";
import { exigirAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatarPrecoBRL } from "@/lib/formatadores";

export const metadata: Metadata = { title: "Eventos — Admin" };

const dataCurta = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export default async function AdminEventosPage() {
  await exigirAdmin();

  const eventos = await prisma.evento.findMany({
    orderBy: { dataInicio: "desc" },
    include: { _count: { select: { inscricoes: true } } },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Eventos</h1>
        <Button asChild>
          <Link href="/admin/eventos/novo">
            <Plus aria-hidden className="size-4.5" />
            Novo evento
          </Link>
        </Button>
      </div>

      {eventos.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
          Nenhum evento ainda. Crie o primeiro!
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-160 bg-card text-left">
            <thead className="border-b border-border bg-secondary text-sm uppercase">
              <tr>
                <th className="px-4 py-3">Evento</th>
                <th className="px-4 py-3">Quando</th>
                <th className="px-4 py-3">Preço</th>
                <th className="px-4 py-3">Inscritos</th>
                <th className="px-4 py-3">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {eventos.map((evento) => (
                <tr key={evento.id} className="hover:bg-accent/30">
                  <td className="px-4 py-3 font-semibold">
                    <Link
                      href={`/admin/eventos/${evento.id}`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {evento.nome}
                    </Link>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {dataCurta.format(evento.dataInicio)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatarPrecoBRL(evento.precoEmCentavos)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/eventos/${evento.id}/inscricoes`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {evento._count.inscricoes}
                      {evento.vagas !== null && ` / ${evento.vagas}`}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <BadgeStatus status={evento.status} />
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

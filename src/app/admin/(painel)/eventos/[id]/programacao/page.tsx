import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { FormProgramacao } from "@/components/admin/form-programacao";
import { exigirAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Conteudo } from "@/lib/validations";

export const metadata: Metadata = { title: "Programação do evento — Admin" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProgramacaoEventoPage({ params }: Props) {
  await exigirAdmin();
  const { id } = await params;

  const evento = await prisma.evento.findUnique({ where: { id } });
  if (!evento) notFound();

  const conteudo = (evento.conteudo ?? {}) as Conteudo;
  const inicial = {
    horarios: (conteudo.horarios ?? []).map((h) => ({
      dia: h.dia,
      blocos: h.blocos,
    })),
    programacao: (conteudo.programacao ?? []).map((d) => ({
      dia: d.dia,
      periodos: d.periodos.map((p) => ({
        titulo: p.titulo ?? "",
        itens: p.itens,
      })),
    })),
  };

  return (
    <div>
      <Link
        href={`/admin/eventos/${evento.id}`}
        className="inline-flex items-center gap-1 text-sm font-semibold text-primary underline-offset-4 hover:underline"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Voltar ao evento
      </Link>

      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Programação — {evento.nome}
      </h1>
      <p className="mt-2 text-muted-foreground">
        Horários e programação por dia. Textos e imagens ficam em outras telas.
      </p>

      <div className="mt-8">
        <FormProgramacao eventoId={evento.id} inicial={inicial} />
      </div>
    </div>
  );
}

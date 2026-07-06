import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { FormConteudo } from "@/components/admin/form-conteudo";
import { exigirAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Conteudo } from "@/lib/validations";

export const metadata: Metadata = { title: "Conteúdo do evento — Admin" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ConteudoEventoPage({ params }: Props) {
  await exigirAdmin();
  const { id } = await params;

  const evento = await prisma.evento.findUnique({ where: { id } });
  if (!evento) notFound();

  const conteudo = (evento.conteudo ?? {}) as Conteudo;
  const inicial = {
    subtitulo: conteudo.subtitulo ?? "",
    apresentacao: conteudo.apresentacao ?? [],
    oQueEncontrara: conteudo.oQueEncontrara ?? [],
    destaques: conteudo.destaques ?? [],
    inclui: conteudo.investimento?.inclui ?? "",
    textoFinalTitulo: conteudo.textoFinal?.titulo ?? "",
    textoFinalCorpo: conteudo.textoFinal?.corpo ?? "",
    contatos: conteudo.textoFinal?.contatos ?? [],
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
        Conteúdo da landing — {evento.nome}
      </h1>
      <p className="mt-2 text-muted-foreground">
        Textos da página do evento. Programação, horários e imagens ficam em
        outras telas.
      </p>

      <div className="mt-8">
        <FormConteudo eventoId={evento.id} inicial={inicial} />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { FormInscricao } from "@/components/eventos/form-inscricao";
import { formatarDataExtensa, formatarPrecoBRL } from "@/lib/formatadores";
import type { CampoPersonalizado } from "@/lib/validations";
import { buscarEventoPorSlug } from "@/services/evento.service";
import { contarInscricoesAtivas } from "@/services/inscricao.service";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const evento = await buscarEventoPorSlug(slug);
  return { title: evento ? `Inscrição — ${evento.nome}` : "Inscrição" };
}

export default async function InscricaoPage({ params }: Props) {
  const { slug } = await params;
  const evento = await buscarEventoPorSlug(slug);
  if (!evento || evento.status === "RASCUNHO") notFound();

  // Evento que não recebe mais inscrição volta para a landing (lá tem o aviso).
  if (evento.status !== "ABERTO") redirect(`/eventos/${evento.slug}`);
  if (evento.vagas !== null) {
    const ativas = await contarInscricoesAtivas(evento.id);
    if (ativas >= evento.vagas) redirect(`/eventos/${evento.slug}`);
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Sua inscrição
      </h1>

      {/* Resumo do que está sendo comprado — sempre visível antes do form. */}
      <div className="mt-6 rounded-xl border border-border bg-secondary p-5">
        <p className="text-xl font-bold">{evento.nome}</p>
        <p className="mt-1 text-muted-foreground first-letter:uppercase">
          {formatarDataExtensa(evento.dataInicio)}
        </p>
        <p className="mt-1 text-lg font-bold text-primary">
          {formatarPrecoBRL(evento.precoEmCentavos)}
        </p>
      </div>

      <div className="mt-10">
        <FormInscricao
          eventoId={evento.id}
          campos={(evento.camposPersonalizados ?? []) as CampoPersonalizado[]}
        />
      </div>
    </div>
  );
}

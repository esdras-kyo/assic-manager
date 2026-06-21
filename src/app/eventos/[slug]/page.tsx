import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  CircleAlert,
  MapPin,
  Ticket,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { LandingEvento } from "@/components/eventos/landing-evento";
import { formatarDataExtensa, formatarPrecoBRL } from "@/lib/formatadores";
import type { Conteudo } from "@/lib/validations";
import { buscarEventoPorSlug } from "@/services/evento.service";
import { contarInscricoesAtivas } from "@/services/inscricao.service";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const evento = await buscarEventoPorSlug(slug);
  if (!evento) return { title: "Evento não encontrado" };
  return { title: evento.nome, description: evento.descricao ?? undefined };
}

export default async function EventoPage({ params }: Props) {
  const { slug } = await params;
  const evento = await buscarEventoPorSlug(slug);
  // Rascunho não é público.
  if (!evento || evento.status === "RASCUNHO") notFound();

  const encerrado =
    evento.status === "ENCERRADO" || evento.status === "CANCELADO";

  let vagasRestantes: number | null = null;
  if (!encerrado && evento.vagas !== null) {
    const ativas = await contarInscricoesAtivas(evento.id);
    vagasRestantes = Math.max(0, evento.vagas - ativas);
  }
  const esgotado = vagasRestantes === 0;
  const podeInscrever = !encerrado && !esgotado;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="font-semibold tracking-wide text-primary uppercase">
        Evento
      </p>
      <h1 className="mt-2 text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
        {evento.nome}
      </h1>

      <dl className="mt-8 space-y-4 text-lg">
        <div className="flex items-start gap-4">
          <dt className="mt-0.5">
            <CalendarDays aria-hidden className="size-6 text-primary" />
            <span className="sr-only">Data</span>
          </dt>
          <dd className="first-letter:uppercase">
            {formatarDataExtensa(evento.dataInicio)}
          </dd>
        </div>
        <div className="flex items-start gap-4">
          <dt className="mt-0.5">
            <MapPin aria-hidden className="size-6 text-primary" />
            <span className="sr-only">Local</span>
          </dt>
          <dd>{evento.local}</dd>
        </div>
        <div className="flex items-start gap-4">
          <dt className="mt-0.5">
            <Ticket aria-hidden className="size-6 text-primary" />
            <span className="sr-only">Valor</span>
          </dt>
          <dd className="font-bold">
            {formatarPrecoBRL(evento.precoEmCentavos)}
          </dd>
        </div>
        {vagasRestantes !== null && vagasRestantes > 0 && (
          <div className="flex items-start gap-4">
            <dt className="mt-0.5">
              <Users aria-hidden className="size-6 text-primary" />
              <span className="sr-only">Vagas</span>
            </dt>
            <dd>
              {vagasRestantes === 1
                ? "Última vaga!"
                : `${vagasRestantes} vagas restantes`}
            </dd>
          </div>
        )}
      </dl>

      {evento.conteudo ? (
        <div className="mt-10">
          <LandingEvento conteudo={evento.conteudo as Conteudo} />
        </div>
      ) : (
        evento.descricao && (
          <p className="mt-8 text-lg leading-relaxed whitespace-pre-line text-muted-foreground">
            {evento.descricao}
          </p>
        )
      )}

      <div className="mt-10">
        {podeInscrever ? (
          <Button
            asChild
            size="lg"
            className="h-14 w-full text-lg sm:w-auto sm:px-10"
          >
            <Link href={`/eventos/${evento.slug}/inscricao`}>
              Quero me inscrever
              <ArrowRight aria-hidden className="size-5" />
            </Link>
          </Button>
        ) : (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-border bg-secondary p-5 text-lg"
          >
            <CircleAlert
              aria-hidden
              className="mt-0.5 size-6 shrink-0 text-muted-foreground"
            />
            <p>
              {evento.status === "CANCELADO"
                ? "Este evento foi cancelado."
                : esgotado
                  ? "As vagas deste evento já foram preenchidas."
                  : "As inscrições deste evento já foram encerradas."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

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
import { ImagemEvento } from "@/components/eventos/imagem-evento";
import { LandingEvento } from "@/components/eventos/landing-evento";
import { formatarPeriodoEvento, formatarPrecoBRL } from "@/lib/formatadores";
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

  const conteudo = evento.conteudo as Conteudo | null;

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
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      {/* -mx-4 sm:mx-0: capa full-bleed (parede a parede) no mobile; hero contido no desktop. */}
      {conteudo?.imagemCapa && (
        <div className="relative -mx-4 mb-10 sm:mx-0">
          {/* glow azul sutil atrás da capa (só desktop; no mobile a capa sangra até a borda) */}
          <div
            aria-hidden
            className="absolute -inset-3 -z-10 hidden rounded-[2rem] bg-primary/10 blur-2xl sm:block"
          />
          <ImagemEvento
            src={conteudo.imagemCapa}
            alt={`Capa do evento ${evento.nome}`}
            eager
            className="aspect-[1600/872] w-full rounded-none shadow-sm ring-0 sm:rounded-2xl sm:ring-1 sm:ring-primary/15"
          />
        </div>
      )}

      {/* Coluna de leitura mais estreita que a capa: conforto de leitura
          (público idoso), enquanto a capa hero ocupa a largura cheia. */}
      <div className="mx-auto max-w-3xl">
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
              {formatarPeriodoEvento(evento.dataInicio, evento.dataFim)}
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
            <dd>
              <span className="font-bold">
                {formatarPrecoBRL(evento.precoEmCentavos)}
              </span>
              {evento.inclui && (
                <span className="mt-1 block text-sm font-normal text-muted-foreground">
                  {evento.inclui}
                </span>
              )}
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

        {conteudo ? (
          <div className="mt-10">
            <LandingEvento conteudo={conteudo} />
          </div>
        ) : (
          evento.descricao && (
            <p className="mt-8 text-xl leading-relaxed whitespace-pre-line text-muted-foreground sm:text-2xl">
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
    </div>
  );
}

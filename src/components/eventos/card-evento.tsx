import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";

import { ImagemEvento } from "@/components/eventos/imagem-evento";
import { Button } from "@/components/ui/button";
import { formatarDataExtensa, formatarPrecoBRL } from "@/lib/formatadores";
import type { Conteudo } from "@/lib/validations";
import type { Evento } from "@/generated/prisma/client";

export function CardEvento({ evento }: { evento: Evento }) {
  const conteudo = evento.conteudo as Conteudo | null;

  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[16/9] overflow-hidden">
        <ImagemEvento
          src={conteudo?.imagemCapa}
          alt={`Capa do evento ${evento.nome}`}
          className="size-full transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
        />
        <p className="absolute top-4 right-4 rounded-full bg-accent/95 px-4 py-1.5 text-lg font-bold text-accent-foreground shadow-sm backdrop-blur">
          {formatarPrecoBRL(evento.precoEmCentavos)}
        </p>
      </div>

      <div className="flex flex-col gap-5 p-6 sm:p-8">
        <h3 className="text-2xl font-semibold tracking-tight">{evento.nome}</h3>

        <dl className="space-y-2 text-muted-foreground">
          <div className="flex items-center gap-3">
            <dt>
              <CalendarDays aria-hidden className="size-5 shrink-0" />
              <span className="sr-only">Data</span>
            </dt>
            <dd className="first-letter:uppercase">
              {formatarDataExtensa(evento.dataInicio)}
            </dd>
          </div>
          <div className="flex items-center gap-3">
            <dt>
              <MapPin aria-hidden className="size-5 shrink-0" />
              <span className="sr-only">Local</span>
            </dt>
            <dd>{evento.local}</dd>
          </div>
        </dl>

        <Button asChild size="lg" className="h-13 w-full text-lg sm:w-auto">
          <Link href={`/eventos/${evento.slug}`}>
            Ver evento e se inscrever
            <ArrowRight aria-hidden className="size-5" />
          </Link>
        </Button>
      </div>
    </article>
  );
}

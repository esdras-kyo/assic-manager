import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatarDataExtensa, formatarPrecoBRL } from "@/lib/formatadores";
import type { Evento } from "@/generated/prisma/client";

export function CardEvento({ evento }: { evento: Evento }) {
  return (
    <article className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-2xl font-semibold tracking-tight">{evento.nome}</h3>
        <p className="rounded-full bg-accent px-4 py-1.5 text-lg font-bold text-accent-foreground">
          {formatarPrecoBRL(evento.precoEmCentavos)}
        </p>
      </div>

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
    </article>
  );
}

import type { Metadata } from "next";
import { CalendarX2 } from "lucide-react";

import { CardEvento } from "@/components/eventos/card-evento";
import { listarEventosAbertos } from "@/services/evento.service";

export const metadata: Metadata = {
  title: "Eventos abertos",
  description: "Veja os próximos eventos com inscrições abertas.",
};

// Sem isto o Next congela a listagem no build — evento publicado depois
// nunca apareceria. A lista deve sempre refletir o banco.
export const dynamic = "force-dynamic";

export default async function EventosPage() {
  const eventos = await listarEventosAbertos();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Eventos abertos</h1>
      <p className="mt-3 text-xl text-muted-foreground">
        Escolha um evento para ver os detalhes e se inscrever.
      </p>

      {eventos.length === 0 ? (
        <div className="mt-12 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <CalendarX2 aria-hidden className="size-12 text-muted-foreground" />
          <p className="text-xl font-semibold">
            Nenhum evento aberto no momento
          </p>
          <p className="max-w-sm text-muted-foreground">
            Assim que abrirmos as inscrições do próximo evento, ele aparece
            aqui. Volte em breve!
          </p>
        </div>
      ) : (
        <div className="mt-10 space-y-6">
          {eventos.map((evento) => (
            <CardEvento key={evento.id} evento={evento} />
          ))}
        </div>
      )}
    </div>
  );
}

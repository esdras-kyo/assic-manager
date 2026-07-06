import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CalendarDays, MapPin } from "lucide-react";

import { SucessoAnimado } from "@/components/eventos/sucesso-animado";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { formatarPeriodoEvento } from "@/lib/formatadores";

export const metadata: Metadata = { title: "Inscrição confirmada" };

interface Props {
  params: Promise<{ inscricaoId: string }>;
}

export default async function SucessoPage({ params }: Props) {
  const { inscricaoId } = await params;

  const inscricao = await prisma.inscricao.findUnique({
    where: { id: inscricaoId },
    include: { evento: true },
  });
  if (!inscricao) notFound();

  // Sucesso só existe com confirmação real (webhook) — nunca por URL (§4.5.2).
  if (inscricao.status !== "CONFIRMADA") {
    redirect(`/pagamento/${inscricaoId}`);
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-16 sm:px-6 sm:py-24">
      <SucessoAnimado>
        <h1 className="text-4xl font-semibold tracking-tight text-success">
          Inscrição confirmada!
        </h1>
        <p className="mt-4 text-xl leading-relaxed">
          Pronto, {inscricao.nome.split(" ")[0]}! Sua vaga no evento está
          garantida.
        </p>

        <div className="mt-8 rounded-xl border border-border bg-card p-6 text-left">
          <p className="text-2xl font-bold">{inscricao.evento.nome}</p>
          <div className="mt-4 space-y-2 text-lg text-muted-foreground">
            <p className="flex items-center gap-3">
              <CalendarDays
                aria-hidden
                className="size-5 shrink-0 text-primary"
              />
              <span className="first-letter:uppercase">
                {formatarPeriodoEvento(
                  inscricao.evento.dataInicio,
                  inscricao.evento.dataFim,
                )}
              </span>
            </p>
            <p className="flex items-center gap-3">
              <MapPin aria-hidden className="size-5 shrink-0 text-primary" />
              {inscricao.evento.local}
            </p>
          </div>
        </div>

        <p className="mt-6 text-lg text-muted-foreground">
          Enviamos a confirmação para <strong>{inscricao.email}</strong>. Não
          encontrou? Confira a caixa de <strong>spam</strong> ou lixo
          eletrônico.
        </p>

        <Button
          asChild
          size="lg"
          variant="outline"
          className="mt-10 h-13 text-lg"
        >
          <Link href="/eventos">Ver outros eventos</Link>
        </Button>
      </SucessoAnimado>
    </div>
  );
}

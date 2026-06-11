import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Clock } from "lucide-react";

import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Aguardando confirmação" };

interface Props {
  params: Promise<{ inscricaoId: string }>;
}

/**
 * Tela de retorno "ainda processando" (ex.: volta do checkout de cartão na
 * Etapa 5). A confirmação real continua vindo só do webhook.
 */
export default async function PendentePage({ params }: Props) {
  const { inscricaoId } = await params;

  const inscricao = await prisma.inscricao.findUnique({
    where: { id: inscricaoId },
  });
  if (!inscricao) notFound();
  if (inscricao.status === "CONFIRMADA") {
    redirect(`/pagamento/${inscricaoId}/sucesso`);
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24">
      <div className="flex size-24 items-center justify-center rounded-full bg-warning/20">
        <Clock aria-hidden className="size-12 text-warning-foreground" />
      </div>
      <h1 className="mt-8 text-4xl font-semibold tracking-tight">
        Estamos confirmando seu pagamento
      </h1>
      <p className="mt-4 max-w-md text-xl leading-relaxed text-muted-foreground">
        Isso pode levar alguns instantes. Você pode voltar à tela de pagamento
        para acompanhar — ela atualiza sozinha.
      </p>
      <Link
        href={`/pagamento/${inscricaoId}`}
        className="mt-10 text-lg font-semibold text-primary underline underline-offset-4"
      >
        Voltar para a tela de pagamento
      </Link>
    </div>
  );
}

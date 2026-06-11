import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CircleX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Pagamento não concluído" };

interface Props {
  params: Promise<{ inscricaoId: string }>;
}

export default async function FalhaPage({ params }: Props) {
  const { inscricaoId } = await params;

  const inscricao = await prisma.inscricao.findUnique({
    where: { id: inscricaoId },
    include: { evento: true },
  });
  if (!inscricao) notFound();
  if (inscricao.status === "CONFIRMADA") {
    redirect(`/pagamento/${inscricaoId}/sucesso`);
  }

  const podeTentarDeNovo = inscricao.status === "PENDENTE";

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24">
      <div className="flex size-24 items-center justify-center rounded-full bg-destructive/15">
        <CircleX aria-hidden className="size-12 text-destructive" />
      </div>
      <h1 className="mt-8 text-4xl font-semibold tracking-tight">
        O pagamento não foi concluído
      </h1>
      <p className="mt-4 max-w-md text-xl leading-relaxed text-muted-foreground">
        {podeTentarDeNovo
          ? "Não se preocupe: sua vaga ainda está reservada. Você pode tentar pagar de novo."
          : "Esta inscrição não está mais ativa. Se quiser participar, faça uma nova inscrição."}
      </p>
      {podeTentarDeNovo ? (
        <Button asChild size="lg" className="mt-10 h-14 px-8 text-lg">
          <Link href={`/pagamento/${inscricaoId}`}>Tentar pagar de novo</Link>
        </Button>
      ) : (
        <Button asChild size="lg" className="mt-10 h-14 px-8 text-lg">
          <Link href={`/eventos/${inscricao.evento.slug}`}>
            Ver o evento e se inscrever de novo
          </Link>
        </Button>
      )}
    </div>
  );
}

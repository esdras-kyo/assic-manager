import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CircleAlert, RotateCcw } from "lucide-react";

import { regerarPixAction } from "@/app/pagamento/[inscricaoId]/actions";
import { PixManualPainel } from "@/components/eventos/pix-manual-painel";
import { PixPainel } from "@/components/eventos/pix-painel";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { formatarPrecoBRL } from "@/lib/formatadores";
import type { PixManual } from "@/lib/validations";

export const metadata: Metadata = { title: "Pagamento" };

interface Props {
  params: Promise<{ inscricaoId: string }>;
}

export default async function PagamentoPage({ params }: Props) {
  const { inscricaoId } = await params;

  const inscricao = await prisma.inscricao.findUnique({
    where: { id: inscricaoId },
    include: {
      evento: true,
      pagamentos: { orderBy: { criadoEm: "desc" }, take: 1 },
    },
  });
  if (!inscricao) notFound();

  // Verdade do servidor: confirmada vai direto para o sucesso.
  if (inscricao.status === "CONFIRMADA") {
    redirect(`/pagamento/${inscricaoId}/sucesso`);
  }
  if (inscricao.status !== "PENDENTE") {
    redirect(`/pagamento/${inscricaoId}/falha`);
  }

  // Evento com pagamento MANUAL: mostra chave fixa, sem gateway/polling.
  if (inscricao.evento.modalidadePagamento === "MANUAL") {
    const pix = inscricao.evento.pixManual as PixManual | null;
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Pagamento via Pix
        </h1>
        <div className="mt-6 rounded-xl border border-border bg-secondary">
          <div className="p-5">
            <p className="text-xl font-bold">{inscricao.evento.nome}</p>
            <p className="mt-1 text-muted-foreground">
              Inscrição de {inscricao.nome.split(" ")[0]}
            </p>
            <p className="mt-2 text-2xl font-bold text-primary">
              {formatarPrecoBRL(inscricao.evento.precoEmCentavos)}
            </p>
          </div>
        </div>
        <div className="mt-10">
          {pix ? (
            <PixManualPainel pix={pix} />
          ) : (
            <p className="text-lg text-muted-foreground">
              A chave PIX deste evento ainda não foi configurada. Fale com a
              organização.
            </p>
          )}
        </div>
        <p className="mt-10 text-center">
          <Link
            href={`/eventos/${inscricao.evento.slug}`}
            className="font-semibold text-primary underline underline-offset-4"
          >
            Voltar para a página do evento
          </Link>
        </p>
      </div>
    );
  }

  const pagamento = inscricao.pagamentos[0];
  const pixAtivo =
    pagamento?.status === "PENDING" &&
    pagamento.pixQrCode &&
    (!pagamento.pixExpiresAt || pagamento.pixExpiresAt > new Date());

  const regerarComId = regerarPixAction.bind(null, inscricao.id);

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Pagamento via Pix
      </h1>

      <div className="mt-6 rounded-xl border border-border bg-secondary">
        <div className="p-5">
          <p className="text-xl font-bold">{inscricao.evento.nome}</p>
          <p className="mt-1 text-muted-foreground">
            Inscrição de {inscricao.nome.split(" ")[0]}
          </p>
          <p className="mt-2 text-2xl font-bold text-primary">
            {formatarPrecoBRL(
              pagamento?.amountInCents ?? inscricao.evento.precoEmCentavos,
            )}
          </p>
        </div>
      </div>

      <div className="mt-10">
        {pixAtivo ? (
          <PixPainel
            inscricaoId={inscricao.id}
            qrCode={pagamento.pixQrCode!}
            mostrarTriggerDev={process.env.NODE_ENV !== "production"}
          />
        ) : (
          <div className="space-y-6">
            <div
              role="status"
              className="flex items-start gap-3 rounded-xl border border-border bg-secondary p-5 text-lg"
            >
              <CircleAlert
                aria-hidden
                className="mt-0.5 size-6 shrink-0 text-muted-foreground"
              />
              <p>
                {pagamento
                  ? "Este código Pix não está mais válido. Gere um novo para continuar."
                  : "Sua inscrição está reservada. Gere o código Pix para pagar."}
              </p>
            </div>
            <form action={regerarComId}>
              <Button type="submit" size="lg" className="h-14 w-full text-lg">
                <RotateCcw aria-hidden className="size-5" />
                {pagamento ? "Gerar novo código Pix" : "Gerar código Pix"}
              </Button>
            </form>
          </div>
        )}
      </div>

      <p className="mt-10 text-center">
        <Link
          href={`/eventos/${inscricao.evento.slug}`}
          className="font-semibold text-primary underline underline-offset-4"
        >
          Voltar para a página do evento
        </Link>
      </p>
    </div>
  );
}

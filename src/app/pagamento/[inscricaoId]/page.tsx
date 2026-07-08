import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  regerarPixAction,
  reenviarLinkAction,
} from "@/app/pagamento/[inscricaoId]/actions";
import { OpcoesPagamento } from "@/components/eventos/opcoes-pagamento";
import { PixManualPainel } from "@/components/eventos/pix-manual-painel";
import { PixPainel } from "@/components/eventos/pix-painel";
import { prisma } from "@/lib/db";
import { formatarPrecoBRL } from "@/lib/formatadores";
import type { PixManual } from "@/lib/validations";

export const metadata: Metadata = { title: "Pagamento" };

function mascararEmail(email: string): string {
  const [usuario, dominio] = email.split("@");
  if (!dominio) return email;
  const visivel = usuario.slice(0, 1);
  return `${visivel}${"*".repeat(Math.max(usuario.length - 1, 1))}@${dominio}`;
}

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
            <OpcoesPagamento
              reenviarLinkAction={reenviarLinkAction.bind(null, inscricao.id)}
              emailMascarado={mascararEmail(inscricao.email)}
            >
              <PixManualPainel
                pix={pix}
                amount={inscricao.evento.precoEmCentavos / 100}
              />
            </OpcoesPagamento>
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
          <OpcoesPagamento
            gerarPixAction={regerarComId}
            reenviarLinkAction={reenviarLinkAction.bind(null, inscricao.id)}
            emailMascarado={mascararEmail(inscricao.email)}
          />
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

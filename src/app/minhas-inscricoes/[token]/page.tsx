import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { formatarPrecoBRL } from "@/lib/formatadores";
import type { Conteudo } from "@/lib/validations";
import {
  listarInscricoesPorEmail,
  resolverTokenConsulta,
} from "@/services/consulta.service";

export const metadata: Metadata = { title: "Minhas inscrições" };

interface Props {
  params: Promise<{ token: string }>;
}

export default async function MinhasInscricoesPage({ params }: Props) {
  const { token } = await params;
  const email = await resolverTokenConsulta(token);

  if (!email) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-semibold">Link expirado ou inválido</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Este link não vale mais (ele expira em 7 dias). Peça um novo na página
          de consulta.
        </p>
        <p className="mt-8">
          <Link
            href="/consultar-inscricao"
            className="font-semibold text-primary underline underline-offset-4"
          >
            Consultar minha inscrição
          </Link>
        </p>
      </div>
    );
  }

  const inscricoes = await listarInscricoesPorEmail(email);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Minhas inscrições
      </h1>

      {inscricoes.length === 0 ? (
        <p className="mt-6 text-lg text-muted-foreground">
          Não encontramos inscrições ativas para este email.
        </p>
      ) : (
        <ul className="mt-8 space-y-5">
          {inscricoes.map((inscricao) => {
            const conteudo = inscricao.evento.conteudo as Conteudo | null;
            const capa = conteudo?.imagemCapa;
            const pendente = inscricao.status === "PENDENTE";
            return (
              <li
                key={inscricao.id}
                className="overflow-hidden rounded-xl border border-border bg-secondary"
              >
                {capa && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={capa}
                    alt={`Capa do evento ${inscricao.evento.nome}`}
                    className="h-40 w-full object-cover"
                  />
                )}
                <div className="p-5">
                  <p className="text-xl font-bold">{inscricao.evento.nome}</p>
                  <p className="mt-1 text-lg text-muted-foreground">
                    {formatarPrecoBRL(inscricao.evento.precoEmCentavos)}
                  </p>
                  <p className="mt-3 text-lg">
                    {pendente ? (
                      <span className="font-semibold text-amber-600">
                        Aguardando pagamento
                      </span>
                    ) : (
                      <span className="font-semibold text-primary">
                        Inscrição confirmada
                      </span>
                    )}
                  </p>
                  {pendente && (
                    <Button
                      asChild
                      size="lg"
                      className="mt-4 h-14 w-full text-lg"
                    >
                      <Link href={`/pagamento/${inscricao.id}`}>
                        Pagar agora
                      </Link>
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

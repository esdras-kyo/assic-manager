import { AcoesInscricao } from "@/components/admin/acoes-inscricao";
import { BadgeStatus } from "@/components/admin/badge-status";
import type {
  InscricaoStatus,
  ModalidadePagamento,
  PagamentoStatus,
} from "@/generated/prisma/client";

const dataCurta = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export interface InscricaoLinha {
  id: string;
  nome: string;
  email: string;
  celular: string;
  status: InscricaoStatus;
  criadoEm: Date;
  evento: { nome: string; modalidadePagamento: ModalidadePagamento };
  pagamentos: { status: PagamentoStatus }[];
}

export function TabelaInscricoes({
  inscricoes,
  mostrarEvento = true,
}: {
  inscricoes: InscricaoLinha[];
  mostrarEvento?: boolean;
}) {
  return (
    <div className="mt-6 overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-200 bg-card text-left">
        <thead className="border-b border-border bg-secondary text-sm uppercase">
          <tr>
            <th className="px-4 py-3">Nome</th>
            <th className="px-4 py-3">Contato</th>
            {mostrarEvento && <th className="px-4 py-3">Evento</th>}
            <th className="px-4 py-3">Inscrição</th>
            <th className="px-4 py-3">Pagamento</th>
            <th className="px-4 py-3">Quando</th>
            <th className="px-4 py-3">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {inscricoes.map((i) => (
            <tr key={i.id} className="hover:bg-accent/30">
              <td className="px-4 py-3 font-semibold">{i.nome}</td>
              <td className="px-4 py-3">
                <p>{i.email}</p>
                <p className="text-sm text-muted-foreground">{i.celular}</p>
              </td>
              {mostrarEvento && <td className="px-4 py-3">{i.evento.nome}</td>}
              <td className="px-4 py-3">
                <BadgeStatus status={i.status} />
              </td>
              <td className="px-4 py-3">
                {i.pagamentos[0] ? (
                  <BadgeStatus status={i.pagamentos[0].status} />
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {dataCurta.format(i.criadoEm)}
              </td>
              <td className="px-4 py-3">
                {i.status === "PENDENTE" &&
                i.evento.modalidadePagamento === "MANUAL" ? (
                  <AcoesInscricao id={i.id} />
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

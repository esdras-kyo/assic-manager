import { getEmailSender } from "@/services/email";
import {
  montarHtmlConfirmacao,
  montarTextoConfirmacao,
} from "@/services/email/templates";
import { formatarPeriodoEvento } from "@/lib/formatadores";
import { getEnv } from "@/lib/env";

export interface ConfirmacaoInscricaoDados {
  nome: string;
  email: string;
  eventoNome: string;
  eventoLocal: string;
  eventoDataInicio: Date;
  eventoDataFim: Date | null;
}

/**
 * Email de confirmação de inscrição. Chamado UMA vez por inscrição —
 * a idempotência vem da confirmação de pagamento (§4.5.1).
 */
export async function enviarConfirmacaoInscricao(
  dados: ConfirmacaoInscricaoDados,
): Promise<void> {
  const conteudo = {
    primeiroNome: dados.nome.split(" ")[0],
    eventoNome: dados.eventoNome,
    eventoLocal: dados.eventoLocal,
    quando: formatarPeriodoEvento(dados.eventoDataInicio, dados.eventoDataFim),
  };

  const replyTo = getEnv().EMAIL_REPLY_TO;
  await getEmailSender().send({
    to: dados.email,
    subject: `Inscrição confirmada - ${dados.eventoNome}`,
    text: montarTextoConfirmacao(conteudo),
    html: montarHtmlConfirmacao(conteudo),
    ...(replyTo && { replyTo }),
  });
}

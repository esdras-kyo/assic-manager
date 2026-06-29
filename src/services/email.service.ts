import { getEmailSender } from "@/services/email";
import {
  montarHtmlConfirmacao,
  montarTextoConfirmacao,
} from "@/services/email/templates";

const formatadorData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export interface ConfirmacaoInscricaoDados {
  nome: string;
  email: string;
  eventoNome: string;
  eventoLocal: string;
  eventoDataInicio: Date;
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
    quando: formatadorData.format(dados.eventoDataInicio),
  };

  await getEmailSender().send({
    to: dados.email,
    subject: `Inscrição confirmada — ${dados.eventoNome}`,
    text: montarTextoConfirmacao(conteudo),
    html: montarHtmlConfirmacao(conteudo),
  });
}

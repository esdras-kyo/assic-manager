import { getEmailSender } from "@/services/email";
import {
  montarHtmlConfirmacao,
  montarHtmlInscricaoRecebida,
  montarHtmlLinkConsulta,
  montarTextoConfirmacao,
  montarTextoInscricaoRecebida,
  montarTextoLinkConsulta,
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
    // Opt-out por email (melhora deliverability; e-mail é transacional).
    ...(replyTo && {
      headers: { "List-Unsubscribe": `<mailto:${replyTo}>` },
    }),
  });
}

export interface InscricaoRecebidaEmail {
  nome: string;
  email: string;
  eventoNome: string;
  /** URL absoluta da lista de inscrições (magic link). */
  link: string;
}

/** Email disparado na criação da inscrição — vaga guardada, pague quando quiser. */
export async function enviarInscricaoRecebida(
  dados: InscricaoRecebidaEmail,
): Promise<void> {
  const conteudo = {
    primeiroNome: dados.nome.split(" ")[0],
    eventoNome: dados.eventoNome,
    link: dados.link,
  };
  const replyTo = getEnv().EMAIL_REPLY_TO;
  await getEmailSender().send({
    to: dados.email,
    subject: `Inscrição recebida - ${dados.eventoNome}`,
    text: montarTextoInscricaoRecebida(conteudo),
    html: montarHtmlInscricaoRecebida(conteudo),
    ...(replyTo && { replyTo }),
    ...(replyTo && { headers: { "List-Unsubscribe": `<mailto:${replyTo}>` } }),
  });
}

/** Email de "aqui está seu link" — reenvio sob demanda (consulta/pagar depois). */
export async function enviarLinkConsulta(dados: {
  email: string;
  link: string;
}): Promise<void> {
  const replyTo = getEnv().EMAIL_REPLY_TO;
  await getEmailSender().send({
    to: dados.email,
    subject: "Suas inscrições na ASSIC",
    text: montarTextoLinkConsulta({ link: dados.link }),
    html: montarHtmlLinkConsulta({ link: dados.link }),
    ...(replyTo && { replyTo }),
    ...(replyTo && { headers: { "List-Unsubscribe": `<mailto:${replyTo}>` } }),
  });
}

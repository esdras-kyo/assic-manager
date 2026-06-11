import { getEmailSender } from "@/services/email";

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
  const primeiroNome = dados.nome.split(" ")[0];
  const quando = formatadorData.format(dados.eventoDataInicio);

  await getEmailSender().send({
    to: dados.email,
    subject: `Inscrição confirmada — ${dados.eventoNome}`,
    text: [
      `Olá, ${primeiroNome}!`,
      "",
      `Sua inscrição no evento "${dados.eventoNome}" está confirmada. 🎉`,
      "",
      `📅 Quando: ${quando}`,
      `📍 Onde: ${dados.eventoLocal}`,
      "",
      "Guarde este email. Até lá!",
    ].join("\n"),
  });
}

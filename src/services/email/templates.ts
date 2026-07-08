// Templates de email — módulo puro (sem imports de "@/"), fácil de testar e
// pré-visualizar. Email usa tabelas + estilos inline: é o que os clientes de
// email (Gmail, Outlook...) renderizam de forma confiável (sem CSS externo/var).

// Azul da marca, aproximação literal do token --primary (email não tem CSS var).
const AZUL = "#2550c8";
// Logo servida pelo próprio site (URL absoluta — email exige). Caso exato.
const LOGO_URL = "https://marketingamesa.com.br/images/assic.PNG";

export interface ConfirmacaoEmailDados {
  primeiroNome: string;
  eventoNome: string;
  eventoLocal: string;
  /** Data/hora já formatada em PT-BR. */
  quando: string;
}

/** Escapa para interpolar com segurança no HTML. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function montarTextoConfirmacao(d: ConfirmacaoEmailDados): string {
  return [
    `Olá, ${d.primeiroNome}!`,
    "",
    `Sua inscrição no evento "${d.eventoNome}" está confirmada.`,
    "",
    "Que alegria ter você com a gente! Confira abaixo os detalhes do encontro e, se tiver qualquer dúvida, é só responder este email.",
    "",
    `📅 Quando: ${d.quando}`,
    `📍 Onde: ${d.eventoLocal}`,
    "",
    "Guarde este email. Em caso de dúvidas, responda esta mensagem.",
  ].join("\n");
}

export function montarHtmlConfirmacao(d: ConfirmacaoEmailDados): string {
  return `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:0;background:#f4f4f5;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background:${AZUL};padding:22px 32px;" align="left">
                <img src="${LOGO_URL}" alt="ASSIC" height="44" style="display:block;border:0;height:44px;width:auto;" />
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#18181b;">Inscrição confirmada</h1>
                <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3f3f46;">
                  Olá, <strong>${esc(d.primeiroNome)}</strong>! Sua inscrição no evento <strong>${esc(d.eventoNome)}</strong> está confirmada.
                </p>
                <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#3f3f46;">
                  Que alegria ter você com a gente! Confira abaixo os detalhes do encontro e, se tiver qualquer dúvida, é só responder este email.
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;border-radius:12px;">
                  <tr>
                    <td style="padding:16px 20px;font-size:15px;line-height:1.9;color:#3f3f46;">
                      <strong>📅 Quando:</strong> ${esc(d.quando)}<br />
                      <strong>📍 Onde:</strong> ${esc(d.eventoLocal)}
                    </td>
                  </tr>
                </table>
                <p style="margin:20px 0 0;font-size:15px;line-height:1.6;color:#3f3f46;">
                  Guarde este email. Em caso de dúvidas, responda esta mensagem.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px;border-top:1px solid #e4e4e7;">
                <p style="margin:0;font-size:12px;line-height:1.5;color:#a1a1aa;">
                  Você recebeu este email porque se inscreveu em um evento da ASSIC.<br />
                  Em caso de dúvidas, responda este email ou fale com a organização.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export interface InscricaoRecebidaDados {
  primeiroNome: string;
  eventoNome: string;
  /** URL absoluta da lista de inscrições (magic link). */
  link: string;
}

export function montarTextoInscricaoRecebida(
  d: InscricaoRecebidaDados,
): string {
  return [
    `Olá, ${d.primeiroNome}!`,
    "",
    `Recebemos sua inscrição no evento "${d.eventoNome}". Sua vaga está guardada.`,
    "",
    "Você pode pagar agora ou depois, quando preferir. Para ver sua inscrição e pagar, acesse o link abaixo:",
    "",
    d.link,
    "",
    "Guarde este email. Se precisar, é só responder esta mensagem.",
  ].join("\n");
}

export function montarHtmlInscricaoRecebida(d: InscricaoRecebidaDados): string {
  return montarHtmlComBotao({
    titulo: "Inscrição recebida",
    corpo: `Olá, <strong>${esc(d.primeiroNome)}</strong>! Recebemos sua inscrição no evento <strong>${esc(d.eventoNome)}</strong>. Sua vaga está guardada. Você pode pagar agora ou depois, quando preferir.`,
    botaoTexto: "Ver minha inscrição e pagar",
    link: d.link,
  });
}

export interface LinkConsultaDados {
  /** URL absoluta da lista de inscrições (magic link). */
  link: string;
}

export function montarTextoLinkConsulta(d: LinkConsultaDados): string {
  return [
    "Olá!",
    "",
    "Aqui está o link para ver suas inscrições e pagar as que estiverem pendentes:",
    "",
    d.link,
    "",
    "O link vale por 7 dias. Se expirar, peça um novo na página de consulta.",
  ].join("\n");
}

export function montarHtmlLinkConsulta(d: LinkConsultaDados): string {
  return montarHtmlComBotao({
    titulo: "Suas inscrições",
    corpo:
      "Aqui está o link para ver suas inscrições e pagar as que estiverem pendentes. O link vale por 7 dias.",
    botaoTexto: "Ver minhas inscrições",
    link: d.link,
  });
}

/** Layout comum de email com um botão de ação (tabela + estilos inline). */
function montarHtmlComBotao(d: {
  titulo: string;
  corpo: string;
  botaoTexto: string;
  link: string;
}): string {
  return `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:0;background:#f4f4f5;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background:${AZUL};padding:22px 32px;" align="left">
                <img src="${LOGO_URL}" alt="ASSIC" height="44" style="display:block;border:0;height:44px;width:auto;" />
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#18181b;">${esc(d.titulo)}</h1>
                <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#3f3f46;">${d.corpo}</p>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="border-radius:10px;background:${AZUL};">
                      <a href="${d.link}" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;">${esc(d.botaoTexto)}</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#71717a;word-break:break-all;">
                  Se o botão não funcionar, copie e cole no navegador:<br />${esc(d.link)}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px;border-top:1px solid #e4e4e7;">
                <p style="margin:0;font-size:12px;line-height:1.5;color:#a1a1aa;">
                  Você recebeu este email porque se inscreveu em um evento da ASSIC.<br />
                  Em caso de dúvidas, responda este email ou fale com a organização.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

import type { EmailMessage, EmailSender } from "@/services/email/types";

// Adapter Resend — REST direto via fetch (mesma filosofia dos gateways de
// pagamento: sem SDK). Doc: https://resend.com/docs/api-reference/emails/send-email
const API_URL = "https://api.resend.com/emails";

export class ResendEmailSender implements EmailSender {
  readonly name = "resend";

  private readonly apiKey: string;
  private readonly from: string;

  constructor(apiKey: string | undefined, from: string | undefined) {
    if (!apiKey) {
      throw new Error(
        "RESEND_API_KEY é obrigatória quando EMAIL_PROVIDER=resend",
      );
    }
    if (!from) {
      throw new Error("EMAIL_FROM é obrigatória quando EMAIL_PROVIDER=resend");
    }
    this.apiKey = apiKey;
    this.from = from;
  }

  async send(message: EmailMessage): Promise<void> {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        ...(message.html && { html: message.html }),
        ...(message.replyTo && { reply_to: message.replyTo }),
        ...(message.headers && { headers: message.headers }),
      }),
    });

    if (!res.ok) {
      const detalhe = await res.text().catch(() => "");
      throw new Error(`Resend falhou (${res.status}): ${detalhe}`);
    }
  }
}

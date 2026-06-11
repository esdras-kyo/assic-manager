import type { EmailMessage, EmailSender } from "@/services/email/types";

/** Sender de desenvolvimento: imprime o email no terminal do servidor. */
export class ConsoleEmailSender implements EmailSender {
  readonly name = "console";

  async send(message: EmailMessage): Promise<void> {
    console.info(
      `\n📧 [email console] para: ${message.to}\nassunto: ${message.subject}\n---\n${message.text}\n---\n`,
    );
  }
}

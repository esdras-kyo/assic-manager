import { getEnv } from "@/lib/env";
import { ConsoleEmailSender } from "@/services/email/senders/console.sender";
import type { EmailSender } from "@/services/email/types";

let instancia: EmailSender | undefined;

export function getEmailSender(): EmailSender {
  if (instancia) return instancia;

  const env = getEnv();
  switch (env.EMAIL_PROVIDER) {
    case "resend":
      throw new Error('Sender "resend" ainda não implementado (sem API key)');
    case "console":
    default:
      instancia = new ConsoleEmailSender();
      return instancia;
  }
}

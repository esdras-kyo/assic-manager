import { getEnv } from "@/lib/env";
import { ConsoleEmailSender } from "@/services/email/senders/console.sender";
import { ResendEmailSender } from "@/services/email/senders/resend.sender";
import type { EmailSender } from "@/services/email/types";

let instancia: EmailSender | undefined;

export function getEmailSender(): EmailSender {
  if (instancia) return instancia;

  const env = getEnv();
  switch (env.EMAIL_PROVIDER) {
    case "resend":
      instancia = new ResendEmailSender(env.RESEND_API_KEY, env.EMAIL_FROM);
      return instancia;
    case "console":
    default:
      instancia = new ConsoleEmailSender();
      return instancia;
  }
}

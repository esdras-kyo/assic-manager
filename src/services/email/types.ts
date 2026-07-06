// Contrato de envio de email — mesma filosofia do PaymentGateway:
// o sistema conhece a interface, nunca o provedor concreto.

export interface EmailMessage {
  to: string;
  subject: string;
  /** Versão texto puro (fallback e clientes sem HTML). */
  text: string;
  /** Versão HTML opcional — quando presente, clientes a preferem. */
  html?: string;
  /** Endereço de resposta (header Reply-To). Opcional. */
  replyTo?: string;
}

export interface EmailSender {
  readonly name: string;
  send(message: EmailMessage): Promise<void>;
}

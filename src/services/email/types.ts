// Contrato de envio de email — mesma filosofia do PaymentGateway:
// o sistema conhece a interface, nunca o provedor concreto.

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

export interface EmailSender {
  readonly name: string;
  send(message: EmailMessage): Promise<void>;
}

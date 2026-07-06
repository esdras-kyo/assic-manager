// Contrato de pagamento (planoassic §4.1). O sistema inteiro depende SÓ
// desta interface; cada gateway concreto a implementa e traduz seus payloads.

export type PaymentMethod = "pix" | "credit_card";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "expired";

export interface CreatePaymentInput {
  amountInCents: number;
  method: PaymentMethod;
  description: string;
  customer: { name: string; email: string; phone: string; document?: string };
  metadata: { inscricaoId: string; eventoId: string };
}

export interface CreatePaymentResult {
  gatewayPaymentId: string;
  status: PaymentStatus;
  pix?: { qrCode: string; qrCodeImageUrl?: string; expiresAt: Date };
  checkoutUrl?: string;
}

export interface WebhookResult {
  gatewayPaymentId: string;
  status: PaymentStatus;
  inscricaoId?: string;
}

export interface PaymentGateway {
  readonly name: string;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  getPayment(gatewayPaymentId: string): Promise<{ status: PaymentStatus }>;
  /**
   * Valida assinatura E traduz o payload — lança se a assinatura for inválida.
   * `query` traz os params da URL (ex.: data.id, type) — o MP assina usando o
   * data.id da query, e em alguns webhooks o corpo vem vazio.
   */
  parseWebhook(
    rawBody: string,
    headers: Record<string, string>,
    query?: Record<string, string>,
  ): Promise<WebhookResult>;
}

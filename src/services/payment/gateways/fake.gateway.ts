import { randomUUID } from "node:crypto";

import { AssinaturaInvalidaError } from "@/services/payment/errors";
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentGateway,
  PaymentStatus,
  WebhookResult,
} from "@/services/payment/types";

// Gateway falso para desenvolvimento (planoassic §4.3): destrava o fluxo
// completo sem gateway contratado. Estado vive em memória — só dev local.

// Reexporta para não quebrar imports antigos (`from ".../fake.gateway"`).
export { AssinaturaInvalidaError };

// O fake tem nomenclatura própria de status de propósito: exercita a
// tradução status-bruto → status-normalizado que todo adapter real fará.
const STATUS_FAKE: Record<string, PaymentStatus> = {
  PENDENTE_FAKE: "pending",
  PAGO_FAKE: "paid",
  FALHOU_FAKE: "failed",
  ESTORNADO_FAKE: "refunded",
  EXPIRADO_FAKE: "expired",
};

const PIX_EXPIRACAO_MS = 30 * 60 * 1000;

export class FakeGateway implements PaymentGateway {
  readonly name = "fake";
  private pagamentos = new Map<string, PaymentStatus>();

  constructor(private readonly webhookSecret: string) {}

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const gatewayPaymentId = `fake_${randomUUID()}`;
    this.pagamentos.set(gatewayPaymentId, "pending");

    if (input.method === "pix") {
      return {
        gatewayPaymentId,
        status: "pending",
        pix: {
          qrCode: `00020126FAKE-PIX-COPIA-E-COLA-${gatewayPaymentId}`,
          expiresAt: new Date(Date.now() + PIX_EXPIRACAO_MS),
        },
      };
    }

    return {
      gatewayPaymentId,
      status: "pending",
      checkoutUrl: `https://fake-gateway.local/checkout/${gatewayPaymentId}`,
    };
  }

  async getPayment(
    gatewayPaymentId: string,
  ): Promise<{ status: PaymentStatus }> {
    const status = this.pagamentos.get(gatewayPaymentId);
    if (!status) {
      throw new Error(`Pagamento desconhecido no fake: ${gatewayPaymentId}`);
    }
    return { status };
  }

  async parseWebhook(
    rawBody: string,
    headers: Record<string, string>,
  ): Promise<WebhookResult> {
    if (headers["x-fake-signature"] !== this.webhookSecret) {
      throw new AssinaturaInvalidaError();
    }

    const payload = JSON.parse(rawBody) as {
      gatewayPaymentId?: string;
      status?: string;
      inscricaoId?: string;
    };
    if (!payload.gatewayPaymentId) {
      throw new Error("Webhook fake sem gatewayPaymentId");
    }
    const status = STATUS_FAKE[payload.status ?? ""];
    if (!status) {
      throw new Error(`Status desconhecido no webhook fake: ${payload.status}`);
    }

    this.pagamentos.set(payload.gatewayPaymentId, status);

    return {
      gatewayPaymentId: payload.gatewayPaymentId,
      status,
      ...(payload.inscricaoId && { inscricaoId: payload.inscricaoId }),
    };
  }
}

/**
 * Gera body+headers de um webhook "pago" válido — trigger de dev e testes
 * ("marcar como pago", planoassic §4.3).
 */
export function gerarWebhookPago(
  gatewayPaymentId: string,
  secret: string,
  extras?: { inscricaoId?: string },
): { body: string; headers: Record<string, string> } {
  return {
    body: JSON.stringify({
      gatewayPaymentId,
      status: "PAGO_FAKE",
      ...extras,
    }),
    headers: { "x-fake-signature": secret },
  };
}

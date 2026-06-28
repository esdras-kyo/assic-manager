import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import { AssinaturaInvalidaError } from "@/services/payment/errors";
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentGateway,
  PaymentStatus,
  WebhookResult,
} from "@/services/payment/types";

// Adapter Mercado Pago — Pix (planoassic §4.4). REST direto via fetch, sem SDK.
// Doc: https://www.mercadopago.com.br/developers/pt/docs/checkout-api-payments/integration-configuration/integrate-pix

const API_BASE = "https://api.mercadopago.com";
// MP exige expiração >= 30 min no futuro. 60 dá folga ao usuário e à latência.
const PIX_EXPIRACAO_MS = 60 * 60 * 1000;

// Status bruto do MP → status normalizado do núcleo.
function mapStatus(status: string, statusDetail?: string): PaymentStatus {
  switch (status) {
    case "approved":
      return "paid";
    case "pending":
    case "in_process":
    case "in_mediation":
    case "authorized":
      return "pending";
    case "refunded":
    case "charged_back":
      return "refunded";
    case "cancelled":
      // Pix expirado chega como cancelled + status_detail "expired".
      return statusDetail === "expired" ? "expired" : "failed";
    case "rejected":
      return "failed";
    default:
      return "pending";
  }
}

interface MpPayment {
  id: number;
  status: string;
  status_detail?: string;
  external_reference?: string;
  date_of_expiration?: string;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    };
  };
}

export class MercadoPagoGateway implements PaymentGateway {
  readonly name = "mercadopago";

  private readonly accessToken: string;
  private readonly webhookSecret: string;

  constructor(
    accessToken: string | undefined,
    webhookSecret: string | undefined,
  ) {
    if (!accessToken) {
      throw new Error(
        "MERCADOPAGO_ACCESS_TOKEN é obrigatória quando PAYMENT_PROVIDER=mercadopago",
      );
    }
    if (!webhookSecret) {
      throw new Error(
        "MERCADOPAGO_WEBHOOK_SECRET é obrigatória quando PAYMENT_PROVIDER=mercadopago",
      );
    }
    this.accessToken = accessToken;
    this.webhookSecret = webhookSecret;
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    if (input.method !== "pix") {
      throw new Error(
        `Mercado Pago: método "${input.method}" não suportado (só pix)`,
      );
    }

    const [primeiroNome, ...resto] = input.customer.name.trim().split(/\s+/);
    const expira = new Date(Date.now() + PIX_EXPIRACAO_MS);

    const body = {
      transaction_amount: input.amountInCents / 100, // MP usa reais (float).
      description: input.description,
      payment_method_id: "pix",
      external_reference: input.metadata.inscricaoId,
      // ISO com offset numérico — MP rejeita o "Z" do toISOString puro.
      date_of_expiration: expira.toISOString().replace("Z", "+00:00"),
      metadata: input.metadata,
      payer: {
        email: input.customer.email,
        first_name: primeiroNome,
        ...(resto.length > 0 && { last_name: resto.join(" ") }),
        // CPF é opcional no Pix do MP; só envia se a inscrição coletou.
        ...(input.customer.document && {
          identification: { type: "CPF", number: input.customer.document },
        }),
      },
    };

    const pagamento = await this.request<MpPayment>("/v1/payments", {
      method: "POST",
      // Chave única por tentativa: regerar Pix cria um pagamento novo.
      headers: { "X-Idempotency-Key": randomUUID() },
      body: JSON.stringify(body),
    });

    const dados = pagamento.point_of_interaction?.transaction_data;
    if (!dados?.qr_code) {
      throw new Error("Mercado Pago não devolveu o código Pix (qr_code)");
    }

    return {
      gatewayPaymentId: String(pagamento.id),
      status: mapStatus(pagamento.status, pagamento.status_detail),
      pix: {
        qrCode: dados.qr_code, // copia-e-cola (EMV) — é o que a tela exibe.
        ...(dados.qr_code_base64 && {
          qrCodeImageUrl: `data:image/png;base64,${dados.qr_code_base64}`,
        }),
        expiresAt: pagamento.date_of_expiration
          ? new Date(pagamento.date_of_expiration)
          : expira,
      },
    };
  }

  async getPayment(
    gatewayPaymentId: string,
  ): Promise<{ status: PaymentStatus }> {
    const pagamento = await this.buscarPagamento(gatewayPaymentId);
    return { status: mapStatus(pagamento.status, pagamento.status_detail) };
  }

  async parseWebhook(
    rawBody: string,
    headers: Record<string, string>,
  ): Promise<WebhookResult> {
    const payload = JSON.parse(rawBody) as {
      type?: string;
      data?: { id?: string | number };
    };
    const dataId = payload.data?.id != null ? String(payload.data.id) : "";

    this.validarAssinatura(dataId, headers);

    // Só notificações de pagamento têm o que processar. As demais
    // (merchant_order etc.) viram no-op → rota responde 200, MP não reenvia.
    if (payload.type !== "payment" || !dataId) {
      return { gatewayPaymentId: dataId, status: "pending" };
    }

    // O body do webhook não traz o status — busca o pagamento na API.
    const pagamento = await this.buscarPagamento(dataId);
    return {
      gatewayPaymentId: String(pagamento.id),
      status: mapStatus(pagamento.status, pagamento.status_detail),
      ...(pagamento.external_reference && {
        inscricaoId: pagamento.external_reference,
      }),
    };
  }

  // --- privados ---

  // Valida o header x-signature (HMAC-SHA256). Doc: "Validar origem da
  // notificação". Manifest: id:{data.id};request-id:{x-request-id};ts:{ts};
  private validarAssinatura(
    dataId: string,
    headers: Record<string, string>,
  ): void {
    const xSignature = headers["x-signature"];
    const xRequestId = headers["x-request-id"];
    if (!xSignature || !xRequestId) throw new AssinaturaInvalidaError();

    let ts: string | undefined;
    let v1: string | undefined;
    for (const parte of xSignature.split(",")) {
      const [chave, valor] = parte.split("=", 2);
      if (chave?.trim() === "ts") ts = valor?.trim();
      else if (chave?.trim() === "v1") v1 = valor?.trim();
    }
    if (!ts || !v1) throw new AssinaturaInvalidaError();

    // data.id alfanumérico vai em minúsculas no manifest (exigência do MP).
    const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${ts};`;
    const esperado = createHmac("sha256", this.webhookSecret)
      .update(manifest)
      .digest("hex");

    const a = Buffer.from(esperado);
    const b = Buffer.from(v1);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new AssinaturaInvalidaError();
    }
  }

  private buscarPagamento(id: string): Promise<MpPayment> {
    return this.request<MpPayment>(`/v1/payments/${id}`, { method: "GET" });
  }

  private async request<T>(
    path: string,
    init: { method: string; headers?: Record<string, string>; body?: string },
  ): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
      method: init.method,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
      ...(init.body && { body: init.body }),
    });

    if (!res.ok) {
      const detalhe = await res.text().catch(() => "");
      throw new Error(
        `Mercado Pago ${init.method} ${path} falhou (${res.status}): ${detalhe}`,
      );
    }
    return (await res.json()) as T;
  }
}

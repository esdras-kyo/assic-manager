import { prisma } from "@/lib/db";
import { enviarConfirmacaoInscricao } from "@/services/email.service";
import { podeTransicionar } from "@/services/inscricao-maquina";
import { InscricaoNaoEncontradaError } from "@/services/inscricao.service";
import { getPaymentGateway } from "@/services/payment";
import type {
  CreatePaymentResult,
  PaymentMethod,
  PaymentStatus,
  WebhookResult,
} from "@/services/payment/types";
import type {
  MetodoPagamento,
  Pagamento,
  PagamentoStatus,
} from "@/generated/prisma/client";

// Invariantes inegociáveis (planoassic §4.5):
// 1. Confirmação idempotente — early-return quando já PAID.
// 2. A verdade é o webhook — NÃO existe caminho de confirmação via redirect.
// 3. Assinatura validada dentro do parseWebhook de cada adapter.

export class InscricaoNaoPagavelError extends Error {
  constructor(status: string) {
    super(`Inscrição não está pendente de pagamento (status: ${status})`);
    this.name = "InscricaoNaoPagavelError";
  }
}

export class PagamentoNaoEncontradoError extends Error {
  constructor(gatewayPaymentId: string) {
    super(`Pagamento não encontrado: ${gatewayPaymentId}`);
    this.name = "PagamentoNaoEncontradoError";
  }
}

const STATUS_DB: Record<PaymentStatus, PagamentoStatus> = {
  pending: "PENDING",
  paid: "PAID",
  failed: "FAILED",
  refunded: "REFUNDED",
  expired: "EXPIRED",
};

const METODO_DB: Record<PaymentMethod, MetodoPagamento> = {
  pix: "PIX",
  credit_card: "CREDIT_CARD",
};

export function mapStatusGatewayParaDb(status: PaymentStatus): PagamentoStatus {
  return STATUS_DB[status];
}

export async function iniciarPagamento(input: {
  inscricaoId: string;
  metodo: PaymentMethod;
}): Promise<{ pagamento: Pagamento; gatewayResult: CreatePaymentResult }> {
  const inscricao = await prisma.inscricao.findUnique({
    where: { id: input.inscricaoId },
    include: { evento: true },
  });
  if (!inscricao) throw new InscricaoNaoEncontradaError(input.inscricaoId);
  if (inscricao.status !== "PENDENTE") {
    throw new InscricaoNaoPagavelError(inscricao.status);
  }

  const gateway = getPaymentGateway();
  const gatewayResult = await gateway.createPayment({
    // Snapshot do preço no momento do pagamento — sempre centavos.
    amountInCents: inscricao.evento.precoEmCentavos,
    method: input.metodo,
    description: `Inscrição ${inscricao.evento.nome}`,
    customer: {
      name: inscricao.nome,
      email: inscricao.email,
      phone: inscricao.celular,
      document: inscricao.documento,
    },
    metadata: { inscricaoId: inscricao.id, eventoId: inscricao.eventoId },
  });

  const pagamento = await prisma.pagamento.create({
    data: {
      inscricaoId: inscricao.id,
      gateway: gateway.name,
      gatewayPaymentId: gatewayResult.gatewayPaymentId,
      metodo: METODO_DB[input.metodo],
      status: mapStatusGatewayParaDb(gatewayResult.status),
      amountInCents: inscricao.evento.precoEmCentavos,
      // Snapshot do Pix para reexibição após refresh.
      pixQrCode: gatewayResult.pix?.qrCode ?? null,
      pixExpiresAt: gatewayResult.pix?.expiresAt ?? null,
    },
  });

  return { pagamento, gatewayResult };
}

/**
 * Idempotente: rodar N vezes para o mesmo pagamento confirma UMA vez.
 * Gateways reenviam webhooks repetidos e fora de ordem (§4.5.1).
 */
export async function confirmarPagamento(gatewayPaymentId: string): Promise<{
  jaConfirmado: boolean;
  inscricaoConfirmada: boolean;
}> {
  const pagamento = await prisma.pagamento.findUnique({
    where: { gatewayPaymentId },
    include: { inscricao: { include: { evento: true } } },
  });
  if (!pagamento) throw new PagamentoNaoEncontradoError(gatewayPaymentId);

  // Early-return: já processado. Não confirma duas vezes, não manda dois emails.
  if (pagamento.status === "PAID") {
    return { jaConfirmado: true, inscricaoConfirmada: false };
  }

  await prisma.pagamento.update({
    where: { gatewayPaymentId },
    data: { status: "PAID" },
  });

  // Inscrição EXPIRADA/CANCELADA não volta (pagamento atrasado vira
  // reembolso manual). Só PENDENTE transiciona.
  if (!podeTransicionar(pagamento.inscricao.status, "CONFIRMADA")) {
    return { jaConfirmado: false, inscricaoConfirmada: false };
  }

  await prisma.inscricao.update({
    where: { id: pagamento.inscricaoId },
    data: { status: "CONFIRMADA" },
  });

  // Falha de email não desfaz a confirmação — inscrição já está paga.
  try {
    await enviarConfirmacaoInscricao({
      nome: pagamento.inscricao.nome,
      email: pagamento.inscricao.email,
      eventoNome: pagamento.inscricao.evento.nome,
      eventoLocal: pagamento.inscricao.evento.local,
      eventoDataInicio: pagamento.inscricao.evento.dataInicio,
    });
  } catch (erro) {
    console.error("Falha ao enviar email de confirmação:", erro);
  }

  return { jaConfirmado: false, inscricaoConfirmada: true };
}

/**
 * Ponto único de entrada de webhooks. parseWebhook do adapter valida a
 * assinatura (lança AssinaturaInvalidaError → rota responde 401).
 */
export async function processarWebhook(
  rawBody: string,
  headers: Record<string, string>,
): Promise<WebhookResult> {
  const gateway = getPaymentGateway();
  const resultado = await gateway.parseWebhook(rawBody, headers);

  switch (resultado.status) {
    case "paid":
      await confirmarPagamento(resultado.gatewayPaymentId);
      break;

    case "expired":
    case "failed":
    case "refunded": {
      const pagamento = await prisma.pagamento.findUnique({
        where: { gatewayPaymentId: resultado.gatewayPaymentId },
        include: { inscricao: true },
      });
      if (!pagamento) {
        throw new PagamentoNaoEncontradoError(resultado.gatewayPaymentId);
      }
      // Webhook atrasado não regride pagamento já PAID.
      if (pagamento.status === "PAID") break;

      await prisma.pagamento.update({
        where: { gatewayPaymentId: resultado.gatewayPaymentId },
        data: { status: mapStatusGatewayParaDb(resultado.status) },
      });

      // Pagamento expirado leva a inscrição PENDENTE junto (§8).
      // failed/refunded não tocam a inscrição (pode tentar pagar de novo).
      if (
        resultado.status === "expired" &&
        podeTransicionar(pagamento.inscricao.status, "EXPIRADA")
      ) {
        await prisma.inscricao.update({
          where: { id: pagamento.inscricaoId },
          data: { status: "EXPIRADA" },
        });
      }
      break;
    }

    case "pending":
      break; // nada a fazer
  }

  return resultado;
}

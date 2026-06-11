import { getEnv } from "@/lib/env";
import { FakeGateway } from "@/services/payment/gateways/fake.gateway";
import type { PaymentGateway } from "@/services/payment/types";

// Fábrica (planoassic §4.4): trocar de gateway = mudar PAYMENT_PROVIDER.
// Nenhuma outra parte do código conhece o gateway concreto.

let instancia: PaymentGateway | undefined;

export function getPaymentGateway(): PaymentGateway {
  if (instancia) return instancia;

  const env = getEnv();
  switch (env.PAYMENT_PROVIDER) {
    case "pagarme":
    case "mercadopago":
      throw new Error(
        `Gateway "${env.PAYMENT_PROVIDER}" ainda não implementado (Etapa 5)`,
      );
    case "fake":
    default:
      instancia = new FakeGateway(env.FAKE_WEBHOOK_SECRET);
      return instancia;
  }
}

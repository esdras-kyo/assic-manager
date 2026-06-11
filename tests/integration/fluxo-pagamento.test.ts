import dotenv from "dotenv";
import { describe, expect, it } from "vitest";

dotenv.config({ path: ".env.local" });

// Integração real (DB + FakeGateway): roda só com env local presente.
// No CI sem credenciais, skipa inteiro.
const temEnv = Boolean(process.env.DATABASE_URL);

describe.skipIf(!temEnv)("fluxo de pagamento ponta a ponta (fake)", () => {
  it(
    "inscrição → pix fake → webhook 3x → CONFIRMADA uma vez só",
    { timeout: 30_000 },
    async () => {
      const { prisma } = await import("@/lib/db");
      const { criarEvento, publicarEvento } =
        await import("@/services/evento.service");
      const { criarInscricao } = await import("@/services/inscricao.service");
      const { iniciarPagamento, processarWebhook } =
        await import("@/services/pagamento.service");
      const { gerarWebhookPago } =
        await import("@/services/payment/gateways/fake.gateway");
      const { getEnv } = await import("@/lib/env");

      const slug = `teste-integracao-${Date.now()}`;
      let eventoId: string | undefined;

      try {
        // evento aberto
        const evento = await criarEvento({
          nome: "Evento Teste Integração",
          slug,
          local: "Salão de Teste",
          dataInicio: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          precoEmCentavos: 5000,
          vagas: 10,
        });
        eventoId = evento.id;
        await publicarEvento(evento.id);

        // inscrição pendente
        const inscricao = await criarInscricao({
          eventoId: evento.id,
          nome: "Maria de Teste",
          email: "maria.teste@example.com",
          celular: "(11) 98765-4321",
          documento: "529.982.247-25",
        });
        expect(inscricao.status).toBe("PENDENTE");

        // pagamento pix fake
        const { gatewayResult } = await iniciarPagamento({
          inscricaoId: inscricao.id,
          metodo: "pix",
        });
        expect(gatewayResult.pix?.qrCode).toBeTruthy();

        // webhook "pago" 3x — idempotência (§4.5.1)
        const { body, headers } = gerarWebhookPago(
          gatewayResult.gatewayPaymentId,
          getEnv().FAKE_WEBHOOK_SECRET,
        );
        await processarWebhook(body, headers);
        await processarWebhook(body, headers);
        await processarWebhook(body, headers);

        // confirmada exatamente uma vez; pagamento PAID
        const final = await prisma.inscricao.findUniqueOrThrow({
          where: { id: inscricao.id },
          include: { pagamentos: true },
        });
        expect(final.status).toBe("CONFIRMADA");
        expect(final.pagamentos).toHaveLength(1);
        expect(final.pagamentos[0].status).toBe("PAID");
      } finally {
        // limpeza (sem cascade no schema)
        if (eventoId) {
          await prisma.pagamento.deleteMany({
            where: { inscricao: { eventoId } },
          });
          await prisma.inscricao.deleteMany({ where: { eventoId } });
          await prisma.evento.delete({ where: { id: eventoId } });
        }
      }
    },
  );
});

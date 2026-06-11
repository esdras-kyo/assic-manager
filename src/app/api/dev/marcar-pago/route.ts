import { NextResponse } from "next/server";

import { getEnv } from "@/lib/env";
import { prisma } from "@/lib/db";
import { processarWebhook } from "@/services/pagamento.service";
import { gerarWebhookPago } from "@/services/payment/gateways/fake.gateway";

// Trigger de desenvolvimento (planoassic §4.3): simula o webhook "pago" do
// FakeGateway passando pelo MESMO caminho do webhook real (assinatura inclusa).
// Em produção a rota se comporta como inexistente.
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { inscricaoId } = (await request.json()) as { inscricaoId?: string };
  if (!inscricaoId) {
    return NextResponse.json(
      { error: "inscricaoId requerido" },
      { status: 400 },
    );
  }

  const pagamento = await prisma.pagamento.findFirst({
    where: { inscricaoId, status: "PENDING" },
    orderBy: { criadoEm: "desc" },
  });
  if (!pagamento) {
    return NextResponse.json(
      { error: "Nenhum pagamento pendente para esta inscrição" },
      { status: 404 },
    );
  }

  const { body, headers } = gerarWebhookPago(
    pagamento.gatewayPaymentId,
    getEnv().FAKE_WEBHOOK_SECRET,
  );
  await processarWebhook(body, headers);

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";

import { processarWebhook } from "@/services/pagamento.service";
import { AssinaturaInvalidaError } from "@/services/payment/errors";

// Rota fina (planoassic §2.1): recebe, repassa ao service, responde.
// A ÚNICA porta de confirmação de inscrição é este webhook (§4.5.2).
export async function POST(request: Request) {
  const rawBody = await request.text();
  const headers = Object.fromEntries(request.headers.entries());
  // O MP manda data.id/type na query e assina usando o data.id da query.
  const query = Object.fromEntries(new URL(request.url).searchParams.entries());

  try {
    await processarWebhook(rawBody, headers, query);
    return NextResponse.json({ received: true });
  } catch (erro) {
    if (erro instanceof AssinaturaInvalidaError) {
      return NextResponse.json(
        { error: "Assinatura inválida" },
        { status: 401 },
      );
    }
    // 5xx faz o gateway reenviar; a confirmação idempotente absorve repetições.
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

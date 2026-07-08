"use server";

import { z } from "zod";

import { solicitarLinkConsulta } from "@/services/consulta.service";

export interface ConsultaFormState {
  enviado?: boolean;
  erro?: string;
  email?: string;
}

const schema = z.object({
  email: z.email({ error: "Digite um email válido, como nome@exemplo.com" }),
});

export async function solicitarLinkAction(
  _prev: ConsultaFormState | undefined,
  formData: FormData,
): Promise<ConsultaFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const parsed = schema.safeParse({ email });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Email inválido", email };
  }

  // Best-effort. Resposta é sempre "enviado" (anti-enumeração): o serviço só
  // dispara email se existir inscrição, mas a UI não revela isso.
  try {
    await solicitarLinkConsulta(parsed.data.email);
  } catch (erro) {
    console.error("Falha ao solicitar link de consulta:", erro);
  }
  return { enviado: true, email };
}

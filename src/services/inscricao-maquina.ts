import { InscricaoStatus } from "@/generated/prisma/client";

// Máquina de estados da inscrição (planoassic §3.3).
// Setas saem apenas de PENDENTE; os demais estados são terminais.
// PENDENTE → CONFIRMADA acontece SÓ via webhook validado (regra aplicada
// no pagamento.service, Etapa 2) — aqui vive apenas a mecânica.
const TRANSICOES: Record<InscricaoStatus, readonly InscricaoStatus[]> = {
  PENDENTE: ["CONFIRMADA", "CANCELADA", "EXPIRADA"],
  CONFIRMADA: [],
  CANCELADA: [],
  EXPIRADA: [],
};

export class TransicaoInvalidaError extends Error {
  constructor(
    readonly de: InscricaoStatus,
    readonly para: InscricaoStatus,
  ) {
    super(`Transição de inscrição inválida: ${de} → ${para}`);
    this.name = "TransicaoInvalidaError";
  }
}

export function podeTransicionar(
  de: InscricaoStatus,
  para: InscricaoStatus,
): boolean {
  return TRANSICOES[de].includes(para);
}

/** Retorna o novo status ou lança TransicaoInvalidaError. */
export function transicionar(
  de: InscricaoStatus,
  para: InscricaoStatus,
): InscricaoStatus {
  if (!podeTransicionar(de, para)) {
    throw new TransicaoInvalidaError(de, para);
  }
  return para;
}

import { describe, expect, it } from "vitest";

import { InscricaoStatus } from "@/generated/prisma/client";
import {
  podeTransicionar,
  TransicaoInvalidaError,
  transicionar,
} from "@/services/inscricao-maquina";

const { PENDENTE, CONFIRMADA, CANCELADA, EXPIRADA } = InscricaoStatus;

describe("máquina de estados da inscrição (§3.3)", () => {
  it.each([
    [PENDENTE, CONFIRMADA],
    [PENDENTE, CANCELADA],
    [PENDENTE, EXPIRADA],
  ])("permite %s → %s", (de, para) => {
    expect(podeTransicionar(de, para)).toBe(true);
    expect(transicionar(de, para)).toBe(para);
  });

  it.each([
    [CONFIRMADA, PENDENTE],
    [CONFIRMADA, EXPIRADA],
    [CONFIRMADA, CANCELADA], // §3.3: setas só saem de PENDENTE
    [CANCELADA, PENDENTE],
    [CANCELADA, CONFIRMADA],
    [EXPIRADA, CONFIRMADA],
    [EXPIRADA, PENDENTE],
    [PENDENTE, PENDENTE],
    [CONFIRMADA, CONFIRMADA],
  ])("bloqueia %s → %s", (de, para) => {
    expect(podeTransicionar(de, para)).toBe(false);
    expect(() => transicionar(de, para)).toThrowError(TransicaoInvalidaError);
  });

  it("erro de transição cita os dois estados", () => {
    try {
      transicionar(EXPIRADA, CONFIRMADA);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(TransicaoInvalidaError);
      expect((e as Error).message).toMatch(/EXPIRADA/);
      expect((e as Error).message).toMatch(/CONFIRMADA/);
    }
  });
});

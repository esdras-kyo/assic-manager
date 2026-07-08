import { beforeEach, describe, expect, it, vi } from "vitest";

import { solicitarLinkAction } from "@/app/consultar-inscricao/actions";
import { solicitarLinkConsulta } from "@/services/consulta.service";

vi.mock("@/services/consulta.service", () => ({
  solicitarLinkConsulta: vi.fn(),
}));

function fd(email: string) {
  const f = new FormData();
  f.set("email", email);
  return f;
}

beforeEach(() => vi.clearAllMocks());

describe("solicitarLinkAction", () => {
  it("email válido: chama o serviço e marca enviado", async () => {
    const state = await solicitarLinkAction(undefined, fd("maria@example.com"));
    expect(solicitarLinkConsulta).toHaveBeenCalledWith("maria@example.com");
    expect(state.enviado).toBe(true);
  });

  it("email inválido: erro e não chama o serviço", async () => {
    const state = await solicitarLinkAction(undefined, fd("nao-e-email"));
    expect(state.erro).toBeTruthy();
    expect(solicitarLinkConsulta).not.toHaveBeenCalled();
  });

  it("mesma resposta mesmo se o serviço não achar inscrição (anti-enumeração)", async () => {
    const state = await solicitarLinkAction(
      undefined,
      fd("ninguem@example.com"),
    );
    expect(state.enviado).toBe(true);
  });
});

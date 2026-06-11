import { beforeEach, describe, expect, it, vi } from "vitest";

import { criarInscricaoEPagarAction } from "@/app/eventos/[slug]/inscricao/actions";
import { criarInscricao, SemVagasError } from "@/services/inscricao.service";
import { iniciarPagamento } from "@/services/pagamento.service";

vi.mock("@/services/inscricao.service", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/services/inscricao.service")>();
  return {
    ...original,
    criarInscricao: vi.fn(),
  };
});

vi.mock("@/services/pagamento.service", () => ({
  iniciarPagamento: vi.fn(),
}));

const REDIRECT = new Error("NEXT_REDIRECT_TEST");
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw REDIRECT;
  }),
}));

function formDataDe(campos: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(campos)) fd.set(k, v);
  return fd;
}

const camposValidos = {
  eventoId: "evt1",
  nome: "Maria da Silva",
  email: "maria@example.com",
  celular: "(11) 98765-4321",
  documento: "529.982.247-25",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("criarInscricaoEPagarAction", () => {
  it("dados válidos: cria inscrição, inicia pix e redireciona", async () => {
    vi.mocked(criarInscricao).mockResolvedValue({ id: "insc1" } as never);
    vi.mocked(iniciarPagamento).mockResolvedValue({} as never);

    await expect(
      criarInscricaoEPagarAction(undefined, formDataDe(camposValidos)),
    ).rejects.toBe(REDIRECT);

    expect(criarInscricao).toHaveBeenCalledWith(
      expect.objectContaining({ eventoId: "evt1", nome: "Maria da Silva" }),
    );
    expect(iniciarPagamento).toHaveBeenCalledWith({
      inscricaoId: "insc1",
      metodo: "pix",
    });
  });

  it("CPF inválido: devolve erro de campo sem chamar services", async () => {
    const state = await criarInscricaoEPagarAction(
      undefined,
      formDataDe({ ...camposValidos, documento: "111.111.111-11" }),
    );

    expect(state?.erros?.documento?.[0]).toMatch(/CPF/);
    expect(state?.valores?.nome).toBe("Maria da Silva"); // não perde o digitado
    expect(criarInscricao).not.toHaveBeenCalled();
  });

  it("vagas esgotadas: devolve mensagem amigável", async () => {
    vi.mocked(criarInscricao).mockRejectedValue(new SemVagasError());

    const state = await criarInscricaoEPagarAction(
      undefined,
      formDataDe(camposValidos),
    );

    expect(state?.mensagem).toMatch(/vagas/i);
  });

  it("erro inesperado: mensagem genérica, sem vazar detalhes", async () => {
    vi.mocked(criarInscricao).mockRejectedValue(new Error("stack interna"));

    const state = await criarInscricaoEPagarAction(
      undefined,
      formDataDe(camposValidos),
    );

    expect(state?.mensagem).toBeTruthy();
    expect(state?.mensagem).not.toMatch(/stack interna/);
  });
});

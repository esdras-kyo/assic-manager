import { beforeEach, describe, expect, it, vi } from "vitest";

import { criarInscricaoEPagarAction } from "@/app/eventos/[slug]/inscricao/actions";
import { buscarEventoPorId } from "@/services/evento.service";
import { enviarInscricaoRecebida } from "@/services/email.service";
import { criarInscricao, SemVagasError } from "@/services/inscricao.service";

vi.mock("@/services/evento.service", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/services/evento.service")>();
  return { ...original, buscarEventoPorId: vi.fn() };
});

vi.mock("@/services/inscricao.service", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/services/inscricao.service")>();
  return { ...original, criarInscricao: vi.fn() };
});

vi.mock("@/services/consulta.service", () => ({
  criarTokenConsulta: vi.fn().mockResolvedValue("tok123"),
  montarLinkConsulta: vi.fn(
    () => "https://assic.example.com/minhas-inscricoes/tok123",
  ),
}));

vi.mock("@/services/email.service", () => ({
  enviarInscricaoRecebida: vi.fn(),
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

const eventoGateway = {
  id: "evt1",
  modalidadePagamento: "GATEWAY",
  camposPersonalizados: null,
} as never;

const eventoManual = {
  id: "evt2",
  modalidadePagamento: "MANUAL",
  camposPersonalizados: [
    { id: "cidade", label: "Cidade", tipo: "texto", obrigatorio: true },
  ],
} as never;

const nucleo = {
  eventoId: "evt1",
  nome: "Maria da Silva",
  email: "maria@example.com",
  celular: "(11) 98765-4321",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("criarInscricaoEPagarAction", () => {
  it("evento GATEWAY: cria, NÃO inicia pix, envia email recebida e redireciona", async () => {
    vi.mocked(buscarEventoPorId).mockResolvedValue(eventoGateway);
    vi.mocked(criarInscricao).mockResolvedValue({
      id: "insc1",
      nome: "Maria da Silva",
      email: "maria@example.com",
    } as never);

    await expect(
      criarInscricaoEPagarAction(undefined, formDataDe(nucleo)),
    ).rejects.toBe(REDIRECT);

    expect(enviarInscricaoRecebida).toHaveBeenCalledWith(
      expect.objectContaining({ email: "maria@example.com" }),
    );
  });

  it("evento MANUAL: cria como pendente e redireciona", async () => {
    vi.mocked(buscarEventoPorId).mockResolvedValue(eventoManual);
    vi.mocked(criarInscricao).mockResolvedValue({
      id: "insc2",
      nome: "Maria da Silva",
      email: "maria@example.com",
    } as never);

    await expect(
      criarInscricaoEPagarAction(
        undefined,
        formDataDe({ ...nucleo, eventoId: "evt2", cidade: "Goiânia" }),
      ),
    ).rejects.toBe(REDIRECT);

    expect(criarInscricao).toHaveBeenCalledWith(
      expect.objectContaining({
        camposExtras: expect.objectContaining({ cidade: "Goiânia" }),
      }),
    );
  });

  it("campo dinâmico obrigatório faltando: erro sem tocar services", async () => {
    vi.mocked(buscarEventoPorId).mockResolvedValue(eventoManual);

    const state = await criarInscricaoEPagarAction(
      undefined,
      formDataDe({ ...nucleo, eventoId: "evt2", cidade: "" }),
    );

    expect(state?.erros?.cidade?.length).toBeTruthy();
    expect(criarInscricao).not.toHaveBeenCalled();
  });

  it("vagas esgotadas: mensagem amigável", async () => {
    vi.mocked(buscarEventoPorId).mockResolvedValue(eventoGateway);
    vi.mocked(criarInscricao).mockRejectedValue(new SemVagasError());

    const state = await criarInscricaoEPagarAction(
      undefined,
      formDataDe(nucleo),
    );
    expect(state?.mensagem).toMatch(/vagas/i);
  });

  it("evento inexistente: mensagem amigável", async () => {
    vi.mocked(buscarEventoPorId).mockResolvedValue(null);

    const state = await criarInscricaoEPagarAction(
      undefined,
      formDataDe(nucleo),
    );
    expect(state?.mensagem).toBeTruthy();
    expect(criarInscricao).not.toHaveBeenCalled();
  });
});

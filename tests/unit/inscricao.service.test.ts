import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db";
import { EventoNaoEncontradoError } from "@/services/evento.service";
import { TransicaoInvalidaError } from "@/services/inscricao-maquina";
import {
  cancelarInscricao,
  confirmarInscricao,
  criarInscricao,
  EventoNaoAbertoError,
  expirarInscricao,
  InscricaoNaoEncontradaError,
  SemVagasError,
} from "@/services/inscricao.service";

vi.mock("@/lib/db", () => {
  const mock = {
    evento: { findUnique: vi.fn() },
    inscricao: {
      create: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  // $transaction(cb) roda o callback passando o próprio mock como tx.
  mock.$transaction.mockImplementation((cb: (tx: unknown) => unknown) =>
    cb(mock),
  );
  return { prisma: mock };
});

const mocked = vi.mocked(prisma, true);

const inscricaoValida = {
  eventoId: "evt1",
  nome: "Maria da Silva",
  email: "maria@example.com",
  celular: "(11) 98765-4321",
  documento: "529.982.247-25",
};

const eventoAberto = {
  id: "evt1",
  slug: "encontro",
  nome: "Encontro",
  descricao: null,
  local: "Salão",
  dataInicio: new Date("2026-07-10T19:00:00.000Z"),
  dataFim: null,
  precoEmCentavos: 5000,
  vagas: null,
  status: "ABERTO" as const,
  criadoEm: new Date(),
  atualizadoEm: new Date(),
};

const inscricaoDb = {
  id: "insc1",
  eventoId: "evt1",
  nome: "Maria da Silva",
  email: "maria@example.com",
  celular: "11987654321",
  documento: "52998224725",
  camposExtras: null,
  status: "PENDENTE" as const,
  criadoEm: new Date(),
  atualizadoEm: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  // Reaponta o callback para o próprio mock (a tipagem real de $transaction
  // não interessa ao teste).
  mocked.$transaction.mockImplementation(((cb: (tx: unknown) => unknown) =>
    cb(mocked)) as never);
});

describe("criarInscricao", () => {
  it("cria PENDENTE com dados normalizados em evento ABERTO", async () => {
    mocked.evento.findUnique.mockResolvedValue(eventoAberto);
    mocked.inscricao.create.mockResolvedValue(inscricaoDb);

    await criarInscricao(inscricaoValida);

    expect(mocked.inscricao.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        eventoId: "evt1",
        celular: "11987654321",
        documento: "52998224725",
      }),
    });
  });

  it("rejeita input inválido sem tocar o banco", async () => {
    await expect(
      criarInscricao({ ...inscricaoValida, documento: "111.111.111-11" }),
    ).rejects.toThrow();
    expect(mocked.evento.findUnique).not.toHaveBeenCalled();
  });

  it("falha se evento não existe", async () => {
    mocked.evento.findUnique.mockResolvedValue(null);
    await expect(criarInscricao(inscricaoValida)).rejects.toBeInstanceOf(
      EventoNaoEncontradoError,
    );
  });

  it.each(["RASCUNHO", "ENCERRADO", "CANCELADO"] as const)(
    "falha se evento está %s",
    async (status) => {
      mocked.evento.findUnique.mockResolvedValue({ ...eventoAberto, status });
      await expect(criarInscricao(inscricaoValida)).rejects.toBeInstanceOf(
        EventoNaoAbertoError,
      );
    },
  );

  it("falha quando vagas esgotadas (conta PENDENTE+CONFIRMADA)", async () => {
    mocked.evento.findUnique.mockResolvedValue({ ...eventoAberto, vagas: 2 });
    mocked.inscricao.count.mockResolvedValue(2);

    await expect(criarInscricao(inscricaoValida)).rejects.toBeInstanceOf(
      SemVagasError,
    );
    expect(mocked.inscricao.count).toHaveBeenCalledWith({
      where: {
        eventoId: "evt1",
        status: { in: ["PENDENTE", "CONFIRMADA"] },
      },
    });
    expect(mocked.inscricao.create).not.toHaveBeenCalled();
  });

  it("cria quando ainda há vaga", async () => {
    mocked.evento.findUnique.mockResolvedValue({ ...eventoAberto, vagas: 2 });
    mocked.inscricao.count.mockResolvedValue(1);
    mocked.inscricao.create.mockResolvedValue(inscricaoDb);

    await criarInscricao(inscricaoValida);
    expect(mocked.inscricao.create).toHaveBeenCalled();
  });

  it("sem limite de vagas não consulta contagem", async () => {
    mocked.evento.findUnique.mockResolvedValue(eventoAberto);
    mocked.inscricao.create.mockResolvedValue(inscricaoDb);

    await criarInscricao(inscricaoValida);
    expect(mocked.inscricao.count).not.toHaveBeenCalled();
  });
});

describe("transições", () => {
  it("confirma inscrição PENDENTE", async () => {
    mocked.inscricao.findUnique.mockResolvedValue(inscricaoDb);
    mocked.inscricao.update.mockResolvedValue({
      ...inscricaoDb,
      status: "CONFIRMADA",
    });

    await confirmarInscricao("insc1");
    expect(mocked.inscricao.update).toHaveBeenCalledWith({
      where: { id: "insc1" },
      data: { status: "CONFIRMADA" },
    });
  });

  it("não confirma inscrição EXPIRADA", async () => {
    mocked.inscricao.findUnique.mockResolvedValue({
      ...inscricaoDb,
      status: "EXPIRADA",
    });
    await expect(confirmarInscricao("insc1")).rejects.toBeInstanceOf(
      TransicaoInvalidaError,
    );
    expect(mocked.inscricao.update).not.toHaveBeenCalled();
  });

  it("cancela e expira inscrição PENDENTE", async () => {
    mocked.inscricao.findUnique.mockResolvedValue(inscricaoDb);
    mocked.inscricao.update.mockResolvedValue({
      ...inscricaoDb,
      status: "CANCELADA",
    });
    await cancelarInscricao("insc1");

    mocked.inscricao.findUnique.mockResolvedValue(inscricaoDb);
    await expirarInscricao("insc1");
    expect(mocked.inscricao.update).toHaveBeenLastCalledWith({
      where: { id: "insc1" },
      data: { status: "EXPIRADA" },
    });
  });

  it("falha se inscrição não existe", async () => {
    mocked.inscricao.findUnique.mockResolvedValue(null);
    await expect(confirmarInscricao("nada")).rejects.toBeInstanceOf(
      InscricaoNaoEncontradaError,
    );
  });
});

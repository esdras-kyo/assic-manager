import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db";
import {
  atualizarEvento,
  buscarEventoPorSlug,
  cancelarEvento,
  criarEvento,
  encerrarEvento,
  EventoNaoEncontradoError,
  listarEventosAbertos,
  publicarEvento,
  SlugEmUsoError,
  TransicaoEventoInvalidaError,
} from "@/services/evento.service";

vi.mock("@/lib/db", () => ({
  prisma: {
    evento: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

const mocked = vi.mocked(prisma.evento, true);

const eventoValido = {
  nome: "Encontro de Junho",
  slug: "encontro-de-junho",
  local: "Salão Principal",
  dataInicio: "2026-07-10T19:00:00.000Z",
  precoEmCentavos: 5000,
};

const eventoDb = {
  id: "evt1",
  slug: "encontro-de-junho",
  nome: "Encontro de Junho",
  descricao: null,
  local: "Salão Principal",
  dataInicio: new Date("2026-07-10T19:00:00.000Z"),
  dataFim: null,
  precoEmCentavos: 5000,
  vagas: null,
  status: "RASCUNHO" as const,
  criadoEm: new Date(),
  atualizadoEm: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("criarEvento", () => {
  it("valida e persiste com data coagida", async () => {
    mocked.create.mockResolvedValue(eventoDb);
    await criarEvento(eventoValido);
    expect(mocked.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        slug: "encontro-de-junho",
        dataInicio: new Date("2026-07-10T19:00:00.000Z"),
      }),
    });
  });

  it("rejeita input inválido sem tocar o banco", async () => {
    await expect(
      criarEvento({ ...eventoValido, nome: "ab" }),
    ).rejects.toThrow();
    expect(mocked.create).not.toHaveBeenCalled();
  });

  it("traduz P2002 para SlugEmUsoError", async () => {
    mocked.create.mockRejectedValue(
      Object.assign(new Error("unique"), { code: "P2002" }),
    );
    await expect(criarEvento(eventoValido)).rejects.toBeInstanceOf(
      SlugEmUsoError,
    );
  });
});

describe("publicarEvento", () => {
  it("RASCUNHO com data futura vira ABERTO", async () => {
    mocked.findUnique.mockResolvedValue(eventoDb);
    mocked.update.mockResolvedValue({ ...eventoDb, status: "ABERTO" });
    await publicarEvento("evt1");
    expect(mocked.update).toHaveBeenCalledWith({
      where: { id: "evt1" },
      data: { status: "ABERTO" },
    });
  });

  it("falha se evento não existe", async () => {
    mocked.findUnique.mockResolvedValue(null);
    await expect(publicarEvento("nada")).rejects.toBeInstanceOf(
      EventoNaoEncontradoError,
    );
  });

  it("falha se já está ABERTO", async () => {
    mocked.findUnique.mockResolvedValue({ ...eventoDb, status: "ABERTO" });
    await expect(publicarEvento("evt1")).rejects.toBeInstanceOf(
      TransicaoEventoInvalidaError,
    );
  });

  it("falha se dataInicio já passou", async () => {
    mocked.findUnique.mockResolvedValue({
      ...eventoDb,
      dataInicio: new Date("2020-01-01T00:00:00.000Z"),
    });
    await expect(publicarEvento("evt1")).rejects.toThrow(/passad/i);
  });
});

describe("encerrarEvento / cancelarEvento", () => {
  it("ABERTO encerra", async () => {
    mocked.findUnique.mockResolvedValue({ ...eventoDb, status: "ABERTO" });
    mocked.update.mockResolvedValue({ ...eventoDb, status: "ENCERRADO" });
    await encerrarEvento("evt1");
    expect(mocked.update).toHaveBeenCalledWith({
      where: { id: "evt1" },
      data: { status: "ENCERRADO" },
    });
  });

  it("RASCUNHO não encerra", async () => {
    mocked.findUnique.mockResolvedValue(eventoDb);
    await expect(encerrarEvento("evt1")).rejects.toBeInstanceOf(
      TransicaoEventoInvalidaError,
    );
  });

  it("RASCUNHO e ABERTO cancelam; ENCERRADO não", async () => {
    mocked.findUnique.mockResolvedValue(eventoDb);
    mocked.update.mockResolvedValue({ ...eventoDb, status: "CANCELADO" });
    await cancelarEvento("evt1");

    mocked.findUnique.mockResolvedValue({ ...eventoDb, status: "ENCERRADO" });
    await expect(cancelarEvento("evt1")).rejects.toBeInstanceOf(
      TransicaoEventoInvalidaError,
    );
  });
});

describe("atualizarEvento", () => {
  it("dataFim sozinha anterior à dataInicio existente falha", async () => {
    mocked.findUnique.mockResolvedValue(eventoDb);
    await expect(
      atualizarEvento("evt1", { dataFim: "2026-07-09T19:00:00.000Z" }),
    ).rejects.toThrow(/antes/i);
    expect(mocked.update).not.toHaveBeenCalled();
  });

  it("atualização válida persiste", async () => {
    mocked.findUnique.mockResolvedValue(eventoDb);
    mocked.update.mockResolvedValue({ ...eventoDb, nome: "Novo Nome" });
    await atualizarEvento("evt1", { nome: "Novo Nome" });
    expect(mocked.update).toHaveBeenCalledWith({
      where: { id: "evt1" },
      data: expect.objectContaining({ nome: "Novo Nome" }),
    });
  });
});

describe("consultas", () => {
  it("listarEventosAbertos filtra por ABERTO", async () => {
    mocked.findMany.mockResolvedValue([]);
    await listarEventosAbertos();
    expect(mocked.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "ABERTO" } }),
    );
  });

  it("buscarEventoPorSlug usa o slug", async () => {
    mocked.findUnique.mockResolvedValue(eventoDb);
    await buscarEventoPorSlug("encontro-de-junho");
    expect(mocked.findUnique).toHaveBeenCalledWith({
      where: { slug: "encontro-de-junho" },
    });
  });
});

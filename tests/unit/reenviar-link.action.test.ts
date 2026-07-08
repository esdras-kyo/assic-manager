import { beforeEach, describe, expect, it, vi } from "vitest";

import { reenviarLinkAction } from "@/app/pagamento/[inscricaoId]/actions";
import { prisma } from "@/lib/db";
import { solicitarLinkConsulta } from "@/services/consulta.service";

vi.mock("@/lib/db", () => ({
  prisma: { inscricao: { findUnique: vi.fn() } },
}));
vi.mock("@/services/consulta.service", () => ({
  solicitarLinkConsulta: vi.fn(),
}));
vi.mock("@/services/pagamento.service", () => ({ iniciarPagamento: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const mocked = vi.mocked(prisma, true);

beforeEach(() => vi.clearAllMocks());

describe("reenviarLinkAction", () => {
  it("acha a inscrição e dispara o link para o email dela", async () => {
    mocked.inscricao.findUnique.mockResolvedValue({
      email: "maria@example.com",
    } as never);

    await reenviarLinkAction("insc1");

    expect(solicitarLinkConsulta).toHaveBeenCalledWith("maria@example.com");
  });

  it("inscrição inexistente: não envia nada", async () => {
    mocked.inscricao.findUnique.mockResolvedValue(null);
    await reenviarLinkAction("nada");
    expect(solicitarLinkConsulta).not.toHaveBeenCalled();
  });
});

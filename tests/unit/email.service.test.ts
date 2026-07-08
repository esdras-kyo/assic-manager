import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  enviarConfirmacaoInscricao,
  enviarInscricaoRecebida,
  enviarLinkConsulta,
} from "@/services/email.service";
import { getEmailSender } from "@/services/email";

vi.mock("@/services/email", () => ({
  getEmailSender: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  getEnv: vi.fn(() => ({ EMAIL_REPLY_TO: "contato@marketingamesa.com.br" })),
}));

const sendMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getEmailSender).mockReturnValue({
    name: "mock",
    send: sendMock,
  });
});

describe("enviarConfirmacaoInscricao", () => {
  const dados = {
    nome: "Maria da Silva",
    email: "maria@example.com",
    eventoNome: "Encontro de Junho",
    eventoLocal: "Salão Principal",
    eventoDataInicio: new Date("2026-07-10T19:00:00.000Z"),
    eventoDataFim: null,
  };

  it("envia para o email do inscrito com evento no assunto", async () => {
    await enviarConfirmacaoInscricao(dados);

    expect(sendMock).toHaveBeenCalledOnce();
    const msg = sendMock.mock.calls[0][0];
    expect(msg.to).toBe("maria@example.com");
    expect(msg.subject).toMatch(/Encontro de Junho/);
    expect(msg.text).toMatch(/Maria/);
    expect(msg.text).toMatch(/Salão Principal/);
  });

  it("inclui replyTo e subject com hífen", async () => {
    await enviarConfirmacaoInscricao(dados);
    const msg = sendMock.mock.calls[0][0];
    expect(msg.replyTo).toBe("contato@marketingamesa.com.br");
    expect(msg.subject).toBe("Inscrição confirmada - Encontro de Junho");
  });

  it("texto sem emoji de festa e com a nova linha final", async () => {
    await enviarConfirmacaoInscricao(dados);
    const msg = sendMock.mock.calls[0][0];
    expect(msg.text).not.toContain("🎉");
    expect(msg.text).toContain("responda esta mensagem");
    expect(msg.html).not.toContain("🎉");
    expect(msg.html).toContain("responda este email ou fale com a organização");
  });

  it("inclui header List-Unsubscribe a partir do reply-to", async () => {
    await enviarConfirmacaoInscricao(dados);
    const msg = sendMock.mock.calls[0][0];
    expect(msg.headers?.["List-Unsubscribe"]).toBe(
      "<mailto:contato@marketingamesa.com.br>",
    );
  });
});

describe("enviarInscricaoRecebida", () => {
  const dados = {
    nome: "Maria da Silva",
    email: "maria@example.com",
    eventoNome: "Encontro de Junho",
    link: "https://assic.example.com/minhas-inscricoes/abc123",
  };

  it("envia para o inscrito com link e assunto do evento", async () => {
    await enviarInscricaoRecebida(dados);
    expect(sendMock).toHaveBeenCalledOnce();
    const msg = sendMock.mock.calls[0][0];
    expect(msg.to).toBe("maria@example.com");
    expect(msg.subject).toMatch(/Encontro de Junho/);
    expect(msg.text).toContain(dados.link);
    expect(msg.html).toContain(`href="${dados.link}"`);
  });
});

describe("enviarLinkConsulta", () => {
  it("envia o link de consulta para o email informado", async () => {
    const link = "https://assic.example.com/minhas-inscricoes/xyz";
    await enviarLinkConsulta({ email: "joao@example.com", link });
    const msg = sendMock.mock.calls[0][0];
    expect(msg.to).toBe("joao@example.com");
    expect(msg.text).toContain(link);
    expect(msg.html).toContain(`href="${link}"`);
  });
});

describe("ConsoleEmailSender", () => {
  it("loga a mensagem sem lançar", async () => {
    const { ConsoleEmailSender } =
      await import("@/services/email/senders/console.sender");
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    const sender = new ConsoleEmailSender();

    await sender.send({ to: "a@b.c", subject: "Oi", text: "corpo" });

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

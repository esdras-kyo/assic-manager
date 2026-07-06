import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ResendEmailSender } from "@/services/email/senders/resend.sender";

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ResendEmailSender", () => {
  it("lança sem API key", () => {
    expect(() => new ResendEmailSender(undefined, "a@b.com")).toThrow(
      /RESEND_API_KEY/,
    );
  });

  it("lança sem remetente", () => {
    expect(() => new ResendEmailSender("re_x", undefined)).toThrow(
      /EMAIL_FROM/,
    );
  });

  it("envia via POST /emails com auth e payload", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "",
    } as Response);

    const sender = new ResendEmailSender("re_x", "ASSIC <no@dominio.com>");
    await sender.send({
      to: "maria@example.com",
      subject: "Oi",
      text: "corpo",
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer re_x");
    const body = JSON.parse(init.body);
    expect(body.from).toBe("ASSIC <no@dominio.com>");
    expect(body.to).toEqual(["maria@example.com"]);
    expect(body.subject).toBe("Oi");
    expect(body.text).toBe("corpo");
  });

  it("propaga erro HTTP do Resend", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 422,
      text: async () => '{"message":"invalid from"}',
    } as Response);

    const sender = new ResendEmailSender("re_x", "no@dominio.com");
    await expect(
      sender.send({ to: "a@b.com", subject: "s", text: "t" }),
    ).rejects.toThrow(/422/);
  });

  it("inclui reply_to quando replyTo é passado", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "",
    } as Response);

    const sender = new ResendEmailSender("re_x", "ASSIC <no@dominio.com>");
    await sender.send({
      to: "maria@example.com",
      subject: "Oi",
      text: "corpo",
      replyTo: "contato@marketingamesa.com.br",
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.reply_to).toBe("contato@marketingamesa.com.br");
  });

  it("omite reply_to quando replyTo não é passado", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "",
    } as Response);

    const sender = new ResendEmailSender("re_x", "ASSIC <no@dominio.com>");
    await sender.send({ to: "a@b.com", subject: "s", text: "t" });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.reply_to).toBeUndefined();
  });
});

import { describe, expect, it } from "vitest";

import {
  montarHtmlInscricaoRecebida,
  montarHtmlLinkConsulta,
  montarTextoInscricaoRecebida,
  montarTextoLinkConsulta,
} from "@/services/email/templates";

const link = "https://assic.example.com/minhas-inscricoes/abc123";

describe("inscrição recebida", () => {
  const d = { primeiroNome: "Maria", eventoNome: "Encontro de Junho", link };

  it("texto tem nome, evento, aviso de vaga guardada e o link", () => {
    const t = montarTextoInscricaoRecebida(d);
    expect(t).toMatch(/Maria/);
    expect(t).toMatch(/Encontro de Junho/);
    expect(t).toMatch(/guardad/i);
    expect(t).toContain(link);
  });

  it("html tem o link como href e escapa o evento", () => {
    const h = montarHtmlInscricaoRecebida({ ...d, eventoNome: "A & B" });
    expect(h).toContain(`href="${link}"`);
    expect(h).toContain("A &amp; B");
  });
});

describe("link de consulta", () => {
  it("texto e html trazem o link", () => {
    expect(montarTextoLinkConsulta({ link })).toContain(link);
    expect(montarHtmlLinkConsulta({ link })).toContain(`href="${link}"`);
  });
});

import { describe, expect, it } from "vitest";

import { assinarSessao, verificarSessaoToken } from "@/lib/auth";

const SECRET = "um-segredo-de-teste-com-32-chars!!";

describe("sessão (jose)", () => {
  it("assina e verifica roundtrip", async () => {
    const token = await assinarSessao({ adminId: "adm1" }, SECRET);
    const sessao = await verificarSessaoToken(token, SECRET);
    expect(sessao).toEqual({ adminId: "adm1" });
  });

  it("token adulterado é rejeitado", async () => {
    const token = await assinarSessao({ adminId: "adm1" }, SECRET);
    const adulterado = token.slice(0, -4) + "XXXX";
    expect(await verificarSessaoToken(adulterado, SECRET)).toBeNull();
  });

  it("secret errado é rejeitado", async () => {
    const token = await assinarSessao({ adminId: "adm1" }, SECRET);
    expect(
      await verificarSessaoToken(token, "outro-segredo-de-32-caracteres!!!"),
    ).toBeNull();
  });

  it("token expirado é rejeitado", async () => {
    const token = await assinarSessao({ adminId: "adm1" }, SECRET, {
      duracaoSegundos: -10,
    });
    expect(await verificarSessaoToken(token, SECRET)).toBeNull();
  });

  it("lixo não explode, retorna null", async () => {
    expect(await verificarSessaoToken("nao-e-um-jwt", SECRET)).toBeNull();
  });
});

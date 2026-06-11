import { describe, expect, it } from "vitest";

import { gerarCsv } from "@/lib/csv";

describe("gerarCsv (Excel pt-BR: separador ; e BOM)", () => {
  it("monta cabeçalho e linhas com CRLF", () => {
    const csv = gerarCsv(
      ["Nome", "Email"],
      [
        ["Maria", "maria@x.com"],
        ["João", "joao@x.com"],
      ],
    );
    expect(csv).toBe("﻿Nome;Email\r\nMaria;maria@x.com\r\nJoão;joao@x.com");
  });

  it("escapa separador, aspas e quebra de linha", () => {
    const csv = gerarCsv(
      ["Campo"],
      [["tem;separador"], ['tem "aspas"'], ["tem\nquebra"]],
    );
    const linhas = csv.replace("﻿", "").split("\r\n");
    expect(linhas[1]).toBe('"tem;separador"');
    expect(linhas[2]).toBe('"tem ""aspas"""');
    expect(linhas[3]).toBe('"tem\nquebra"');
  });

  it("célula vazia vira campo vazio", () => {
    const csv = gerarCsv(["A", "B"], [["x", ""]]);
    expect(csv.endsWith("x;")).toBe(true);
  });
});

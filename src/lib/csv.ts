// CSV para Excel pt-BR: separador ";" (vírgula é decimal no Brasil),
// BOM UTF-8 (acentos corretos ao abrir direto) e CRLF.

const SEPARADOR = ";";
const BOM = "﻿";

function escaparCelula(valor: string): string {
  if (/[";\n\r]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

export function gerarCsv(cabecalhos: string[], linhas: string[][]): string {
  const todas = [cabecalhos, ...linhas];
  const corpo = todas
    .map((linha) => linha.map(escaparCelula).join(SEPARADOR))
    .join("\r\n");
  return BOM + corpo;
}

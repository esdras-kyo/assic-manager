import { normalizarDigitos } from "@/lib/validations";

const moedaBRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Centavos (int) → "R$ 50,00". Zero vira "Gratuito" (clareza > jargão). */
export function formatarPrecoBRL(centavos: number): string {
  if (centavos === 0) return "Gratuito";
  // Intl emite non-breaking space — normaliza para espaço comum.
  return moedaBRL.format(centavos / 100).replace(/ /g, " ");
}

const dataExtensa = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

const horaCurta = new Intl.DateTimeFormat("pt-BR", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

/** "sexta-feira, 10 de julho de 2026, às 16h00" — legível em voz alta. */
export function formatarDataExtensa(data: Date): string {
  const hora = horaCurta.format(data).replace(":", "h");
  return `${dataExtensa.format(data)}, às ${hora}`;
}

/**
 * Entrada de preço do admin → centavos (int). Aceita "50", "50,00",
 * "1.234,56" (BR) e "50.5" (decimal com ponto). Inválido/negativo → null.
 */
export function reaisParaCentavos(valor: string): number | null {
  const bruto = valor.trim();
  if (!bruto) return null;

  // Vírgula presente = formato BR: pontos são milhar, vírgula é decimal.
  const normalizado = bruto.includes(",")
    ? bruto.replace(/\./g, "").replace(",", ".")
    : bruto;

  if (!/^\d+(\.\d+)?$/.test(normalizado)) return null;

  const reais = Number(normalizado);
  if (!Number.isFinite(reais) || reais < 0) return null;
  return Math.round(reais * 100);
}

/** "São João 2026!" → "sao-joao-2026" (slug de URL). */
export function gerarSlug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Eventos acontecem em São Paulo (fuso fixo -03:00 — Brasil sem DST desde
// 2019). O servidor pode rodar em UTC (Vercel): nunca interpretar
// datetime-local com o fuso do servidor.
const OFFSET_SP = "-03:00";

/** "2026-07-10T16:00" (horário SP do input) → Date UTC. */
export function inputLocalParaData(valor: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(valor)) return null;
  const data = new Date(`${valor}:00${OFFSET_SP}`);
  return Number.isNaN(data.getTime()) ? null : data;
}

const inputLocalFormatador = new Intl.DateTimeFormat("sv-SE", {
  // sv-SE produz "YYYY-MM-DD HH:mm" — vira valor de datetime-local com 1 replace
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

/** Date UTC → valor de input datetime-local no horário de SP. */
export function dataParaInputLocal(data: Date): string {
  return inputLocalFormatador.format(data).replace(" ", "T");
}

/** Máscara incremental de CPF: digite e os pontos aparecem. */
export function mascararCpf(valor: string): string {
  const d = normalizarDigitos(valor).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}

/** Máscara incremental de celular BR: (DD) 9XXXX-XXXX. */
export function mascararCelular(valor: string): string {
  const d = normalizarDigitos(valor).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

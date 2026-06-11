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

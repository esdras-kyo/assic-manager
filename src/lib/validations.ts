import { z } from "zod";

// Schemas compartilhados entre formulário (cliente) e API (servidor).
// Mensagens em PT, claras para público leigo (planoassic §5.1).

/** Remove tudo que não é dígito (máscaras de CPF, celular etc.). */
export function normalizarDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

/** Valida CPF pelos dígitos verificadores. Aceita com ou sem máscara. */
export function cpfValido(cpf: string): boolean {
  const digitos = normalizarDigitos(cpf);
  if (digitos.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digitos)) return false; // todos iguais

  const calcularDv = (tamanho: number): number => {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) {
      soma += Number(digitos[i]) * (tamanho + 1 - i);
    }
    return ((soma * 10) % 11) % 10;
  };

  return (
    calcularDv(9) === Number(digitos[9]) &&
    calcularDv(10) === Number(digitos[10])
  );
}

/** Celular BR: DDD (2 dígitos) + 9 + 8 dígitos = 11 dígitos. */
function celularValido(celular: string): boolean {
  const digitos = normalizarDigitos(celular);
  return /^[1-9][0-9]9[0-9]{8}$/.test(digitos);
}

export const inscricaoCreateSchema = z.object({
  eventoId: z.string().min(1, { error: "Evento é obrigatório" }),
  nome: z
    .string({ error: "Digite seu nome completo" })
    .trim()
    .min(3, { error: "Digite seu nome completo" })
    .max(120, { error: "Nome muito longo" }),
  email: z.email({ error: "Digite um email válido, como nome@exemplo.com" }),
  celular: z
    .string({ error: "Digite seu celular com DDD" })
    .refine(celularValido, {
      error: "Digite seu celular com DDD, como (11) 98765-4321",
    })
    .transform(normalizarDigitos),
  documento: z
    .string({ error: "Digite seu CPF" })
    .refine(cpfValido, { error: "CPF inválido. Confira os números digitados" })
    .transform(normalizarDigitos),
  camposExtras: z.record(z.string(), z.unknown()).optional(),
});

export type InscricaoCreateInput = z.input<typeof inscricaoCreateSchema>;
export type InscricaoCreate = z.output<typeof inscricaoCreateSchema>;

const eventoBaseSchema = z.object({
  nome: z
    .string({ error: "Nome do evento é obrigatório" })
    .trim()
    .min(3, { error: "Nome do evento precisa de pelo menos 3 letras" }),
  slug: z
    .string({ error: "Slug é obrigatório" })
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
      error: "Slug deve ter só letras minúsculas, números e hífens",
    }),
  descricao: z.string().trim().optional(),
  local: z
    .string({ error: "Local é obrigatório" })
    .trim()
    .min(2, { error: "Informe o local do evento" }),
  dataInicio: z.coerce.date({ error: "Data de início inválida" }),
  dataFim: z.coerce.date({ error: "Data de fim inválida" }).optional(),
  precoEmCentavos: z
    .number({ error: "Preço é obrigatório" })
    .int({ error: "Preço deve ser em centavos (número inteiro)" })
    .nonnegative({ error: "Preço não pode ser negativo" }),
  vagas: z
    .number()
    .int({ error: "Vagas deve ser um número inteiro" })
    .positive({ error: "Vagas deve ser maior que zero" })
    .optional(),
});

const dataFimAposInicio = {
  error: "Data de fim não pode ser antes da data de início",
  path: ["dataFim"],
};

export const eventoCreateSchema = eventoBaseSchema.refine(
  (data) => !data.dataFim || data.dataFim >= data.dataInicio,
  dataFimAposInicio,
);

export type EventoCreateInput = z.input<typeof eventoCreateSchema>;
export type EventoCreate = z.output<typeof eventoCreateSchema>;

// Em updates parciais, o cruzamento dataInicio×dataFim só é checável quando
// ambas vêm juntas; com uma só, o service valida contra o registro existente.
export const eventoUpdateSchema = eventoBaseSchema
  .partial()
  .refine(
    (data) =>
      !data.dataFim || !data.dataInicio || data.dataFim >= data.dataInicio,
    dataFimAposInicio,
  );

export type EventoUpdateInput = z.input<typeof eventoUpdateSchema>;
export type EventoUpdate = z.output<typeof eventoUpdateSchema>;

import { z } from "zod";

// Schemas compartilhados entre formulário (cliente) e API (servidor).
// Mensagens em PT, claras para público leigo (planoassic §5.1).

/** Remove tudo que não é dígito (máscaras de CPF, celular etc.). */
export function normalizarDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

/**
 * CPF "completo": exige só os 11 dígitos (com ou sem máscara). NÃO valida os
 * dígitos verificadores — CPF fake é aceito, basta ter os 11 números.
 */
export function cpfCompleto(cpf: string): boolean {
  return normalizarDigitos(cpf).length === 11;
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
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? normalizarDigitos(v) : undefined))
    .refine((v) => !v || v.length === 11, {
      error: "CPF precisa ter os 11 números",
    }),
  camposExtras: z.record(z.string(), z.unknown()).optional(),
});

export type InscricaoCreateInput = z.input<typeof inscricaoCreateSchema>;
export type InscricaoCreate = z.output<typeof inscricaoCreateSchema>;

export const pixManualSchema = z.object({
  chave: z.string().min(1),
  tipoChave: z.enum(["cnpj", "cpf", "email", "telefone", "aleatoria"]),
  beneficiario: z.string().min(1),
  instrucoes: z.string().optional(),
});
export type PixManual = z.infer<typeof pixManualSchema>;

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
  inclui: z.string().trim().optional(),
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
  modalidadePagamento: z.enum(["GATEWAY", "MANUAL"]).optional(),
  pixManual: pixManualSchema.optional(),
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

// --- Campos personalizados por evento ---

export const TIPOS_CAMPO = [
  "texto",
  "email",
  "tel",
  "textarea",
  "radio",
  "select",
  "checkbox",
] as const;
export type TipoCampo = (typeof TIPOS_CAMPO)[number];

export const campoPersonalizadoSchema = z
  .object({
    id: z.string().regex(/^[a-zA-Z][a-zA-Z0-9]*$/, {
      error: "id de campo deve ser alfanumérico começando por letra",
    }),
    label: z.string().min(1),
    tipo: z.enum(TIPOS_CAMPO),
    obrigatorio: z.boolean(),
    opcoes: z.array(z.string().min(1)).optional(),
    ajuda: z.string().optional(),
    autoComplete: z.string().optional(),
  })
  .refine(
    (c) =>
      (c.tipo !== "radio" && c.tipo !== "select") ||
      (c.opcoes !== undefined && c.opcoes.length > 0),
    { error: "Campos radio/select precisam de opções", path: ["opcoes"] },
  );

export type CampoPersonalizado = z.infer<typeof campoPersonalizadoSchema>;

export const camposPersonalizadosSchema = z.array(campoPersonalizadoSchema);

/**
 * Constrói um Zod object para validar as RESPOSTAS dos campos personalizados.
 * Valores vêm de FormData (strings); checkbox marcado = "on".
 */
export function construirSchemaCampos(campos: CampoPersonalizado[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const campo of campos) {
    let validador: z.ZodTypeAny;

    if (campo.tipo === "checkbox") {
      validador = campo.obrigatorio
        ? z.literal("on", {
            error: "Você precisa marcar esta opção para continuar",
          })
        : z.literal("on").optional();
    } else if (campo.tipo === "radio" || campo.tipo === "select") {
      const opcoes = (campo.opcoes ?? []) as [string, ...string[]];
      const base = z.enum(opcoes, { error: "Escolha uma opção" });
      validador = campo.obrigatorio ? base : z.optional(base).or(z.literal(""));
    } else if (campo.tipo === "email") {
      const base = z.email({ error: "Digite um email válido" });
      validador = campo.obrigatorio ? base : base.or(z.literal(""));
    } else {
      const base = z.string().trim();
      validador = campo.obrigatorio
        ? base.min(1, { error: `${campo.label} é obrigatório` })
        : base.optional();
    }

    shape[campo.id] = validador;
  }
  return z.object(shape);
}

// --- Conteúdo estruturado da landing ---

export const conteudoSchema = z.object({
  // Imagens do evento (URLs). Upload virá depois; por ora a URL é setada no
  // seed/config. imagemCapa (~1600x872) é o destaque em todas as etapas.
  imagemCapa: z.string().optional(),
  galeria: z.array(z.string()).optional(),
  subtitulo: z.string().optional(),
  apresentacao: z.array(z.string()).optional(),
  destaques: z.array(z.string()).optional(),
  horarios: z
    .array(z.object({ dia: z.string(), blocos: z.array(z.string()) }))
    .optional(),
  oQueEncontrara: z.array(z.string()).optional(),
  programacao: z
    .array(
      z.object({
        dia: z.string(),
        periodos: z.array(
          z.object({
            titulo: z.string().optional(),
            itens: z.array(z.string()),
          }),
        ),
      }),
    )
    .optional(),
  investimento: z.object({ inclui: z.string().optional() }).optional(),
  textoFinal: z
    .object({
      titulo: z.string(),
      corpo: z.string(),
      contatos: z.array(z.string()).optional(),
    })
    .optional(),
  fotos: z.array(z.string()).optional(),
});
export type Conteudo = z.infer<typeof conteudoSchema>;

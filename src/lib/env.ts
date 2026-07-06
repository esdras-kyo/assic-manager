import { z } from "zod";

// Vars que o RUNTIME do app exige. DIRECT_URL é só do Prisma CLI
// (prisma.config.ts) e fica de fora de propósito.
const envSchema = z.object({
  DATABASE_URL: z
    .string({ error: "DATABASE_URL é obrigatória" })
    .min(1, { error: "DATABASE_URL é obrigatória" }),
  PAYMENT_PROVIDER: z
    .enum(["fake", "pagarme", "mercadopago"], {
      error: "PAYMENT_PROVIDER deve ser fake, pagarme ou mercadopago",
    })
    .default("fake"),
  // Assinatura do webhook do FakeGateway — só desenvolvimento.
  FAKE_WEBHOOK_SECRET: z.string().min(1).default("fake-dev-secret"),
  // Mercado Pago — exigidas só quando PAYMENT_PROVIDER=mercadopago.
  // (Validação efetiva acontece no construtor do gateway.)
  MERCADOPAGO_ACCESS_TOKEN: z.string().optional(),
  MERCADOPAGO_WEBHOOK_SECRET: z.string().optional(),
  EMAIL_PROVIDER: z
    .enum(["console", "resend"], {
      error: "EMAIL_PROVIDER deve ser console ou resend",
    })
    .default("console"),
  // Resend — exigidas só quando EMAIL_PROVIDER=resend (validadas no sender).
  RESEND_API_KEY: z.string().optional(),
  // Remetente verificado, ex.: "ASSIC <nao-responda@marketingamesa.com.br>".
  EMAIL_FROM: z.string().optional(),
  // Reply-To opcional (header por mensagem), ex.: "contato@marketingamesa.com.br".
  EMAIL_REPLY_TO: z.string().optional(),
  // Assina o cookie de sessão do admin. Gerar com: openssl rand -base64 32
  AUTH_SECRET: z
    .string({ error: "AUTH_SECRET é obrigatória" })
    .min(32, { error: "AUTH_SECRET precisa de pelo menos 32 caracteres" }),
});

export type Env = z.infer<typeof envSchema>;

/** Valida um dicionário de env. Lança erro legível citando as vars com problema. */
export function parseEnv(raw: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const detalhes = result.error.issues
      .map((issue) => `- ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Variáveis de ambiente inválidas:\n${detalhes}`);
  }
  return result.data;
}

let cached: Env | undefined;

/** Env validada e memoizada. Usar em código server-side no lugar de process.env. */
export function getEnv(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}

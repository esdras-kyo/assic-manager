import dotenv from "dotenv";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import {
  camposPersonalizadosSchema,
  conteudoSchema,
  pixManualSchema,
} from "../src/lib/validations";
import { conteudoAssic, localAssic } from "./dados-assic-2026";

// Seed de DESENVOLVIMENTO: evento de exemplo para enxergar as telas.
// Idempotente (upsert por slug). Rodar: npx prisma db seed

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  // --- ASSIC 2026 ---

  const pixManual = {
    chave: "26.619.189/0001-99",
    tipoChave: "cnpj" as const,
    beneficiario: "Associação das Igrejas de Cristo de Goiânia",
    instrucoes: "Pagamento exclusivamente via PIX.",
  };

  const camposPersonalizados = [
    {
      id: "cidade",
      label: "Cidade",
      tipo: "texto" as const,
      obrigatorio: true,
    },
    {
      id: "estado",
      label: "Estado (UF)",
      tipo: "texto" as const,
      obrigatorio: true,
    },
    {
      id: "igreja",
      label: "Igreja que congrega ou lidera",
      tipo: "texto" as const,
      obrigatorio: true,
    },
    {
      id: "cargo",
      label: "Cargo/Função Ministerial",
      tipo: "radio" as const,
      obrigatorio: true,
      opcoes: [
        "Pastor Titular",
        "Pastora Titular",
        "Pastor Auxiliar",
        "Líder Ministerial",
        "Missionário(a)",
        "Outro",
      ],
    },
    {
      id: "tempoMinisterio",
      label: "Há quanto tempo exerce o ministério?",
      tipo: "radio" as const,
      obrigatorio: false,
      opcoes: [
        "Menos de 5 anos",
        "5 a 10 anos",
        "11 a 20 anos",
        "Mais de 20 anos",
      ],
    },
    {
      id: "participaDoisDias",
      label: "Participará dos dois dias do evento?",
      tipo: "radio" as const,
      obrigatorio: true,
      opcoes: ["Sim", "Não"],
    },
    {
      id: "comoSoube",
      label: "Como ficou sabendo da Atualização Ministerial 2026?",
      tipo: "radio" as const,
      obrigatorio: true,
      opcoes: [
        "ASSIC",
        "WhatsApp",
        "Instagram",
        "Indicação de outro pastor",
        "Minha igreja",
        "Outro",
      ],
    },
    {
      id: "termo",
      label:
        "Declaro que as informações fornecidas são verdadeiras e estou ciente de que minha inscrição será confirmada após a validação do pagamento.",
      tipo: "checkbox" as const,
      obrigatorio: true,
    },
    {
      id: "autorizaImagem",
      label:
        "Autorizo o uso de minha imagem (fotos e vídeos) para divulgação do evento?",
      tipo: "radio" as const,
      obrigatorio: false,
      opcoes: ["Sim", "Não"],
    },
  ];

  // Validate config objects against Zod schemas before touching the DB.
  // Will throw loudly if data is malformed.
  pixManualSchema.parse(pixManual);
  conteudoSchema.parse(conteudoAssic);
  camposPersonalizadosSchema.parse(camposPersonalizados);

  const dadosAssic = {
    slug: "assic-2026",
    nome: "Atualização Ministerial Regional ASSIC 2026",
    descricao: "Atualizando para Crescer",
    local: localAssic,
    dataInicio: new Date("2026-08-07T19:30:00-03:00"),
    dataFim: new Date("2026-08-08T19:00:00-03:00"),
    precoEmCentavos: 3500,
    status: "ABERTO" as const,
    // Pix automático via Mercado Pago (gateway). pixManual fica como
    // registro do beneficiário; não é usado no modo GATEWAY.
    modalidadePagamento: "GATEWAY" as const,
    pixManual,
    conteudo: conteudoAssic,
    camposPersonalizados,
  };

  // update com os mesmos dados: re-rodar o seed REFRESCA o evento (conteúdo,
  // imagens, campos). update:{} deixaria mudanças sem efeito em evento existente.
  const assic = await prisma.evento.upsert({
    where: { slug: "assic-2026" },
    update: dadosAssic,
    create: dadosAssic,
  });

  console.info(`Seed ok: evento "${assic.nome}" (${assic.status})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

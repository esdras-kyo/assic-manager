import dotenv from "dotenv";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import {
  camposPersonalizadosSchema,
  conteudoSchema,
  pixManualSchema,
} from "../src/lib/validations";

// Seed de DESENVOLVIMENTO: evento de exemplo para enxergar as telas.
// Idempotente (upsert por slug). Rodar: npx prisma db seed

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const daquiUmMes = new Date();
  daquiUmMes.setMonth(daquiUmMes.getMonth() + 1);
  daquiUmMes.setHours(19, 0, 0, 0);

  const evento = await prisma.evento.upsert({
    where: { slug: "encontro-de-exemplo" },
    update: {},
    create: {
      slug: "encontro-de-exemplo",
      nome: "Encontro de Exemplo",
      descricao:
        "Um evento de exemplo para desenvolvimento.\n\nVenha passar uma tarde especial com a gente: música, boa companhia e um lanche caprichado no final.",
      local: "Salão Principal — Rua das Flores, 123",
      dataInicio: daquiUmMes,
      precoEmCentavos: 5000,
      vagas: 30,
      status: "ABERTO",
    },
  });

  console.info(`Seed ok: evento "${evento.nome}" (${evento.status})`);

  // --- ASSIC 2026 ---

  const pixManual = {
    chave: "26.619.189/0001-99",
    tipoChave: "cnpj" as const,
    beneficiario: "Associação das Igrejas de Cristo de Goiânia",
    instrucoes: "Pagamento exclusivamente via PIX.",
  };

  const conteudo = {
    // URLs de TESTE (picsum, com seed p/ serem estáveis). Trocar pelas imagens
    // reais do evento depois — capa ~1600x872.
    imagemCapa: "https://picsum.photos/seed/assic2026-capa/1600/872",
    galeria: [
      "https://picsum.photos/seed/assic2026-1/800/600",
      "https://picsum.photos/seed/assic2026-2/800/600",
      "https://picsum.photos/seed/assic2026-3/800/600",
      "https://picsum.photos/seed/assic2026-4/800/600",
      "https://picsum.photos/seed/assic2026-5/800/600",
    ],
    subtitulo: "Atualizando para Crescer",
    destaques: [
      "Atualizando para Crescer",
      "COMUNHÃO",
      "APRENDIZADO",
      "REFLEXÃO",
      "ATUALIZAÇÃO MINISTERIAL",
    ],
    apresentacao: [
      "Um encontro especial para pastores, pastoras e líderes ministeriais que desejam se preparar para os desafios da igreja nos dias atuais.",
      "Durante dois dias, viveremos momentos de COMUNHÃO, APRENDIZADO, REFLEXÃO e ATUALIZAÇÃO MINISTERIAL, com ministrações, painéis temáticos e oportunidades de networking com líderes de diversas regiões.",
    ],
    horarios: [
      { dia: "Sexta-feira (07/08)", blocos: ["19h30 às 22h00"] },
      { dia: "Sábado (08/08)", blocos: ["09h00 às 12h00", "15h30 às 19h00"] },
    ],
    oQueEncontrara: [
      "Ministrações voltadas para os desafios atuais da liderança cristã.",
      "Atualização ministerial prática e relevante.",
      "Painéis específicos para homens, mulheres e filhos de pastores.",
      "Momentos de comunhão e networking entre líderes.",
      "Ambiente de crescimento, fortalecimento e encorajamento ministerial.",
    ],
    programacao: [
      {
        dia: "Dia 01 — Sexta-feira",
        periodos: [
          {
            itens: [
              "Abertura e boas-vindas",
              "Louvor com Igreja de Cristo do Garavelo",
              "Ministração com Pr. Edilson Nascimento",
              "Momento de comunhão e networking",
              "Coffee-break",
            ],
          },
        ],
      },
      {
        dia: "Dia 02 — Sábado",
        periodos: [
          {
            titulo: "Manhã",
            itens: [
              "Abertura e boas-vindas",
              "Louvor com Igreja de Cristo do Solange Park",
              "Ministração com Pr. João Márcio",
              "Ministração com Bispo Flávio",
              "Intervalo para almoço (este ano a ASSIC não oferecerá almoço)",
            ],
          },
          {
            titulo: "Tarde",
            itens: [
              "Abertura — Louvor Igreja de Cristo Madre Germano",
              "Teatro com Equipe Yeshua",
              "Painel para Mulheres — Pra. Andrea Patricia",
              "Painel para Homens — Pr. Clodoaldo Lourenço",
              "Painel para Filhos de Pastores — Hans Miller Rodrigues",
              "Ministração com Pr. Roberto",
              "Encerramento e confraternização",
            ],
          },
        ],
      },
    ],
    investimento: {
      valorTexto: "R$ 35,00 por participante",
      inclui:
        "O valor inclui a participação em toda a programação do evento e os momentos de coffee-break.",
    },
    textoFinal: {
      titulo: "Inscrição recebida com sucesso!",
      corpo:
        "Agradecemos seu interesse em participar da Atualização Ministerial Regional ASSIC 2026. Após a validação do pagamento, sua inscrição estará confirmada.",
      contatos: [
        "WhatsApp (62) 9386-5467 ou (62) 99612-1393",
        "E-mail: assicgomkt@gmail.com",
      ],
    },
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
  conteudoSchema.parse(conteudo);
  camposPersonalizadosSchema.parse(camposPersonalizados);

  const dadosAssic = {
    slug: "assic-2026",
    nome: "Atualização Ministerial Regional ASSIC 2026",
    descricao: "Atualizando para Crescer",
    local:
      "Igreja de Cristo Maranata — Avenida Abel Coimbra, Qd. 86, Lt. 09, Cidade Jardim, Goiânia/GO",
    dataInicio: new Date("2026-08-07T19:30:00-03:00"),
    dataFim: new Date("2026-08-08T19:00:00-03:00"),
    precoEmCentavos: 3500,
    status: "ABERTO" as const,
    modalidadePagamento: "MANUAL" as const,
    pixManual,
    conteudo,
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

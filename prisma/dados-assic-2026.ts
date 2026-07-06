// Dados de conteúdo do evento ASSIC 2026, compartilhados entre o seed (dev)
// e o script de atualização cirúrgica (produção).

export const localAssic =
  "Igreja de Cristo Novo Horizonte — Avenida Engenheiro José Martins Filho, Qd. 55, Lt. 718-804, Vila Novo Horizonte, Goiânia/GO";

export const conteudoAssic = {
  // Imagens reais do evento (R2 via worker). Capa = "capa-atualizac_ao".
  imagemCapa:
    "https://worker-1.esdrascamel.workers.dev/8949d12c-b0b0-4557-8ae4-97d01264689d-capa-atualizac_ao.jpeg",
  galeria: [
    "https://worker-1.esdrascamel.workers.dev/181968d7-a1a0-4174-9659-924d47c720e6-assicgo_1753092868740.jpeg",
    "https://worker-1.esdrascamel.workers.dev/9b596bba-1ba5-4d5b-b866-61b7cde76acb-assicgo_1753092874363.jpeg",
    "https://worker-1.esdrascamel.workers.dev/c6cf7fc1-f0b9-4204-85a8-fa6a691ecedd-assicgo_1753092877917.jpeg",
    "https://worker-1.esdrascamel.workers.dev/aaadf9d6-1f15-4ef4-839a-e7ad30182be8-assicgo_1753092906012.jpeg",
    "https://worker-1.esdrascamel.workers.dev/ee6b3b5f-0d74-4d28-8dd6-adbed634b79a-IMG_2733.JPG",
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
            "Ministração com Pr. Edilson Nascimento — Capacitação das futuras gerações",
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
            "Ministração com Pr. João Márcio — A força missionária da igreja local",
            "Ministração com Bispo Flávio — A economia do reino de Deus",
            "Intervalo para almoço (este ano a ASSIC não oferecerá almoço)",
          ],
        },
        {
          titulo: "Tarde",
          itens: [
            "Abertura — Louvor Igreja de Cristo Madre Germano",
            "Teatro com Igreja de Cristo Shangrilá",
            "Painel para Mulheres — Pra. Andrea Patricia",
            "Painel para Homens — Pr. Clodoaldo Lourenço — Uma visão dada por Deus",
            "Painel para Filhos de Pastores — Hans Miller Rodrigues — Formando uma nova geração",
            "Ministração com Pr. Roberto",
            "Encerramento e confraternização",
          ],
        },
      ],
    },
  ],
  investimento: {
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

-- CreateEnum
CREATE TYPE "EventoStatus" AS ENUM ('RASCUNHO', 'ABERTO', 'ENCERRADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "InscricaoStatus" AS ENUM ('PENDENTE', 'CONFIRMADA', 'CANCELADA', 'EXPIRADA');

-- CreateEnum
CREATE TYPE "MetodoPagamento" AS ENUM ('PIX', 'CREDIT_CARD');

-- CreateEnum
CREATE TYPE "PagamentoStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Evento" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "local" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "precoEmCentavos" INTEGER NOT NULL,
    "vagas" INTEGER,
    "status" "EventoStatus" NOT NULL DEFAULT 'RASCUNHO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inscricao" (
    "id" TEXT NOT NULL,
    "eventoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "celular" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "camposExtras" JSONB,
    "status" "InscricaoStatus" NOT NULL DEFAULT 'PENDENTE',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inscricao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pagamento" (
    "id" TEXT NOT NULL,
    "inscricaoId" TEXT NOT NULL,
    "gateway" TEXT NOT NULL,
    "gatewayPaymentId" TEXT NOT NULL,
    "metodo" "MetodoPagamento" NOT NULL,
    "status" "PagamentoStatus" NOT NULL DEFAULT 'PENDING',
    "amountInCents" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Evento_slug_key" ON "Evento"("slug");

-- CreateIndex
CREATE INDEX "Inscricao_eventoId_idx" ON "Inscricao"("eventoId");

-- CreateIndex
CREATE INDEX "Inscricao_status_idx" ON "Inscricao"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Pagamento_gatewayPaymentId_key" ON "Pagamento"("gatewayPaymentId");

-- CreateIndex
CREATE INDEX "Pagamento_inscricaoId_idx" ON "Pagamento"("inscricaoId");

-- CreateIndex
CREATE INDEX "Pagamento_gatewayPaymentId_idx" ON "Pagamento"("gatewayPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- AddForeignKey
ALTER TABLE "Inscricao" ADD CONSTRAINT "Inscricao_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_inscricaoId_fkey" FOREIGN KEY ("inscricaoId") REFERENCES "Inscricao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

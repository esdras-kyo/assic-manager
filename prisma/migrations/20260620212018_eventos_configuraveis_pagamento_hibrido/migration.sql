-- CreateEnum
CREATE TYPE "ModalidadePagamento" AS ENUM ('GATEWAY', 'MANUAL');

-- AlterTable
ALTER TABLE "Evento" ADD COLUMN     "camposPersonalizados" JSONB,
ADD COLUMN     "conteudo" JSONB,
ADD COLUMN     "modalidadePagamento" "ModalidadePagamento" NOT NULL DEFAULT 'GATEWAY',
ADD COLUMN     "pixManual" JSONB;

-- AlterTable
ALTER TABLE "Inscricao" ALTER COLUMN "documento" DROP NOT NULL;

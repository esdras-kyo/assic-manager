import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";

import {
  cancelarEventoAction,
  encerrarEventoAction,
  publicarEventoAction,
} from "@/app/admin/(painel)/eventos/actions";
import { BadgeStatus } from "@/components/admin/badge-status";
import { FormEvento } from "@/components/admin/form-evento";
import { Button } from "@/components/ui/button";
import { exigirAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dataParaInputLocal } from "@/lib/formatadores";
import { pixManualSchema } from "@/lib/validations";

export const metadata: Metadata = { title: "Editar evento — Admin" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarEventoPage({ params }: Props) {
  await exigirAdmin();
  const { id } = await params;

  const evento = await prisma.evento.findUnique({ where: { id } });
  if (!evento) notFound();

  const publicar = publicarEventoAction.bind(null, evento.id);
  const encerrar = encerrarEventoAction.bind(null, evento.id);
  const cancelar = cancelarEventoAction.bind(null, evento.id);

  // Lê o PIX manual de forma segura: JSON corrompido não vira "" silencioso
  // que sobrescreveria os dados no próximo salvar.
  const pix = pixManualSchema.safeParse(evento.pixManual);
  const pixManual = pix.success ? pix.data : null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">{evento.nome}</h1>
        <BadgeStatus status={evento.status} />
        {evento.status !== "RASCUNHO" && (
          <Link
            href={`/eventos/${evento.slug}`}
            className="inline-flex items-center gap-1 font-semibold text-primary underline-offset-4 hover:underline"
          >
            ver página pública
            <ExternalLink aria-hidden className="size-4" />
          </Link>
        )}
        <Link
          href={`/admin/eventos/${evento.id}/inscricoes`}
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          ver inscrições
        </Link>
        <Link
          href={`/admin/eventos/${evento.id}/conteudo`}
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          editar conteúdo
        </Link>
        <Link
          href={`/admin/eventos/${evento.id}/programacao`}
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          editar programação
        </Link>
      </div>

      {/* Ações de situação — condicionais à máquina de estados do evento */}
      <div className="mt-6 flex flex-wrap gap-3">
        {evento.status === "RASCUNHO" && (
          <form action={publicar}>
            <Button type="submit">Publicar (abrir inscrições)</Button>
          </form>
        )}
        {evento.status === "ABERTO" && (
          <form action={encerrar}>
            <Button type="submit" variant="secondary">
              Encerrar inscrições
            </Button>
          </form>
        )}
        {(evento.status === "RASCUNHO" || evento.status === "ABERTO") && (
          <form action={cancelar}>
            <Button type="submit" variant="destructive">
              Cancelar evento
            </Button>
          </form>
        )}
      </div>

      <div className="mt-10">
        <FormEvento
          inicial={{
            id: evento.id,
            nome: evento.nome,
            slug: evento.slug,
            descricao: evento.descricao ?? "",
            inclui: evento.inclui ?? "",
            local: evento.local,
            dataInicio: dataParaInputLocal(evento.dataInicio),
            dataFim: evento.dataFim ? dataParaInputLocal(evento.dataFim) : "",
            precoReais: (evento.precoEmCentavos / 100)
              .toFixed(2)
              .replace(".", ","),
            vagas: evento.vagas?.toString() ?? "",
            modalidadePagamento: evento.modalidadePagamento,
            pixChave: pixManual?.chave ?? "",
            pixTipoChave: pixManual?.tipoChave ?? "",
            pixBeneficiario: pixManual?.beneficiario ?? "",
            pixInstrucoes: pixManual?.instrucoes ?? "",
          }}
        />
      </div>
    </div>
  );
}

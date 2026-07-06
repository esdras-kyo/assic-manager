import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { FormCampos } from "@/components/admin/form-campos";
import { exigirAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { camposPersonalizadosSchema } from "@/lib/validations";
import type { RascunhoCampo } from "@/lib/campos";

export const metadata: Metadata = { title: "Campos do evento — Admin" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CamposEventoPage({ params }: Props) {
  await exigirAdmin();
  const { id } = await params;

  const evento = await prisma.evento.findUnique({ where: { id } });
  if (!evento) notFound();

  const parsed = camposPersonalizadosSchema.safeParse(
    evento.camposPersonalizados,
  );
  const inicial: RascunhoCampo[] = (parsed.success ? parsed.data : []).map(
    (c) => ({
      id: c.id,
      label: c.label,
      tipo: c.tipo,
      obrigatorio: c.obrigatorio,
      ajuda: c.ajuda ?? "",
      opcoes: c.opcoes ?? [],
    }),
  );

  return (
    <div>
      <Link
        href={`/admin/eventos/${evento.id}`}
        className="inline-flex items-center gap-1 text-sm font-semibold text-primary underline-offset-4 hover:underline"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Voltar ao evento
      </Link>

      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Campos do formulário — {evento.nome}
      </h1>
      <p className="mt-2 text-muted-foreground">
        Perguntas extras do formulário de inscrição deste evento.
      </p>

      <div className="mt-8">
        <FormCampos eventoId={evento.id} inicial={inicial} />
      </div>
    </div>
  );
}

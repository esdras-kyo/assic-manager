"use client";

import { type ReactNode, useState } from "react";
import { Clock, QrCode } from "lucide-react";

import { Button } from "@/components/ui/button";

interface Props {
  /** Ação server que reenvia o link por email (bind com o inscricaoId). */
  reenviarLinkAction: () => Promise<void>;
  /** Email (mascarado) para onde o link vai. */
  emailMascarado: string;
  /** GATEWAY: ação server que gera o Pix (bind com o inscricaoId). */
  gerarPixAction?: () => Promise<void>;
  /** MANUAL: painel da chave estática, revelado ao clicar "Pagar agora". */
  children?: ReactNode;
}

export function OpcoesPagamento({
  reenviarLinkAction,
  emailMascarado,
  gerarPixAction,
  children,
}: Props) {
  const [mostrarDepois, setMostrarDepois] = useState(false);
  const [mostrarAgora, setMostrarAgora] = useState(false);
  const [enviado, setEnviado] = useState(false);

  return (
    <div className="space-y-4">
      {gerarPixAction ? (
        <form action={gerarPixAction}>
          <Button type="submit" size="lg" className="h-14 w-full text-lg">
            <QrCode aria-hidden className="size-5" />
            Pagar agora com Pix
          </Button>
        </form>
      ) : (
        !mostrarAgora && (
          <Button
            type="button"
            size="lg"
            className="h-14 w-full text-lg"
            onClick={() => setMostrarAgora(true)}
          >
            <QrCode aria-hidden className="size-5" />
            Pagar agora com Pix
          </Button>
        )
      )}

      {/* MANUAL: painel da chave revelado após "Pagar agora". */}
      {mostrarAgora && children}

      {!mostrarDepois ? (
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-14 w-full text-lg"
          onClick={() => setMostrarDepois(true)}
        >
          <Clock aria-hidden className="size-5" />
          Prefiro pagar depois
        </Button>
      ) : (
        <div className="space-y-4 rounded-xl border border-border bg-secondary p-5 text-lg">
          <p>
            Sua vaga está guardada. Você pode pagar quando quiser: enviamos um
            link para o seu email <strong>{emailMascarado}</strong>.
          </p>
          {enviado ? (
            <p role="status" className="font-semibold text-primary">
              Link enviado! Confira seu email (e a caixa de spam).
            </p>
          ) : (
            <form
              action={async () => {
                await reenviarLinkAction();
                setEnviado(true);
              }}
            >
              <Button type="submit" size="lg" className="h-14 w-full text-lg">
                Enviar o link para o meu email
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

const INTERVALO_POLLING_MS = 5000;

interface PixPainelProps {
  inscricaoId: string;
  qrCode: string;
  /** Botão de dev "marcar como pago" — nunca renderiza em produção. */
  mostrarTriggerDev: boolean;
}

const passos = [
  "Abra o aplicativo do seu banco no celular.",
  "Procure a opção Pix e escolha “Pix copia e cola”.",
  "Cole o código copiado e confirme o pagamento.",
  "Volte aqui: a confirmação aparece sozinha nesta tela.",
];

export function PixPainel({
  inscricaoId,
  qrCode,
  mostrarTriggerDev,
}: PixPainelProps) {
  const router = useRouter();
  const [copiado, setCopiado] = useState(false);
  const timeoutCopiado = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(qrCode);
      setCopiado(true);
      if (timeoutCopiado.current) clearTimeout(timeoutCopiado.current);
      timeoutCopiado.current = setTimeout(() => setCopiado(false), 3000);
    } catch {
      // Clipboard bloqueado: usuário ainda pode selecionar o texto manualmente.
    }
  }

  // Polling: a verdade vem do servidor (webhook). Esta tela só observa.
  useEffect(() => {
    const intervalo = setInterval(async () => {
      try {
        const res = await fetch(`/api/inscricoes/${inscricaoId}/status`);
        if (!res.ok) return;
        const { inscricao, pagamento } = (await res.json()) as {
          inscricao: string;
          pagamento: string | null;
        };
        if (inscricao === "CONFIRMADA") {
          router.replace(`/pagamento/${inscricaoId}/sucesso`);
        } else if (pagamento === "EXPIRED" || pagamento === "FAILED") {
          router.refresh(); // servidor re-renderiza com opção de gerar novo código
        }
      } catch {
        // Falha de rede passageira: tenta de novo no próximo tick.
      }
    }, INTERVALO_POLLING_MS);
    return () => clearInterval(intervalo);
  }, [inscricaoId, router]);

  async function marcarComoPagoDev() {
    await fetch("/api/dev/marcar-pago", {
      method: "POST",
      body: JSON.stringify({ inscricaoId }),
    });
  }

  return (
    <div className="space-y-8">
      {/* Código copia-e-cola */}
      <div>
        <p className="text-lg font-bold">Código Pix copia e cola</p>
        <code className="mt-2 block max-h-32 overflow-y-auto rounded-xl border border-border bg-secondary p-4 font-mono text-base break-all select-all">
          {qrCode}
        </code>
        <Button
          type="button"
          size="lg"
          onClick={copiar}
          className="mt-4 h-14 w-full text-lg"
        >
          {copiado ? (
            <>
              <Check aria-hidden className="size-6" />
              Código copiado!
            </>
          ) : (
            <>
              <Copy aria-hidden className="size-5" />
              Copiar código Pix
            </>
          )}
        </Button>
        <p aria-live="polite" className="sr-only">
          {copiado ? "Código Pix copiado para a área de transferência" : ""}
        </p>
      </div>

      {/* Passo a passo */}
      <div>
        <h2 className="text-2xl font-semibold">Como pagar</h2>
        <ol className="mt-4 space-y-4">
          {passos.map((passo, i) => (
            <li key={passo} className="flex items-start gap-4">
              <span
                aria-hidden
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-lg font-bold text-primary-foreground"
              >
                {i + 1}
              </span>
              <p className="pt-1 text-lg leading-relaxed">{passo}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Aguardando */}
      <div
        role="status"
        className="flex items-center gap-3 rounded-xl border border-warning/50 bg-warning/15 p-4 text-lg"
      >
        <LoaderCircle
          aria-hidden
          className="size-6 shrink-0 animate-spin text-warning-foreground"
        />
        <p className="font-semibold">
          Aguardando seu pagamento… Esta tela atualiza sozinha.
        </p>
      </div>

      {mostrarTriggerDev && (
        <Button
          type="button"
          variant="outline"
          onClick={marcarComoPagoDev}
          className="w-full border-dashed"
        >
          [DEV] Marcar como pago
        </Button>
      )}
    </div>
  );
}

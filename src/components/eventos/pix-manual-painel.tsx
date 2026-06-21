"use client";

import { useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PixManual } from "@/lib/validations";

export function PixManualPainel({ pix }: { pix: PixManual }) {
  const [copiado, setCopiado] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(pix.chave);
      setCopiado(true);
      if (timeout.current) clearTimeout(timeout.current);
      timeout.current = setTimeout(() => setCopiado(false), 3000);
    } catch {
      // Clipboard bloqueado: a chave continua selecionável na tela.
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-lg font-bold">Chave PIX ({pix.tipoChave})</p>
        <code className="mt-2 block rounded-xl border border-border bg-secondary p-4 font-mono text-lg break-all select-all">
          {pix.chave}
        </code>
        <p className="mt-2 text-muted-foreground">
          Em nome de {pix.beneficiario}
        </p>
        <Button
          type="button"
          size="lg"
          onClick={copiar}
          aria-label={copiado ? "Chave copiada" : "Copiar chave PIX"}
          className="mt-4 h-14 w-full text-lg"
        >
          {copiado ? (
            <>
              <Check aria-hidden className="size-6" />
              Chave copiada!
            </>
          ) : (
            <>
              <Copy aria-hidden className="size-5" />
              Copiar chave PIX
            </>
          )}
        </Button>
      </div>

      {pix.instrucoes && (
        <p className="text-lg leading-relaxed whitespace-pre-line">
          {pix.instrucoes}
        </p>
      )}

      <div
        role="status"
        className="rounded-xl border border-warning/50 bg-warning/15 p-5 text-lg leading-relaxed"
      >
        <p className="font-semibold">Sua inscrição foi registrada.</p>
        <p className="mt-1">
          Ela está <strong>pendente</strong> até a confirmação do pagamento pela
          organização. Faça o PIX usando a chave acima — você não precisa enviar
          comprovante por aqui.
        </p>
      </div>
    </div>
  );
}

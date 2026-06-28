"use client";

import { useMemo, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { createStaticPix, hasError } from "pix-utils";

import { Button } from "@/components/ui/button";
import type { PixManual } from "@/lib/validations";

function tirarAcentos(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export function PixManualPainel({
  pix,
  amount,
}: {
  pix: PixManual;
  /** Valor em reais (não centavos) — entra no BR Code. */
  amount: number;
}) {
  const [copiado, setCopiado] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // BR Code EMV (com CRC16): é o que o banco lê no "Pix copia e cola" e no QR.
  // A chave crua (ex.: CNPJ formatado) NÃO é um copia-e-cola válido.
  const brCode = useMemo(() => {
    // CNPJ/CPF/telefone vêm formatados; a spec do Pix exige só os dígitos.
    const chaveLimpa = /^[\d.\-/]+$/.test(pix.chave)
      ? pix.chave.replace(/\D/g, "")
      : pix.chave;

    const codigo = createStaticPix({
      merchantName: tirarAcentos(pix.beneficiario).slice(0, 25),
      merchantCity: "BRASIL",
      pixKey: chaveLimpa,
      transactionAmount: amount,
      txid: "***",
    });
    return hasError(codigo) ? "" : codigo.toBRCode();
  }, [pix.chave, pix.beneficiario, amount]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(brCode || pix.chave);
      setCopiado(true);
      if (timeout.current) clearTimeout(timeout.current);
      timeout.current = setTimeout(() => setCopiado(false), 3000);
    } catch {
      // Clipboard bloqueado: o código continua selecionável na tela.
    }
  }

  return (
    <div className="space-y-8">
      {brCode ? (
        <div className="space-y-5">
          {/* QR escaneável */}
          <div>
            <p className="text-lg font-bold">
              Aponte a câmera do app do seu banco
            </p>
            <div className="mt-3 flex justify-center">
              <div className="rounded-2xl border border-border bg-white p-4">
                <QRCodeSVG
                  value={brCode}
                  size={232}
                  marginSize={0}
                  title="QR Code para pagamento via Pix"
                  className="h-auto w-full max-w-[232px]"
                />
              </div>
            </div>
          </div>

          {/* Copia e cola */}
          <div>
            <p className="text-lg font-bold">Ou copie o código Pix</p>
            <code className="mt-2 block max-h-28 overflow-y-auto rounded-xl border border-border bg-secondary p-3 font-mono text-xs break-all select-all">
              {brCode}
            </code>
            <p className="mt-2 text-muted-foreground">
              Em nome de {pix.beneficiario}
            </p>
            <Button
              type="button"
              size="lg"
              onClick={copiar}
              aria-label={copiado ? "Código copiado" : "Copiar código Pix"}
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
          </div>
        </div>
      ) : (
        // Fallback: a chave não gerou BR Code (ex.: chave atípica). Mostra a
        // chave crua para pagamento via "Pix → chave".
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
      )}

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
          organização. Faça o PIX usando o código acima — você não precisa
          enviar comprovante por aqui.
        </p>
      </div>
    </div>
  );
}

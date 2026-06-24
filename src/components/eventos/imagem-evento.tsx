import { ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Imagem de evento com recorte consistente (object-cover) e fallback elegante
 * quando o evento ainda não tem imagem. Mantém simples: recebe uma URL pronta
 * (o upload por evento será resolvido depois). `className` controla proporção,
 * tamanho e cantos; `eager` para imagens acima da dobra (capa/hero).
 */
export function ImagemEvento({
  src,
  alt,
  className,
  eager = false,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  if (!src) {
    return (
      <div
        aria-hidden
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-primary/20 via-primary/5 to-accent/25",
          className,
        )}
      >
        <ImageIcon className="size-10 text-primary/40" />
      </div>
    );
  }

  return (
    // Imagem externa trocável (sem upload ainda): next/image exigiria whitelist
    // de domínio e quebraria com URLs arbitrárias que o organizador colar depois.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={cn("object-cover", className)}
    />
  );
}

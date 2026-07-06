import { ImagemEvento } from "@/components/eventos/imagem-evento";
import { formatarPrecoBRL } from "@/lib/formatadores";
import type { Conteudo } from "@/lib/validations";

/** Destaca, em um texto, as palavras/expressões listadas em `destaques`. */
function comDestaques(texto: string, destaques?: string[]) {
  if (!destaques?.length) return texto;
  const escapadas = destaques
    .map((d) => d.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .sort((a, b) => b.length - a.length);
  const re = new RegExp(`(${escapadas.join("|")})`, "g");
  return texto.split(re).map((parte, i) =>
    destaques.includes(parte) ? (
      <strong key={i} className="font-bold text-primary">
        {parte}
      </strong>
    ) : (
      <span key={i}>{parte}</span>
    ),
  );
}

export function LandingEvento({
  conteudo,
  precoEmCentavos,
}: {
  conteudo: Conteudo;
  precoEmCentavos: number;
}) {
  return (
    <div className="space-y-12">
      {conteudo.subtitulo && (
        <p className="text-2xl font-semibold text-primary">
          {conteudo.subtitulo}
        </p>
      )}

      {conteudo.apresentacao?.length ? (
        <div className="space-y-4 text-lg leading-relaxed">
          {conteudo.apresentacao.map((p, i) => (
            <p key={i}>{comDestaques(p, conteudo.destaques)}</p>
          ))}
        </div>
      ) : null}

      {conteudo.galeria?.length ? (
        <section aria-label="Galeria de fotos">
          {/* faixa rolável (scroll-snap CSS, sem JS) — simples e acessível */}
          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
            {conteudo.galeria.map((url, i) => (
              <ImagemEvento
                key={url}
                src={url}
                alt={`Foto ${i + 1} do evento`}
                className="aspect-[4/3] w-72 shrink-0 snap-start rounded-xl ring-1 ring-border sm:w-80"
              />
            ))}
          </div>
        </section>
      ) : null}

      {conteudo.horarios?.length ? (
        <section>
          <h2 className="text-2xl font-semibold">Horários</h2>
          <div className="mt-4 space-y-4">
            {conteudo.horarios.map((h) => (
              <div key={h.dia}>
                <p className="font-bold">{h.dia}</p>
                <ul className="mt-1 space-y-1 text-lg text-muted-foreground">
                  {h.blocos.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {conteudo.oQueEncontrara?.length ? (
        <section>
          <h2 className="text-2xl font-semibold">
            O que você encontrará neste encontro?
          </h2>
          <ul className="mt-4 space-y-3 text-lg">
            {conteudo.oQueEncontrara.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="mt-2.5 size-2 shrink-0 rounded-full bg-primary"
                />
                {item}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {conteudo.programacao?.length ? (
        <section>
          <h2 className="text-2xl font-semibold">Programação</h2>
          <div className="mt-4 space-y-6">
            {conteudo.programacao.map((dia) => (
              <div key={dia.dia}>
                <p className="text-xl font-bold">{dia.dia}</p>
                {dia.periodos.map((per, i) => (
                  <div key={i} className="mt-3">
                    {per.titulo && (
                      <p className="font-semibold text-muted-foreground">
                        {per.titulo}
                      </p>
                    )}
                    <ul className="mt-1 space-y-2 text-lg">
                      {per.itens.map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <span
                            aria-hidden
                            className="mt-2.5 size-2 shrink-0 rounded-full bg-primary"
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {conteudo.investimento && (
        <section className="rounded-xl border border-border bg-secondary p-6">
          <h2 className="text-2xl font-semibold">Investimento</h2>
          <p className="mt-2 text-xl font-bold text-primary">
            {formatarPrecoBRL(precoEmCentavos)}
          </p>
          {conteudo.investimento.inclui && (
            <p className="mt-2 text-lg">{conteudo.investimento.inclui}</p>
          )}
        </section>
      )}

      {/* textoFinal é a mensagem PÓS-inscrição (PDF: "texto final após enviar").
          Não pertence à landing pré-inscrição — exibido após o envio. */}
    </div>
  );
}

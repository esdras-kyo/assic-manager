import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

const passos = [
  {
    numero: "1",
    titulo: "Escolha o evento",
    texto: "Veja os eventos abertos e toque no que você quer participar.",
  },
  {
    numero: "2",
    titulo: "Preencha seus dados",
    texto: "Nome, email, celular e CPF. Só o essencial, em uma única tela.",
  },
  {
    numero: "3",
    titulo: "Pague com Pix",
    texto:
      "Copie o código, cole no app do seu banco e pronto: inscrição confirmada.",
  },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 right-[-10%] size-[28rem] rounded-full bg-accent/50 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 left-[-12%] size-[24rem] rounded-full bg-primary/10 blur-3xl"
        />
        <div className="relative mx-auto w-full max-w-5xl px-4 py-20 sm:px-6 sm:py-28">
          <h1 className="max-w-2xl text-5xl leading-[1.1] font-semibold tracking-tight text-foreground sm:text-6xl">
            Encontros que <span className="text-primary">aproximam</span>{" "}
            pessoas.
          </h1>
          <p className="mt-6 max-w-xl text-xl leading-relaxed text-muted-foreground">
            Inscreva-se nos próximos eventos de forma simples e segura — direto
            do seu celular, sem complicação.
          </p>
          <div className="mt-10">
            <Button asChild size="lg" className="h-14 px-8 text-lg">
              <Link href="/eventos">
                Ver eventos abertos
                <ArrowRight aria-hidden className="size-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section
        aria-labelledby="como-funciona"
        className="border-t border-border bg-card"
      >
        <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
          <h2
            id="como-funciona"
            className="text-3xl font-semibold tracking-tight"
          >
            Como funciona
          </h2>
          <ol className="mt-10 grid gap-10 sm:grid-cols-3">
            {passos.map((passo) => (
              <li key={passo.numero} className="flex flex-col gap-3">
                <span
                  aria-hidden
                  className="font-heading text-5xl font-semibold text-primary/40"
                >
                  {passo.numero}
                </span>
                <h3 className="text-xl font-semibold">{passo.titulo}</h3>
                <p className="leading-relaxed text-muted-foreground">
                  {passo.texto}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}

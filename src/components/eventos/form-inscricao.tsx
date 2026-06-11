"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CircleAlert, LoaderCircle } from "lucide-react";

import {
  criarInscricaoEPagarAction,
  type InscricaoFormState,
} from "@/app/eventos/[slug]/inscricao/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mascararCelular, mascararCpf } from "@/lib/formatadores";

interface CampoProps {
  id: string;
  rotulo: string;
  ajuda?: string;
  erros?: string[];
  children: React.ReactNode;
}

/** Campo vertical: label grande em cima, erro logo abaixo (§5.1). */
function Campo({ id, rotulo, ajuda, erros, children }: CampoProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-lg font-bold">
        {rotulo}
      </Label>
      {children}
      {ajuda && !erros?.length && (
        <p id={`${id}-ajuda`} className="text-muted-foreground">
          {ajuda}
        </p>
      )}
      {erros?.map((erro) => (
        <p
          key={erro}
          id={`${id}-erro`}
          className="flex items-center gap-1.5 font-semibold text-destructive"
        >
          <CircleAlert aria-hidden className="size-4.5 shrink-0" />
          {erro}
        </p>
      ))}
    </div>
  );
}

function BotaoEnviar() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending}
      className="h-14 w-full text-lg"
    >
      {pending ? (
        <>
          <LoaderCircle aria-hidden className="size-5 animate-spin" />
          Enviando sua inscrição…
        </>
      ) : (
        "Confirmar inscrição e gerar Pix"
      )}
    </Button>
  );
}

export function FormInscricao({ eventoId }: { eventoId: string }) {
  const [state, formAction] = useActionState<
    InscricaoFormState | undefined,
    FormData
  >(criarInscricaoEPagarAction, undefined);

  const aoDigitarCpf = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = mascararCpf(e.target.value);
  };
  const aoDigitarCelular = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = mascararCelular(e.target.value);
  };

  const alturaCampo = "h-13 text-lg";

  return (
    <form action={formAction} noValidate className="space-y-7">
      <input type="hidden" name="eventoId" value={eventoId} />

      {state?.mensagem && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-lg font-semibold text-destructive"
        >
          <CircleAlert aria-hidden className="mt-0.5 size-5 shrink-0" />
          {state.mensagem}
        </div>
      )}

      <Campo id="nome" rotulo="Nome completo" erros={state?.erros?.nome}>
        <Input
          id="nome"
          name="nome"
          autoComplete="name"
          required
          defaultValue={state?.valores?.nome}
          aria-invalid={Boolean(state?.erros?.nome?.length)}
          aria-describedby={
            state?.erros?.nome?.length ? "nome-erro" : undefined
          }
          className={alturaCampo}
        />
      </Campo>

      <Campo
        id="email"
        rotulo="Email"
        ajuda="Vamos enviar a confirmação para este email."
        erros={state?.erros?.email}
      >
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state?.valores?.email}
          aria-invalid={Boolean(state?.erros?.email?.length)}
          aria-describedby={
            state?.erros?.email?.length ? "email-erro" : "email-ajuda"
          }
          className={alturaCampo}
        />
      </Campo>

      <Campo
        id="celular"
        rotulo="Celular com DDD"
        ajuda="Por exemplo: (11) 98765-4321"
        erros={state?.erros?.celular}
      >
        <Input
          id="celular"
          name="celular"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          required
          defaultValue={state?.valores?.celular}
          onChange={aoDigitarCelular}
          aria-invalid={Boolean(state?.erros?.celular?.length)}
          aria-describedby={
            state?.erros?.celular?.length ? "celular-erro" : "celular-ajuda"
          }
          className={alturaCampo}
        />
      </Campo>

      <Campo id="documento" rotulo="CPF" erros={state?.erros?.documento}>
        <Input
          id="documento"
          name="documento"
          inputMode="numeric"
          required
          defaultValue={state?.valores?.documento}
          onChange={aoDigitarCpf}
          aria-invalid={Boolean(state?.erros?.documento?.length)}
          aria-describedby={
            state?.erros?.documento?.length ? "documento-erro" : undefined
          }
          className={alturaCampo}
        />
      </Campo>

      <BotaoEnviar />

      <p className="text-center text-muted-foreground">
        Depois de confirmar, você verá o código Pix para pagar.
      </p>
    </form>
  );
}

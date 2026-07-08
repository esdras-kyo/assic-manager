"use client";

import { useActionState } from "react";

import { solicitarLinkAction } from "@/app/consultar-inscricao/actions";
import { Button } from "@/components/ui/button";

export default function ConsultarInscricaoPage() {
  const [state, formAction, pending] = useActionState(
    solicitarLinkAction,
    undefined,
  );

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Consultar minha inscrição
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Digite o email que você usou na inscrição. Enviaremos um link para você
        ver suas inscrições e pagar as que estiverem pendentes.
      </p>

      {state?.enviado ? (
        <div
          role="status"
          className="mt-8 rounded-xl border border-border bg-secondary p-5 text-lg"
        >
          Se houver uma inscrição com esse email, enviamos um link para{" "}
          <strong>{state.email}</strong>. Confira sua caixa de entrada e o spam.
        </div>
      ) : (
        <form action={formAction} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="text-lg font-medium">
              Seu email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              defaultValue={state?.email}
              className="mt-2 h-14 w-full rounded-xl border border-border bg-background px-4 text-lg"
              placeholder="nome@exemplo.com"
            />
            {state?.erro && (
              <p className="mt-2 text-base text-destructive">{state.erro}</p>
            )}
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={pending}
            className="h-14 w-full text-lg"
          >
            {pending ? "Enviando..." : "Enviar link por email"}
          </Button>
        </form>
      )}
    </div>
  );
}

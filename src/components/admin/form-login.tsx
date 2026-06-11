"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CircleAlert, LoaderCircle } from "lucide-react";

import { loginAction, type LoginFormState } from "@/app/admin/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function BotaoEntrar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="h-13 w-full">
      {pending ? (
        <>
          <LoaderCircle aria-hidden className="size-5 animate-spin" />
          Entrando…
        </>
      ) : (
        "Entrar"
      )}
    </Button>
  );
}

export function FormLogin() {
  const [state, formAction] = useActionState<
    LoginFormState | undefined,
    FormData
  >(loginAction, undefined);

  return (
    <form action={formAction} className="space-y-6">
      {state?.mensagem && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 font-semibold text-destructive"
        >
          <CircleAlert aria-hidden className="size-5 shrink-0" />
          {state.mensagem}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className="h-12"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="senha">Senha</Label>
        <Input
          id="senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          required
          className="h-12"
        />
      </div>

      <BotaoEntrar />
    </form>
  );
}

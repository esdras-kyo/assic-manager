"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { CircleAlert, LoaderCircle } from "lucide-react";

import {
  salvarEventoAction,
  type EventoFormState,
} from "@/app/admin/(painel)/eventos/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { gerarSlug } from "@/lib/formatadores";

export interface EventoFormValores {
  id?: string;
  nome?: string;
  slug?: string;
  descricao?: string;
  local?: string;
  dataInicio?: string; // datetime-local (horário SP)
  dataFim?: string;
  precoReais?: string;
  vagas?: string;
}

function Erros({ id, lista }: { id: string; lista?: string[] }) {
  if (!lista?.length) return null;
  return (
    <>
      {lista.map((erro) => (
        <p
          key={erro}
          id={`${id}-erro`}
          className="flex items-center gap-1.5 text-sm font-semibold text-destructive"
        >
          <CircleAlert aria-hidden className="size-4 shrink-0" />
          {erro}
        </p>
      ))}
    </>
  );
}

function BotaoSalvar({ editando }: { editando: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="h-12">
      {pending ? (
        <>
          <LoaderCircle aria-hidden className="size-5 animate-spin" />
          Salvando…
        </>
      ) : editando ? (
        "Salvar alterações"
      ) : (
        "Criar evento (rascunho)"
      )}
    </Button>
  );
}

export function FormEvento({ inicial }: { inicial?: EventoFormValores }) {
  const [state, formAction] = useActionState<
    EventoFormState | undefined,
    FormData
  >(salvarEventoAction, undefined);

  const editando = Boolean(inicial?.id);
  // Slug acompanha o nome até a pessoa editar o slug manualmente.
  const [slug, setSlug] = useState(inicial?.slug ?? "");
  const [slugManual, setSlugManual] = useState(editando);

  const valores = { ...inicial, ...state?.valores };

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      {inicial?.id && <input type="hidden" name="id" value={inicial.id} />}

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
        <Label htmlFor="nome">Nome do evento</Label>
        <Input
          id="nome"
          name="nome"
          required
          defaultValue={valores?.nome}
          onChange={(e) => {
            if (!slugManual) setSlug(gerarSlug(e.target.value));
          }}
        />
        <Erros id="nome" lista={state?.erros?.nome} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Endereço (slug)</Label>
        <Input
          id="slug"
          name="slug"
          required
          value={slug}
          onChange={(e) => {
            setSlugManual(true);
            setSlug(gerarSlug(e.target.value));
          }}
        />
        <p className="text-sm text-muted-foreground">
          O evento ficará em /eventos/{slug || "…"}
        </p>
        <Erros id="slug" lista={state?.erros?.slug} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição (opcional)</Label>
        <Textarea
          id="descricao"
          name="descricao"
          rows={4}
          defaultValue={valores?.descricao}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="local">Local</Label>
        <Input id="local" name="local" required defaultValue={valores?.local} />
        <Erros id="local" lista={state?.erros?.local} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dataInicio">Início (horário de Brasília)</Label>
          <Input
            id="dataInicio"
            name="dataInicio"
            type="datetime-local"
            required
            defaultValue={valores?.dataInicio}
          />
          <Erros id="dataInicio" lista={state?.erros?.dataInicio} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dataFim">Fim (opcional)</Label>
          <Input
            id="dataFim"
            name="dataFim"
            type="datetime-local"
            defaultValue={valores?.dataFim}
          />
          <Erros id="dataFim" lista={state?.erros?.dataFim} />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="precoReais">Preço (R$)</Label>
          <Input
            id="precoReais"
            name="precoReais"
            inputMode="decimal"
            placeholder="50,00"
            required
            defaultValue={valores?.precoReais}
          />
          <p className="text-sm text-muted-foreground">Use 0 para gratuito.</p>
          <Erros id="precoReais" lista={state?.erros?.precoReais} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vagas">Vagas (opcional)</Label>
          <Input
            id="vagas"
            name="vagas"
            inputMode="numeric"
            placeholder="Sem limite"
            defaultValue={valores?.vagas}
          />
          <Erros id="vagas" lista={state?.erros?.vagas} />
        </div>
      </div>

      <BotaoSalvar editando={editando} />
    </form>
  );
}

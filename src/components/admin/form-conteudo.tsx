"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  CheckCircle2,
  CircleAlert,
  LoaderCircle,
  Plus,
  Trash2,
} from "lucide-react";

import {
  salvarConteudoAction,
  type ConteudoFormState,
} from "@/app/admin/(painel)/eventos/[id]/conteudo/actions";
import type { EntradaConteudo } from "@/lib/conteudo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function ListaEditavel({
  nome,
  label,
  inicial,
  placeholder,
}: {
  nome: string;
  label: string;
  inicial: string[];
  placeholder?: string;
}) {
  // Chave estável por linha (id, não índice): remover uma do meio não faz o
  // valor das seguintes "pular" nos inputs não-controlados.
  const [itens, setItens] = useState<{ id: number; valor: string }[]>(() =>
    (inicial.length ? inicial : [""]).map((valor, i) => ({ id: i, valor })),
  );
  const proximoId = useRef(inicial.length || 1);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="space-y-2">
        {itens.map((item) => (
          <div key={item.id} className="flex gap-2">
            <Input
              name={nome}
              defaultValue={item.valor}
              placeholder={placeholder}
            />
            <Button
              type="button"
              variant="outline"
              aria-label="Remover"
              className="h-11 shrink-0 px-3"
              onClick={() =>
                setItens((xs) =>
                  xs.length > 1 ? xs.filter((x) => x.id !== item.id) : xs,
                )
              }
            >
              <Trash2 aria-hidden className="size-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="secondary"
        className="h-10"
        onClick={() =>
          setItens((xs) => [...xs, { id: proximoId.current++, valor: "" }])
        }
      >
        <Plus aria-hidden className="size-4" />
        Adicionar
      </Button>
    </div>
  );
}

function Erros({ lista }: { lista?: string[] }) {
  if (!lista?.length) return null;
  return (
    <>
      {lista.map((erro) => (
        <p
          key={erro}
          className="flex items-center gap-1.5 text-sm font-semibold text-destructive"
        >
          <CircleAlert aria-hidden className="size-4 shrink-0" />
          {erro}
        </p>
      ))}
    </>
  );
}

function BotaoSalvar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="h-12">
      {pending ? (
        <>
          <LoaderCircle aria-hidden className="size-5 animate-spin" />
          Salvando…
        </>
      ) : (
        "Salvar conteúdo"
      )}
    </Button>
  );
}

export function FormConteudo({
  eventoId,
  inicial,
}: {
  eventoId: string;
  inicial: EntradaConteudo;
}) {
  const [state, formAction] = useActionState<
    ConteudoFormState | undefined,
    FormData
  >(salvarConteudoAction, undefined);

  return (
    <form action={formAction} className="max-w-2xl space-y-8">
      <input type="hidden" name="eventoId" value={eventoId} />

      {state?.sucesso && (
        <p className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 p-3 font-semibold text-primary">
          <CheckCircle2 aria-hidden className="size-5 shrink-0" />
          Conteúdo salvo.
        </p>
      )}
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
        <Label htmlFor="subtitulo">Subtítulo</Label>
        <Input
          id="subtitulo"
          name="subtitulo"
          defaultValue={inicial.subtitulo}
        />
      </div>

      <ListaEditavel
        nome="apresentacao"
        label="Apresentação (um parágrafo por linha)"
        inicial={inicial.apresentacao}
      />

      <ListaEditavel
        nome="oQueEncontrara"
        label="O que você encontrará (um item por linha)"
        inicial={inicial.oQueEncontrara}
      />

      <ListaEditavel
        nome="destaque"
        label="Palavras em destaque (negrito na apresentação)"
        inicial={inicial.destaques}
      />

      <div className="space-y-2">
        <Label htmlFor="inclui">Investimento — o que inclui</Label>
        <Textarea
          id="inclui"
          name="inclui"
          rows={2}
          defaultValue={inicial.inclui}
        />
      </div>

      <fieldset className="space-y-4 rounded-lg border border-border p-4">
        <legend className="px-1 font-semibold">
          Texto final (mensagem pós-inscrição)
        </legend>
        <div className="space-y-2">
          <Label htmlFor="textoFinalTitulo">Título</Label>
          <Input
            id="textoFinalTitulo"
            name="textoFinalTitulo"
            defaultValue={inicial.textoFinalTitulo}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="textoFinalCorpo">Corpo</Label>
          <Textarea
            id="textoFinalCorpo"
            name="textoFinalCorpo"
            rows={3}
            defaultValue={inicial.textoFinalCorpo}
          />
        </div>
        <ListaEditavel
          nome="contato"
          label="Contatos"
          inicial={inicial.contatos}
          placeholder="WhatsApp (62) 99999-9999"
        />
        <Erros lista={state?.erros?.textoFinal} />
      </fieldset>

      <BotaoSalvar />
    </form>
  );
}

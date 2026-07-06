"use client";

import { useRef, useState, useTransition } from "react";
import {
  CheckCircle2,
  CircleAlert,
  LoaderCircle,
  Plus,
  Trash2,
} from "lucide-react";

import {
  salvarCamposAction,
  type CamposFormState,
} from "@/app/admin/(painel)/eventos/[id]/campos/actions";
import type { RascunhoCampo } from "@/lib/campos";
import { TIPOS_CAMPO, type TipoCampo } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ROTULO_TIPO: Record<TipoCampo, string> = {
  texto: "Texto",
  email: "E-mail",
  tel: "Telefone",
  textarea: "Texto longo",
  radio: "Escolha única",
  select: "Lista suspensa",
  checkbox: "Caixa de confirmação",
};

const COM_OPCOES: TipoCampo[] = ["radio", "select"];

type Opcao = { uid: number; valor: string };
type CampoSt = {
  uid: number;
  id: string;
  label: string;
  tipo: TipoCampo;
  obrigatorio: boolean;
  ajuda: string;
  opcoes: Opcao[];
};

function construir(inicial: RascunhoCampo[]) {
  let n = 0;
  const uid = () => n++;
  const campos: CampoSt[] = inicial.map((c) => ({
    uid: uid(),
    id: c.id,
    label: c.label,
    tipo: c.tipo,
    obrigatorio: c.obrigatorio,
    ajuda: c.ajuda,
    opcoes: c.opcoes.map((valor) => ({ uid: uid(), valor })),
  }));
  return { campos, proximo: n };
}

export function FormCampos({
  eventoId,
  inicial,
}: {
  eventoId: string;
  inicial: RascunhoCampo[];
}) {
  const [construido] = useState(() => construir(inicial));
  const [campos, setCampos] = useState<CampoSt[]>(construido.campos);
  const proximoUid = useRef(construido.proximo);
  const novoUid = () => proximoUid.current++;

  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<CamposFormState>({});

  function up(uid: number, patch: Partial<CampoSt>) {
    setCampos((cs) => cs.map((c) => (c.uid === uid ? { ...c, ...patch } : c)));
  }

  function salvar() {
    const rascunhos: RascunhoCampo[] = campos.map((c) => ({
      id: c.id,
      label: c.label,
      tipo: c.tipo,
      obrigatorio: c.obrigatorio,
      ajuda: c.ajuda,
      opcoes: c.opcoes.map((o) => o.valor),
    }));
    startTransition(async () => {
      setState(await salvarCamposAction(eventoId, rascunhos));
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      {state.sucesso && (
        <p className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 p-3 font-semibold text-primary">
          <CheckCircle2 aria-hidden className="size-5 shrink-0" />
          Campos salvos.
        </p>
      )}
      {state.mensagem && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 font-semibold text-destructive"
        >
          <CircleAlert aria-hidden className="size-5 shrink-0" />
          {state.mensagem}
        </p>
      )}

      <p className="text-sm text-muted-foreground">
        Remover um campo não apaga respostas já enviadas — elas seguem no CSV.
      </p>

      {campos.map((c) => (
        <div
          key={c.uid}
          className="space-y-3 rounded-lg border border-border p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">
              {c.id ? `id: ${c.id}` : "novo campo"}
            </span>
            <Button
              type="button"
              variant="outline"
              aria-label="Remover campo"
              className="h-10 px-3"
              onClick={() =>
                setCampos((cs) => cs.filter((x) => x.uid !== c.uid))
              }
            >
              <Trash2 aria-hidden className="size-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Rótulo</Label>
            <Input
              value={c.label}
              onChange={(e) => up(c.uid, { label: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <select
                value={c.tipo}
                onChange={(e) =>
                  up(c.uid, { tipo: e.target.value as TipoCampo })
                }
                className="h-11 w-full rounded-lg border border-input bg-card px-3"
              >
                {TIPOS_CAMPO.map((t) => (
                  <option key={t} value={t}>
                    {ROTULO_TIPO[t]}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 pt-8 font-semibold">
              <input
                type="checkbox"
                checked={c.obrigatorio}
                onChange={(e) => up(c.uid, { obrigatorio: e.target.checked })}
                className="size-5"
              />
              Obrigatório
            </label>
          </div>

          <div className="space-y-2">
            <Label>Ajuda (opcional)</Label>
            <Input
              value={c.ajuda}
              onChange={(e) => up(c.uid, { ajuda: e.target.value })}
            />
          </div>

          {COM_OPCOES.includes(c.tipo) && (
            <div className="space-y-2">
              <Label>Opções</Label>
              {c.opcoes.map((o) => (
                <div key={o.uid} className="flex gap-2">
                  <Input
                    value={o.valor}
                    onChange={(e) =>
                      setCampos((cs) =>
                        cs.map((cc) =>
                          cc.uid === c.uid
                            ? {
                                ...cc,
                                opcoes: cc.opcoes.map((x) =>
                                  x.uid === o.uid
                                    ? { ...x, valor: e.target.value }
                                    : x,
                                ),
                              }
                            : cc,
                        ),
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    aria-label="Remover opção"
                    className="h-11 shrink-0 px-3"
                    onClick={() =>
                      setCampos((cs) =>
                        cs.map((cc) =>
                          cc.uid === c.uid
                            ? {
                                ...cc,
                                opcoes: cc.opcoes.filter(
                                  (x) => x.uid !== o.uid,
                                ),
                              }
                            : cc,
                        ),
                      )
                    }
                  >
                    <Trash2 aria-hidden className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="secondary"
                className="h-9"
                onClick={() =>
                  setCampos((cs) =>
                    cs.map((cc) =>
                      cc.uid === c.uid
                        ? {
                            ...cc,
                            opcoes: [
                              ...cc.opcoes,
                              { uid: novoUid(), valor: "" },
                            ],
                          }
                        : cc,
                    ),
                  )
                }
              >
                <Plus aria-hidden className="size-4" />
                Adicionar opção
              </Button>
            </div>
          )}
        </div>
      ))}

      <Button
        type="button"
        variant="secondary"
        className="h-10"
        onClick={() =>
          setCampos((cs) => [
            ...cs,
            {
              uid: novoUid(),
              id: "",
              label: "",
              tipo: "texto",
              obrigatorio: false,
              ajuda: "",
              opcoes: [],
            },
          ])
        }
      >
        <Plus aria-hidden className="size-4" />
        Adicionar campo
      </Button>

      <div>
        <Button
          type="button"
          size="lg"
          className="h-12"
          disabled={pending}
          onClick={salvar}
        >
          {pending ? (
            <>
              <LoaderCircle aria-hidden className="size-5 animate-spin" />
              Salvando…
            </>
          ) : (
            "Salvar campos"
          )}
        </Button>
      </div>
    </div>
  );
}

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
  salvarProgramacaoAction,
  type ProgramacaoFormState,
} from "@/app/admin/(painel)/eventos/[id]/programacao/actions";
import type { EntradaProgramacao } from "@/lib/conteudo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Item = { id: number; valor: string };
type HorarioSt = { id: number; dia: string; blocos: Item[] };
type PeriodoSt = { id: number; titulo: string; itens: Item[] };
type DiaSt = { id: number; dia: string; periodos: PeriodoSt[] };

function construir(inicial: EntradaProgramacao) {
  let n = 0;
  const id = () => n++;
  const horarios: HorarioSt[] = inicial.horarios.map((h) => ({
    id: id(),
    dia: h.dia,
    blocos: h.blocos.map((valor) => ({ id: id(), valor })),
  }));
  const programacao: DiaSt[] = inicial.programacao.map((d) => ({
    id: id(),
    dia: d.dia,
    periodos: d.periodos.map((p) => ({
      id: id(),
      titulo: p.titulo,
      itens: p.itens.map((valor) => ({ id: id(), valor })),
    })),
  }));
  return { horarios, programacao, proximo: n };
}

function ListaTextos({
  label,
  itens,
  placeholder,
  onChange,
  novoId,
}: {
  label: string;
  itens: Item[];
  placeholder?: string;
  onChange: (itens: Item[]) => void;
  novoId: () => number;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {itens.map((it) => (
        <div key={it.id} className="flex gap-2">
          <Input
            value={it.valor}
            placeholder={placeholder}
            onChange={(e) =>
              onChange(
                itens.map((x) =>
                  x.id === it.id ? { ...x, valor: e.target.value } : x,
                ),
              )
            }
          />
          <Button
            type="button"
            variant="outline"
            aria-label="Remover"
            className="h-11 shrink-0 px-3"
            onClick={() => onChange(itens.filter((x) => x.id !== it.id))}
          >
            <Trash2 aria-hidden className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        className="h-9"
        onClick={() => onChange([...itens, { id: novoId(), valor: "" }])}
      >
        <Plus aria-hidden className="size-4" />
        Adicionar
      </Button>
    </div>
  );
}

export function FormProgramacao({
  eventoId,
  inicial,
}: {
  eventoId: string;
  inicial: EntradaProgramacao;
}) {
  // Constrói o estado inicial UMA vez (ids sequenciais + próximo id do contador).
  const [inicialConstruido] = useState(() => construir(inicial));
  const [horarios, setHorarios] = useState<HorarioSt[]>(
    inicialConstruido.horarios,
  );
  const [programacao, setProgramacao] = useState<DiaSt[]>(
    inicialConstruido.programacao,
  );
  const proximoId = useRef(inicialConstruido.proximo);
  const novoId = () => proximoId.current++;

  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<ProgramacaoFormState>({});

  function salvar() {
    const entrada: EntradaProgramacao = {
      horarios: horarios.map((h) => ({
        dia: h.dia,
        blocos: h.blocos.map((b) => b.valor),
      })),
      programacao: programacao.map((d) => ({
        dia: d.dia,
        periodos: d.periodos.map((p) => ({
          titulo: p.titulo,
          itens: p.itens.map((i) => i.valor),
        })),
      })),
    };
    startTransition(async () => {
      setState(await salvarProgramacaoAction(eventoId, entrada));
    });
  }

  return (
    <div className="max-w-2xl space-y-10">
      {state.sucesso && (
        <p className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 p-3 font-semibold text-primary">
          <CheckCircle2 aria-hidden className="size-5 shrink-0" />
          Programação salva.
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

      {/* Horários */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Horários</h2>
        {horarios.map((h) => (
          <div
            key={h.id}
            className="space-y-3 rounded-lg border border-border p-4"
          >
            <div className="flex gap-2">
              <Input
                value={h.dia}
                placeholder="Sábado (08/08)"
                onChange={(e) =>
                  setHorarios((hs) =>
                    hs.map((x) =>
                      x.id === h.id ? { ...x, dia: e.target.value } : x,
                    ),
                  )
                }
              />
              <Button
                type="button"
                variant="outline"
                aria-label="Remover dia"
                className="h-11 shrink-0 px-3"
                onClick={() =>
                  setHorarios((hs) => hs.filter((x) => x.id !== h.id))
                }
              >
                <Trash2 aria-hidden className="size-4" />
              </Button>
            </div>
            <ListaTextos
              label="Blocos"
              itens={h.blocos}
              placeholder="09h00 às 12h00"
              novoId={novoId}
              onChange={(blocos) =>
                setHorarios((hs) =>
                  hs.map((x) => (x.id === h.id ? { ...x, blocos } : x)),
                )
              }
            />
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          className="h-10"
          onClick={() =>
            setHorarios((hs) => [...hs, { id: novoId(), dia: "", blocos: [] }])
          }
        >
          <Plus aria-hidden className="size-4" />
          Adicionar dia
        </Button>
      </section>

      {/* Programação */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Programação</h2>
        {programacao.map((d) => (
          <div
            key={d.id}
            className="space-y-4 rounded-lg border border-border p-4"
          >
            <div className="flex gap-2">
              <Input
                value={d.dia}
                placeholder="Dia 01 — Sexta-feira"
                onChange={(e) =>
                  setProgramacao((ds) =>
                    ds.map((x) =>
                      x.id === d.id ? { ...x, dia: e.target.value } : x,
                    ),
                  )
                }
              />
              <Button
                type="button"
                variant="outline"
                aria-label="Remover dia"
                className="h-11 shrink-0 px-3"
                onClick={() =>
                  setProgramacao((ds) => ds.filter((x) => x.id !== d.id))
                }
              >
                <Trash2 aria-hidden className="size-4" />
              </Button>
            </div>

            {d.periodos.map((p) => (
              <div
                key={p.id}
                className="space-y-3 rounded-lg border border-border bg-secondary/40 p-3"
              >
                <div className="flex gap-2">
                  <Input
                    value={p.titulo}
                    placeholder="Título do período (opcional): Manhã"
                    onChange={(e) =>
                      setProgramacao((ds) =>
                        ds.map((x) =>
                          x.id === d.id
                            ? {
                                ...x,
                                periodos: x.periodos.map((y) =>
                                  y.id === p.id
                                    ? { ...y, titulo: e.target.value }
                                    : y,
                                ),
                              }
                            : x,
                        ),
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    aria-label="Remover período"
                    className="h-11 shrink-0 px-3"
                    onClick={() =>
                      setProgramacao((ds) =>
                        ds.map((x) =>
                          x.id === d.id
                            ? {
                                ...x,
                                periodos: x.periodos.filter(
                                  (y) => y.id !== p.id,
                                ),
                              }
                            : x,
                        ),
                      )
                    }
                  >
                    <Trash2 aria-hidden className="size-4" />
                  </Button>
                </div>
                <ListaTextos
                  label="Itens"
                  itens={p.itens}
                  placeholder="Ministração com Pr. Fulano — Tema"
                  novoId={novoId}
                  onChange={(itens) =>
                    setProgramacao((ds) =>
                      ds.map((x) =>
                        x.id === d.id
                          ? {
                              ...x,
                              periodos: x.periodos.map((y) =>
                                y.id === p.id ? { ...y, itens } : y,
                              ),
                            }
                          : x,
                      ),
                    )
                  }
                />
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              className="h-9"
              onClick={() =>
                setProgramacao((ds) =>
                  ds.map((x) =>
                    x.id === d.id
                      ? {
                          ...x,
                          periodos: [
                            ...x.periodos,
                            { id: novoId(), titulo: "", itens: [] },
                          ],
                        }
                      : x,
                  ),
                )
              }
            >
              <Plus aria-hidden className="size-4" />
              Adicionar período
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          className="h-10"
          onClick={() =>
            setProgramacao((ds) => [
              ...ds,
              { id: novoId(), dia: "", periodos: [] },
            ])
          }
        >
          <Plus aria-hidden className="size-4" />
          Adicionar dia
        </Button>
      </section>

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
          "Salvar programação"
        )}
      </Button>
    </div>
  );
}

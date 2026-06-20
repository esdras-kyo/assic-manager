"use client";

import { CircleAlert } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CampoPersonalizado } from "@/lib/validations";

const alturaCampo = "h-13 text-lg";

export function CampoPersonalizadoInput({
  campo,
  erros,
  valor,
}: {
  campo: CampoPersonalizado;
  erros?: string[];
  valor?: string;
}) {
  const temErro = Boolean(erros?.length);
  const descrito = temErro
    ? `${campo.id}-erro`
    : campo.ajuda
      ? `${campo.id}-ajuda`
      : undefined;

  return (
    <fieldset className="space-y-2">
      {campo.tipo === "radio" ? (
        <legend className="text-lg font-bold">{campo.label}</legend>
      ) : (
        <Label htmlFor={campo.id} className="text-lg font-bold">
          {campo.label}
        </Label>
      )}

      {campo.tipo === "textarea" && (
        <Textarea
          id={campo.id}
          name={campo.id}
          rows={4}
          required={campo.obrigatorio}
          defaultValue={valor}
          aria-invalid={temErro}
          aria-describedby={descrito}
          className="text-lg"
        />
      )}

      {(campo.tipo === "texto" ||
        campo.tipo === "email" ||
        campo.tipo === "tel") && (
        <Input
          id={campo.id}
          name={campo.id}
          type={
            campo.tipo === "email"
              ? "email"
              : campo.tipo === "tel"
                ? "tel"
                : "text"
          }
          autoComplete={campo.autoComplete}
          required={campo.obrigatorio}
          defaultValue={valor}
          aria-invalid={temErro}
          aria-describedby={descrito}
          className={alturaCampo}
        />
      )}

      {campo.tipo === "select" && (
        <select
          id={campo.id}
          name={campo.id}
          required={campo.obrigatorio}
          defaultValue={valor ?? ""}
          aria-invalid={temErro}
          aria-describedby={descrito}
          className="h-13 w-full rounded-lg border border-input bg-card px-3 text-lg"
        >
          <option value="" disabled>
            Selecione…
          </option>
          {campo.opcoes?.map((op) => (
            <option key={op} value={op}>
              {op}
            </option>
          ))}
        </select>
      )}

      {campo.tipo === "radio" && (
        <div className="space-y-3 pt-1">
          {campo.opcoes?.map((op) => (
            <label
              key={op}
              className="flex items-center gap-3 text-lg"
              htmlFor={`${campo.id}-${op}`}
            >
              <input
                id={`${campo.id}-${op}`}
                type="radio"
                name={campo.id}
                value={op}
                required={campo.obrigatorio}
                defaultChecked={valor === op}
                className="size-5 accent-primary"
              />
              {op}
            </label>
          ))}
        </div>
      )}

      {campo.tipo === "checkbox" && (
        <label className="flex items-start gap-3 text-lg" htmlFor={campo.id}>
          <input
            id={campo.id}
            type="checkbox"
            name={campo.id}
            required={campo.obrigatorio}
            defaultChecked={valor === "on"}
            className="mt-1 size-5 shrink-0 accent-primary"
            aria-describedby={descrito}
          />
          <span>{campo.label}</span>
        </label>
      )}

      {campo.ajuda && !temErro && (
        <p id={`${campo.id}-ajuda`} className="text-muted-foreground">
          {campo.ajuda}
        </p>
      )}
      {erros?.map((erro) => (
        <p
          key={erro}
          id={`${campo.id}-erro`}
          className="flex items-center gap-1.5 font-semibold text-destructive"
        >
          <CircleAlert aria-hidden className="size-4.5 shrink-0" />
          {erro}
        </p>
      ))}
    </fieldset>
  );
}

"use client";

import { Check, X } from "lucide-react";

import {
  cancelarInscricaoAction,
  confirmarInscricaoAction,
} from "@/app/admin/(painel)/inscricoes/actions";
import { Button } from "@/components/ui/button";

export function AcoesInscricao({ id }: { id: string }) {
  return (
    <div className="flex gap-2">
      <form action={confirmarInscricaoAction.bind(null, id)}>
        <Button type="submit" size="sm" variant="secondary">
          <Check aria-hidden className="size-4" />
          Confirmar
        </Button>
      </form>
      <form action={cancelarInscricaoAction.bind(null, id)}>
        <Button type="submit" size="sm" variant="outline">
          <X aria-hidden className="size-4" />
          Cancelar
        </Button>
      </form>
    </div>
  );
}

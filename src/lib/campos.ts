import { type CampoPersonalizado, type TipoCampo } from "@/lib/validations";

export interface RascunhoCampo {
  id: string;
  label: string;
  tipo: TipoCampo;
  obrigatorio: boolean;
  ajuda: string;
  opcoes: string[];
}

const COM_OPCOES: TipoCampo[] = ["radio", "select"];

/** Gera um id alfanumérico começando por letra, único no conjunto `usados`. */
function gerarIdCampo(label: string, usados: Set<string>): string {
  const base = label
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .replace(/^[0-9]+/, "");
  const id = base ? base[0].toLowerCase() + base.slice(1) : "campo";
  let final = id;
  let n = 1;
  while (usados.has(final)) final = `${id}${++n}`;
  usados.add(final);
  return final;
}

/**
 * Monta os campos personalizados a partir dos rascunhos do form. id existente é
 * preservado (imutável); novo é gerado do label (único). opcoes só p/
 * radio/select (trim + descarta vazias). Rascunho sem label é descartado. Não
 * valida — o schema valida na action.
 */
export function montarCampos(rascunhos: RascunhoCampo[]): CampoPersonalizado[] {
  const usados = new Set<string>();
  for (const r of rascunhos) {
    const id = r.id.trim();
    if (id) usados.add(id);
  }

  const campos: CampoPersonalizado[] = [];
  for (const r of rascunhos) {
    const label = r.label.trim();
    if (!label) continue;

    const id = r.id.trim() || gerarIdCampo(label, usados);
    const ajuda = r.ajuda.trim();
    const opcoes = COM_OPCOES.includes(r.tipo)
      ? r.opcoes.map((o) => o.trim()).filter(Boolean)
      : undefined;

    campos.push({
      id,
      label,
      tipo: r.tipo,
      obrigatorio: r.obrigatorio,
      ...(ajuda && { ajuda }),
      ...(opcoes && { opcoes }),
    });
  }
  return campos;
}

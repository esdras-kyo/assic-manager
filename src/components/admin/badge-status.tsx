import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Estado nunca é só cor: rótulo textual sempre presente (§5.2).
const ESTILOS: Record<string, { rotulo: string; classe: string }> = {
  // Evento
  RASCUNHO: { rotulo: "Rascunho", classe: "bg-muted text-muted-foreground" },
  ABERTO: { rotulo: "Aberto", classe: "bg-success text-success-foreground" },
  ENCERRADO: { rotulo: "Encerrado", classe: "bg-muted text-muted-foreground" },
  CANCELADO: {
    rotulo: "Cancelado",
    classe: "bg-destructive/15 text-destructive",
  },
  // Inscrição
  PENDENTE: {
    rotulo: "Pendente",
    classe: "bg-warning text-warning-foreground",
  },
  CONFIRMADA: {
    rotulo: "Confirmada",
    classe: "bg-success text-success-foreground",
  },
  CANCELADA: {
    rotulo: "Cancelada",
    classe: "bg-destructive/15 text-destructive",
  },
  EXPIRADA: { rotulo: "Expirada", classe: "bg-muted text-muted-foreground" },
  // Pagamento
  PENDING: {
    rotulo: "Aguardando",
    classe: "bg-warning text-warning-foreground",
  },
  PAID: { rotulo: "Pago", classe: "bg-success text-success-foreground" },
  FAILED: { rotulo: "Falhou", classe: "bg-destructive/15 text-destructive" },
  REFUNDED: { rotulo: "Estornado", classe: "bg-muted text-muted-foreground" },
  EXPIRED: { rotulo: "Expirado", classe: "bg-muted text-muted-foreground" },
};

export function BadgeStatus({ status }: { status: string }) {
  const estilo = ESTILOS[status] ?? { rotulo: status, classe: "" };
  return (
    <Badge className={cn("font-semibold", estilo.classe)}>
      {estilo.rotulo}
    </Badge>
  );
}

import Link from "next/link";
import { CalendarDays, LayoutDashboard, LogOut, Users } from "lucide-react";

import { logoutAction } from "@/app/admin/login/actions";
import { Button } from "@/components/ui/button";
import { exigirAdmin } from "@/lib/auth";

const navegacao = [
  { href: "/admin", rotulo: "Visão geral", Icone: LayoutDashboard },
  { href: "/admin/eventos", rotulo: "Eventos", Icone: CalendarDays },
  { href: "/admin/inscricoes", rotulo: "Inscrições", Icone: Users },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Camada extra de UX; cada page/action repete a checagem (autorização real).
  await exigirAdmin();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <p className="font-heading text-xl font-semibold text-primary">
          assic <span className="text-muted-foreground">/ admin</span>
        </p>
        <nav aria-label="Navegação do painel">
          <ul className="flex flex-wrap items-center gap-1">
            {navegacao.map(({ href, rotulo, Icone }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 font-semibold transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <Icone aria-hidden className="size-4.5" />
                  {rotulo}
                </Link>
              </li>
            ))}
            <li>
              <form action={logoutAction}>
                <Button
                  type="submit"
                  variant="ghost"
                  className="min-h-11 gap-2"
                >
                  <LogOut aria-hidden className="size-4.5" />
                  Sair
                </Button>
              </form>
            </li>
          </ul>
        </nav>
      </div>
      <div className="py-8">{children}</div>
    </div>
  );
}

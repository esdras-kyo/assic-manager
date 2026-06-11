import Link from "next/link";

const navegacao = [
  { href: "/", rotulo: "Início" },
  { href: "/eventos", rotulo: "Eventos" },
];

export function Header() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="font-heading text-2xl font-semibold tracking-tight text-primary"
        >
          assic
        </Link>
        <nav aria-label="Navegação principal">
          <ul className="flex items-center gap-1">
            {navegacao.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center rounded-lg px-4 font-semibold text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {item.rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

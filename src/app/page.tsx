import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        assic
      </h1>
      <p className="text-muted-foreground">
        Plataforma de inscrições — em construção.
      </p>
      <Button>Botão de teste</Button>
    </main>
  );
}

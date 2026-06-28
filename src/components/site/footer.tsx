export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-5 px-4 py-12 text-center sm:px-6">
        {/* Logo estática (public/images/assic.PNG — caso exato p/ Linux/Vercel).
            img simples: next/image exigiria dimensões fixas, desnecessário aqui. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/assic.PNG" alt="ASSIC" className="h-20 w-auto" />
        <p className="max-w-md text-lg text-primary-foreground/85">
          Inscrições simples e seguras para os nossos eventos. Dúvidas? Fale com
          a organização.
        </p>
      </div>
    </footer>
  );
}

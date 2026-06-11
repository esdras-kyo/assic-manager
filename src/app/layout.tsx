import type { Metadata } from "next";
import { Atkinson_Hyperlegible, Fraunces, Geist_Mono } from "next/font/google";

import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { MotionProvider } from "@/components/site/motion-provider";

import "./globals.css";

// Atkinson Hyperlegible: desenhada pelo Braille Institute para máxima
// legibilidade (público leigo/idoso — planoassic §5). Fraunces: serif
// calorosa para títulos. Geist Mono: códigos (Pix copia-e-cola).
const atkinson = Atkinson_Hyperlegible({
  variable: "--font-atkinson",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "assic — eventos e inscrições",
    template: "%s · assic",
  },
  description:
    "Inscreva-se nos próximos eventos de forma simples e segura, direto do seu celular.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${atkinson.variable} ${fraunces.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <MotionProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </MotionProvider>
      </body>
    </html>
  );
}

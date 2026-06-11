import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { FormLogin } from "@/components/admin/form-login";
import { obterSessao } from "@/lib/auth";

export const metadata: Metadata = { title: "Entrar — Admin" };

export default async function LoginPage() {
  // Já logado não precisa ver o login.
  if (await obterSessao()) redirect("/admin");

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col px-4 py-20">
      <h1 className="text-3xl font-semibold tracking-tight">Painel admin</h1>
      <p className="mt-2 text-muted-foreground">
        Entre para gerenciar eventos e inscrições.
      </p>
      <div className="mt-8">
        <FormLogin />
      </div>
    </div>
  );
}

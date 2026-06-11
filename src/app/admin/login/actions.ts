"use server";

import { redirect } from "next/navigation";

import { criarSessaoCookie, destruirSessao } from "@/lib/auth";
import { autenticarAdmin } from "@/services/admin.service";

export interface LoginFormState {
  mensagem?: string;
}

export async function loginAction(
  _prev: LoginFormState | undefined,
  formData: FormData,
): Promise<LoginFormState | undefined> {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");

  if (!email || !senha) {
    return { mensagem: "Preencha email e senha." };
  }

  const admin = await autenticarAdmin(email, senha);
  if (!admin) {
    // Mensagem única p/ email OU senha errada — sem enumeração de contas.
    return { mensagem: "Email ou senha incorretos." };
  }

  await criarSessaoCookie(admin.id);
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await destruirSessao();
  redirect("/admin/login");
}

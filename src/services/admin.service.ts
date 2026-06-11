import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db";
import type { Admin } from "@/generated/prisma/client";

const BCRYPT_COST = 12;

/**
 * Email OU senha errada devolvem o MESMO null — resposta indistinguível
 * evita enumeração de contas (§6).
 */
export async function autenticarAdmin(
  email: string,
  senha: string,
): Promise<Admin | null> {
  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) return null;

  const senhaOk = await bcrypt.compare(senha, admin.senhaHash);
  return senhaOk ? admin : null;
}

export async function criarAdmin(input: {
  nome: string;
  email: string;
  senha: string;
}): Promise<Admin> {
  const senhaHash = await bcrypt.hash(input.senha, BCRYPT_COST);
  return prisma.admin.create({
    data: { nome: input.nome, email: input.email, senhaHash },
  });
}

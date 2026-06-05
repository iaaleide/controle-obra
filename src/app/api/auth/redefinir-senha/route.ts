import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashSenha } from "@/lib/auth";

export async function POST(request: Request) {
  const { token, novaSenha } = await request.json();

  if (!token || !novaSenha || novaSenha.length < 4) {
    return NextResponse.json(
      { error: "Token e nova senha (mín. 4 caracteres) são obrigatórios" },
      { status: 400 }
    );
  }

  const reset = await prisma.passwordReset.findUnique({
    where: { token },
    include: { usuario: true },
  });

  if (!reset || reset.usado || reset.expiraEm < new Date()) {
    return NextResponse.json({ error: "Link inválido ou expirado" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.usuario.update({
      where: { id: reset.usuarioId },
      data: { senhaHash: await hashSenha(novaSenha) },
    }),
    prisma.passwordReset.update({
      where: { id: reset.id },
      data: { usado: true },
    }),
  ]);

  return NextResponse.json({ message: "Senha redefinida com sucesso. Faça login." });
}

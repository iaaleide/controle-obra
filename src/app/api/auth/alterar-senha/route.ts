import { NextResponse } from "next/server";
import { getSession, verificarSenha, hashSenha } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { temPermissao } from "@/lib/permissions";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "alterar_senha")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { senhaAtual, novaSenha } = await request.json();

  if (!senhaAtual || !novaSenha || novaSenha.length < 4) {
    return NextResponse.json(
      { error: "Senha atual e nova senha (mín. 4 caracteres) são obrigatórias" },
      { status: 400 }
    );
  }

  const usuario = await prisma.usuario.findUnique({ where: { id: session.id } });
  if (!usuario || !(await verificarSenha(senhaAtual, usuario.senhaHash))) {
    return NextResponse.json({ error: "Senha atual incorreta" }, { status: 401 });
  }

  await prisma.usuario.update({
    where: { id: session.id },
    data: { senhaHash: await hashSenha(novaSenha) },
  });

  return NextResponse.json({ message: "Senha alterada com sucesso" });
}

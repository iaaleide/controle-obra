import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizarContatoUsuario } from "@/lib/usuario-contato";
import { temPermissao } from "@/lib/permissions";

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "editar_contato")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { email, telefone } = await request.json();
  const contato = normalizarContatoUsuario(email, telefone);
  if (!contato.ok) {
    return NextResponse.json({ error: contato.error }, { status: 400 });
  }

  try {
    const usuario = await prisma.usuario.update({
      where: { id: session.id },
      data: {
        email: contato.email,
        telefone: contato.telefone,
      },
      select: { id: true, login: true, nome: true, perfil: true, email: true, telefone: true },
    });

    return NextResponse.json({
      message: "Contatos atualizados",
      email: usuario.email,
      telefone: usuario.telefone,
    });
  } catch (err) {
    console.error("Erro ao salvar contatos:", err);
    return NextResponse.json(
      { error: "Não foi possível salvar os contatos. Tente novamente." },
      { status: 500 }
    );
  }
}

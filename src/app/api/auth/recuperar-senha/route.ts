import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { enviarRecuperacaoSenha } from "@/lib/email";

export async function POST(request: Request) {
  const { login } = await request.json();

  if (!login) {
    return NextResponse.json({ error: "Informe o login" }, { status: 400 });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { login: login.trim().toLowerCase(), ativo: true },
  });

  // Resposta genérica por segurança
  if (!usuario) {
    return NextResponse.json({
      message:
        "Se o login existir, o link de recuperação será enviado para os e-mails autorizados.",
    });
  }

  const token = randomBytes(32).toString("hex");
  const expiraEm = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordReset.create({
    data: { usuarioId: usuario.id, token, expiraEm },
  });

  const resultado = await enviarRecuperacaoSenha(usuario.login, token);

  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.message }, { status: 500 });
  }

  return NextResponse.json({ message: resultado.message });
}

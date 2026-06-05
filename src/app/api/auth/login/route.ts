import { NextResponse } from "next/server";
import {
  buscarUsuarioPorLogin,
  verificarSenha,
  criarToken,
  setSessionCookie,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { login, senha } = await request.json();

    if (!login || !senha) {
      return NextResponse.json({ error: "Login e senha são obrigatórios" }, { status: 400 });
    }

    const usuario = await buscarUsuarioPorLogin(login.trim().toLowerCase());

    if (!usuario || !(await verificarSenha(senha, usuario.senhaHash))) {
      return NextResponse.json({ error: "Login ou senha inválidos" }, { status: 401 });
    }

    const token = await criarToken({
      id: usuario.id,
      login: usuario.login,
      nome: usuario.nome,
      perfil: usuario.perfil,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      user: {
        id: usuario.id,
        login: usuario.login,
        nome: usuario.nome,
        perfil: usuario.perfil,
      },
    });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

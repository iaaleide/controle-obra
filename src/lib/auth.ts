import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { Perfil } from "@prisma/client";
import { prisma } from "./prisma";

const COOKIE_NAME = "obra_session";
const EXPIRES_IN = "7d";

export interface SessionUser {
  id: string;
  login: string;
  nome: string;
  perfil: Perfil;
}

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET não configurado");
  return new TextEncoder().encode(secret);
}

export async function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, 12);
}

export async function verificarSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}

export async function criarToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    login: user.login,
    nome: user.nome,
    perfil: user.perfil,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(getSecret());
}

export async function verificarToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      id: payload.id as string,
      login: payload.login as string,
      nome: payload.nome as string,
      perfil: payload.perfil as Perfil,
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verificarToken(token);
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado");
  return session;
}

export async function buscarUsuarioPorLogin(login: string) {
  return prisma.usuario.findFirst({ where: { login, ativo: true } });
}

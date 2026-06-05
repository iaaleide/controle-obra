import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { labelPerfil } from "@/lib/permissions";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.id },
    select: { email: true, telefone: true },
  });

  return NextResponse.json({
    ...session,
    email: usuario?.email ?? null,
    telefone: usuario?.telefone ?? null,
    perfilLabel: labelPerfil(session.perfil),
  });
}

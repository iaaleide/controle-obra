import { NextResponse } from "next/server";
import { Perfil } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { temPermissao } from "@/lib/permissions";

export async function GET() {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "alocar_obras_visitante")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const visitantes = await prisma.usuario.findMany({
    where: { perfil: Perfil.VISITANTE, ativo: true },
    select: {
      id: true,
      nome: true,
      login: true,
      email: true,
      telefone: true,
      obrasAlocadas: {
        select: { obra: { select: { id: true, nome: true } } },
      },
    },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(
    visitantes.map((v) => ({
      ...v,
      obraIds: v.obrasAlocadas.map((a) => a.obra.id),
      obras: v.obrasAlocadas.map((a) => a.obra),
    }))
  );
}

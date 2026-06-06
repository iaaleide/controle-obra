import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { temPermissao } from "@/lib/permissions";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "gerenciar_diario_obra")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const obraId = new URL(request.url).searchParams.get("obraId");
  if (!obraId) {
    return NextResponse.json({ error: "obraId é obrigatório" }, { status: 400 });
  }

  const diarios = await prisma.diarioObra.findMany({
    where: { obraId },
    include: { fotos: { orderBy: [{ pagina: "asc" }, { ordem: "asc" }] } },
    orderBy: { data: "desc" },
    take: 20,
  });

  return NextResponse.json(diarios);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "gerenciar_diario_obra")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { obraId, data, clienteNome, clima, observacoes, fotos } = await request.json();

  if (!obraId || !data) {
    return NextResponse.json({ error: "obraId e data são obrigatórios" }, { status: 400 });
  }

  const obra = await prisma.obra.findUnique({ where: { id: obraId, ativa: true } });
  if (!obra) {
    return NextResponse.json({ error: "Obra não encontrada" }, { status: 404 });
  }

  const listaFotos = Array.isArray(fotos) ? fotos : [];

  const diario = await prisma.$transaction(async (tx) => {
    const criado = await tx.diarioObra.create({
      data: {
        obraId,
        data: new Date(data + "T12:00:00"),
        clienteNome: clienteNome || obra.clienteNome || null,
        clima: clima || null,
        observacoes: observacoes || null,
      },
    });

    if (listaFotos.length > 0) {
      await tx.diarioObraFoto.createMany({
        data: listaFotos.map(
          (f: { pagina?: number; ordem: number; imagemBase64?: string; legenda?: string }) => ({
            diarioId: criado.id,
            pagina: f.pagina ?? 0,
            ordem: f.ordem,
            imagemBase64: f.imagemBase64 || null,
            legenda: f.legenda || null,
          })
        ),
      });
    }

    return tx.diarioObra.findUnique({
      where: { id: criado.id },
      include: { fotos: { orderBy: [{ pagina: "asc" }, { ordem: "asc" }] }, obra: true },
    });
  });

  return NextResponse.json(diario, { status: 201 });
}

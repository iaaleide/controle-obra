import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { temPermissao } from "@/lib/permissions";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "ver_presenca")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const presencaId = searchParams.get("presencaId");
  const funcionarioId = searchParams.get("funcionarioId");
  const data = searchParams.get("data");

  if (!presencaId && (!funcionarioId || !data)) {
    return NextResponse.json(
      { error: "Informe presencaId ou funcionarioId + data" },
      { status: 400 }
    );
  }

  const where = presencaId
    ? { presencaId }
    : { funcionarioId: funcionarioId!, data: new Date(data! + "T12:00:00") };

  const historico = await prisma.presencaHistorico.findMany({
    where,
    orderBy: { criadoEm: "desc" },
    select: {
      id: true,
      acao: true,
      presente: true,
      observacao: true,
      obraId: true,
      presenteAnterior: true,
      observacaoAnterior: true,
      obraIdAnterior: true,
      usuarioNome: true,
      usuarioPerfil: true,
      criadoEm: true,
    },
  });

  const obraIds = [
    ...new Set(
      historico.flatMap((h) => [h.obraId, h.obraIdAnterior].filter(Boolean) as string[])
    ),
  ];

  const obras =
    obraIds.length > 0
      ? await prisma.obra.findMany({
          where: { id: { in: obraIds } },
          select: { id: true, nome: true },
        })
      : [];

  const nomesObra = Object.fromEntries(obras.map((o) => [o.id, o.nome]));

  const resultado = historico.map((h) => ({
    ...h,
    obraNome: nomesObra[h.obraId] ?? h.obraId,
    obraAnteriorNome: h.obraIdAnterior ? (nomesObra[h.obraIdAnterior] ?? h.obraIdAnterior) : null,
  }));

  return NextResponse.json(resultado);
}

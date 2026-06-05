import { NextResponse } from "next/server";
import { AcaoPresencaHistorico } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { temPermissao } from "@/lib/permissions";
import { presencaAlterada, registrarHistoricoPresenca } from "@/lib/presenca-historico";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "ver_presenca")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const obraId = searchParams.get("obraId");
  const funcionarioId = searchParams.get("funcionarioId");
  const data = searchParams.get("data");

  if (!data) {
    return NextResponse.json({ error: "data é obrigatória" }, { status: 400 });
  }

  const dataRef = new Date(data + "T12:00:00");

  if (funcionarioId) {
    const funcionario = await prisma.funcionario.findUnique({
      where: { id: funcionarioId, ativo: true },
      include: {
        obras: { include: { obra: { select: { id: true, nome: true } } } },
        presencas: { where: { data: dataRef }, take: 1 },
      },
    });

    if (!funcionario) {
      return NextResponse.json({ error: "Funcionário não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      funcionarioId: funcionario.id,
      nome: funcionario.nome,
      cargo: funcionario.cargo,
      obras: funcionario.obras.map((a) => a.obra),
      alocadoNaObra: obraId
        ? funcionario.obras.some((a) => a.obraId === obraId)
        : undefined,
      presenca: funcionario.presencas[0] || null,
    });
  }

  if (!obraId) {
    return NextResponse.json({ error: "obraId ou funcionarioId é obrigatório" }, { status: 400 });
  }

  const funcionarios = await prisma.funcionario.findMany({
    where: { ativo: true, obras: { some: { obraId } } },
    include: {
      presencas: {
        where: { data: dataRef },
        take: 1,
      },
    },
    orderBy: { nome: "asc" },
  });

  const resultado = funcionarios.map((f) => ({
    funcionarioId: f.id,
    nome: f.nome,
    cargo: f.cargo,
    presenca: f.presencas[0] || null,
  }));

  return NextResponse.json(resultado);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "cadastrar_presenca")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { funcionarioId, obraId, data, presente, observacao } = await request.json();

  if (!funcionarioId || !obraId || !data) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  if (observacao && observacao.length > 500) {
    return NextResponse.json({ error: "Observação máximo 500 caracteres" }, { status: 400 });
  }

  const dataRef = new Date(data + "T12:00:00");

  const alocado = await prisma.funcionarioObra.findUnique({
    where: { funcionarioId_obraId: { funcionarioId, obraId } },
  });
  if (!alocado) {
    return NextResponse.json(
      { error: "Funcionário não está alocado nesta obra" },
      { status: 400 }
    );
  }

  const existente = await prisma.presenca.findUnique({
    where: {
      funcionarioId_data: { funcionarioId, data: dataRef },
    },
  });

  const dadosNovos = {
    presente: !!presente,
    observacao: observacao || null,
    obraId,
  };

  if (existente) {
    if (!temPermissao(session.perfil, "editar_presenca")) {
      return NextResponse.json(
        { error: "Registro já existe. Sem permissão para alterar." },
        { status: 403 }
      );
    }

    if (!presencaAlterada(existente, dadosNovos)) {
      return NextResponse.json(existente);
    }

    const anterior = {
      presente: existente.presente,
      observacao: existente.observacao,
      obraId: existente.obraId,
    };

    const atualizada = await prisma.presenca.update({
      where: { id: existente.id },
      data: dadosNovos,
    });

    await registrarHistoricoPresenca(
      atualizada,
      AcaoPresencaHistorico.ALTERACAO,
      session,
      anterior
    );

    return NextResponse.json({ ...atualizada, alterado: true });
  }

  const presenca = await prisma.presenca.create({
    data: {
      funcionarioId,
      data: dataRef,
      ...dadosNovos,
    },
  });

  await registrarHistoricoPresenca(presenca, AcaoPresencaHistorico.CRIACAO, session);

  return NextResponse.json(presenca, { status: 201 });
}

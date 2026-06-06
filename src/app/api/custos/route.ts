import { NextResponse } from "next/server";
import { TipoCustoFuncionario } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { temPermissao } from "@/lib/permissions";

export async function GET() {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "gerenciar_custos")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const custos = await prisma.custoFuncionario.findMany({
    where: { ativo: true },
    include: { funcionario: { select: { id: true, nome: true, cargo: true } } },
    orderBy: { criadoEm: "desc" },
  });

  return NextResponse.json(
    custos.map((c) => ({
      ...c,
      valorDiario: Number(c.valorDiario),
    }))
  );
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "gerenciar_custos")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { tipo, cargo, funcionarioId, valorDiario } = await request.json();
  const valor = Number(valorDiario);

  if (!tipo || !["CARGO", "PESSOA"].includes(tipo)) {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }
  if (!valor || valor <= 0) {
    return NextResponse.json({ error: "Valor diário inválido" }, { status: 400 });
  }

  if (tipo === TipoCustoFuncionario.CARGO && !cargo?.trim()) {
    return NextResponse.json({ error: "Informe o cargo" }, { status: 400 });
  }
  if (tipo === TipoCustoFuncionario.PESSOA && !funcionarioId) {
    return NextResponse.json({ error: "Selecione o funcionário" }, { status: 400 });
  }

  const custo = await prisma.custoFuncionario.create({
    data: {
      tipo,
      cargo: tipo === TipoCustoFuncionario.CARGO ? cargo.trim() : null,
      funcionarioId: tipo === TipoCustoFuncionario.PESSOA ? funcionarioId : null,
      valorDiario: valor,
    },
    include: { funcionario: { select: { id: true, nome: true, cargo: true } } },
  });

  return NextResponse.json({ ...custo, valorDiario: Number(custo.valorDiario) }, { status: 201 });
}

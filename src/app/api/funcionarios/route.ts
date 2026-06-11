import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { temPermissao } from "@/lib/permissions";
import { paraArmazenamento } from "@/lib/telefone";
import {
  formatarCpf,
  normalizarCpfOpcional,
  normalizarEnderecoOpcional,
  normalizarRgOpcional,
} from "@/lib/documento";

const includeObras = {
  obras: {
    where: { obra: { ativa: true } },
    include: { obra: { select: { id: true, nome: true } } },
  },
} as const;

function formatFuncionario(
  f: Awaited<ReturnType<typeof prisma.funcionario.findFirst>> & {
    obras: { obra: { id: string; nome: string } }[];
  }
) {
  return {
    id: f!.id,
    nome: f!.nome,
    cargo: f!.cargo,
    rg: f!.rg,
    cpf: f!.cpf ? formatarCpf(f!.cpf) : null,
    endereco: f!.endereco,
    telefone: f!.telefone,
    ativo: f!.ativo,
    obras: f!.obras.map((a) => a.obra),
  };
}

function normalizarCamposFuncionario(body: {
  rg?: unknown;
  cpf?: unknown;
  endereco?: unknown;
  telefone?: unknown;
}) {
  const rg = normalizarRgOpcional(body.rg);
  if (!rg.ok) return rg;

  const cpf = normalizarCpfOpcional(body.cpf);
  if (!cpf.ok) return cpf;

  const endereco = normalizarEnderecoOpcional(body.endereco);
  if (!endereco.ok) return endereco;

  const telefoneBruto = typeof body.telefone === "string" ? body.telefone.trim() : "";
  const telefone = telefoneBruto ? paraArmazenamento(telefoneBruto) || null : null;

  return {
    ok: true as const,
    rg: rg.valor,
    cpf: cpf.valor,
    endereco: endereco.valor,
    telefone,
  };
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "ver_funcionarios")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const obraId = searchParams.get("obraId");
  const semObra = searchParams.get("semObra") === "true";

  const funcionarios = await prisma.funcionario.findMany({
    where: {
      ativo: true,
      ...(obraId
        ? { obras: { some: { obraId, obra: { ativa: true } } } }
        : {}),
      ...(semObra ? { obras: { none: {} } } : {}),
    },
    include: includeObras,
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(funcionarios.map((f) => formatFuncionario(f as never)));
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "cadastrar_funcionario")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { nome, cargo, rg, cpf, endereco, telefone, obraIds } = await request.json();

  if (!nome?.trim()) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  const campos = normalizarCamposFuncionario({ rg, cpf, endereco, telefone });
  if (!campos.ok) {
    return NextResponse.json({ error: campos.error }, { status: 400 });
  }

  const ids = Array.isArray(obraIds) ? obraIds.filter(Boolean) : [];

  try {
    const funcionario = await prisma.funcionario.create({
      data: {
        nome: nome.trim(),
        cargo: cargo || null,
        rg: campos.rg,
        cpf: campos.cpf,
        endereco: campos.endereco,
        telefone: campos.telefone,
        ...(ids.length > 0
          ? { obras: { create: ids.map((obraId: string) => ({ obraId })) } }
          : {}),
      },
      include: includeObras,
    });

    return NextResponse.json(formatFuncionario(funcionario as never), { status: 201 });
  } catch (err) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      err.code === "P2002"
    ) {
      return NextResponse.json({ error: "CPF já cadastrado" }, { status: 409 });
    }
    throw err;
  }
}

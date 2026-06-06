import { TipoCustoFuncionario } from "@prisma/client";
import { prisma } from "./prisma";
import { gerarRelatorioSemanal } from "./relatorio";

export interface LinhaCusto {
  funcionario: string;
  cargo: string | null;
  diasTrabalhados: number;
  valorDiario: number;
  valorTotal: number;
  origemCusto: "PESSOA" | "CARGO" | "SEM_CUSTO";
}

export interface RelatorioCustoSemanal {
  obra: string;
  periodo: string;
  linhas: LinhaCusto[];
  totalGeral: number;
}

function inicioSemana(data: Date): Date {
  const d = new Date(data);
  const dia = d.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fimSemana(inicio: Date): Date {
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + 6);
  fim.setHours(23, 59, 59, 999);
  return fim;
}

async function buscarCustosAtivos() {
  return prisma.custoFuncionario.findMany({
    where: { ativo: true },
    include: { funcionario: { select: { id: true, nome: true } } },
  });
}

function resolverValorDiario(
  funcionarioId: string,
  cargo: string | null,
  custos: Awaited<ReturnType<typeof buscarCustosAtivos>>
): { valor: number; origem: LinhaCusto["origemCusto"] } {
  const porPessoa = custos.find(
    (c) => c.tipo === TipoCustoFuncionario.PESSOA && c.funcionarioId === funcionarioId
  );
  if (porPessoa) {
    return { valor: Number(porPessoa.valorDiario), origem: "PESSOA" };
  }

  const cargoNorm = (cargo || "").trim().toLowerCase();
  if (cargoNorm) {
    const porCargo = custos.find(
      (c) =>
        c.tipo === TipoCustoFuncionario.CARGO &&
        (c.cargo || "").trim().toLowerCase() === cargoNorm
    );
    if (porCargo) {
      return { valor: Number(porCargo.valorDiario), origem: "CARGO" };
    }
  }

  return { valor: 0, origem: "SEM_CUSTO" };
}

export async function gerarRelatorioCustoSemanal(
  obraId: string,
  referencia?: Date
): Promise<RelatorioCustoSemanal | null> {
  const relatorioPresenca = await gerarRelatorioSemanal(obraId, referencia, {
    incluirSemPresenca: false,
  });
  if (!relatorioPresenca) return null;

  const custos = await buscarCustosAtivos();
  const funcionarios = await prisma.funcionario.findMany({
    where: {
      ativo: true,
      obras: { some: { obraId } },
    },
    select: { id: true, nome: true, cargo: true },
  });

  const mapaFunc = Object.fromEntries(funcionarios.map((f) => [f.nome, f]));

  const linhas: LinhaCusto[] = relatorioPresenca.linhas.map((l) => {
    const f = mapaFunc[l.funcionario];
    const { valor, origem } = resolverValorDiario(
      f?.id ?? "",
      l.cargo,
      custos
    );
    const valorTotal = valor * l.diasTrabalhados;
    return {
      funcionario: l.funcionario,
      cargo: l.cargo,
      diasTrabalhados: l.diasTrabalhados,
      valorDiario: valor,
      valorTotal,
      origemCusto: origem,
    };
  });

  return {
    obra: relatorioPresenca.obra,
    periodo: relatorioPresenca.periodo,
    linhas,
    totalGeral: linhas.reduce((acc, l) => acc + l.valorTotal, 0),
  };
}

export function periodoSemanaAtual(referencia = new Date()) {
  const inicio = inicioSemana(referencia);
  const fim = fimSemana(inicio);
  const periodo = `${inicio.toLocaleDateString("pt-BR")} a ${fim.toLocaleDateString("pt-BR")}`;
  return { inicio, fim, periodo };
}

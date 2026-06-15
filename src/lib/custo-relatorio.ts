import { TipoCustoFuncionario } from "@prisma/client";
import { prisma } from "./prisma";
import { gerarRelatorioSemanal, gerarRelatorioPeriodo } from "./relatorio";
import type { RelatorioSemanal } from "./pdf";
import { inicioSemana, fimSemana } from "./semana";

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
  emitidoEm?: string | null;
}

async function buscarCustosAtivos() {
  return prisma.custoFuncionario.findMany({
    where: { ativo: true },
    include: { funcionario: { select: { id: true, nome: true } } },
  });
}

type CustoAtivo = Awaited<ReturnType<typeof buscarCustosAtivos>>[number];

function indexarCustos(custos: CustoAtivo[]) {
  const porPessoa = new Map<string, CustoAtivo>();
  const porCargo = new Map<string, CustoAtivo>();

  for (const c of custos) {
    if (c.tipo === TipoCustoFuncionario.PESSOA && c.funcionarioId) {
      porPessoa.set(c.funcionarioId, c);
    } else if (c.tipo === TipoCustoFuncionario.CARGO && c.cargo) {
      porCargo.set(c.cargo.trim().toLowerCase(), c);
    }
  }

  return { porPessoa, porCargo };
}

function resolverValorDiario(
  funcionarioId: string,
  cargo: string | null,
  custosIndexados: ReturnType<typeof indexarCustos>
): { valor: number; origem: LinhaCusto["origemCusto"] } {
  const porPessoa = custosIndexados.porPessoa.get(funcionarioId);
  if (porPessoa) {
    return { valor: Number(porPessoa.valorDiario), origem: "PESSOA" };
  }

  const cargoNorm = (cargo || "").trim().toLowerCase();
  if (cargoNorm) {
    const porCargo = custosIndexados.porCargo.get(cargoNorm);
    if (porCargo) {
      return { valor: Number(porCargo.valorDiario), origem: "CARGO" };
    }
  }

  return { valor: 0, origem: "SEM_CUSTO" };
}

async function montarRelatorioCusto(
  obraId: string,
  relatorioPresenca: RelatorioSemanal
): Promise<RelatorioCustoSemanal> {
  const custos = await buscarCustosAtivos();
  const custosIndexados = indexarCustos(custos);
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
    const { valor, origem } = resolverValorDiario(f?.id ?? "", l.cargo, custosIndexados);
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

export async function gerarRelatorioCustoSemanal(
  obraId: string,
  referencia?: Date
): Promise<RelatorioCustoSemanal | null> {
  const relatorioPresenca = await gerarRelatorioSemanal(obraId, referencia, {
    incluirSemPresenca: false,
  });
  if (!relatorioPresenca) return null;
  return montarRelatorioCusto(obraId, relatorioPresenca);
}

export async function gerarRelatorioCustoPeriodo(
  obraId: string,
  dataInicio: Date,
  dataFim: Date
): Promise<RelatorioCustoSemanal | null> {
  const relatorioPresenca = await gerarRelatorioPeriodo(obraId, dataInicio, dataFim, {
    incluirSemPresenca: false,
  });
  if (!relatorioPresenca) return null;
  return montarRelatorioCusto(obraId, relatorioPresenca);
}

export function periodoSemanaAtual(referencia = new Date()) {
  const inicio = inicioSemana(referencia);
  const fim = fimSemana(inicio);
  const periodo = `${inicio.toLocaleDateString("pt-BR")} a ${fim.toLocaleDateString("pt-BR")}`;
  return { inicio, fim, periodo };
}

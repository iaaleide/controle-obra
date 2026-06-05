export interface RelatorioLinha {
  funcionario: string;
  cargo: string;
  diasTrabalhados: number;
  datas: string[];
}

export interface RelatorioSemanal {
  obra: string;
  periodo: string;
  linhas: RelatorioLinha[];
  totalPresencas: number;
  incluirSemPresenca?: boolean;
}

export function linhasRelatorioVisiveis(dados: RelatorioSemanal): RelatorioLinha[] {
  if (dados.incluirSemPresenca) return dados.linhas;
  return dados.linhas.filter((l) => l.diasTrabalhados > 0);
}

export const RODAPE_RELATORIO = "Desenvolvido por Atômica Engenharia®";

export function textoRelatorioWhatsApp(dados: RelatorioSemanal): string {
  const linhas = linhasRelatorioVisiveis(dados);
  const total = linhas.reduce((acc, l) => acc + l.diasTrabalhados, 0);

  let texto = `📋 *Relatório de Presença*\n`;
  texto += `🏗️ Obra: ${dados.obra}\n`;
  texto += `📅 Período: ${dados.periodo}\n\n`;

  if (linhas.length === 0) {
    texto += `_Nenhum funcionário com presença nesta semana._\n`;
  } else {
    for (const linha of linhas) {
      texto += `👷 ${linha.funcionario}: *${linha.diasTrabalhados} dia(s)*\n`;
      if (linha.datas.length > 0) {
        texto += `   ${linha.datas.join(", ")}\n`;
      }
    }
  }

  texto += `\nTotal: ${total} presença(s)`;
  texto += `\n\n${RODAPE_RELATORIO}`;
  return texto;
}

import { NextResponse } from "next/server";
import { TipoRelatorio } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { exigirAcessoObra } from "@/lib/acesso-obra";
import { limparRelatoriosObraComBackup } from "@/lib/relatorio-backup";
import { temPermissao } from "@/lib/permissions";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !temPermissao(session.perfil, "gerenciar_relatorios_fotografico")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { obraId, confirmar } = await request.json();

  if (!obraId) {
    return NextResponse.json({ error: "obraId é obrigatório" }, { status: 400 });
  }

  if (!confirmar) {
    return NextResponse.json(
      { error: "Confirmação necessária para excluir relatórios" },
      { status: 400 }
    );
  }

  const acesso = await exigirAcessoObra(session.id, session.perfil, obraId);
  if (!acesso.ok) {
    return NextResponse.json({ error: acesso.error }, { status: acesso.status });
  }

  const quantidade = await limparRelatoriosObraComBackup(obraId, TipoRelatorio.FOTOGRAFICO, {
    id: session.id,
    nome: session.nome,
  });

  return NextResponse.json({
    ok: true,
    message:
      quantidade === 0
        ? "Nenhum relatório fotográfico para excluir."
        : `${quantidade} relatório(s) excluído(s). Backup salvo no Supabase.`,
    quantidade,
  });
}

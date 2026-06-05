"use client";

import { Badge } from "@/components/ui/Badge";
import { corPerfil, labelPerfil } from "@/lib/permissions";
import { Perfil } from "@prisma/client";
import { Eye, HardHat, Shield } from "lucide-react";

const icones: Record<Perfil, React.ReactNode> = {
  ADMIN: <Shield className="h-3.5 w-3.5" />,
  MESTRE: <HardHat className="h-3.5 w-3.5" />,
  VISITANTE: <Eye className="h-3.5 w-3.5" />,
};

const descricoes: Record<Perfil, string> = {
  ADMIN: "Acesso total — cadastra e altera todos os dados",
  MESTRE: "Pode cadastrar, mas não alterar registros existentes",
  VISITANTE: "Somente visualização — resumo semanal e exportação PDF",
};

export function PerfilBanner({ perfil }: { perfil: Perfil }) {
  return (
    <div className={`flex items-start gap-3 rounded-xl p-3 ${corPerfil(perfil)}`}>
      <div className="mt-0.5">{icones[perfil]}</div>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Perfil: {labelPerfil(perfil)}</span>
          <Badge className={corPerfil(perfil)}>{perfil}</Badge>
        </div>
        <p className="mt-0.5 text-xs opacity-80">{descricoes[perfil]}</p>
      </div>
    </div>
  );
}

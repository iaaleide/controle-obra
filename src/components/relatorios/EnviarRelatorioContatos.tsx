import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TelefoneBrasilInput } from "@/components/ui/TelefoneBrasilInput";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Mail } from "lucide-react";

interface Props {
  email: string;
  onEmailChange: (valor: string) => void;
  whatsapp: string;
  onWhatsappChange: (valor: string) => void;
  onEnviarEmail: () => void;
  onEnviarWhatsApp: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function EnviarRelatorioContatos({
  email,
  onEmailChange,
  whatsapp,
  onWhatsappChange,
  onEnviarEmail,
  onEnviarWhatsApp,
  loading = false,
  disabled = false,
}: Props) {
  return (
    <div className="mt-4 w-full space-y-3 border-t border-slate-100 pt-4">
      <p className="text-sm font-medium text-slate-700">Enviar relatório</p>
      {!email && !whatsapp && (
        <p className="text-xs text-amber-700">
          Cadastre seu e-mail e WhatsApp em{" "}
          <Link href="/dashboard/alterar-senha" className="font-medium underline">
            Minha Conta
          </Link>{" "}
          para preencher automaticamente.
        </p>
      )}
      <div className="flex w-full gap-2">
        <Input
          label="E-mail destino"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          className="flex-1"
          disabled={disabled}
        />
        <Button
          variant="secondary"
          onClick={onEnviarEmail}
          loading={loading}
          disabled={disabled || !email}
          className="mt-6 shrink-0"
          title="Enviar por e-mail"
        >
          <Mail className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-slate-400">
        Preenchido com seu e-mail cadastrado. Edite para enviar a outra pessoa.
      </p>
      <div className="flex w-full items-end gap-2">
        <TelefoneBrasilInput
          label="WhatsApp"
          value={whatsapp}
          onChange={onWhatsappChange}
          className="flex-1"
          disabled={disabled}
          hint="Preenchido com seu número cadastrado. Edite para enviar a outro contato."
        />
        <Button
          variant="secondary"
          onClick={onEnviarWhatsApp}
          disabled={disabled}
          className="shrink-0 text-green-600 hover:bg-green-50 hover:text-green-700"
          title="Enviar por WhatsApp"
        >
          <WhatsAppIcon className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

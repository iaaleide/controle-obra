"use client";

import { useId } from "react";
import { Camera, ImageIcon } from "lucide-react";

/** Inputs acessíveis — `display:none` quebra o seletor de arquivos no Firefox mobile. */
const INPUT_ARQUIVO =
  "absolute h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 [-webkit-clip-path:inset(50%)] [clip-path:inset(50%)]";

export const MAX_FOTOS_GALERIA = 6;

interface Props {
  onSelect: (files: File[]) => void;
  /** Máximo de fotos por seleção na galeria (padrão: 6). */
  maxSelecao?: number;
  disabled?: boolean;
}

/** Galeria (múltipla) ou câmera — use com `lerImagemComoDataUrl` após seleção. */
export function SelecionarImagemFoto({ onSelect, maxSelecao = MAX_FOTOS_GALERIA, disabled }: Props) {
  const galeriaId = useId();
  const cameraId = useId();
  const limiteGaleria = Math.max(1, Math.min(maxSelecao, MAX_FOTOS_GALERIA));

  function entregar(files: FileList | null, limite: number) {
    if (!files?.length) return;
    onSelect(Array.from(files).slice(0, limite));
  }

  function onGaleria(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    entregar(input.files, limiteGaleria);
    input.value = "";
  }

  function onCamera(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    entregar(input.files, 1);
    input.value = "";
  }

  const rotuloGaleria =
    limiteGaleria > 1 ? `Galeria (até ${limiteGaleria})` : "Galeria";

  const classeBotao = (ativo: boolean) =>
    `inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 ${
      !ativo ? "pointer-events-none opacity-50" : ""
    }`;

  return (
    <div className="relative mb-2 flex flex-wrap gap-2">
      <input
        id={galeriaId}
        type="file"
        accept="image/*"
        multiple={limiteGaleria > 1}
        disabled={disabled}
        className={INPUT_ARQUIVO}
        onChange={onGaleria}
      />
      <input
        id={cameraId}
        type="file"
        accept="image/*"
        capture="environment"
        disabled={disabled}
        className={INPUT_ARQUIVO}
        onChange={onCamera}
      />
      <label htmlFor={disabled ? undefined : galeriaId} className={classeBotao(!disabled)}>
        <ImageIcon className="h-3.5 w-3.5" aria-hidden />
        {rotuloGaleria}
      </label>
      <label htmlFor={disabled ? undefined : cameraId} className={classeBotao(!disabled)}>
        <Camera className="h-3.5 w-3.5" aria-hidden />
        Câmera
      </label>
    </div>
  );
}

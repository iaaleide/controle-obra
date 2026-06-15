/** Padrão para fotos em relatórios (fotográfico, diário de obra, etc.). */
export const IMAGEM_RELATORIO_MAX_LADO = 1600;
export const IMAGEM_RELATORIO_QUALIDADE = 0.82;

function lerArquivoComoDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function redimensionarDataUrl(
  dataUrl: string,
  maxLado = IMAGEM_RELATORIO_MAX_LADO,
  qualidade = IMAGEM_RELATORIO_QUALIDADE
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      const maior = Math.max(width, height);
      const escala = maior > maxLado ? maxLado / maior : 1;
      const w = Math.max(1, Math.round(width * escala));
      const h = Math.max(1, Math.round(height * escala));

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", qualidade));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Ponto único para carregar fotos no sistema — galeria ou câmera.
 * Redimensiona e converte para JPEG para salvar, gerar PDF e enviar.
 */
export async function lerImagemComoDataUrl(
  file: File,
  opcoes?: { maxLado?: number; qualidade?: number }
): Promise<string> {
  const dataUrl = await lerArquivoComoDataUrl(file);
  return redimensionarDataUrl(
    dataUrl,
    opcoes?.maxLado ?? IMAGEM_RELATORIO_MAX_LADO,
    opcoes?.qualidade ?? IMAGEM_RELATORIO_QUALIDADE
  );
}

/** Recomprime data URL já existente (ex.: imagem antiga no banco). */
export async function comprimirDataUrlParaRelatorio(dataUrl: string): Promise<string> {
  if (!dataUrl?.startsWith("data:image")) return dataUrl;
  return redimensionarDataUrl(dataUrl);
}

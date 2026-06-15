/** Padrão para fotos em relatórios (fotográfico, diário de obra, etc.). */
export const IMAGEM_RELATORIO_MAX_LADO = 1600;
export const IMAGEM_RELATORIO_QUALIDADE = 0.82;
const TIMEOUT_IMAGEM_MS = 20_000;

function comTimeout<T>(promise: Promise<T>, ms: number, mensagem: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(mensagem)), ms);
    promise
      .then((v) => {
        clearTimeout(timer);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(timer);
        reject(e);
      });
  });
}

function lerArquivoComoDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem"));
    reader.readAsDataURL(file);
  });
}

function canvasParaJpeg(
  source: CanvasImageSource,
  width: number,
  height: number,
  maxLado: number,
  qualidade: number
): string {
  const maior = Math.max(width, height);
  const escala = maior > maxLado ? maxLado / maior : 1;
  const w = Math.max(1, Math.round(width * escala));
  const h = Math.max(1, Math.round(height * escala));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível");
  ctx.drawImage(source, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", qualidade);
}

async function comprimirArquivo(
  file: File,
  maxLado: number,
  qualidade: number
): Promise<string> {
  if (typeof createImageBitmap !== "undefined") {
    try {
      const bitmap = await createImageBitmap(file);
      try {
        return canvasParaJpeg(bitmap, bitmap.width, bitmap.height, maxLado, qualidade);
      } finally {
        bitmap.close();
      }
    } catch {
      /* fallback abaixo */
    }
  }

  const blobUrl = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          resolve(canvasParaJpeg(img, img.width, img.height, maxLado, qualidade));
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => reject(new Error("Formato de imagem não suportado"));
      img.src = blobUrl;
    });
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

/**
 * Ponto único para carregar fotos no sistema — galeria ou câmera.
 * Redimensiona e converte para JPEG para salvar, gerar PDF e enviar.
 */
export async function lerImagemComoDataUrl(
  file: File,
  opcoes?: { maxLado?: number; qualidade?: number }
): Promise<string> {
  const maxLado = opcoes?.maxLado ?? IMAGEM_RELATORIO_MAX_LADO;
  const qualidade = opcoes?.qualidade ?? IMAGEM_RELATORIO_QUALIDADE;

  return comTimeout(
    comprimirArquivo(file, maxLado, qualidade),
    TIMEOUT_IMAGEM_MS,
    "Tempo esgotado ao processar a imagem"
  );
}

/** Recomprime data URL já existente (ex.: imagem antiga no banco). */
export async function comprimirDataUrlParaRelatorio(dataUrl: string): Promise<string> {
  if (!dataUrl?.startsWith("data:image")) return dataUrl;

  try {
    return await comTimeout(
      new Promise<string>((resolve) => {
        const img = new Image();
        img.onload = () => {
          try {
            resolve(
              canvasParaJpeg(img, img.width, img.height, IMAGEM_RELATORIO_MAX_LADO, IMAGEM_RELATORIO_QUALIDADE)
            );
          } catch {
            resolve(dataUrl);
          }
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
      }),
      TIMEOUT_IMAGEM_MS,
      "timeout"
    );
  } catch {
    return dataUrl;
  }
}

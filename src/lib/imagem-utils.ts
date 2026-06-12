function base64ParaBuffer(dataUrl: string): Buffer | null {
  const match = dataUrl.match(/^data:image\/\w+;base64,(.+)$/);
  if (!match) return null;
  return Buffer.from(match[1], "base64");
}

export function obterDimensoesBase64(dataUrl: string): { w: number; h: number } {
  const buffer = base64ParaBuffer(dataUrl);
  if (!buffer || buffer.length < 24) return { w: 4, h: 3 };

  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return {
      w: buffer.readUInt32BE(16),
      h: buffer.readUInt32BE(20),
    };
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) break;
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8) {
        return {
          h: buffer.readUInt16BE(offset + 5),
          w: buffer.readUInt16BE(offset + 7),
        };
      }
      offset += 2 + length;
    }
  }

  return { w: 4, h: 3 };
}

export function calcularFitContain(
  imgW: number,
  imgH: number,
  boxW: number,
  boxH: number
): { w: number; h: number; x: number; y: number } {
  const ratio = Math.min(boxW / imgW, boxH / imgH);
  const w = imgW * ratio;
  const h = imgH * ratio;
  return { w, h, x: (boxW - w) / 2, y: (boxH - h) / 2 };
}

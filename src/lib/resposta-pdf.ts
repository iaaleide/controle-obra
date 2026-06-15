import { NextResponse } from "next/server";

export function respostaPdfNext(pdf: Buffer, prefixo: string, nomeObra: string) {
  const nome = nomeObra.replace(/\s+/g, "-").replace(/[^\w-]/g, "");
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${prefixo}-${nome || "obra"}.pdf"`,
    },
  });
}

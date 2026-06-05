import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const fontPath = path.join(
  process.cwd(),
  "node_modules/dejavu-fonts-ttf/ttf/DejaVuSans.ttf"
);
const base64 = readFileSync(fontPath).toString("base64");
const outPath = path.join(process.cwd(), "src/lib/pdf-font-dejavu.ts");

writeFileSync(
  outPath,
  `// Gerado por scripts/embed-pdf-font.mjs — não editar manualmente\nexport const DEJAVU_SANS_BASE64 = ${JSON.stringify(base64)};\n`
);

console.log("ok", outPath, base64.length);

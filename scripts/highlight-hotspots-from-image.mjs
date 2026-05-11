/**
 * Sugere células (linha, coluna) da grelha Braille onde há mais contraste local na imagem,
 * para orientar animação de highlight (IA ou edição manual).
 *
 * Redimensiona a imagem para (C×2) × (L×4) px — o mesmo espaço de pontos que o pipeline
 * `scripts/braille-from-image.ts` — e pontua cada célula 2×4 por variância dos 8 níveis de cinzento.
 *
 * Uso:
 *   node scripts/highlight-hotspots-from-image.mjs <imagem.png> --base src/.../arte.txt [--top 30] [--json]
 *
 * `--base` deve ser o `.txt` da arte (ex.: o `artKey` base) para derivar L e C após alinhar larguras.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..');

/** @param {string} raw */
function gridSizeFromAscii(raw) {
  const lines = raw.split(/\r?\n/);
  const L = Math.max(1, lines.length);
  const C = Math.max(1, ...lines.map((ln) => [...ln].length));
  return { L, C };
}

function parseArgs(argv) {
  const rest = argv.slice(2);
  let top = 30;
  let json = false;
  let basePath = null;
  const positional = [];
  while (rest.length) {
    const a = rest.shift();
    if (a === '--top' && rest[0]) top = Math.max(1, parseInt(rest.shift(), 10) || 30);
    else if (a === '--json') json = true;
    else if (a === '--base' && rest[0]) basePath = rest.shift();
    else if (a) positional.push(a);
  }
  return { top, json, basePath, imagePath: positional[0] };
}

async function main() {
  const { top, json, basePath, imagePath } = parseArgs(process.argv);

  if (!imagePath || !basePath) {
    console.error(
      'Uso: node scripts/highlight-hotspots-from-image.mjs <imagem> --base src/.../arte.txt [--top 30] [--json]',
    );
    process.exit(1);
  }

  const absBase = path.isAbsolute(basePath) ? basePath : path.join(repoRoot, basePath);
  const absImg = path.isAbsolute(imagePath) ? imagePath : path.join(repoRoot, imagePath);

  if (!fs.existsSync(absBase)) {
    console.error(`--base não encontrado: ${absBase}`);
    process.exit(1);
  }
  if (!fs.existsSync(absImg)) {
    console.error(`Imagem não encontrada: ${absImg}`);
    process.exit(1);
  }

  const { L, C } = gridSizeFromAscii(fs.readFileSync(absBase, 'utf8'));
  const dotW = C * 2;
  const dotH = L * 4;

  const buf = fs.readFileSync(absImg);
  const { data, info } = await sharp(buf)
    .resize(dotW, dotH, { fit: 'fill' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  if (w !== dotW || h !== dotH) {
    console.error(`Inesperado: resize devolveu ${w}×${h}, esperado ${dotW}×${dotH}`);
    process.exit(1);
  }

  /** @type {{ row: number, col: number, score: number }[]} */
  const scores = [];

  for (let row = 0; row < L; row++) {
    for (let col = 0; col < C; col++) {
      const vals = [];
      for (let dy = 0; dy < 4; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          const x = col * 2 + dx;
          const y = row * 4 + dy;
          vals.push(data[y * w + x] ?? 0);
        }
      }
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const variance = vals.reduce((a, v) => a + (v - mean) ** 2, 0) / vals.length;
      scores.push({ row, col, score: variance });
    }
  }

  scores.sort((a, b) => b.score - a.score);
  const pick = scores.slice(0, top);

  if (json) {
    console.log(
      JSON.stringify(
        {
          L,
          C,
          dotW,
          dotH,
          base: path.relative(repoRoot, absBase),
          image: path.relative(repoRoot, absImg),
          hotspots: pick,
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log(
    `Grelha: L=${L} C=${C} (células Braille); imagem amostrada a ${dotW}×${dotH} px.\n` +
      `Base: ${path.relative(repoRoot, absBase)}\n` +
      `Imagem: ${path.relative(repoRoot, absImg)}\n`,
  );
  console.log('row\tcol\tscore (variância local 2×4)\n');
  for (const { row, col, score } of pick) {
    console.log(`${row}\t${col}\t${score.toFixed(2)}`);
  }
  console.log(
    '\nCoordenadas 0-based: alinham com linhas do .txt e índice de carácter por linha (code points).',
  );
  console.log('Anexa esta saída (ou a imagem) ao chat da IA para indicar onde animar.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

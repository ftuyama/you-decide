/**
 * Exporta arte Braille (.txt) para PNG para inspeção visual (alinhado ao motor / DevTools).
 *
 * Uso:
 *   node scripts/braille-art-preview.mjs <arte.txt> [-o saida.png] [--scale 2] [--grid]
 *
 * Sem `-o`, grava em `tmp/ascii-preview/<caminhoRelativoSeguro>.png` (para o agente ler com Read).
 *
 * `--grid`: grelha em coords de **células** Braille (vertical a cada 10 cols, horizontal a cada 5 linhas).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { renderBrailleTextToPng } from './lib/brailleArtPreviewCore.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..');

function parseArgs(argv) {
  const rest = argv.slice(2);
  let outPath = null;
  let scale = 2;
  let grid = false;
  const pos = [];
  while (rest.length) {
    const a = rest.shift();
    if (a === '-o' && rest[0]) outPath = rest.shift();
    else if (a === '--scale' && rest[0]) scale = Math.max(1, Math.min(8, parseInt(rest.shift(), 10) || 2));
    else if (a === '--grid') grid = true;
    else if (a) pos.push(a);
  }
  return { outPath, scale, grid, inputPaths: pos };
}

function defaultOutPath(repoRoot, absIn, scale, grid) {
  const rel = path.relative(repoRoot, absIn);
  const safe = rel.replace(/\\/g, '__').replace(/\.txt$/i, '');
  return path.join(repoRoot, 'tmp', 'ascii-preview', `${safe}_s${scale}${grid ? '_grid' : ''}.png`);
}

async function main() {
  const { outPath, scale, grid, inputPaths } = parseArgs(process.argv);
  if (inputPaths.length === 0) {
    console.error(
      'Uso: node scripts/braille-art-preview.mjs <arte.txt>… [-o saida.png] [--scale 2] [--grid]\n' +
        '  Sem -o: ficheiros em tmp/ascii-preview/ (vários .txt na mesma invocação são suportados).',
    );
    process.exit(1);
  }

  if (outPath && inputPaths.length > 1) {
    console.error('Use -o só com um único ficheiro .txt.');
    process.exit(1);
  }

  const written = [];
  for (const inputPath of inputPaths) {
    const absIn = path.isAbsolute(inputPath) ? inputPath : path.join(repoRoot, inputPath);
    if (!fs.existsSync(absIn)) {
      console.error(`Ficheiro não encontrado: ${absIn}`);
      process.exit(1);
    }

    const raw = fs.readFileSync(absIn, 'utf8');
    const absOut = outPath
      ? path.isAbsolute(outPath)
        ? outPath
        : path.join(repoRoot, outPath)
      : defaultOutPath(repoRoot, absIn, scale, grid);

    await renderBrailleTextToPng(raw, absOut, { scale, grid });
    written.push(path.relative(repoRoot, absOut));
    console.log(`${path.relative(repoRoot, absOut)} (${scale}${grid ? ', grid' : ''})`);
  }

  console.log('\nAGENT_READ_PATHS:' + written.join('|'));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

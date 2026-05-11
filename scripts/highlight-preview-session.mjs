/**
 * Gera PNGs (com grelha por defeito) para o arte base + todos os `*_hl*.txt` na mesma pasta,
 * em `tmp/ascii-preview/`, para o **agente** poder usar Read sem anexos do utilizador.
 *
 * Uso:
 *   node scripts/highlight-preview-session.mjs --base src/campaigns/calvario/ascii/scenes/act1/dungeon_mouth.txt
 *   node scripts/highlight-preview-session.mjs --base path/to/foo.txt [--no-grid] [--scale 2]
 *
 * Saída final: linha `AGENT_READ_PATHS:rel1.png|rel2.png|...` (caminhos relativos ao repo).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { renderBrailleTextToPng } from './lib/brailleArtPreviewCore.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..');

function parseArgs(argv) {
  const rest = argv.slice(2);
  let basePath = null;
  let scale = 2;
  let grid = true;
  while (rest.length) {
    const a = rest.shift();
    if (a === '--base' && rest[0]) basePath = rest.shift();
    else if (a === '--scale' && rest[0]) scale = Math.max(1, Math.min(8, parseInt(rest.shift(), 10) || 2));
    else if (a === '--no-grid') grid = false;
    else if (a) {
      console.error(`Argumento desconhecido: ${a}`);
      process.exit(1);
    }
  }
  return { basePath, scale, grid };
}

function defaultPreviewPath(repoRoot, absTxt, scale, grid) {
  const rel = path.relative(repoRoot, absTxt);
  const safe = rel.replace(/\\/g, '__').replace(/\.txt$/i, '');
  return path.join(repoRoot, 'tmp', 'ascii-preview', `${safe}_s${scale}${grid ? '_grid' : ''}.png`);
}

async function main() {
  const { basePath, scale, grid } = parseArgs(process.argv);
  if (!basePath) {
    console.error('Uso: node scripts/highlight-preview-session.mjs --base <arte_base.txt> [--scale 2] [--no-grid]');
    process.exit(1);
  }

  const absBase = path.isAbsolute(basePath) ? basePath : path.join(repoRoot, basePath);
  if (!fs.existsSync(absBase)) {
    console.error(`--base não encontrado: ${absBase}`);
    process.exit(1);
  }

  const dir = path.dirname(absBase);
  const stem = path.basename(absBase, '.txt');
  const names = fs
    .readdirSync(dir)
    .filter((n) => n.startsWith(`${stem}_hl`) && n.endsWith('.txt'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  const targets = [absBase, ...names.map((n) => path.join(dir, n))];
  const written = [];

  for (const absTxt of targets) {
    const raw = fs.readFileSync(absTxt, 'utf8');
    const absOut = defaultPreviewPath(repoRoot, absTxt, scale, grid);
    await renderBrailleTextToPng(raw, absOut, { scale, grid });
    written.push(path.relative(repoRoot, absOut));
    console.log(path.relative(repoRoot, absOut));
  }

  console.log(`\nPré-visualização: ${written.length} PNG (${targets.length} quadros incl. base).`);
  console.log('AGENT_READ_PATHS:' + written.join('|'));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

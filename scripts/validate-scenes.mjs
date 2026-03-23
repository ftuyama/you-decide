/**
 * Valida referências entre cenas (next, onVictory, onFlee, skillCheck, etc.).
 * Uso: node scripts/validate-scenes.mjs [--campaign <id>]
 * Default: calvario
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const argv = process.argv.slice(2);
let campaignId = 'calvario';
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--campaign' && argv[i + 1]) {
    campaignId = argv[i + 1];
    i++;
  }
}

const scenesDir = path.join(__dirname, '..', 'src', 'campaigns', campaignId, 'scenes');

if (!fs.existsSync(scenesDir)) {
  console.error(`Pasta de cenas não encontrada: ${scenesDir}`);
  process.exit(1);
}

function walkMd(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) { walkMd(p).forEach((x) => out.push(x)); }
    else if (name.name.endsWith('.md')) out.push(p);
  }
  return out;
}

const refRe = /\b(?:next|successNext|failNext|onVictory|onDefeat|onFlee|fallbackNext):\s*([a-z0-9_/]+)/gi;

function extractId(raw) {
  const m = raw.match(/^id:\s*(.+)$/m);
  return m ? m[1].trim() : null;
}

const files = walkMd(scenesDir);
const ids = new Set();
const fileById = new Map();

for (const f of files) {
  const raw = fs.readFileSync(f, 'utf8');
  const id = extractId(raw);
  if (id) {
    ids.add(id);
    fileById.set(id, path.relative(path.join(__dirname, '..'), f));
  }
}

const missing = [];
const seen = new Set();

for (const f of files) {
  const raw = fs.readFileSync(f, 'utf8');
  let m;
  refRe.lastIndex = 0;
  while ((m = refRe.exec(raw)) !== null) {
    const target = m[1];
    if (seen.has(`${f}:${target}`)) continue;
    seen.add(`${f}:${target}`);
    if (!ids.has(target)) {
      missing.push({ from: path.relative(path.join(__dirname, '..'), f), target });
    }
  }
}

if (missing.length) {
  console.error('Referências a cenas inexistentes:');
  for (const x of missing) {
    console.error(`  ${x.from} → "${x.target}"`);
  }
  process.exit(1);
}

console.log(`OK [${campaignId}]: ${ids.size} cenas, referências cruzadas válidas.`);

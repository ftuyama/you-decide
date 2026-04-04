/**
 * Valida referências entre cenas (next, onVictory, onFlee, skillCheck, etc.).
 * Uso: node scripts/validate-scenes.mjs [--campaign <id>]
 * Default: calvario
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  campaignPaths,
  extractSceneIdLine,
  parseCampaignArgv,
  walkMd,
} from './lib/campaignFs.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..');

const campaignId = parseCampaignArgv(process.argv.slice(2));
const { scenesDir } = campaignPaths(repoRoot, campaignId);

if (!fs.existsSync(scenesDir)) {
  console.error(`Pasta de cenas não encontrada: ${scenesDir}`);
  process.exit(1);
}

const refRe = /\b(?:next|successNext|failNext|onVictory|onDefeat|onFlee|fallbackNext):\s*([a-z0-9_/]+)/gi;

const files = walkMd(scenesDir);
const ids = new Set();

for (const f of files) {
  const raw = fs.readFileSync(f, 'utf8');
  const id = extractSceneIdLine(raw);
  if (id) ids.add(id);
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
      missing.push({ from: path.relative(repoRoot, f), target });
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

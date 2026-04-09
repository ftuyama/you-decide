/**
 * Lista arte ASCII de cena pendente: `artKey` sem ficheiro `.txt` correspondente,
 * ficheiro vazio/só espaços, ou `art` inline declarado mas em branco.
 *
 * Alinha-se ao carregamento em `ascii/art.ts` (chave = basename do `.txt` em `ascii/scenes/**`).
 *
 * Uso: node scripts/check-pending-ascii-art.mjs [--campaign <id>]
 * Default: calvario
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  campaignPaths,
  parseCampaignArgv,
  pathToSceneIdFromScenesDir,
  splitFrontmatter,
  walkMd,
} from './lib/campaignFs.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..');

const campaignId = parseCampaignArgv(process.argv.slice(2));
const { campaignRoot, scenesDir } = campaignPaths(repoRoot, campaignId);
const asciiScenesDir = path.join(campaignRoot, 'ascii', 'scenes');

/**
 * @returns {Map<string, string[]>} basename → caminhos relativos ao repo
 */
function indexAsciiSceneFiles() {
  /** @type {Map<string, string[]>} */
  const byKey = new Map();

  if (!fs.existsSync(asciiScenesDir)) {
    return byKey;
  }

  function walkTxt(dir) {
    const out = [];
    for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, name.name);
      if (name.isDirectory()) walkTxt(p).forEach((x) => out.push(x));
      else if (name.name.endsWith('.txt')) out.push(p);
    }
    return out;
  }

  for (const abs of walkTxt(asciiScenesDir)) {
    const base = path.basename(abs, '.txt');
    const rel = path.relative(repoRoot, abs);
    const list = byKey.get(base) ?? [];
    list.push(rel);
    byKey.set(base, list);
  }

  return byKey;
}

if (!fs.existsSync(scenesDir)) {
  console.error(`Pasta de cenas não encontrada: ${scenesDir}`);
  process.exit(1);
}

const byKey = indexAsciiSceneFiles();
const duplicateKeys = [...byKey.entries()].filter(([, paths]) => paths.length > 1);

const pending = [];
const files = walkMd(scenesDir);

for (const f of files) {
  const raw = fs.readFileSync(f, 'utf8');
  const { data: fm } = splitFrontmatter(raw);
  const sceneId = pathToSceneIdFromScenesDir(scenesDir, f);
  const rel = path.relative(repoRoot, f);

  const artKeyRaw = fm.artKey;
  const artKey =
    typeof artKeyRaw === 'string' && artKeyRaw.trim() !== '' ? artKeyRaw.trim() : null;

  let inline = null;
  if (typeof fm.art === 'string') {
    inline = fm.art.trim();
  }

  /** Cena resolve arte: inline não vazio ganha (como `resolveSceneArtFromFrontmatter`). */
  if (inline) continue;

  if (artKey) {
    const paths = byKey.get(artKey);
    if (!paths || paths.length === 0) {
      pending.push({
        sceneId,
        file: rel,
        reason: 'missing_file',
        artKey,
        detail: `nenhum ascii/scenes/**/${artKey}.txt`,
      });
      continue;
    }
    const nonBlank = paths.find((p) => {
      const full = path.join(repoRoot, p);
      return fs.readFileSync(full, 'utf8').trim() !== '';
    });
    if (!nonBlank) {
      pending.push({
        sceneId,
        file: rel,
        reason: 'blank_file',
        artKey,
        detail: paths.join(', '),
      });
    }
    continue;
  }

  if (Object.prototype.hasOwnProperty.call(fm, 'art')) {
    if (typeof fm.art === 'string' && fm.art.trim() === '') {
      pending.push({
        sceneId,
        file: rel,
        reason: 'blank_inline_art',
        artKey: null,
        detail: 'campo `art` vazio no frontmatter',
      });
    }
  }
}

let failed = false;

if (duplicateKeys.length) {
  failed = true;
  console.error('Chaves duplicadas em ascii/scenes (o build em ascii/art.ts falha):');
  for (const [key, paths] of duplicateKeys) {
    console.error(`  ${key}: ${paths.join(' | ')}`);
  }
  console.error('');
}

if (pending.length) {
  failed = true;
  console.error('Arte ASCII pendente (sem ficheiro ou ficheiro em branco):');
  for (const p of pending) {
    const keyPart = p.artKey ? `artKey=${p.artKey}` : '';
    console.error(`  ${p.sceneId} (${p.file})`);
    console.error(`    ${p.reason}${keyPart ? ` — ${keyPart}` : ''}`);
    console.error(`    ${p.detail}`);
  }
}

if (failed) process.exit(1);

console.log(
  `OK [${campaignId}]: nenhuma arte ASCII pendente entre ${files.length} cenas.`
);

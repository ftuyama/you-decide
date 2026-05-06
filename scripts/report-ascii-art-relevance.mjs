/**
 * Relatório de relevância para arte ASCII:
 * - Detecta cenas com arte pendente (ficheiro ausente / blank / PLACEHOLDER)
 * - Detecta cenas que reutilizam a mesma arte (mesma artKey em 2+ cenas)
 * - Agrupa por tier de relevância narrativa (S, A, B, C)
 *
 * Uso: node scripts/report-ascii-art-relevance.mjs [--campaign <id>]
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

const TIER_ORDER = ['S', 'A', 'B', 'C'];
const ISSUE_WEIGHT = {
  missing: 4,
  placeholder: 3,
  blank: 2,
  reused: 1,
};
const ISSUE_ORDER = ['missing', 'placeholder', 'blank', 'reused'];

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

function isPlaceholderAsciiContent(text) {
  return text.trim().toUpperCase() === 'PLACEHOLDER';
}

function classifyTier(sceneId) {
  const id = sceneId.toLowerCase();

  const isS =
    /(^|\/)(title|prologue|epilogue)(\/|$)/.test(id) ||
    /(^|\/)hub(_|\/|$)/.test(id) ||
    /(boss|final|apocalypse|dungeon_mouth|mirror_gate|throne_gate)/.test(id) ||
    /(^|\/)(entry|opening)/.test(id);
  if (isS) return { tier: 'S', reason: 'marco principal da campanha' };

  const isA =
    /(throne|mirror|trial|ritual|summit|secret|gate|router|interlude|choice|recruit)/.test(id) ||
    /(fight_|encounter_)/.test(id);
  if (isA) return { tier: 'A', reason: 'ramo central ou confronto importante' };

  const isC =
    /(^|\/)camp(\/|$)/.test(id) ||
    /(manage_equip|merchant|fireside|companion_chat|banter|topic_)/.test(id) ||
    /(wild_encounter|encounters\/)/.test(id);
  if (isC) return { tier: 'C', reason: 'cena utilitária, repetível ou de baixo impacto' };

  return { tier: 'B', reason: 'progressão secundária relevante' };
}

function formatIssueDetails(issue, item) {
  if (issue === 'missing') return `artKey=${item.artKey} (sem ficheiro correspondente)`;
  if (issue === 'placeholder') return item.placeholderSource ?? 'arte placeholder';
  if (issue === 'blank') return item.blankSource ?? 'arte em branco';
  if (issue === 'reused') return `artKey=${item.artKey} partilhada por ${item.reusedCount} cenas`;
  return '';
}

if (!fs.existsSync(scenesDir)) {
  console.error(`Pasta de cenas não encontrada: ${scenesDir}`);
  process.exit(1);
}

const byKey = indexAsciiSceneFiles();
const files = walkMd(scenesDir);

/** @type {Map<string, {
 *   sceneId: string,
 *   file: string,
 *   issues: Set<string>,
 *   artKey: string | null,
 *   placeholderSource?: string,
 *   blankSource?: string,
 *   reusedCount?: number,
 *   tier?: string,
 *   tierReason?: string,
 * }>} */
const flaggedByScene = new Map();

/** @type {Map<string, string[]>} */
const scenesByResolvedKey = new Map();

function getOrCreateFlag(sceneId, file) {
  const existing = flaggedByScene.get(sceneId);
  if (existing) return existing;
  const created = {
    sceneId,
    file,
    issues: new Set(),
    artKey: null,
  };
  flaggedByScene.set(sceneId, created);
  return created;
}

for (const f of files) {
  const raw = fs.readFileSync(f, 'utf8');
  const { data: fm } = splitFrontmatter(raw);
  const sceneId = pathToSceneIdFromScenesDir(scenesDir, f);
  const rel = path.relative(repoRoot, f);

  const artKeyRaw = fm.artKey;
  const artKey =
    typeof artKeyRaw === 'string' && artKeyRaw.trim() !== '' ? artKeyRaw.trim() : null;

  const inlineRaw = typeof fm.art === 'string' ? fm.art.trim() : null;
  const hasInline = Boolean(inlineRaw);

  // Regras de resolução: art inline prevalece sobre artKey.
  if (hasInline) {
    if (isPlaceholderAsciiContent(inlineRaw)) {
      const item = getOrCreateFlag(sceneId, rel);
      item.issues.add('placeholder');
      item.placeholderSource = 'campo `art` inline com PLACEHOLDER';
    }
    continue;
  }

  if (Object.prototype.hasOwnProperty.call(fm, 'art') && typeof fm.art === 'string' && fm.art.trim() === '') {
    const item = getOrCreateFlag(sceneId, rel);
    item.issues.add('blank');
    item.blankSource = 'campo `art` inline vazio';
    continue;
  }

  if (!artKey) continue;

  const paths = byKey.get(artKey);
  if (!paths || paths.length === 0) {
    const item = getOrCreateFlag(sceneId, rel);
    item.issues.add('missing');
    item.artKey = artKey;
    continue;
  }

  const resolvedPath = paths.find((p) => {
    const full = path.join(repoRoot, p);
    const content = fs.readFileSync(full, 'utf8');
    const t = content.trim();
    return t !== '' && !isPlaceholderAsciiContent(content);
  });

  if (!resolvedPath) {
    const hasNonEmpty = paths.some((p) => fs.readFileSync(path.join(repoRoot, p), 'utf8').trim() !== '');
    const item = getOrCreateFlag(sceneId, rel);
    item.artKey = artKey;
    if (hasNonEmpty) {
      item.issues.add('placeholder');
      item.placeholderSource = `ficheiro(s): ${paths.join(', ')}`;
    } else {
      item.issues.add('blank');
      item.blankSource = `ficheiro(s): ${paths.join(', ')}`;
    }
    continue;
  }

  const list = scenesByResolvedKey.get(artKey) ?? [];
  list.push(sceneId);
  scenesByResolvedKey.set(artKey, list);
}

for (const [artKey, sceneIds] of scenesByResolvedKey.entries()) {
  if (sceneIds.length < 2) continue;
  for (const sceneId of sceneIds) {
    const existing = flaggedByScene.get(sceneId);
    if (existing && existing.issues.has('missing')) continue;
    const file = existing?.file ?? path.relative(repoRoot, path.join(scenesDir, `${sceneId}.md`));
    const item = getOrCreateFlag(sceneId, file);
    item.issues.add('reused');
    item.artKey = artKey;
    item.reusedCount = sceneIds.length;
  }
}

const flagged = [...flaggedByScene.values()].map((item) => {
  const { tier, reason } = classifyTier(item.sceneId);
  const primary = [...item.issues].sort((a, b) => ISSUE_WEIGHT[b] - ISSUE_WEIGHT[a])[0];
  return {
    ...item,
    tier,
    tierReason: reason,
    primaryIssue: primary,
  };
});

if (flagged.length === 0) {
  console.log(`OK [${campaignId}]: nenhuma cena com arte pendente/reutilizada em ${files.length} cenas.`);
  process.exit(0);
}

/** @type {Map<string, typeof flagged>} */
const grouped = new Map();
for (const tier of TIER_ORDER) grouped.set(tier, []);
for (const item of flagged) grouped.get(item.tier)?.push(item);

console.log(`ASCII Art Relevance Audit [${campaignId}]`);
console.log(`Cenas analisadas: ${files.length}`);
console.log(`Cenas sinalizadas: ${flagged.length}`);
console.log('');

for (const tier of TIER_ORDER) {
  const list = grouped.get(tier) ?? [];
  if (list.length === 0) continue;

  list.sort((a, b) => {
    const issueCmp = ISSUE_ORDER.indexOf(a.primaryIssue) - ISSUE_ORDER.indexOf(b.primaryIssue);
    if (issueCmp !== 0) return issueCmp;
    return a.sceneId.localeCompare(b.sceneId);
  });

  console.log(`Tier ${tier} (${list.length})`);
  for (const item of list) {
    const issues = [...item.issues].sort((a, b) => ISSUE_ORDER.indexOf(a) - ISSUE_ORDER.indexOf(b));
    const details = issues
      .map((issue) => `${issue}: ${formatIssueDetails(issue, item)}`.trim())
      .join(' | ');
    console.log(`  - ${item.sceneId}`);
    console.log(`    issue=${item.primaryIssue}; all=[${issues.join(', ')}]`);
    console.log(`    ${details}`);
    console.log(`    ${item.file}`);
  }
  console.log('');
}

process.exit(1);

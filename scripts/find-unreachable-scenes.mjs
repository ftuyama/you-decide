/**
 * Lista cenas .md não alcançáveis desde entryScene (BFS nas arestas estáticas do frontmatter).
 * Uso: node scripts/find-unreachable-scenes.mjs [--campaign <id>]
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
const { scenesDir, indexPath } = campaignPaths(repoRoot, campaignId);

function pushEffectEdges(effects, from, out) {
  if (!Array.isArray(effects)) return;
  for (const e of effects) {
    if (!e || typeof e !== 'object') continue;
    if (e.op === 'goto' && e.sceneId) out.push({ from, to: e.sceneId });
    if (e.op === 'startCombat') {
      if (e.onVictory) out.push({ from, to: e.onVictory });
      if (e.onFlee) out.push({ from, to: e.onFlee });
      if (e.onDefeat) out.push({ from, to: e.onDefeat });
    }
  }
}

function edgesFromFm(fromId, fm) {
  const out = [];
  for (const ch of fm.choices ?? []) {
    if (ch?.next) out.push({ from: fromId, to: ch.next });
    if (ch?.fallbackNext) out.push({ from: fromId, to: ch.fallbackNext });
    pushEffectEdges(ch?.effects, fromId, out);
  }
  pushEffectEdges(fm.onEnter, fromId, out);
  if (fm.skillCheck) {
    out.push({ from: fromId, to: fm.skillCheck.successNext });
    out.push({ from: fromId, to: fm.skillCheck.failNext });
  }
  if (fm.dualAttrSkillCheck) {
    out.push({ from: fromId, to: fm.dualAttrSkillCheck.successNext });
    out.push({ from: fromId, to: fm.dualAttrSkillCheck.failNext });
  }
  if (fm.luckCheck) {
    out.push({ from: fromId, to: fm.luckCheck.successNext });
    out.push({ from: fromId, to: fm.luckCheck.failNext });
  }
  if (fm.randomBranch?.branches) {
    for (const b of fm.randomBranch.branches) {
      if (b?.next) out.push({ from: fromId, to: b.next });
    }
  }
  if (fm.chapterGate) {
    out.push({ from: fromId, to: fm.chapterGate.passNext });
    out.push({ from: fromId, to: fm.chapterGate.failNext });
  }
  if (fm.onVictory) out.push({ from: fromId, to: fm.onVictory });
  if (fm.onFlee) out.push({ from: fromId, to: fm.onFlee });
  if (fm.onDefeat) out.push({ from: fromId, to: fm.onDefeat });
  return out;
}

if (!fs.existsSync(scenesDir)) {
  console.error(`Pasta de cenas não encontrada: ${scenesDir}`);
  process.exit(1);
}

const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
const entrySceneId = index.entryScene;

const files = walkMd(scenesDir);
const sceneIds = new Set();
const allEdges = [];

for (const f of files) {
  const id = pathToSceneIdFromScenesDir(scenesDir, f);
  const raw = fs.readFileSync(f, 'utf8');
  const { data } = splitFrontmatter(raw);
  const fmId = data.id ?? id;
  sceneIds.add(fmId);
  const edges = edgesFromFm(fmId, data);
  allEdges.push(...edges);
}

const adj = new Map();
for (const e of allEdges) {
  if (!adj.has(e.from)) adj.set(e.from, new Set());
  adj.get(e.from).add(e.to);
}

const reachable = new Set();
const stack = [entrySceneId];
while (stack.length) {
  const id = stack.pop();
  if (reachable.has(id)) continue;
  reachable.add(id);
  for (const n of adj.get(id) || []) stack.push(n);
}

const unreachable = [...sceneIds].filter((id) => !reachable.has(id)).sort();

if (unreachable.length === 0) {
  console.log(`OK [${campaignId}]: todas as ${sceneIds.size} cenas são alcançáveis desde "${entrySceneId}".`);
  process.exit(0);
}

console.log(`Cenas não alcançáveis desde "${entrySceneId}" (${unreachable.length}):`);
for (const id of unreachable) console.log(`  ${id}`);
process.exit(1);

/**
 * Relatório de progressão de Calvário (UX/balance ato a ato).
 *
 * Estima:
 *  - Gates de nível por ato (de `level: { gte: N }` no frontmatter das cenas)
 *  - XP a ganhar entre gates (curva `xpToNextLevel`)
 *  - Encontros mandatórios (lista curada do caminho crítico) e respetivo XP
 *  - Encontros aleatórios estimados (gap / média ponderada do pool wild)
 *  - Movimentos no mapa estimados (≈ encontros / encounterChance médio)
 *  - Tempo estimado e dificuldade (proxies leves)
 *  - Densidade de escolhas (total e gated por `condition`)
 *
 * Uso:
 *   npx tsx scripts/progression-report.ts
 *   npx tsx scripts/progression-report.ts --json
 *   npx tsx scripts/progression-report.ts --act 5
 *   npx tsx scripts/progression-report.ts --class mage
 *
 * Premissas (resumidas no rodapé do relatório):
 *  - Classe de referência única afeta apenas HP/CA do herói para a coluna “Dificuldade”.
 *  - “Encontros aleatórios estimados” assume que o jogador esgota o pool até atingir o gate.
 *  - Cenas com `addXp` direto (lore/eventos) NÃO entram no XP mandatório (são listadas à parte).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { walkMd, splitFrontmatter } from './lib/campaignFs.mjs';

import campaignIndex from '../src/campaigns/calvario/index.json';
import encountersJson from '../src/campaigns/calvario/data/encounters.json';
import { xpToNextLevel, projectCharacterToLevel } from '../src/engine/progression/progression.ts';
import { createPlayerCharacter } from '../src/engine/core/state.ts';
import { EXPLORATION_WILD_BRANCHES_BY_GRAPH } from '../src/engine/world/exploration.ts';
import type { ClassId } from '../src/engine/schema/index.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..');
const scenesDir = path.join(repoRoot, 'src', 'campaigns', 'calvario', 'scenes');
const enemiesTsPath = path.join(repoRoot, 'src', 'campaigns', 'calvario', 'data', 'enemies.ts');

/**
 * `enemies.ts` importa `ascii/sprites/enemies` que usa `import.meta.glob` (Vite-only).
 * Para correr sob Node/tsx, lemos o ficheiro como texto e extraímos só os campos
 * numéricos que precisamos (`id`, `xp`, `maxHp`, `str`, `name`). Mantém o script
 * desacoplado da camada UI/Vite.
 */
type EnemyDef = { id: string; name: string; xp: number; maxHp: number; str: number };

function parseEnemies(): Record<string, EnemyDef> {
  const text = fs.readFileSync(enemiesTsPath, 'utf8');
  const blockRe = /(\w+):\s*\{\s*id:\s*'([^']+)'[\s\S]*?\n\s\s\}/g;
  const out: Record<string, EnemyDef> = {};
  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(text)) !== null) {
    const block = m[0]!;
    const id = m[2]!;
    const name = block.match(/name:\s*'([^']+)'/)?.[1] ?? id;
    const xp = Number(block.match(/\bxp:\s*(\d+)/)?.[1] ?? 0);
    const maxHp = Number(block.match(/\bmaxHp:\s*(\d+)/)?.[1] ?? 0);
    const str = Number(block.match(/\bstr:\s*(\d+)/)?.[1] ?? 0);
    out[id] = { id, name, xp, maxHp, str };
  }
  return out;
}

const enemies = parseEnemies();

// --------- Config: per-act curated metadata (sync com `exploration.ts` e cenas) ---------

type ActConfig = {
  id: string;
  chapter: number;
  /** Nível esperado ao entrar no ato (após gates anteriores). */
  entryLevel: number;
  /** Maior gate de saída a atingir para avançar (ou nível ≈ esperado, se sem gate). */
  exitLevel: number;
  /** Encontros do caminho crítico — lista curada (não automática). */
  mandatoryEncounterIds: string[];
  /** Grafo wild (chave em `EXPLORATION_WILD_BRANCHES_BY_GRAPH`); `null` se o ato não tem mapa. */
  wildPoolKey: string | null;
};

/**
 * Configuração curada por ato. Gates derivados de `hub_*` / `frost_hub`:
 *  - act2 hub_catacomb: descer mais fundo exige `level >= 5`.
 *  - act3 hub_depths: rumo ao trono exige `level >= 10` + stone_guard_defeated.
 *  - act4: sem gate explícito; cadeia de boss (Morvayn p1+p2) é a saída.
 *  - act5 frost_hub: cume exige `level >= 25`; saída via Vetrnax p1+p2.
 *  - act6 hub_fractured_nave: provas exigem `level >= 25`, espelho final `level >= 30`.
 *  - act7: sem gate; epílogo via `wasteland_router`.
 */
const ACTS: ActConfig[] = [
  { id: 'act1', chapter: 1, entryLevel: 1, exitLevel: 1, mandatoryEncounterIds: [], wildPoolKey: null },
  { id: 'act2', chapter: 2, entryLevel: 1, exitLevel: 5, mandatoryEncounterIds: ['rats_cellar', 'skeleton_hall'], wildPoolKey: 'act2_catacomb' },
  { id: 'act3', chapter: 3, entryLevel: 5, exitLevel: 10, mandatoryEncounterIds: ['stone_guard_fight'], wildPoolKey: 'act3_depths' },
  { id: 'act4', chapter: 4, entryLevel: 10, exitLevel: 11, mandatoryEncounterIds: ['boss_morvayn_1', 'boss_morvayn_2'], wildPoolKey: null },
  { id: 'act5', chapter: 5, entryLevel: 11, exitLevel: 22, mandatoryEncounterIds: ['boss_ice_dragon_1', 'boss_ice_dragon_2'], wildPoolKey: 'act5_frost' },
  { id: 'act6', chapter: 6, entryLevel: 25, exitLevel: 30, mandatoryEncounterIds: ['act6_veil_herald', 'act6_echo_chorus', 'act6_penitent_blade', 'act6_shadow_self'], wildPoolKey: 'act6_fractured_nave' },
  { id: 'act7', chapter: 7, entryLevel: 30, exitLevel: 30, mandatoryEncounterIds: [], wildPoolKey: null },
];

// --------- Helpers de XP / encontros ---------

type EncounterDef = {
  id: string;
  combatType?: string;
  enemies?: string[];
  dialogueEnemyId?: string;
  xpReward?: number;
  isBoss?: boolean;
};
const encounters = encountersJson as Record<string, EncounterDef>;

function encounterXp(encId: string): number | null {
  const enc = encounters[encId];
  if (!enc) return null;
  if (enc.combatType === 'dialogue') {
    return enc.xpReward ?? 0;
  }
  let xp = enc.xpReward ?? 0;
  for (const enemyId of enc.enemies ?? []) {
    const def = enemies[enemyId];
    if (!def) continue;
    xp += def.xp ?? 10 + Math.floor(def.maxHp / 2);
  }
  return xp;
}

function totalXpToReachLevel(level: number): number {
  let sum = 0;
  for (let l = 1; l < level; l++) sum += xpToNextLevel(l);
  return sum;
}

function avgWildXp(poolKey: string | null): { avg: number; samples: { encId: string; xp: number; weight: number }[] } | null {
  if (!poolKey) return null;
  const pool = EXPLORATION_WILD_BRANCHES_BY_GRAPH[poolKey];
  if (!pool) return null;
  let totalW = 0;
  let totalXpW = 0;
  const samples: { encId: string; xp: number; weight: number }[] = [];
  for (const branch of pool) {
    if (!('encounterId' in branch)) continue;
    const xp = encounterXp(branch.encounterId);
    if (xp == null) {
      samples.push({ encId: branch.encounterId, xp: 0, weight: branch.weight });
      continue;
    }
    samples.push({ encId: branch.encounterId, xp, weight: branch.weight });
    totalW += branch.weight;
    totalXpW += branch.weight * xp;
  }
  return { avg: totalW > 0 ? totalXpW / totalW : 0, samples };
}

// --------- Walk de cenas: gates + escolhas + encontros referenciados ---------

type SceneSummary = {
  id: string;
  act: string;
  totalChoices: number;
  gatedChoices: number;
  levelGates: number[];
  startCombatIds: string[];
  addXpDirect: number;
};

function inferActFromSceneId(id: string): string | null {
  const m = id.match(/^(act\d+)\//);
  return m ? m[1] : null;
}

function walkScenes(): SceneSummary[] {
  const out: SceneSummary[] = [];
  for (const file of walkMd(scenesDir) as string[]) {
    const raw = fs.readFileSync(file, 'utf8');
    const { data } = splitFrontmatter(raw) as { data: Record<string, unknown> };
    const sceneId = (data.id as string) ?? '';
    const act = inferActFromSceneId(sceneId);
    if (!act) continue;

    const choices = Array.isArray(data.choices) ? (data.choices as Record<string, unknown>[]) : [];
    let gatedChoices = 0;
    const levelGates: number[] = [];
    const startCombatIds: string[] = [];

    for (const ch of choices) {
      if (ch.condition) gatedChoices++;
      const lvl = extractLevelGte(ch.condition);
      if (lvl != null) levelGates.push(lvl);
      const effects = Array.isArray(ch.effects) ? (ch.effects as Record<string, unknown>[]) : [];
      for (const e of effects) {
        if (e?.op === 'startCombat' && typeof e.encounterId === 'string') {
          startCombatIds.push(e.encounterId);
        }
      }
    }

    let addXpDirect = 0;
    const onEnter = Array.isArray(data.onEnter) ? (data.onEnter as Record<string, unknown>[]) : [];
    for (const e of onEnter) {
      if (e?.op === 'addXp' && typeof e.amount === 'number') addXpDirect += e.amount;
      if (e?.op === 'startCombat' && typeof e.encounterId === 'string') {
        startCombatIds.push(e.encounterId);
      }
    }

    out.push({
      id: sceneId,
      act,
      totalChoices: choices.length,
      gatedChoices,
      levelGates,
      startCombatIds,
      addXpDirect,
    });
  }
  return out;
}

function extractLevelGte(condition: unknown): number | null {
  if (!condition || typeof condition !== 'object') return null;
  const c = condition as Record<string, unknown>;
  if (c.level && typeof c.level === 'object') {
    const lvl = (c.level as Record<string, unknown>).gte;
    if (typeof lvl === 'number') return lvl;
  }
  if (Array.isArray(c.all)) {
    let max: number | null = null;
    for (const sub of c.all) {
      const n = extractLevelGte(sub);
      if (n != null && (max == null || n > max)) max = n;
    }
    return max;
  }
  return null;
}

// --------- Dificuldade (proxy leve) ---------

function difficultyLabel(act: ActConfig, refClass: ClassId): { label: string; heroHp: number; toughest: { id: string; hp: number; str: number } | null } {
  const lead = projectCharacterToLevel(createPlayerCharacter('Ref', refClass), act.entryLevel);
  const heroHp = lead.maxHp;
  const candidateIds = new Set<string>();
  for (const id of act.mandatoryEncounterIds) {
    for (const e of (encounters[id]?.enemies ?? [])) candidateIds.add(e);
  }
  if (act.wildPoolKey) {
    for (const b of EXPLORATION_WILD_BRANCHES_BY_GRAPH[act.wildPoolKey] ?? []) {
      if (!('encounterId' in b)) continue;
      for (const e of (encounters[b.encounterId]?.enemies ?? [])) candidateIds.add(e);
    }
  }
  let toughest: { id: string; hp: number; str: number } | null = null;
  for (const eid of candidateIds) {
    const def = enemies[eid];
    if (!def) continue;
    if (!toughest || def.maxHp > toughest.hp) {
      toughest = { id: eid, hp: def.maxHp, str: def.str };
    }
  }
  if (!toughest) return { label: 'Acessível', heroHp, toughest };
  const hpRatio = toughest.hp / Math.max(1, heroHp);
  let label: string;
  if (hpRatio < 0.7) label = 'Acessível';
  else if (hpRatio < 1.4) label = 'Equilibrado';
  else if (hpRatio < 2.5) label = 'Desafiador';
  else label = 'Brutal';
  return { label, heroHp, toughest };
}

// --------- Estimativas de tempo ---------

function timeEstimateMin(narrativeScenes: number, encounters: number, bossEncounters: number, moves: number): { min: number; max: number } {
  const minutes = narrativeScenes * 0.5 + (encounters - bossEncounters) * 4 + bossEncounters * 6 + moves * 1;
  return { min: Math.round(minutes * 0.7), max: Math.round(minutes * 1.3) };
}

// --------- Cálculo principal ---------

type ActReport = {
  id: string;
  title: string;
  entryLevel: number;
  exitLevel: number;
  xpToGain: number;
  mandatoryCount: number;
  mandatoryXp: number;
  randomEncountersEst: number;
  movesEst: number;
  avgWildXp: number;
  totalChoices: number;
  gatedChoices: number;
  totalScenes: number;
  difficulty: string;
  timeMin: number;
  timeMax: number;
  toughest: { id: string; hp: number; str: number } | null;
  heroHpAtEntry: number;
  warnings: string[];
};

function buildReport(refClass: ClassId): ActReport[] {
  const scenes = walkScenes();
  const byAct: Record<string, SceneSummary[]> = {};
  for (const s of scenes) (byAct[s.act] ??= []).push(s);

  const reports: ActReport[] = [];
  for (const act of ACTS) {
    const actScenes = byAct[act.id] ?? [];
    const totalChoices = actScenes.reduce((a, s) => a + s.totalChoices, 0);
    const gatedChoices = actScenes.reduce((a, s) => a + s.gatedChoices, 0);
    const xpToGain = totalXpToReachLevel(act.exitLevel) - totalXpToReachLevel(act.entryLevel);
    const warnings: string[] = [];

    let mandatoryXp = 0;
    let bossCount = 0;
    for (const eid of act.mandatoryEncounterIds) {
      const xp = encounterXp(eid);
      if (xp == null) {
        warnings.push(`encontro mandatório \`${eid}\` não encontrado em encounters.json`);
        continue;
      }
      mandatoryXp += xp;
      if (encounters[eid]?.isBoss) bossCount++;
    }

    const wild = avgWildXp(act.wildPoolKey);
    if (act.wildPoolKey) {
      for (const s of wild?.samples ?? []) {
        if (s.xp === 0) warnings.push(`branch wild \`${s.encId}\` (peso ${s.weight}) não resolve em encounters.json`);
      }
    }
    const avgWild = wild?.avg ?? 0;
    const xpGap = Math.max(0, xpToGain - mandatoryXp);
    const randomEncountersEst = avgWild > 0 ? Math.ceil(xpGap / avgWild) : 0;
    const movesEst = act.wildPoolKey ? Math.ceil(randomEncountersEst / 0.6) : 0;

    const diff = difficultyLabel(act, refClass);
    const time = timeEstimateMin(actScenes.length, randomEncountersEst + act.mandatoryEncounterIds.length, bossCount, movesEst);

    reports.push({
      id: act.id,
      title: (campaignIndex.chapterTitles as Record<string, string>)[String(act.chapter)] ?? act.id,
      entryLevel: act.entryLevel,
      exitLevel: act.exitLevel,
      xpToGain,
      mandatoryCount: act.mandatoryEncounterIds.length,
      mandatoryXp,
      randomEncountersEst,
      movesEst,
      avgWildXp: Math.round(avgWild * 10) / 10,
      totalChoices,
      gatedChoices,
      totalScenes: actScenes.length,
      difficulty: diff.label,
      timeMin: time.min,
      timeMax: time.max,
      toughest: diff.toughest,
      heroHpAtEntry: diff.heroHp,
      warnings,
    });
  }
  return reports;
}

// --------- Renderização ---------

function renderMarkdown(reports: ActReport[], refClass: ClassId): string {
  const lines: string[] = [];
  lines.push('# Relatório de progressão — Calvário\n');
  lines.push(`Classe de referência: **${refClass}** (afeta apenas HP/dificuldade).\n`);
  lines.push('| Ato | Título | Nível ent→sai | XP a ganhar | Encontros mandat. (XP) | Encontros random est. | Movim. mapa est. | XP médio random | Tempo (min) | Dificuldade | Escolhas (total / gated) |');
  lines.push('|-----|--------|---------------|-------------|------------------------|-----------------------|------------------|-----------------|-------------|-------------|--------------------------|');
  for (const r of reports) {
    const gatedPct = r.totalChoices > 0 ? Math.round((100 * r.gatedChoices) / r.totalChoices) : 0;
    lines.push(
      `| ${r.id} | ${r.title} | ${r.entryLevel}→${r.exitLevel} | ${r.xpToGain} | ${r.mandatoryCount} (${r.mandatoryXp}) | ${r.randomEncountersEst} | ${r.movesEst || '—'} | ${r.avgWildXp || '—'} | ${r.timeMin}–${r.timeMax} | ${r.difficulty} | ${r.totalChoices} / ${r.gatedChoices} (${gatedPct}%) |`
    );
  }
  lines.push('');
  lines.push('## Apêndice: detalhe por ato\n');
  for (const r of reports) {
    lines.push(`### ${r.id} — ${r.title}`);
    lines.push(`- Nível esperado: entrada ${r.entryLevel}, saída ${r.exitLevel} (XP curva total: ${r.xpToGain}).`);
    lines.push(`- HP do herói (${refClass}) à entrada: ${r.heroHpAtEntry}; inimigo mais duro: ${r.toughest ? `\`${r.toughest.id}\` HP ${r.toughest.hp}, STR ${r.toughest.str}` : 'n/d'}.`);
    lines.push(`- Cenas no ato: ${r.totalScenes}; escolhas totais: ${r.totalChoices} (${r.gatedChoices} gated por \`condition\`).`);
    if (r.warnings.length > 0) {
      for (const w of r.warnings) lines.push(`- ⚠ ${w}`);
    }
    lines.push('');
  }
  lines.push('## Premissas');
  lines.push('- Curva de XP: `xpToNextLevel(level) = 50 + (level-1)*10` (`src/engine/progression/progression.ts`).');
  lines.push('- Encontros random estimados = `ceil((xpToGain − mandatoryXp) / avgWildXp)`. Pool wild espelhado de `src/engine/world/exploration.ts`.');
  lines.push('- Movimentos no mapa estimados = `ceil(encontros / 0.6)` (encounterChance médio nas arestas).');
  lines.push('- Tempo: `0.5 min/cena + 4 min/encontro normal + 6 min/boss + 1 min/movimento`, com banda ±30%.');
  lines.push('- Dificuldade: rácio entre HP do inimigo mais duro do ato e HP do herói no nível de entrada (proxy grosso, não substitui `scripts/balance-estimate.ts`).');
  lines.push('- Cenas com `addXp` direto (lore/eventos) não entram no XP mandatório — o gap é coberto pelos pools wild.');
  return lines.join('\n');
}

// --------- CLI ---------

function parseArgs(argv: string[]): { json: boolean; act: string | null; refClass: ClassId } {
  let json = false;
  let act: string | null = null;
  let refClass: ClassId = 'knight';
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') {
      console.log(`Uso: npx tsx scripts/progression-report.ts [opções]

Opções:
  --json           Saída JSON
  --act N          Filtra por ato (1..7)
  --class ID       knight | mage | cleric (default knight)
`);
      process.exit(0);
    }
    if (a === '--json') json = true;
    else if (a === '--act' && argv[i + 1]) {
      act = `act${argv[++i]!.replace(/^act/, '')}`;
    } else if (a === '--class' && argv[i + 1]) {
      const c = argv[++i] as ClassId;
      if (c === 'knight' || c === 'mage' || c === 'cleric') refClass = c;
    }
  }
  return { json, act, refClass };
}

function main(): void {
  const { json, act, refClass } = parseArgs(process.argv);
  const all = buildReport(refClass);
  const filtered = act ? all.filter((r) => r.id === act) : all;
  if (json) {
    console.log(JSON.stringify({ refClass, reports: filtered }, null, 2));
    return;
  }
  console.log(renderMarkdown(filtered, refClass));
}

main();

import { marked } from 'marked';
import { splitFrontmatter } from './frontmatter.ts';
import DOMPurify from 'dompurify';
import {
  SceneFrontmatterSchema,
  type Choice,
  type GameState,
  type SceneFrontmatter,
} from './schema.ts';
import { evaluateCondition } from './conditions.ts';
import { applyEffects, tickActiveBuffs } from './effects.ts';
import { injectText } from './template.ts';
import type { EventBus } from './eventBus.ts';
import type { GameData } from './gameData.ts';
import { getEffectiveLuck } from './luck.ts';
import { mulberry32, nextRngSeed, roll2d6 } from './rng.ts';

export type LoadedScene = {
  id: string;
  frontmatter: SceneFrontmatter;
  bodyRaw: string;
};

export function parseSceneMarkdown(raw: string, sceneIdForErrors: string): LoadedScene {
  const { data, content } = splitFrontmatter(raw);
  const parsed = SceneFrontmatterSchema.safeParse({
    ...data,
    id: (data.id as string | undefined) ?? sceneIdForErrors,
  });
  if (!parsed.success) {
    console.error(`Cena inválida [${sceneIdForErrors}]:`, parsed.error.flatten());
    throw new Error(`Validação da cena falhou: ${sceneIdForErrors}`);
  }
  const fm = parsed.data;
  return { id: fm.id, frontmatter: fm, bodyRaw: content };
}

export function renderSceneBody(body: string, state: GameState): string {
  const bodyInj = injectText(body.trim(), state);
  return DOMPurify.sanitize(marked.parse(bodyInj) as string);
}

export function enterScene(
  state: GameState,
  scene: LoadedScene,
  data: GameData,
  bus: EventBus
): GameState {
  let s: GameState = { ...state, sceneId: scene.id, mode: 'story' };
  const fm = scene.frontmatter;

  if (fm.chapterGate) {
    const g = fm.chapterGate;
    let pass = true;
    if (g.minSupply !== undefined && s.resources.supply < g.minSupply) pass = false;
    if (g.minFaith !== undefined && s.resources.faith < g.minFaith) pass = false;
    if (g.rep) {
      for (const r of g.rep) {
        const v = s.reputation[r.faction];
        if (r.gte !== undefined && v < r.gte) pass = false;
      }
    }
    const nextId = pass ? g.passNext : g.failNext;
    s = { ...s, sceneId: nextId };
    if (nextId !== scene.id) {
      return tickActiveBuffs(s);
    }
  }

  if (fm.randomBranch) {
    const r = resolveRandomBranch(s, scene);
    s = r.state;
    s = {
      ...s,
      visitedScenes: { ...s.visitedScenes, [scene.id]: true },
    };
    return s;
  }

  /** Cenas só com teste de sorte: não marcar visitada ao entrar — a marca fica ao rolar (GameApp), para onEnter repetir se necessário; hoje onEnter costuma estar vazio. */
  if (fm.luckCheck) {
    s = applyEffects(s, fm.onEnter, { sceneId: scene.id, data, bus });
    return s;
  }

  const repeat = fm.repeatOnEnter ?? [];
  if (repeat.length > 0) {
    s = applyEffects(s, repeat, { sceneId: scene.id, data, bus });
  }

  const already = !!s.visitedScenes[scene.id];
  if (!already) {
    s = applyEffects(s, fm.onEnter, { sceneId: scene.id, data, bus });
    s = {
      ...s,
      visitedScenes: { ...s.visitedScenes, [scene.id]: true },
    };
  }

  return s;
}

/** Linhas de escolha na ordem do YAML: ativas, bloqueadas visíveis (teaser), ou omitidas. */
export type StoryChoiceRow =
  | { kind: 'enabled'; choice: Choice }
  | { kind: 'locked'; choice: Choice; hint: string };

export function buildStoryChoiceRows(choices: Choice[], state: GameState): StoryChoiceRow[] {
  const rows: StoryChoiceRow[] = [];
  for (const ch of choices) {
    if (ch.condition === undefined || evaluateCondition(ch.condition, state)) {
      rows.push({ kind: 'enabled', choice: ch });
      continue;
    }
    const hint = ch.lockedHint?.trim();
    if (ch.showWhenLocked && hint) {
      rows.push({ kind: 'locked', choice: ch, hint });
    }
  }
  return rows;
}

export function filterChoices(choices: Choice[], state: GameState): Choice[] {
  return buildStoryChoiceRows(choices, state).flatMap((r) =>
    r.kind === 'enabled' ? [r.choice] : []
  );
}

/** Dados da rolagem 2d6 + mod para a UI (teste de perícia / sorte). */
export type StoryDiceRollBreakdown =
  | {
      kind: 'skill';
      attr: 'str' | 'agi' | 'mind';
      d1: number;
      d2: number;
      mod: number;
      total: number;
      tn: number;
      success: boolean;
      rollLog: string;
    }
  | {
      kind: 'luck';
      d1: number;
      d2: number;
      mod: number;
      luckPenalty: number;
      total: number;
      tn: number;
      success: boolean;
      rollLog: string;
    }
  | {
      kind: 'dualSkill';
      attrs: ['str' | 'agi' | 'mind', 'str' | 'agi' | 'mind'];
      rounds: Array<{
        d1: number;
        d2: number;
        mod1: number;
        mod2: number;
        total: number;
        tn: number;
        success: boolean;
      }>;
      success: boolean;
      rollLog: string;
    };

export function resolveSkillCheck(
  state: GameState,
  scene: LoadedScene
): { state: GameState; breakdown: StoryDiceRollBreakdown | null } {
  const sc = scene.frontmatter.skillCheck;
  if (!sc) return { state, breakdown: null };
  const rng = mulberry32(state.rngSeed);
  const [d1, d2] = roll2d6(rng);
  const lead = state.party[0];
  const attr = sc.attr === 'str' ? lead?.str ?? 0 : sc.attr === 'agi' ? lead?.agi ?? 0 : lead?.mind ?? 0;
  const mod = Math.floor((attr - 6) / 2);
  const total = d1 + d2 + mod;
  const ok = total >= sc.tn;
  const next = ok ? sc.successNext : sc.failNext;
  const rollLog = `Teste (${sc.attr.toUpperCase()}): [${d1}][${d2}] +${mod} = ${total} vs TN ${sc.tn} → ${ok ? 'sucesso' : 'falha'}.`;
  const breakdown: StoryDiceRollBreakdown = {
    kind: 'skill',
    attr: sc.attr,
    d1,
    d2,
    mod,
    total,
    tn: sc.tn,
    success: ok,
    rollLog,
  };
  const newState = tickActiveBuffs({
    ...state,
    rngSeed: nextRngSeed(rng),
    sceneId: next,
  });
  return { state: newState, breakdown };
}

function attrMod(lead: GameState['party'][0], attr: 'str' | 'agi' | 'mind'): number {
  const v =
    attr === 'str' ? lead?.str ?? 0 : attr === 'agi' ? lead?.agi ?? 0 : lead?.mind ?? 0;
  return Math.floor((v - 6) / 2);
}

export function resolveDualAttrSkillCheck(
  state: GameState,
  scene: LoadedScene
): { state: GameState; breakdown: StoryDiceRollBreakdown | null } {
  const dc = scene.frontmatter.dualAttrSkillCheck;
  if (!dc) return { state, breakdown: null };
  const rng = mulberry32(state.rngSeed);
  const lead = state.party[0];
  const [a1, a2] = dc.attrs;
  const m1 = attrMod(lead, a1);
  const m2 = attrMod(lead, a2);
  const rounds: Array<{
    d1: number;
    d2: number;
    mod1: number;
    mod2: number;
    total: number;
    tn: number;
    success: boolean;
  }> = [];
  const lines: string[] = [];
  let allOk = true;
  for (let r = 0; r < dc.rounds; r++) {
    const [d1, d2] = roll2d6(rng);
    const total = d1 + d2 + m1 + m2;
    const ok = total >= dc.tn;
    if (!ok) allOk = false;
    rounds.push({ d1, d2, mod1: m1, mod2: m2, total, tn: dc.tn, success: ok });
    lines.push(
      `Selo ${r + 1}/${dc.rounds}: [${d1}][${d2}] +${m1} (${a1.toUpperCase()}) +${m2} (${a2.toUpperCase()}) = ${total} vs TN ${dc.tn} → ${ok ? 'sucesso' : 'falha'}.`
    );
  }
  const rollLog = lines.join('\n');
  const next = allOk ? dc.successNext : dc.failNext;
  const breakdown: StoryDiceRollBreakdown = {
    kind: 'dualSkill',
    attrs: dc.attrs,
    rounds,
    success: allOk,
    rollLog,
  };
  const newState = tickActiveBuffs({
    ...state,
    rngSeed: nextRngSeed(rng),
    sceneId: next,
  });
  return { state: newState, breakdown };
}

export function resolveLuckCheck(
  state: GameState,
  scene: LoadedScene,
  data: GameData
): { state: GameState; breakdown: StoryDiceRollBreakdown | null } {
  const lc = scene.frontmatter.luckCheck;
  if (!lc) return { state, breakdown: null };
  const rng = mulberry32(state.rngSeed);
  const [d1, d2] = roll2d6(rng);
  const lead = state.party[0];
  const effLuck = lead ? getEffectiveLuck(lead, data, state) : 8;
  const mod = Math.floor((effLuck - 6) / 2);
  const penalty = lc.luckPenalty ?? 0;
  const total = d1 + d2 + mod - penalty;
  const ok = total >= lc.tn;
  const next = ok ? lc.successNext : lc.failNext;
  const curseBit =
    penalty > 0 ? ` −${penalty} (maldição)` : '';
  const rollLog = `Sorte: [${d1}][${d2}] +${mod}${curseBit} = ${total} vs TN ${lc.tn} → ${ok ? 'sucesso' : 'falha'}.`;
  const breakdown: StoryDiceRollBreakdown = {
    kind: 'luck',
    d1,
    d2,
    mod,
    luckPenalty: penalty,
    total,
    tn: lc.tn,
    success: ok,
    rollLog,
  };
  const newState = tickActiveBuffs({
    ...state,
    rngSeed: nextRngSeed(rng),
    sceneId: next,
  });
  return { state: newState, breakdown };
}

export function resolveRandomBranch(
  state: GameState,
  scene: LoadedScene
): { state: GameState; nextSceneId: string } {
  const rb = scene.frontmatter.randomBranch;
  if (!rb) return { state, nextSceneId: state.sceneId };
  const eligible = rb.branches.filter((b) => evaluateCondition(b.condition, state));
  const pool = eligible.length > 0 ? eligible : rb.branches;
  const rng = mulberry32(state.rngSeed ^ rb.id.length);
  const w = pool.reduce((a, b) => a + b.weight, 0);
  let t = rng() * w;
  let next = pool[0]!.next;
  for (const b of pool) {
    t -= b.weight;
    if (t <= 0) {
      next = b.next;
      break;
    }
  }
  return {
    state: {
      ...state,
      rngSeed: (state.rngSeed + 41) >>> 0,
      sceneId: next,
    },
    nextSceneId: next,
  };
}

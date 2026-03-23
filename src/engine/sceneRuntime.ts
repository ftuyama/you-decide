import { marked } from 'marked';
import { splitFrontmatter } from './frontmatter';
import DOMPurify from 'dompurify';
import { SceneFrontmatterSchema, type GameState, type SceneFrontmatter } from './schema';
import { evaluateCondition } from './conditions';
import { applyEffects, tickActiveBuffs } from './effects';
import { injectText } from './template';
import type { EventBus } from './eventBus';
import type { GameData } from './gameData';
import { getEffectiveLuck } from './combat';
import { mulberry32, roll2d6 } from './rng';
import type { Choice } from './schema';

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

export function filterChoices(choices: Choice[], state: GameState): Choice[] {
  return choices.filter((ch) => evaluateCondition(ch.condition, state));
}

export function resolveSkillCheck(
  state: GameState,
  scene: LoadedScene
): { state: GameState; nextSceneId: string; rollLog: string } {
  const sc = scene.frontmatter.skillCheck;
  if (!sc) return { state, nextSceneId: state.sceneId, rollLog: '' };
  const rng = mulberry32(state.rngSeed);
  const [d1, d2] = roll2d6(rng);
  const lead = state.party[0];
  const attr = sc.attr === 'str' ? lead?.str ?? 0 : sc.attr === 'agi' ? lead?.agi ?? 0 : lead?.mind ?? 0;
  const mod = Math.floor((attr - 6) / 2);
  const total = d1 + d2 + mod;
  const ok = total >= sc.tn;
  const next = ok ? sc.successNext : sc.failNext;
  const rollLog = `Teste (${sc.attr.toUpperCase()}): [${d1}][${d2}] +${mod} = ${total} vs TN ${sc.tn} → ${ok ? 'sucesso' : 'falha'}.`;
  const newState = tickActiveBuffs({
    ...state,
    rngSeed: (state.rngSeed + 17) >>> 0,
    sceneId: next,
  });
  return { state: newState, nextSceneId: next, rollLog };
}

export function resolveLuckCheck(
  state: GameState,
  scene: LoadedScene,
  data: GameData
): { state: GameState; nextSceneId: string; rollLog: string } {
  const lc = scene.frontmatter.luckCheck;
  if (!lc) return { state, nextSceneId: state.sceneId, rollLog: '' };
  const rng = mulberry32(state.rngSeed);
  const [d1, d2] = roll2d6(rng);
  const lead = state.party[0];
  const effLuck = lead ? getEffectiveLuck(lead, data, state) : 8;
  const mod = Math.floor((effLuck - 6) / 2);
  const total = d1 + d2 + mod;
  const ok = total >= lc.tn;
  const next = ok ? lc.successNext : lc.failNext;
  const rollLog = `Sorte: [${d1}][${d2}] +${mod} = ${total} vs TN ${lc.tn} → ${ok ? 'sucesso' : 'falha'}.`;
  const newState = tickActiveBuffs({
    ...state,
    rngSeed: (state.rngSeed + 19) >>> 0,
    sceneId: next,
  });
  return { state: newState, nextSceneId: next, rollLog };
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

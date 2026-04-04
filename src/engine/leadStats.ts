import type { Character, GameState } from './schema.ts';

export type LeadStatAttr = 'str' | 'agi' | 'mind' | 'luck';

const ATTR_MIN = 3;
const ATTR_MAX = 22;

/** Ao mudar de cena: decrementa duração dos buffs temporários. */
export function tickActiveBuffs(state: GameState): GameState {
  if (!state.activeBuffs.length) return state;
  const next = state.activeBuffs
    .map((b) => ({ ...b, remainingScenes: b.remainingScenes - 1 }))
    .filter((b) => b.remainingScenes > 0);
  return { ...state, activeBuffs: next };
}

function deltaFor(state: GameState, attr: LeadStatAttr): number {
  const buffs = state.activeBuffs;
  if (!buffs?.length) return 0;
  return buffs.filter((b) => b.attr === attr).reduce((s, b) => s + b.delta, 0);
}

export function effectiveLeadAttr(
  state: GameState,
  lead: Character | undefined,
  attr: LeadStatAttr
): number {
  if (!lead) return 0;
  const base = lead[attr];
  return base + deltaFor(state, attr);
}

/** Aplica ajuste de stats permanentes (piso/teto). */
export function clampLeadStat(_attr: LeadStatAttr, value: number): number {
  return Math.max(ATTR_MIN, Math.min(ATTR_MAX, value));
}

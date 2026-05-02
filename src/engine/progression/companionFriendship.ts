import type { GameData } from '../data/gameData.ts';
import type { EventBus } from '../core/eventBus.ts';
import type { GameState } from '../schema/index.ts';

export const FRIENDSHIP_SCORE_MIN = 0;
export const FRIENDSHIP_SCORE_MAX = 100;
/** Valor ao recrutar (primeira entrada no mapa). */
export const FRIENDSHIP_INITIAL_RECRUIT = 25;
/** Perda de vínculo quando o companheiro cai a 0 HP (ataque inimigo). */
export const KNOCKOUT_FRIENDSHIP_DELTA = -5;

/** Rótulos de patamar para UI (índice = tier 0..5). */
export const FRIENDSHIP_TIER_LABELS_PT = [
  'Distante',
  'Neutra',
  'Próxima',
  'Firme',
  'Leal',
  'Aliança',
] as const;

export function clampFriendshipScore(n: number): number {
  return Math.max(FRIENDSHIP_SCORE_MIN, Math.min(FRIENDSHIP_SCORE_MAX, n));
}

/** Patamar 0..5 a partir do score (de 20 em 20 pontos). */
export function friendshipTier(score: number): number {
  const s = clampFriendshipScore(score);
  return Math.min(5, Math.floor(s / 20));
}

/**
 * Bónus cumulativos de atributos e HP máximo no patamar atual (stats base = `CompanionDef` + isto).
 */
export function friendshipBonusesAtTier(tier: number): {
  str: number;
  agi: number;
  mind: number;
  maxHp: number;
} {
  const t = Math.max(0, Math.min(5, tier));
  const table: { str: number; agi: number; mind: number; maxHp: number }[] = [
    { str: 0, agi: 0, mind: 0, maxHp: 0 },
    { str: 1, agi: 0, mind: 0, maxHp: 3 },
    { str: 2, agi: 1, mind: 0, maxHp: 6 },
    { str: 3, agi: 1, mind: 1, maxHp: 10 },
    { str: 4, agi: 2, mind: 2, maxHp: 14 },
    { str: 5, agi: 3, mind: 3, maxHp: 18 },
  ];
  return table[t]!;
}

export function friendshipTierLabelPt(tier: number): string {
  const t = Math.max(0, Math.min(5, tier));
  return FRIENDSHIP_TIER_LABELS_PT[t] ?? FRIENDSHIP_TIER_LABELS_PT[0]!;
}

export function getCompanionFriendshipScore(state: GameState, companionId: string): number {
  return state.companionFriendship[companionId] ?? 0;
}

export function adjustCompanionFriendshipScore(
  state: GameState,
  companionId: string,
  delta: number
): GameState {
  const cur = getCompanionFriendshipScore(state, companionId);
  const next = clampFriendshipScore(cur + delta);
  if (next === cur) return state;
  return {
    ...state,
    companionFriendship: { ...state.companionFriendship, [companionId]: next },
  };
}

/** Alerta na UI (fila `statusHighlight`) quando o vínculo muda — ganhos estilo +XP. */
export function notifyCompanionFriendshipChange(
  bus: EventBus | undefined,
  data: GameData,
  companionId: string,
  before: number,
  after: number
): void {
  if (!bus || before === after) return;
  const delta = after - before;
  const name = data.companions[companionId]?.name ?? companionId;
  bus.emit({
    type: 'statusHighlight',
    variant: delta > 0 ? 'good' : 'bad',
    title: delta > 0 ? `+${delta} vínculo` : `−${Math.abs(delta)} vínculo`,
    subtitle: name,
  });
}

/**
 * Recalcula STR/AGI/MEN/maxHp/hp dos companheiros a partir do def + patamar de vínculo.
 * O líder (índice 0) não é alterado.
 */
export function syncCompanionPartyWithFriendship(state: GameState, data: GameData): GameState {
  if (state.party.length <= 1) return state;
  let changed = false;
  const nextParty = state.party.map((c, idx) => {
    if (idx === 0) return c;
    const def = data.companions[c.id];
    if (!def) return c;
    const tier = friendshipTier(getCompanionFriendshipScore(state, c.id));
    const b = friendshipBonusesAtTier(tier);
    const newStr = def.str + b.str;
    const newAgi = def.agi + b.agi;
    const newMind = def.mind + b.mind;
    const newMaxHp = def.maxHp + b.maxHp;
    const oldMax = c.maxHp;
    const oldHp = c.hp;
    let newHp = oldHp;
    if (newMaxHp > oldMax) {
      newHp = Math.min(newMaxHp, oldHp + (newMaxHp - oldMax));
    } else if (newMaxHp < oldMax) {
      newHp = Math.min(newMaxHp, oldHp);
    } else {
      newHp = Math.min(newMaxHp, oldHp);
    }
    if (
      newStr === c.str &&
      newAgi === c.agi &&
      newMind === c.mind &&
      newMaxHp === c.maxHp &&
      newHp === c.hp
    ) {
      return c;
    }
    changed = true;
    return { ...c, str: newStr, agi: newAgi, mind: newMind, maxHp: newMaxHp, hp: newHp };
  });
  if (!changed) return state;
  return { ...state, party: nextParty };
}

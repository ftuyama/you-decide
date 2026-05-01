import type { Character, EnemyDef, GameState } from '../schema/index.ts';
import type { AttackRollSpecial } from '../core/rng.ts';

/** Confirmação de crítico inimigo após 6+6 (padrão ~25%) */
export const DEFAULT_ENEMY_CRIT_CONFIRM = 0.25;

/** Com `attackStrategy: focus_leader` e `focusLeaderWeight` omitido no def */
export const DEFAULT_FOCUS_LEADER_WEIGHT = 0.72;
/** Chance de um inimigo com falas proferir uma linha no turno. */
export const DEFAULT_ENEMY_COMBAT_LINE_CHANCE = 0.22;
export const SACRIFICE_MIN_CORRUPTION = 5;

export function getSacrificeValues(state: GameState): { hpCost: number; damageBonus: number } | null {
  if (!state.flags.act6_void_pact) return null;
  const c = state.resources.corruption;
  if (c < SACRIFICE_MIN_CORRUPTION) return null;
  if (c >= 5) return { hpCost: 3, damageBonus: 3 };
  if (c === 4) return { hpCost: 2, damageBonus: 2 };
  return { hpCost: 1, damageBonus: 1 };
}

/** Índice no grupo a atacar (líder vs companheiro) conforme o def do inimigo. */
export function pickEnemyMeleeTarget(party: Character[], def: EnemyDef, rng: () => number): number {
  const alive = party.map((p, i) => (p.hp > 0 ? i : -1)).filter((i): i is number => i >= 0);
  if (alive.length === 0) return 0;
  if (alive.length === 1) return alive[0]!;

  const strategy = def.attackStrategy ?? 'random';
  if (strategy === 'random') {
    return alive[Math.floor(rng() * alive.length)]!;
  }

  const w = def.focusLeaderWeight ?? DEFAULT_FOCUS_LEADER_WEIGHT;
  const leadAlive = party[0]!.hp > 0;
  if (leadAlive && rng() < w) return 0;

  const others = alive.filter((i) => i !== 0);
  if (others.length === 0) return 0;
  return others[Math.floor(rng() * others.length)]!;
}

export function toRollOutcome(
  s: AttackRollSpecial
): 'crit_threat' | 'fumble_threat' | 'normal' {
  if (s === 'crit') return 'crit_threat';
  if (s === 'fumble') return 'fumble_threat';
  return 'normal';
}

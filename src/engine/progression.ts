import type { ClassId, GameState } from './schema';
import type { GameData } from './gameData';
import type { Encounter } from './schema';
import type { EventBus } from './eventBus';

/** XP necessário para sair do nível `level` e ir para `level + 1` */
export const XP_PER_LEVEL_BASE = 100;

/** Nível máximo; acima disso o XP não aumenta nível */
export const MAX_LEVEL = 30;

export function xpToNextLevel(level: number): number {
  if (level >= MAX_LEVEL) return 0;
  return XP_PER_LEVEL_BASE * level;
}

function defaultXpFromEnemyDef(maxHp: number): number {
  return 10 + Math.floor(maxHp / 2);
}

export function computeCombatXp(enc: Encounter, data: GameData): number {
  if (enc.xpReward !== undefined) return enc.xpReward;
  let sum = 0;
  for (const id of enc.enemies) {
    const def = data.enemies[id];
    if (!def) continue;
    sum += def.xp !== undefined ? def.xp : defaultXpFromEnemyDef(def.maxHp);
  }
  return Math.max(0, sum);
}

function applyOneLevelUp(state: GameState, newLevel: number, newXp: number): GameState {
  const lead = state.party[0];
  if (!lead) return { ...state, level: newLevel, xp: newXp };
  const cls: ClassId = lead.class;
  let { str, agi, mind, maxHp, hp } = lead;
  const hpGain = 3;
  maxHp += hpGain;
  hp = Math.min(maxHp, hp + hpGain);
  if (cls === 'knight') {
    str += 1;
    if (newLevel % 2 === 0) agi += 1;
  } else if (cls === 'mage') {
    mind += 1;
    if (newLevel % 2 === 0) agi += 1;
  } else {
    mind += 1;
    if (newLevel % 2 === 0) str += 1;
  }
  const newLead = { ...lead, str, agi, mind, maxHp, hp };
  return {
    ...state,
    level: newLevel,
    xp: newXp,
    party: [newLead, ...state.party.slice(1)],
  };
}

export function addXp(
  state: GameState,
  amount: number,
  opts?: { bus?: EventBus }
): GameState {
  if (amount <= 0) return state;
  if (state.level >= MAX_LEVEL) return state;
  const bus = opts?.bus;
  let level = state.level;
  let xp = state.xp + amount;
  let s = state;

  while (level < MAX_LEVEL && xp >= xpToNextLevel(level)) {
    xp -= xpToNextLevel(level);
    level += 1;
    s = applyOneLevelUp(s, level, xp);
    bus?.emit({ type: 'level.up', level });
  }

  if (level >= MAX_LEVEL) {
    s = { ...s, level: MAX_LEVEL, xp: 0 };
  } else {
    s = { ...s, level, xp };
  }

  bus?.emit({ type: 'xp.gained', amount });
  return s;
}

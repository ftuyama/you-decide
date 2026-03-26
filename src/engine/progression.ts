import type { ClassId, GameState, LevelUpStatDeltas, LevelUpStep } from './schema';
import type { GameData } from './gameData';
import type { Encounter } from './schema';
import type { EventBus } from './eventBus';
import { unlockSpellsForNewLevel } from './spellsKnown';

/** Nível máximo; acima disso o XP não aumenta nível */
export const MAX_LEVEL = 40;

/** XP para o primeiro nível (1→2); cada nível seguinte exige isto a mais que o anterior. */
const XP_TO_NEXT_LEVEL_START = 50;
const XP_TO_NEXT_LEVEL_STEP = 10;

/** XP necessário para sair do nível `level` e ir para `level + 1` */
export function xpToNextLevel(level: number): number {
  if (level >= MAX_LEVEL) return 0;
  return XP_TO_NEXT_LEVEL_START + (level - 1) * XP_TO_NEXT_LEVEL_STEP;
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

const ZERO_DELTAS: LevelUpStatDeltas = {
  str: 0,
  agi: 0,
  mind: 0,
  maxHp: 0,
  hp: 0,
  maxMana: 0,
  mana: 0,
};

function applyOneLevelUp(
  state: GameState,
  newLevel: number,
  newXp: number
): { state: GameState; deltas: LevelUpStatDeltas } {
  const lead = state.party[0];
  if (!lead) {
    return { state: { ...state, level: newLevel, xp: newXp }, deltas: { ...ZERO_DELTAS } };
  }
  const cls: ClassId = lead.class;
  const d: LevelUpStatDeltas = { ...ZERO_DELTAS };
  let { str, agi, mind, maxHp, hp, mana, maxMana } = lead;
  d.maxHp = 3;
  maxHp += 3;
  const hpBefore = hp;
  hp = Math.min(maxHp, hp + 3);
  d.hp = hp - hpBefore;
  if (cls === 'knight') {
    str += 1;
    d.str = 1;
    if (newLevel % 2 === 0) {
      agi += 1;
      d.agi = 1;
    }
  } else if (cls === 'mage') {
    mind += 1;
    d.mind = 1;
    if (newLevel % 2 === 0) {
      agi += 1;
      d.agi = 1;
    }
    d.maxMana = 2;
    maxMana += 2;
    const manaBefore = mana;
    mana = Math.min(maxMana, mana + 2);
    d.mana = mana - manaBefore;
  } else {
    mind += 1;
    d.mind = 1;
    if (newLevel % 2 === 0) {
      str += 1;
      d.str = 1;
    }
    d.maxMana = 2;
    maxMana += 2;
    const manaBefore = mana;
    mana = Math.min(maxMana, mana + 2);
    d.mana = mana - manaBefore;
  }
  const newLead = { ...lead, str, agi, mind, maxHp, hp, mana, maxMana };
  return {
    state: {
      ...state,
      level: newLevel,
      xp: newXp,
      party: [newLead, ...state.party.slice(1)],
    },
    deltas: d,
  };
}

export function addXp(
  state: GameState,
  amount: number,
  opts?: { bus?: EventBus; data?: GameData }
): { state: GameState; levelUps: LevelUpStep[] } {
  if (amount <= 0) return { state, levelUps: [] };
  if (state.level >= MAX_LEVEL) return { state, levelUps: [] };
  const bus = opts?.bus;
  const data = opts?.data;
  let level = state.level;
  let xp = state.xp + amount;
  let s = state;
  const levelUps: LevelUpStep[] = [];

  while (level < MAX_LEVEL && xp >= xpToNextLevel(level)) {
    xp -= xpToNextLevel(level);
    level += 1;
    const step = applyOneLevelUp(s, level, xp);
    s = step.state;
    levelUps.push({ level, deltas: step.deltas });
    if (data) {
      s = unlockSpellsForNewLevel(s, level, data);
    }
    bus?.emit({ type: 'level.up', level });
  }

  if (level >= MAX_LEVEL) {
    s = { ...s, level: MAX_LEVEL, xp: 0 };
  } else {
    s = { ...s, level, xp };
  }

  bus?.emit({ type: 'xp.gained', amount });
  return { state: s, levelUps };
}

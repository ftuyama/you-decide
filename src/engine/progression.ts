import type { Character, ClassId, GameState, LevelUpStatDeltas, LevelUpStep } from './schema.ts';
import type { GameData } from './gameData.ts';
import type { Encounter } from './schema.ts';
import type { EventBus } from './eventBus.ts';
import { unlockSpellsForNewLevel } from './spellsKnown.ts';

/** Quando um efeito de subida de nível se aplica em relação ao nível alcançado */
export type LevelUpWhen = 'every' | 'even' | 'odd';

export type LevelUpEffect =
  | { kind: 'hp'; delta: number; when: LevelUpWhen }
  | { kind: 'mana'; delta: number; when: LevelUpWhen }
  | { kind: 'stat'; attr: 'str' | 'agi' | 'mind'; delta: number; when: LevelUpWhen };

function whenMatches(when: LevelUpWhen, newLevel: number): boolean {
  if (when === 'every') return true;
  if (when === 'even') return newLevel % 2 === 0;
  return newLevel % 2 === 1;
}

/** Curva de XP, ganhos por nível e regras por classe — valores de equilíbrio num só sítio */
export const PROGRESSION = {
  /** Nível máximo; acima disso o XP não aumenta nível */
  maxLevel: 50,
  /** XP para o primeiro nível (1→2); cada nível seguinte exige `step` a mais que o anterior */
  xpToNextLevel: {
    start: 50,
    step: 10,
  },
  /** Quando `EnemyDef.xp` está omitido: `base + floor(maxHp / maxHpDivisor)` */
  defaultEnemyXp: {
    base: 10,
    maxHpDivisor: 2,
  },
  levelUp: {
    byClass: {
      knight: {
        effects: [
          { kind: 'hp', delta: 3, when: 'every' },
          { kind: 'stat', attr: 'str', delta: 1, when: 'every' },
          { kind: 'stat', attr: 'agi', delta: 1, when: 'even' },
          { kind: 'mana', delta: 2, when: 'even' },
        ] as const satisfies readonly LevelUpEffect[],
      },
      mage: {
        effects: [
          { kind: 'hp', delta: 3, when: 'every' },
          { kind: 'stat', attr: 'mind', delta: 1, when: 'every' },
          { kind: 'stat', attr: 'agi', delta: 1, when: 'even' },
          { kind: 'mana', delta: 2, when: 'every' },
        ] as const satisfies readonly LevelUpEffect[],
      },
      cleric: {
        effects: [
          { kind: 'hp', delta: 3, when: 'every' },
          { kind: 'stat', attr: 'mind', delta: 1, when: 'every' },
          { kind: 'stat', attr: 'agi', delta: 1, when: 'even' },
          { kind: 'mana', delta: 2, when: 'every' },
        ] as const satisfies readonly LevelUpEffect[],
      },
    } satisfies Record<ClassId, { effects: readonly LevelUpEffect[] }>,
  },
} as const;

/** Igual a `PROGRESSION.maxLevel`; export separado para compatibilidade com imports existentes */
export const MAX_LEVEL = PROGRESSION.maxLevel;

/** XP necessário para sair do nível `level` e ir para `level + 1` */
export function xpToNextLevel(level: number): number {
  if (level >= PROGRESSION.maxLevel) return 0;
  return PROGRESSION.xpToNextLevel.start + (level - 1) * PROGRESSION.xpToNextLevel.step;
}

function defaultXpFromEnemyDef(maxHp: number): number {
  const { base, maxHpDivisor } = PROGRESSION.defaultEnemyXp;
  return base + Math.floor(maxHp / maxHpDivisor);
}

export function computeCombatXp(enc: Encounter, data: GameData): number {
  let sum = 0;
  for (const id of enc.enemies) {
    const def = data.enemies[id];
    if (!def) continue;
    sum += def.xp !== undefined ? def.xp : defaultXpFromEnemyDef(def.maxHp);
  }
  const bonus = enc.xpReward ?? 0;
  return Math.max(0, sum + bonus);
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

function applyLevelUpEffect(
  effect: LevelUpEffect,
  newLevel: number,
  d: LevelUpStatDeltas,
  stats: { str: number; agi: number; mind: number; maxHp: number; hp: number; maxMana: number; mana: number }
): void {
  if (!whenMatches(effect.when, newLevel)) return;

  switch (effect.kind) {
    case 'hp': {
      const delta = effect.delta;
      d.maxHp += delta;
      stats.maxHp += delta;
      const hpBefore = stats.hp;
      stats.hp = Math.min(stats.maxHp, stats.hp + delta);
      d.hp += stats.hp - hpBefore;
      break;
    }
    case 'mana': {
      const delta = effect.delta;
      d.maxMana += delta;
      stats.maxMana += delta;
      const manaBefore = stats.mana;
      stats.mana = Math.min(stats.maxMana, stats.mana + delta);
      d.mana += stats.mana - manaBefore;
      break;
    }
    case 'stat': {
      const delta = effect.delta;
      d[effect.attr] += delta;
      stats[effect.attr] += delta;
      break;
    }
  }
}

/** Aplica os efeitos de um único nível (nível alcançado = `newLevel`) ao personagem. */
export function applyLevelUpEffectsToCharacter(lead: Character, newLevel: number): Character {
  const cls: ClassId = lead.class;
  const { effects } = PROGRESSION.levelUp.byClass[cls];
  const d: LevelUpStatDeltas = { ...ZERO_DELTAS };
  const stats = {
    str: lead.str,
    agi: lead.agi,
    mind: lead.mind,
    maxHp: lead.maxHp,
    hp: lead.hp,
    maxMana: lead.maxMana,
    mana: lead.mana,
  };

  for (const effect of effects) {
    applyLevelUpEffect(effect, newLevel, d, stats);
  }

  return {
    ...lead,
    str: stats.str,
    agi: stats.agi,
    mind: stats.mind,
    maxHp: stats.maxHp,
    hp: stats.hp,
    maxMana: stats.maxMana,
    mana: stats.mana,
  };
}

/**
 * Projeta o líder como se tivesse subido de nível 1 até `targetLevel` só com a tabela de `PROGRESSION`
 * (sem feitiços, buffs ou XP real). Útil para estimativas de equilíbrio.
 */
export function projectCharacterToLevel(lead: Character, targetLevel: number): Character {
  const cap = Math.min(Math.max(1, Math.floor(targetLevel)), PROGRESSION.maxLevel);
  let c = lead;
  for (let newLevel = 2; newLevel <= cap; newLevel++) {
    c = applyLevelUpEffectsToCharacter(c, newLevel);
  }
  return c;
}

function applyOneLevelUp(
  state: GameState,
  newLevel: number,
  newXp: number
): { state: GameState; deltas: LevelUpStatDeltas } {
  const lead = state.party[0];
  if (!lead) {
    return { state: { ...state, level: newLevel, xp: newXp }, deltas: { ...ZERO_DELTAS } };
  }
  const newLead = applyLevelUpEffectsToCharacter(lead, newLevel);
  const d: LevelUpStatDeltas = { ...ZERO_DELTAS };
  const prev = {
    str: lead.str,
    agi: lead.agi,
    mind: lead.mind,
    maxHp: lead.maxHp,
    hp: lead.hp,
    maxMana: lead.maxMana,
    mana: lead.mana,
  };
  d.str = newLead.str - prev.str;
  d.agi = newLead.agi - prev.agi;
  d.mind = newLead.mind - prev.mind;
  d.maxHp = newLead.maxHp - prev.maxHp;
  d.hp = newLead.hp - prev.hp;
  d.maxMana = newLead.maxMana - prev.maxMana;
  d.mana = newLead.mana - prev.mana;

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
  if (state.level >= PROGRESSION.maxLevel) return { state, levelUps: [] };
  const bus = opts?.bus;
  const data = opts?.data;
  let level = state.level;
  let xp = state.xp + amount;
  let s = state;
  const levelUps: LevelUpStep[] = [];

  while (level < PROGRESSION.maxLevel && xp >= xpToNextLevel(level)) {
    xp -= xpToNextLevel(level);
    level += 1;
    const step = applyOneLevelUp(s, level, xp);
    s = step.state;
    let spellsLearned: string[] = [];
    if (data) {
      const unlocked = unlockSpellsForNewLevel(s, level, data);
      s = unlocked.state;
      spellsLearned = unlocked.learned;
    }
    levelUps.push({ level, deltas: step.deltas, spellsLearned });
    bus?.emit({ type: 'level.up', level });
  }

  if (level >= PROGRESSION.maxLevel) {
    s = { ...s, level: MAX_LEVEL, xp: 0 };
  } else {
    s = { ...s, level, xp };
  }

  bus?.emit({ type: 'xp.gained', amount });
  return { state: s, levelUps };
}

import { describe, expect, it } from 'vitest';
import {
  MAX_LEVEL,
  addXp,
  computeCombatXp,
  projectCharacterToLevel,
  xpToNextLevel,
} from '../../src/engine/progression/index.ts';
import { createInitialState, createPlayerCharacter } from '../../src/engine/core/index.ts';
import type { Encounter } from '../../src/engine/schema/index.ts';
import { createTestData, testCampaign } from '../helpers/engineTestData.ts';

const minimalData = createTestData();

describe('xpToNextLevel', () => {
  it('matches ladder: 50 at level 1, +10 per level', () => {
    expect(xpToNextLevel(1)).toBe(50);
    expect(xpToNextLevel(2)).toBe(60);
    expect(xpToNextLevel(3)).toBe(70);
  });

  it('returns 0 at or above max level', () => {
    expect(xpToNextLevel(MAX_LEVEL)).toBe(0);
    expect(xpToNextLevel(MAX_LEVEL + 5)).toBe(0);
  });
});

describe('computeCombatXp', () => {
  it('sums enemy xp and encounter bonus', () => {
    const enc: Encounter = {
      combatType: 'battle',
      id: 'e1',
      enemies: ['gob'],
      xpReward: 5,
    };
    const data = {
      ...minimalData,
      enemies: {
        gob: {
          id: 'gob',
          name: 'Gob',
          hp: 10,
          maxHp: 10,
          xp: 12,
          str: 8,
          agi: 8,
          mind: 6,
          armor: 0,
          type: 'normal' as const,
          armorChips: 0,
          sprite: 'g',
          attackStrategy: 'random' as const,
        },
      },
    };
    expect(computeCombatXp(enc, data)).toBe(12 + 5);
  });

  it('dialogue encounter uses tensionMax base xp plus xpReward', () => {
    const enc: Encounter = {
      combatType: 'dialogue',
      id: 'd1',
      dialogueEnemyId: 'noop',
      xpReward: 7,
    };
    expect(computeCombatXp(enc, minimalData)).toBe(7);
    const dataWithDlg = {
      ...minimalData,
      dialogueEnemies: {
        ...minimalData.dialogueEnemies,
        dlg: {
          id: 'dlg',
          name: 'X',
          sprite: 's',
          tensionMax: 10,
          graph: { rootNodeId: 'r', nodes: { r: { linePt: 'a', terminal: 'victory' as const } } },
        },
      },
    };
    const enc2: Encounter = {
      combatType: 'dialogue',
      id: 'd2',
      dialogueEnemyId: 'dlg',
    };
    expect(computeCombatXp(enc2, dataWithDlg)).toBe(15);
  });
});

describe('projectCharacterToLevel', () => {
  it('applies PROGRESSION from nível 1 até N (cavaleiro: +3 maxHp por nível)', () => {
    const l1 = createPlayerCharacter('H', 'knight');
    expect(l1.maxHp).toBe(18);
    const l2 = projectCharacterToLevel(l1, 2);
    expect(l2.maxHp).toBe(21);
    const l5 = projectCharacterToLevel(l1, 5);
    expect(l5.maxHp).toBe(18 + 3 * 4);
  });
});

describe('addXp', () => {
  it('levels knight when XP crosses threshold', () => {
    let s = createInitialState(testCampaign, 1);
    s = { ...s, party: [createPlayerCharacter('Hero', 'knight')] };
    const { state, levelUps } = addXp(s, 50, { data: minimalData });
    expect(state.level).toBe(2);
    expect(levelUps.length).toBe(1);
    expect(levelUps[0]?.level).toBe(2);
    expect(state.party[0]!.maxHp).toBeGreaterThan(18);
  });

  it('emits no level-ups when amount is zero', () => {
    let s = createInitialState(testCampaign, 1);
    s = { ...s, party: [createPlayerCharacter('Hero', 'knight')] };
    const { levelUps } = addXp(s, 0);
    expect(levelUps).toEqual([]);
  });
});

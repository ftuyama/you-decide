import { describe, expect, it } from 'vitest';
import {
  beginEncounter,
  fleeCombat,
  fleeDifficultyTn,
  getCharacterArmorClass,
} from '../../src/engine/combat.ts';
import { createInitialState, createPlayerCharacter } from '../../src/engine/state.ts';
import { emptyGameData } from '../../src/engine/gameData.ts';
import type { CampaignIndex, EnemyDef, Encounter, ItemDef } from '../../src/engine/schema.ts';

const testCampaign: CampaignIndex = {
  id: 'test',
  name: 'Test',
  entryScene: 'act1/title',
  startingCompanionPool: [],
  scenes: [],
};

const leather: ItemDef = {
  id: 'leather',
  name: 'Leather',
  slot: 'armor',
  bonusStr: 0,
  bonusAgi: 0,
  bonusMind: 0,
  bonusLuck: 0,
  armor: 2,
  damage: 0,
};

describe('getCharacterArmorClass', () => {
  it('uses 7 + AGI mod + item armor', () => {
    const data = emptyGameData(testCampaign, {
      defaultHeroName: () => 'H',
      getHeroClassLabel: () => '—',
      getPathUnlockBonus: () => null,
    });
    data.items = { leather };
    const knight = createPlayerCharacter('K', 'knight');
    // knight agi 9 -> mod 1; CA = 7 + 1 + 2 = 10
    expect(getCharacterArmorClass(data, { ...knight, armorId: 'leather' })).toBe(10);
  });
});

const dummyEnemy: EnemyDef = {
  id: 'dummy',
  name: 'Boneco',
  hp: 20,
  maxHp: 20,
  str: 6,
  agi: 6,
  mind: 6,
  armor: 0,
  type: 'normal',
  armorChips: 0,
  sprite: 'x',
  attackStrategy: 'random',
};

function combatTestData(): ReturnType<typeof emptyGameData> {
  const data = emptyGameData(testCampaign, {
    defaultHeroName: () => 'H',
    getHeroClassLabel: () => '—',
    getPathUnlockBonus: () => null,
  });
  data.enemies = { dummy: dummyEnemy };
  return data;
}

describe('fleeDifficultyTn', () => {
  it('maps fleeRate to TN in7..12', () => {
    expect(fleeDifficultyTn(1)).toBe(7);
    expect(fleeDifficultyTn(0)).toBe(12);
    expect(fleeDifficultyTn(0.5)).toBe(10);
  });
});

describe('fleeCombat', () => {
  it('escapes on success and goes to onFlee scene', () => {
    const data = combatTestData();
    const enc: Encounter = {
      id: 'flee_ok',
      enemies: ['dummy'],
      fleeRate: 1,
    };
    let state = createInitialState(testCampaign, 42_424);
    state.party = [{ ...createPlayerCharacter('Ágil', 'knight'), agi: 18 }];
    state = beginEncounter(state, enc, data, {
      returnScene: 'hub',
      onFlee: 'cena_fuga',
    });
    const after = fleeCombat(state, data);
    expect(after.mode).toBe('story');
    expect(after.combat).toBeNull();
    expect(after.sceneId).toBe('cena_fuga');
  });

  it('failed flee consumes the player turn and advances to next player round', () => {
    const data = combatTestData();
    const enc: Encounter = {
      id: 'flee_fail',
      enemies: ['dummy'],
      fleeRate: 0,
    };
    let state = createInitialState(testCampaign, 99_001);
    state.party = [{ ...createPlayerCharacter('Lento', 'knight'), agi: 3 }];
    state = beginEncounter(state, enc, data, { returnScene: 'hub', onFlee: 'cena_fuga' });
    const startRound = state.combat!.round;
    const after = fleeCombat(state, data);
    expect(after.mode).toBe('combat');
    expect(after.combat).not.toBeNull();
    expect(after.combat!.round).toBe(startRound + 1);
    expect(after.combat!.phase).toBe('choose_stance');
    const msg = after.combat!.log.some((e) => e.message.includes('não consegue fugir'));
    expect(msg).toBe(true);
  });

  it('uses fleeRate 0.5 when encounter omits fleeRate', () => {
    const data = combatTestData();
    const enc: Encounter = {
      id: 'flee_default',
      enemies: ['dummy'],
    };
    let state = createInitialState(testCampaign, 7);
    state.party = [{ ...createPlayerCharacter('X', 'knight'), agi: 1 }];
    state = beginEncounter(state, enc, data, { returnScene: 'hub' });
    expect(state.combat!.fleeRate).toBeUndefined();
    const after = fleeCombat(state, data);
    expect(after.mode).toBe('combat');
    const tnLine = after.combat!.log.find(
      (e) => e.kind === 'info' && e.message.includes('vs TN 10')
    );
    expect(tnLine).toBeDefined();
  });

  it('no-ops when not in choose_stance phase', () => {
    const data = combatTestData();
    const enc: Encounter = { id: 'x', enemies: ['dummy'], fleeRate: 1 };
    let state = createInitialState(testCampaign, 1);
    state.party = [createPlayerCharacter('H', 'knight')];
    state = beginEncounter(state, enc, data, { returnScene: 'hub', onFlee: 'f' });
    const mid = {
      ...state,
      combat: { ...state.combat!, phase: 'enemy' as const },
    };
    expect(fleeCombat(mid, data)).toBe(mid);
  });
});

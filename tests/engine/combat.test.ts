import { describe, expect, it } from 'vitest';
import { getCharacterArmorClass } from '../../src/engine/combat.ts';
import { createPlayerCharacter } from '../../src/engine/state.ts';
import { emptyGameData } from '../../src/engine/gameData.ts';
import type { CampaignIndex, ItemDef } from '../../src/engine/schema.ts';

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

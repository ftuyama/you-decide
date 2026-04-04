import { describe, expect, it } from 'vitest';
import { applyEffects } from '../../src/engine/effects.ts';
import { EventBus } from '../../src/engine/eventBus.ts';
import { createInitialState, createPlayerCharacter } from '../../src/engine/state.ts';
import { emptyGameData } from '../../src/engine/gameData.ts';
import type { CampaignIndex } from '../../src/engine/schema.ts';

const testCampaign: CampaignIndex = {
  id: 'test',
  name: 'Test',
  entryScene: 'act1/title',
  startingCompanionPool: [],
  scenes: [],
};

describe('applyEffects', () => {
  it('applies setFlag', () => {
    let s = createInitialState(testCampaign, 1);
    s = { ...s, party: [createPlayerCharacter('H', 'knight')] };
    const bus = new EventBus();
    const data = emptyGameData(testCampaign, {
      defaultHeroName: () => 'H',
      getHeroClassLabel: () => '—',
      getPathUnlockBonus: () => null,
    });
    const next = applyEffects(s, [{ op: 'setFlag', key: 'door_open', value: true }], {
      sceneId: 'test/scene',
      data,
      bus,
    });
    expect(next.flags.door_open).toBe(true);
  });

  it('addResource clamps to caps', () => {
    let s = createInitialState(testCampaign, 1);
    s = { ...s, party: [createPlayerCharacter('H', 'knight')], resources: { ...s.resources, gold: 990 } };
    const bus = new EventBus();
    const data = emptyGameData(testCampaign, {
      defaultHeroName: () => 'H',
      getHeroClassLabel: () => '—',
      getPathUnlockBonus: () => null,
    });
    const next = applyEffects(s, [{ op: 'addResource', resource: 'gold', delta: 50 }], {
      sceneId: 'test/scene',
      data,
      bus,
    });
    expect(next.resources.gold).toBe(999);
  });
});

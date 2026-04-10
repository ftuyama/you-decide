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

  it('addRep directGain aplica ganho imediato', () => {
    let s = createInitialState(testCampaign, 1);
    s = { ...s, party: [createPlayerCharacter('H', 'knight')] };
    const bus = new EventBus();
    const data = emptyGameData(testCampaign, {
      defaultHeroName: () => 'H',
      getHeroClassLabel: () => '—',
      getPathUnlockBonus: () => null,
    });
    const next = applyEffects(
      s,
      [{ op: 'addRep', faction: 'vigilia', delta: 1, directGain: true }],
      { sceneId: 'test/scene', data, bus }
    );
    expect(next.reputation.vigilia).toBe(1);
    expect(next.factionGainPending.vigilia).toBe(0);
  });

  it('multiplyLeadHp reduz PV máx. e atuais pelo fator', () => {
    let s = createInitialState(testCampaign, 1);
    s = { ...s, party: [createPlayerCharacter('H', 'knight')] };
    const bus = new EventBus();
    const data = emptyGameData(testCampaign, {
      defaultHeroName: () => 'H',
      getHeroClassLabel: () => '—',
      getPathUnlockBonus: () => null,
    });
    const next = applyEffects(s, [{ op: 'multiplyLeadHp', factor: 0.5 }], {
      sceneId: 'test/scene',
      data,
      bus,
    });
    expect(next.party[0]!.maxHp).toBe(9);
    expect(next.party[0]!.hp).toBe(9);
  });

  it('addRep sem directGain exige dois ganhos para +1 reputação', () => {
    let s = createInitialState(testCampaign, 1);
    s = { ...s, party: [createPlayerCharacter('H', 'knight')] };
    const bus = new EventBus();
    const data = emptyGameData(testCampaign, {
      defaultHeroName: () => 'H',
      getHeroClassLabel: () => '—',
      getPathUnlockBonus: () => null,
    });
    const ctx = { sceneId: 'test/scene', data, bus };
    const a = applyEffects(s, [{ op: 'addRep', faction: 'circulo', delta: 1 }], ctx);
    expect(a.reputation.circulo).toBe(0);
    expect(a.factionGainPending.circulo).toBe(1);
    const b = applyEffects(a, [{ op: 'addRep', faction: 'circulo', delta: 1 }], ctx);
    expect(b.reputation.circulo).toBe(1);
    expect(b.factionGainPending.circulo).toBe(0);
  });

  it('addRep negativo zera pending e aplica perda', () => {
    let s = createInitialState(testCampaign, 1);
    s = {
      ...s,
      party: [createPlayerCharacter('H', 'knight')],
      factionGainPending: { vigilia: 1, circulo: 0, culto: 0 },
      reputation: { ...s.reputation, vigilia: 1 },
    };
    const bus = new EventBus();
    const data = emptyGameData(testCampaign, {
      defaultHeroName: () => 'H',
      getHeroClassLabel: () => '—',
      getPathUnlockBonus: () => null,
    });
    const next = applyEffects(s, [{ op: 'addRep', faction: 'vigilia', delta: -1 }], {
      sceneId: 'test/scene',
      data,
      bus,
    });
    expect(next.reputation.vigilia).toBe(0);
    expect(next.factionGainPending.vigilia).toBe(0);
  });

  it('grantLeadStoryPassive dedup e grava id', () => {
    let s = createInitialState(testCampaign, 1);
    s = { ...s, party: [createPlayerCharacter('H', 'knight')] };
    const bus = new EventBus();
    const data = {
      ...emptyGameData(testCampaign, {
        defaultHeroName: () => 'H',
        getHeroClassLabel: () => '—',
        getPathUnlockBonus: () => null,
      }),
      leadStoryPassives: { test_passive: { name: 'T', description: 'D' } },
    };
    const ctx = { sceneId: 'test/scene', data, bus };
    const a = applyEffects(s, [{ op: 'grantLeadStoryPassive', id: 'test_passive' }], ctx);
    expect(a.leadStoryPassives).toEqual(['test_passive']);
    const b = applyEffects(a, [{ op: 'grantLeadStoryPassive', id: 'test_passive' }], ctx);
    expect(b.leadStoryPassives).toEqual(['test_passive']);
  });
});

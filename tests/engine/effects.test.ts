import { describe, expect, it } from 'vitest';
import { applyEffects } from '../../src/engine/core/index.ts';
import { EventBus } from '../../src/engine/core/index.ts';
import { createInitialState, createPlayerCharacter } from '../../src/engine/core/index.ts';
import type { Character, ClassId } from '../../src/engine/schema/index.ts';
import { createTestData, testCampaign } from '../helpers/engineTestData.ts';

describe('applyEffects', () => {
  it('applies setFlag', () => {
    let s = createInitialState(testCampaign, 1);
    s = { ...s, party: [createPlayerCharacter('H', 'knight')] };
    const bus = new EventBus();
    const data = createTestData();
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
    const data = createTestData();
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
    const data = createTestData();
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
    const data = createTestData();
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
    const data = createTestData();
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
    const data = createTestData();
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
      ...createTestData(),
      leadStoryPassives: { test_passive: { name: 'T', description: 'D' } },
    };
    const ctx = { sceneId: 'test/scene', data, bus };
    const a = applyEffects(s, [{ op: 'grantLeadStoryPassive', id: 'test_passive' }], ctx);
    expect(a.leadStoryPassives).toEqual(['test_passive']);
    const b = applyEffects(a, [{ op: 'grantLeadStoryPassive', id: 'test_passive' }], ctx);
    expect(b.leadStoryPassives).toEqual(['test_passive']);
  });

  it('campRest consome 1 suprimento e remove todo o stress da party', () => {
    let s = createInitialState(testCampaign, 1);
    const hero = createPlayerCharacter('H', 'knight');
    const ally = createPlayerCharacter('A', 'mage');
    s = {
      ...s,
      party: [
        { ...hero, hp: 3, mana: 1, stress: 4 },
        { ...ally, hp: 2, mana: 0, stress: 2 },
      ],
      resources: { ...s.resources, supply: 2 },
    };
    const bus = new EventBus();
    const data = createTestData();
    const next = applyEffects(s, [{ op: 'campRest' }], {
      sceneId: 'test/scene',
      data,
      bus,
    });
    expect(next.resources.supply).toBe(1);
    expect(next.party[0]!.hp).toBe(next.party[0]!.maxHp);
    expect(next.party[0]!.mana).toBe(next.party[0]!.maxMana);
    expect(next.party[0]!.stress).toBe(0);
    expect(next.party[1]!.hp).toBe(next.party[1]!.maxHp);
    expect(next.party[1]!.mana).toBe(next.party[1]!.maxMana);
    expect(next.party[1]!.stress).toBe(0);
  });

  it('setExploration atualiza nodeId no mesmo graphId', () => {
    let s = createInitialState(testCampaign, 1);
    s = {
      ...s,
      party: [createPlayerCharacter('H', 'knight')],
      exploration: { graphId: 'act2_catacomb', nodeId: 'cross_start' },
    };
    const bus = new EventBus();
    const data = createTestData();
    const next = applyEffects(
      s,
      [{ op: 'setExploration', graphId: 'act2_catacomb', nodeId: 'cross_north' }],
      { sceneId: 'test/scene', data, bus }
    );
    expect(next.exploration).toEqual({ graphId: 'act2_catacomb', nodeId: 'cross_north' });
  });

  it('adjustCompanionFriendship sincroniza stats do companheiro', () => {
    const hero = createPlayerCharacter('H', 'knight');
    const ally: Character = {
      id: 'ally_test',
      name: 'Ally',
      class: 'knight',
      str: 8,
      agi: 8,
      mind: 8,
      luck: 8,
      hp: 10,
      maxHp: 10,
      stress: 0,
      mana: 0,
      maxMana: 0,
      weaponId: null,
      armorId: null,
      relicId: null,
      critRatio: 0,
      specialUsedThisCombat: false,
      path: null,
    };
    let s = createInitialState(testCampaign, 1);
    s = { ...s, party: [hero, ally], companionFriendship: { ally_test: 20 } };
    const bus = new EventBus();
    const data = {
      ...createTestData(),
      companions: {
        ally_test: {
          id: 'ally_test',
          name: 'Ally',
          str: 8,
          agi: 8,
          mind: 8,
          luck: 8,
          hp: 10,
          maxHp: 10,
        },
      },
    };
    const next = applyEffects(
      s,
      [{ op: 'adjustCompanionFriendship', companionId: 'ally_test', delta: 25 }],
      { sceneId: 'test/scene', data, bus }
    );
    expect(next.companionFriendship.ally_test).toBe(45);
    expect(next.party[1]!.str).toBe(10);
    expect(next.party[1]!.maxHp).toBe(16);
  });

  it('adjustCompanionFriendship com onceFlag só aplica uma vez', () => {
    let s = createInitialState(testCampaign, 1);
    s = {
      ...s,
      party: [createPlayerCharacter('H', 'knight')],
      companionFriendship: { ally_test: 20 },
      flags: { ff_cf_test_once: true },
    };
    const bus = new EventBus();
    const data = {
      ...createTestData(),
      companions: {
        ally_test: {
          id: 'ally_test',
          name: 'Ally',
          str: 8,
          agi: 8,
          mind: 8,
          luck: 8,
          hp: 10,
          maxHp: 10,
        },
      },
    };
    const ctx = { sceneId: 'test/scene', data, bus };
    const blocked = applyEffects(
      s,
      [{ op: 'adjustCompanionFriendship', companionId: 'ally_test', delta: 5, onceFlag: 'ff_cf_test_once' }],
      ctx
    );
    expect(blocked.companionFriendship.ally_test).toBe(20);
    const fresh = applyEffects(
      { ...s, flags: {} },
      [{ op: 'adjustCompanionFriendship', companionId: 'ally_test', delta: 5, onceFlag: 'ff_cf_test_once' }],
      ctx
    );
    expect(fresh.companionFriendship.ally_test).toBe(25);
    expect(fresh.flags.ff_cf_test_once).toBe(true);
  });

  it('recruit preserva vínculo prévio quando abaixo do valor inicial', () => {
    let s = createInitialState(testCampaign, 1);
    s = {
      ...s,
      party: [createPlayerCharacter('H', 'knight')],
      companionFriendship: { ally_test: 8 },
      companionsAvailable: ['ally_test'],
    };
    const bus = new EventBus();
    const data = {
      ...createTestData(),
      companions: {
        ally_test: {
          id: 'ally_test',
          name: 'Ally',
          str: 8,
          agi: 8,
          mind: 8,
          luck: 8,
          hp: 10,
          maxHp: 10,
        },
      },
    };
    const next = applyEffects(s, [{ op: 'recruit', companionId: 'ally_test' }], {
      sceneId: 'test/scene',
      data,
      bus,
    });
    expect(next.companionFriendship.ally_test).toBe(8);
    expect(next.party).toHaveLength(2);
  });

  it('setPath com path grava lastPathPromotion para o banner de UI', () => {
    let s = createInitialState(testCampaign, 1);
    s = { ...s, party: [createPlayerCharacter('H', 'knight')] };
    const bus = new EventBus();
    const base = createTestData();
    const data = {
      ...base,
      heroNarrative: {
        ...base.heroNarrative,
        getHeroClassLabel: (_c: ClassId, path: string | null | undefined) =>
          path === 'fallen' ? 'Cavaleiro caído' : '—',
        getPathPromotionNarrativePt: (_c: ClassId, path: string | null | undefined) =>
          path === 'fallen' ? 'O aço lembra o que juraste e o que quebraste.' : null,
      },
    };
    const next = applyEffects(s, [{ op: 'setPath', path: 'fallen' }], {
      sceneId: 'test/scene',
      data,
      bus,
    });
    expect(next.party[0]!.path).toBe('fallen');
    expect(next.lastPathPromotion).toEqual({
      label: 'Cavaleiro caído',
      narrativePt: 'O aço lembra o que juraste e o que quebraste.',
    });
  });

  it('setPath com path null zera lastPathPromotion', () => {
    let s = createInitialState(testCampaign, 1);
    s = {
      ...s,
      party: [createPlayerCharacter('H', 'knight')],
      lastPathPromotion: { label: 'Temp' },
    };
    const bus = new EventBus();
    const data = createTestData();
    const next = applyEffects(s, [{ op: 'setPath', path: null }], {
      sceneId: 'test/scene',
      data,
      bus,
    });
    expect(next.party[0]!.path).toBe(null);
    expect(next.lastPathPromotion).toBe(null);
  });
});

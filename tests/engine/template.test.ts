import { describe, expect, it } from 'vitest';
import { injectText } from '../../src/engine/core/index.ts';
import type { GameState } from '../../src/engine/schema/index.ts';
import { createInitialState } from '../../src/engine/core/index.ts';
import campaignIndex from '../../src/campaigns/calvario/index.json';

function baseState(): GameState {
  const s = createInitialState(campaignIndex);
  return {
    ...s,
    party: [
      {
        id: 'player',
        name: 'Test',
        class: 'knight',
        str: 10,
        agi: 10,
        mind: 10,
        luck: 10,
        hp: 10,
        maxHp: 10,
        stress: 0,
        weaponId: null,
        armorId: null,
        relicId: null,
        critRatio: 0,
        specialUsedThisCombat: false,
        mana: 0,
        maxMana: 0,
        path: null,
      },
    ],
  };
}

describe('injectText', () => {
  it('substitui throneOutcomeLine para selo', () => {
    const s = baseState();
    s.marks = ['calvario_sealed'];
    s.resources = { ...s.resources, corruption: 2, faith: 1 };
    const out = injectText('{{throneOutcomeLine}}', s);
    expect(out).toContain('fé');
    expect(out).toContain('subsolo');
  });

  it('substitui factionThroneEcho quando Vigília favorece selo', () => {
    const s = baseState();
    s.marks = ['calvario_sealed'];
    s.reputation = { vigilia: 2, circulo: 0, culto: 0 };
    const out = injectText('{{factionThroneEcho}}', s);
    expect(out).toContain('capeador');
  });
});

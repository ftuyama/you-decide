import { describe, expect, it } from 'vitest';
import type { CombatLogEntry, CombatState, EnemyDef } from '../../src/engine/schema/index.ts';
import type { GameData } from '../../src/engine/data/index.ts';
import { emptyGameData } from '../../src/engine/data/index.ts';
import { createPlayerCharacter } from '../../src/engine/core/index.ts';
import {
  extractLethalGhosts,
  isBuffInfoEntry,
  logSliceHasBuffCast,
  resolveCombatLogFx,
} from '../../src/ui/combatFx.ts';

const minimalData = (): GameData => {
  const d = emptyGameData(
    { id: 't', name: 't', entryScene: 'a', startingCompanionPool: [], scenes: [] },
    {
      defaultHeroName: () => 'H',
      getHeroClassLabel: () => 'k',
      getPathUnlockBonus: () => null,
      getPathPromotionNarrativePt: () => null,
    }
  );
  d.spells = {
    ember_spark: {
      id: 'ember_spark',
      name: 'Brasa',
      manaCost: 1,
      minLevel: 1,
      classId: 'mage',
      spellKind: 'damage',
      dice: 1,
      base: 0,
    },
    lesser_heal: {
      id: 'lesser_heal',
      name: 'Cura',
      manaCost: 1,
      minLevel: 1,
      classId: 'cleric',
      spellKind: 'heal_self',
      dice: 1,
      base: 0,
    },
    warriors_focus: {
      id: 'warriors_focus',
      name: 'Foco',
      manaCost: 1,
      minLevel: 1,
      classId: 'any',
      spellKind: 'buff_attack_roll',
      dice: 1,
      base: 0,
    },
    arcane_bolt: {
      id: 'arcane_bolt',
      name: 'Arcano',
      manaCost: 1,
      minLevel: 1,
      classId: 'mage',
      spellKind: 'damage',
      dice: 1,
      base: 0,
    },
  };
  d.items = {
    ...d.items,
    potion_hp: {
      id: 'potion_hp',
      name: 'Poção Rubra',
      slot: 'consumable',
      bonusStr: 0,
      bonusAgi: 0,
      bonusMind: 0,
      armor: 0,
      damage: 0,
      bonusLuck: 0,
      restoreHp: 8,
    },
    potion_mana: {
      id: 'potion_mana',
      name: 'Tônico Azul',
      slot: 'consumable',
      bonusStr: 0,
      bonusAgi: 0,
      bonusMind: 0,
      armor: 0,
      damage: 0,
      bonusLuck: 0,
      restoreMana: 6,
    },
    potion_stress: {
      id: 'potion_stress',
      name: 'Hidromel',
      slot: 'consumable',
      bonusStr: 0,
      bonusAgi: 0,
      bonusMind: 0,
      armor: 0,
      damage: 0,
      bonusLuck: 0,
      stressRelief: 1,
    },
    some_potion: {
      id: 'some_potion',
      name: 'Mistério',
      slot: 'consumable',
      bonusStr: 0,
      bonusAgi: 0,
      bonusMind: 0,
      armor: 0,
      damage: 0,
      bonusLuck: 0,
    },
  };
  return d;
};

const combatStub = (overrides?: Partial<CombatState>): CombatState => ({
  encounterId: 'e1',
  enemies: [
    {
      defId: 'gob',
      hp: 5,
      maxHp: 10,
      armorChipsRemaining: 0,
      stress: 0,
    },
  ],
  turnOrder: [],
  turnIndex: 0,
  round: 1,
  phase: 'choose_stance',
  pendingSacrificeDamage: 0,
  pendingSacrificeCost: 0,
  buffAttackRoll: 0,
  buffArmorClass: 0,
  enemyBuffArmorClass: 0,
  enemyBuffAttackRoll: 0,
  bossTwistAppliedIds: [],
  log: [],
  returnScene: 'x',
  ...overrides,
});

describe('resolveCombatLogFx', () => {
  const data = minimalData();
  const knight = { ...createPlayerCharacter('Aldo', 'knight'), name: 'Aldo' };
  const mage = { ...createPlayerCharacter('Bela', 'mage'), name: 'Bela' };

  it('maps player miss to miss overlay on enemy index', () => {
    const entries: CombatLogEntry[] = [
      {
        kind: 'attack',
        message: 'Aldo erra o golpe.',
        outcome: 'miss',
        actor: 'Aldo',
        target: 'Goblin',
        enemyIndex: 0,
        rollOutcome: 'normal',
      },
    ];
    const r = resolveCombatLogFx(entries, [knight], data);
    expect(r.byEnemyIndex.get(0)?.layerClasses).toContain('combat-fx-miss');
    expect(r.columnPulse).toBeNull();
  });

  it('maps fumble miss to fumble overlay', () => {
    const entries: CombatLogEntry[] = [
      {
        kind: 'attack',
        message: 'Falha.',
        outcome: 'miss',
        actor: 'Aldo',
        target: 'Goblin',
        enemyIndex: 0,
        rollOutcome: 'fumble_threat',
      },
    ];
    const r = resolveCombatLogFx(entries, [knight], data);
    expect(r.byEnemyIndex.get(0)?.layerClasses).toContain('combat-fx-fumble');
  });

  it('maps physical damage to melee slash for sword knight', () => {
    const entries: CombatLogEntry[] = [
      {
        kind: 'attack',
        message: 'Acerta!',
        outcome: 'hit',
        actor: 'Aldo',
        target: 'Goblin',
        enemyIndex: 0,
      },
      {
        kind: 'damage',
        message: 'Dano.',
        target: 'Goblin',
        enemyIndex: 0,
        damageKind: 'normal',
        final: 3,
      },
    ];
    const r = resolveCombatLogFx(entries, [knight], data);
    expect(r.byEnemyIndex.get(0)?.layerClasses).toContain('combat-fx-melee-slash');
  });

  it('maps staff mage to staff melee fx', () => {
    const entries: CombatLogEntry[] = [
      {
        kind: 'attack',
        message: 'Hit',
        outcome: 'hit',
        actor: 'Bela',
        target: 'Goblin',
        enemyIndex: 0,
      },
      {
        kind: 'damage',
        message: 'Dano.',
        target: 'Goblin',
        enemyIndex: 0,
        damageKind: 'normal',
        final: 2,
      },
    ];
    const r = resolveCombatLogFx(entries, [mage], data);
    expect(r.byEnemyIndex.get(0)?.layerClasses).toContain('combat-fx-melee-staff');
  });

  it('maps spell damage with spellId to ember class', () => {
    const entries: CombatLogEntry[] = [
      {
        kind: 'damage',
        message: 'Mágico.',
        target: 'Goblin',
        enemyIndex: 0,
        damageKind: 'normal',
        spellId: 'ember_spark',
        final: 4,
      },
    ];
    const r = resolveCombatLogFx(entries, [mage], data);
    expect(r.byEnemyIndex.get(0)?.layerClasses).toContain('combat-fx-spell-ember');
    expect(r.columnFlash).toBe('ember');
  });

  it('does not set column flash for non-ember spell damage', () => {
    const entries: CombatLogEntry[] = [
      {
        kind: 'damage',
        message: 'Arcano.',
        target: 'Goblin',
        enemyIndex: 0,
        damageKind: 'normal',
        spellId: 'arcane_bolt',
        final: 3,
      },
    ];
    const r = resolveCombatLogFx(entries, [mage], data);
    expect(r.columnFlash).toBeNull();
  });

  it('sets heal column pulse from heal with spellId', () => {
    const entries: CombatLogEntry[] = [
      {
        kind: 'heal',
        message: 'Cura.',
        actor: 'Aldo',
        target: 'Aldo',
        spellId: 'lesser_heal',
        final: 2,
      },
    ];
    const r = resolveCombatLogFx(entries, [knight], data);
    expect(r.columnPulse).toBe('heal_spell');
  });

  it('sets potion pulse from info with itemId (ex.: mana)', () => {
    const entries: CombatLogEntry[] = [
      {
        kind: 'info',
        message: 'Usa poção.',
        actor: 'Aldo',
        itemId: 'some_potion',
      },
    ];
    const r = resolveCombatLogFx(entries, [knight], data);
    expect(r.columnPulse).toBe('heal_potion');
    expect(r.potionParticles).toBeNull();
  });

  it('classifies potion particles for HP mana stress from itemId', () => {
    expect(
      resolveCombatLogFx(
        [{ kind: 'info', message: 'x', actor: 'Aldo', itemId: 'potion_hp' }],
        [knight],
        data
      ).potionParticles
    ).toBe('hp');
    expect(
      resolveCombatLogFx(
        [{ kind: 'info', message: 'x', actor: 'Aldo', itemId: 'potion_mana' }],
        [knight],
        data
      ).potionParticles
    ).toBe('mana');
    expect(
      resolveCombatLogFx(
        [{ kind: 'info', message: 'x', actor: 'Aldo', itemId: 'potion_stress' }],
        [knight],
        data
      ).potionParticles
    ).toBe('stress');
  });

  it('sets potion particles from heal entry with itemId', () => {
    const entries: CombatLogEntry[] = [
      {
        kind: 'heal',
        message: 'Cura.',
        actor: 'Aldo',
        target: 'Aldo',
        itemId: 'potion_hp',
        final: 3,
      },
    ];
    const r = resolveCombatLogFx(entries, [knight], data);
    expect(r.columnPulse).toBe('heal_potion');
    expect(r.potionParticles).toBe('hp');
  });

  it('sets buff column pulse from info with buff spellId', () => {
    const entries: CombatLogEntry[] = [
      {
        kind: 'info',
        message: 'Buff.',
        spellId: 'warriors_focus',
      },
    ];
    const r = resolveCombatLogFx(entries, [knight], data);
    expect(r.columnPulse).toBe('buff');
  });
});

describe('logSliceHasBuffCast', () => {
  const data = minimalData();

  it('is true when slice has info with buff spellId', () => {
    const entries: CombatLogEntry[] = [
      { kind: 'info', message: 'Foco.', spellId: 'warriors_focus' },
    ];
    expect(logSliceHasBuffCast(entries, data)).toBe(true);
  });

  it('is false for non-buff spell info', () => {
    const entries: CombatLogEntry[] = [
      { kind: 'info', message: 'Magia.', spellId: 'ember_spark' },
    ];
    expect(logSliceHasBuffCast(entries, data)).toBe(false);
  });

  it('is false for empty slice', () => {
    expect(logSliceHasBuffCast([], data)).toBe(false);
  });

  it('flags warriors_focus for martial buff sound routing', () => {
    const entries: CombatLogEntry[] = [
      { kind: 'info', message: 'Foco.', spellId: 'warriors_focus' },
    ];
    expect(entries.some((e) => isBuffInfoEntry(e, data) && e.spellId === 'warriors_focus')).toBe(
      true
    );
  });
});

describe('extractLethalGhosts', () => {
  const data = minimalData();
  const gob: EnemyDef = {
    id: 'gob',
    name: 'Goblin',
    hp: 10,
    maxHp: 10,
    str: 8,
    agi: 8,
    mind: 4,
    armor: 0,
    type: 'normal',
    armorChips: 0,
    sprite: 'G\nO\nB',
    attackStrategy: 'random',
  };
  data.enemies = { gob };

  it('returns ghost info for lethal damage with enemy index', () => {
    const c = combatStub({
      enemies: [{ defId: 'gob', hp: 0, maxHp: 10, armorChipsRemaining: 0, stress: 0 }],
    });
    const entries: CombatLogEntry[] = [
      {
        kind: 'damage',
        message: 'Morte.',
        target: 'Goblin',
        enemyIndex: 0,
        lethal: true,
        final: 10,
        damageKind: 'normal',
      },
    ];
    const ghosts = extractLethalGhosts(entries, c, data);
    expect(ghosts).toHaveLength(1);
    expect(ghosts[0]!.name).toBe('Goblin');
    expect(ghosts[0]!.sprite).toContain('G');
  });
});

import type { SpellDef } from '../../../engine/schema';

export const spells: Record<string, SpellDef> = {
  arcane_bolt: {
    id: 'arcane_bolt',
    name: 'Projétil Arcano',
    manaCost: 2,
    minLevel: 1,
    classId: 'mage',
    spellKind: 'damage',
    dice: 2,
  },
  ember_spark: {
    id: 'ember_spark',
    name: 'Centelha',
    manaCost: 1,
    minLevel: 1,
    classId: 'mage',
    spellKind: 'damage',
    dice: 1,
  },
  lesser_heal: {
    id: 'lesser_heal',
    name: 'Cura Menor',
    manaCost: 2,
    minLevel: 1,
    classId: 'cleric',
    spellKind: 'heal_self',
    dice: 2,
  },
};

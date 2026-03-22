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
  /** Nível 2 — desbloqueio automático ao subir de nível (clérigo). */
  merciful_light: {
    id: 'merciful_light',
    name: 'Luz Misericordiosa',
    manaCost: 2,
    minLevel: 2,
    classId: 'cleric',
    spellKind: 'heal_self',
    dice: 2,
  },
  /** Nível 2 — desbloqueio automático ao subir de nível (mago). */
  silver_bolt: {
    id: 'silver_bolt',
    name: 'Raio de Prata',
    manaCost: 3,
    minLevel: 2,
    classId: 'mage',
    spellKind: 'damage',
    dice: 3,
  },
  /** Só narrativa — Mago das trevas. */
  whisper_cache: {
    id: 'whisper_cache',
    name: 'Sussurro da Cache',
    manaCost: 2,
    minLevel: 1,
    classId: 'mage',
    learnOnly: true,
    spellKind: 'damage',
    dice: 2,
  },
  /** Só narrativa — Clérigo penitente. */
  pilgrims_benediction: {
    id: 'pilgrims_benediction',
    name: 'Benção do Peregrino',
    manaCost: 2,
    minLevel: 1,
    classId: 'cleric',
    learnOnly: true,
    spellKind: 'heal_self',
    dice: 2,
  },
};

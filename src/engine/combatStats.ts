import { effectiveLeadAttr } from './leadStats.ts';
import type { Character, GameState } from './schema.ts';
import type { GameData } from './gameData.ts';

export function statMod(attr: number): number {
  return Math.floor((attr - 6) / 2);
}

export function getWeaponDamage(data: GameData, c: Character): number {
  let bonus = 0;
  if (c.weaponId && data.items[c.weaponId]) {
    bonus += data.items[c.weaponId]!.damage;
  }
  return bonus;
}

export function getArmorValue(data: GameData, c: Character): number {
  let a = 0;
  if (c.armorId && data.items[c.armorId]) a += data.items[c.armorId]!.armor;
  if (c.relicId && data.items[c.relicId]) a += data.items[c.relicId]!.armor;
  return a;
}

/** Soma bônus de STR/AGI/MEN/SOR e valores de armadura/dano dos três slots equipados. */
export function sumEquippedItemBonuses(data: GameData, c: Character): {
  str: number;
  agi: number;
  mind: number;
  luck: number;
  armor: number;
  damage: number;
} {
  let str = 0;
  let agi = 0;
  let mind = 0;
  let luck = 0;
  let armor = 0;
  let damage = 0;
  for (const slot of [c.weaponId, c.armorId, c.relicId] as const) {
    if (slot && data.items[slot]) {
      const it = data.items[slot]!;
      str += it.bonusStr ?? 0;
      agi += it.bonusAgi ?? 0;
      mind += it.bonusMind ?? 0;
      luck += it.bonusLuck ?? 0;
      armor += it.armor ?? 0;
      damage += it.damage ?? 0;
    }
  }
  return { str, agi, mind, luck, armor, damage };
}

/** Pontos de armadura vindos só de itens (CA parcial). */
export function getEquippedArmorPoints(data: GameData, c: Character): number {
  return getArmorValue(data, c);
}

/** CA base (ataques inimigos: 7 + mod AGI + bónus de armadura; postura defensiva +2 em combate). */
export function getCharacterArmorClass(data: GameData, c: Character, state?: GameState): number {
  const agi = state ? effectiveLeadAttr(state, c, 'agi') : c.agi;
  return 7 + statMod(agi) + getArmorValue(data, c);
}

export function getTotalMind(data: GameData, c: Character, state?: GameState): number {
  let mind = state ? effectiveLeadAttr(state, c, 'mind') : c.mind;
  for (const slot of [c.weaponId, c.armorId, c.relicId] as const) {
    if (slot && data.items[slot]) {
      mind += data.items[slot]!.bonusMind;
    }
  }
  return mind;
}

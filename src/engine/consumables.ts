import type { Character, ItemDef } from './schema.ts';

export function isConsumable(def: ItemDef | undefined): def is ItemDef & { slot: 'consumable' } {
  return def?.slot === 'consumable';
}

/** Remove uma unidade do inventário; devolve null se não houver. */
export function removeOneInventoryItem(inventory: string[], itemId: string): string[] | null {
  const idx = inventory.indexOf(itemId);
  if (idx < 0) return null;
  return [...inventory.slice(0, idx), ...inventory.slice(idx + 1)];
}

export function applyConsumableToCharacter(def: ItemDef, target: Character): Character {
  if (!isConsumable(def)) return target;
  let t = { ...target };
  if (def.restoreHp && def.restoreHp > 0) {
    t.hp = Math.min(t.maxHp, t.hp + def.restoreHp);
  }
  if (def.restoreMana && def.restoreMana > 0 && t.maxMana > 0) {
    t.mana = Math.min(t.maxMana, t.mana + def.restoreMana);
  }
  if (def.stressRelief && def.stressRelief > 0) {
    t.stress = Math.max(0, t.stress - def.stressRelief);
  }
  return t;
}

import type { ItemDef } from '../engine/schema.ts';

export function formatItemEquipmentStatParts(it: ItemDef): string[] {
  const parts: string[] = [];
  if (it.damage !== 0) {
    parts.push(it.damage > 0 ? `Dano +${it.damage}` : `Dano ${it.damage}`);
  }
  if (it.armor !== 0) {
    parts.push(it.armor > 0 ? `Armadura +${it.armor}` : `Armadura ${it.armor}`);
  }
  const attrs: [keyof ItemDef, string][] = [
    ['bonusStr', 'STR'],
    ['bonusAgi', 'AGI'],
    ['bonusMind', 'MEN'],
    ['bonusLuck', 'SOR'],
  ];
  for (const [key, label] of attrs) {
    const v = it[key];
    if (typeof v !== 'number' || v === 0) continue;
    parts.push(`${label} ${v > 0 ? '+' : ''}${v}`);
  }
  if (it.cursed) parts.push('Amaldiçoado');
  return parts;
}

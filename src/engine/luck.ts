import type { Character, GameState } from './schema.ts';
import type { GameData } from './gameData.ts';
import { effectiveLeadAttr } from './leadStats.ts';

/** Sorte base (+ buffs temporários) + bônus de itens equipados */
export function getEffectiveLuck(c: Character, data: GameData, state?: GameState): number {
  let sum = state ? effectiveLeadAttr(state, c, 'luck') : c.luck;
  for (const slot of [c.weaponId, c.armorId, c.relicId] as const) {
    if (slot && data.items[slot]) {
      sum += data.items[slot]!.bonusLuck ?? 0;
    }
  }
  return sum;
}

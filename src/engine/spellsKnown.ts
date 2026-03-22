import type { Character, GameState, SpellDef } from './schema';
import type { GameData } from './gameData';

export function spellMatchesHeroClass(spell: SpellDef, lead: Character): boolean {
  return spell.classId === 'any' || spell.classId === lead.class;
}

/** Magias iniciais ao criar o herói (nível 1, classe adequada, não learnOnly). */
export function initialKnownSpellIds(lead: Character, data: GameData): string[] {
  const ids: string[] = [];
  for (const [id, sp] of Object.entries(data.spells)) {
    if (sp.learnOnly) continue;
    if (sp.minLevel > 1) continue;
    if (!spellMatchesHeroClass(sp, lead)) continue;
    ids.push(id);
  }
  return ids;
}

/** Ao subir para `newLevel`, desbloqueia magias com minLevel === newLevel. */
export function unlockSpellsForNewLevel(
  state: GameState,
  newLevel: number,
  data: GameData
): GameState {
  const lead = state.party[0];
  if (!lead) return state;
  const known = new Set(state.knownSpells);
  for (const [id, sp] of Object.entries(data.spells)) {
    if (sp.learnOnly) continue;
    if (sp.minLevel !== newLevel) continue;
    if (!spellMatchesHeroClass(sp, lead)) continue;
    known.add(id);
  }
  return { ...state, knownSpells: [...known] };
}

/**
 * Saves antigos sem `knownSpells`: assume o comportamento legado
 * (todas as magias elegíveis até ao nível actual).
 */
export function migrateLegacyKnownSpells(state: GameState, data: GameData): GameState {
  if (state.knownSpells.length > 0) return state;
  const lead = state.party[0];
  if (!lead) return { ...state, knownSpells: [] };
  const ids: string[] = [];
  for (const [id, sp] of Object.entries(data.spells)) {
    if (sp.learnOnly) continue;
    if (sp.minLevel > state.level) continue;
    if (!spellMatchesHeroClass(sp, lead)) continue;
    ids.push(id);
  }
  return { ...state, knownSpells: ids };
}

import type { ClassId, GameState } from '../../engine/schema/index.ts';
import type { PathUnlockBonus } from '../../engine/data/index.ts';

const CLASS_LABEL: Record<ClassId, string> = {
  knight: 'Cavaleiro',
  mage: 'Mago',
  cleric: 'Clérigo',
};

const DEFAULT_NAME: Record<ClassId, string> = {
  knight: 'Demo Knight',
  mage: 'Demo Mage',
  cleric: 'Demo Cleric',
};

const LORE: Record<ClassId, string> = {
  knight: 'Personagem de demonstração.',
  mage: 'Personagem de demonstração.',
  cleric: 'Personagem de demonstração.',
};

export const DEFAULT_HERO_NAME = DEFAULT_NAME;

export function getHeroClassLabel(classId: ClassId, _path: string | null | undefined): string {
  return CLASS_LABEL[classId];
}

export function getHeroLore(_state: GameState, classId: ClassId, _path: string | null | undefined): string {
  return LORE[classId];
}

export function getHeroStoryProgress(
  _state: GameState,
  _classId: ClassId,
  _path: string | null | undefined
): { unlocked: number; total: number } {
  return { unlocked: 1, total: 1 };
}

export function getPathUnlockBonus(_classId: ClassId, _path: string | null | undefined): PathUnlockBonus | null {
  return null;
}

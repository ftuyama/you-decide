import type { ClassId } from '../../engine/schema/index.ts';
import type { PathUnlockBonus } from '../../engine/data/gameData.ts';

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

export function getHeroLore(classId: ClassId, _path: string | null | undefined): string {
  return LORE[classId];
}

export function getPathUnlockBonus(_classId: ClassId, _path: string | null | undefined): PathUnlockBonus | null {
  return null;
}

import type { ClassId } from '../../engine/schema/index.ts';
import type { HeroNarrative } from '../../engine/data/gameData.ts';
import { DEFAULT_HERO_NAME, getHeroClassLabel, getPathUnlockBonus } from './classHero.ts';

export const demoHeroNarrative: HeroNarrative = {
  defaultHeroName(cls: ClassId): string {
    return DEFAULT_HERO_NAME[cls];
  },
  getHeroClassLabel,
  getPathUnlockBonus,
};

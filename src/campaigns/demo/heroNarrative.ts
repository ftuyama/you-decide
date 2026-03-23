import type { ClassId } from '../../engine/schema';
import type { HeroNarrative } from '../../engine/gameData';
import { DEFAULT_HERO_NAME, getHeroClassLabel } from './classHero';

export const demoHeroNarrative: HeroNarrative = {
  defaultHeroName(cls: ClassId): string {
    return DEFAULT_HERO_NAME[cls];
  },
  getHeroClassLabel,
};

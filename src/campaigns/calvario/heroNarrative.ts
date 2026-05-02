import type { ClassId } from '../../engine/schema/index.ts';
import type { HeroNarrative } from '../../engine/data/index.ts';
import {
  DEFAULT_HERO_NAME,
  getHeroClassLabel,
  getPathPromotionNarrativePt,
  getPathUnlockBonus,
} from './classHero.ts';

export const calvarioHeroNarrative: HeroNarrative = {
  defaultHeroName(cls: ClassId): string {
    return DEFAULT_HERO_NAME[cls];
  },
  getHeroClassLabel,
  getPathUnlockBonus,
  getPathPromotionNarrativePt,
};

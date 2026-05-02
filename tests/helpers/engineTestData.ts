import { createInitialState, createPlayerCharacter } from '../../src/engine/core/index.ts';
import { emptyGameData } from '../../src/engine/data/index.ts';
import type { CampaignIndex, GameState, HeroClass } from '../../src/engine/schema/index.ts';

export const testCampaign: CampaignIndex = {
  id: 'test',
  name: 'Test',
  entryScene: 'act1/title',
  startingCompanionPool: [],
  scenes: [],
};

export function createTestData() {
  return emptyGameData(testCampaign, {
    defaultHeroName: () => 'H',
    getHeroClassLabel: () => '—',
    getPathUnlockBonus: () => null,
    getPathPromotionNarrativePt: () => null,
  });
}

export function createStateWithHero(opts?: {
  level?: number;
  seed?: number;
  heroClass?: HeroClass;
  heroName?: string;
}): GameState {
  const level = opts?.level ?? 1;
  const seed = opts?.seed ?? 1;
  const heroClass = opts?.heroClass ?? 'knight';
  const heroName = opts?.heroName ?? 'H';
  let s = createInitialState(testCampaign, seed);
  s = { ...s, party: [createPlayerCharacter(heroName, heroClass)], level };
  return s;
}

import type {
  CampaignIndex,
  ClassId,
  CompanionDef,
  EnemyDef,
  Encounter,
  ItemDef,
  SpellDef,
} from './schema';

/** Bónus aplicados uma vez ao ganhar um arquétipo narrativo (`setPath` com path não nulo). */
export type PathUnlockBonus = {
  stats?: Partial<Record<'str' | 'agi' | 'mind' | 'luck', number>>;
  addXp?: number;
  addResource?: { resource: 'faith' | 'corruption' | 'gold' | 'supply'; delta: number };
};

/** Campaign-specific hero names and class labels for effects (no engine imports of campaigns). */
export type HeroNarrative = {
  defaultHeroName(classId: ClassId): string;
  getHeroClassLabel(classId: ClassId, path: string | null | undefined): string;
  getPathUnlockBonus(classId: ClassId, path: string | null | undefined): PathUnlockBonus | null;
};

export type GameData = {
  campaign: CampaignIndex;
  heroNarrative: HeroNarrative;
  enemies: Record<string, EnemyDef>;
  encounters: Record<string, Encounter>;
  items: Record<string, ItemDef>;
  companions: Record<string, CompanionDef>;
  spells: Record<string, SpellDef>;
};

export function emptyGameData(campaign: CampaignIndex, heroNarrative: HeroNarrative): GameData {
  return {
    campaign,
    heroNarrative,
    enemies: {},
    encounters: {},
    items: {},
    companions: {},
    spells: {},
  };
}

import type {
  CampaignIndex,
  CompanionDef,
  EnemyDef,
  Encounter,
  ItemDef,
  SpellDef,
} from './schema';

export type GameData = {
  campaign: CampaignIndex;
  enemies: Record<string, EnemyDef>;
  encounters: Record<string, Encounter>;
  items: Record<string, ItemDef>;
  companions: Record<string, CompanionDef>;
  spells: Record<string, SpellDef>;
};

export function emptyGameData(campaign: CampaignIndex): GameData {
  return {
    campaign,
    enemies: {},
    encounters: {},
    items: {},
    companions: {},
    spells: {},
  };
}

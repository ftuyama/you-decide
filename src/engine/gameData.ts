import type {
  CampaignIndex,
  CompanionDef,
  EnemyDef,
  Encounter,
  ItemDef,
} from './schema';

export type GameData = {
  campaign: CampaignIndex;
  enemies: Record<string, EnemyDef>;
  encounters: Record<string, Encounter>;
  items: Record<string, ItemDef>;
  companions: Record<string, CompanionDef>;
};

export function emptyGameData(campaign: CampaignIndex): GameData {
  return {
    campaign,
    enemies: {},
    encounters: {},
    items: {},
    companions: {},
  };
}

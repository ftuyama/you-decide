import {
  CampaignIndexSchema,
  type CompanionDef,
  type EnemyDef,
  type Encounter,
  type ItemDef,
  type SpellDef,
} from '../../engine/schema.ts';
import { emptyGameData } from '../../engine/gameData.ts';
import type { CampaignUIAdapter } from '../campaignUi.ts';
import campaignIndex from './index.json';
import { enemies as enemiesTs } from './data/enemies.ts';
import { items as itemsTs } from './data/items.ts';
import encounters from './data/encounters.json';
import companions from './data/companions.json';
import { spells as spellsTs } from './data/spells.ts';
import { journeyMarks as journeyMarksTs } from './data/journeyMarks.ts';
import { leadStoryPassives as leadStoryPassivesTs, passives as passivesTs } from './data/passives.ts';
import { calvarioHeroNarrative } from './heroNarrative.ts';
import { renderMap } from './maps.ts';
import { SCENE_ART } from './ascii/art.ts';
import { getHeroClassLabel, getHeroLore } from './classHero.ts';
import { EXPLORATION_GRAPHS } from './exploration/graphs.ts';

const sceneRaw = import.meta.glob<string>('./scenes/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export const calvarioUI: CampaignUIAdapter = {
  renderMap,
  sceneArt: SCENE_ART,
  getHeroClassLabel,
  getHeroLore,
  getExplorationGraph: (id: string) => EXPLORATION_GRAPHS[id] ?? null,
};

export function loadCalvarioContent() {
  const idx = CampaignIndexSchema.parse(campaignIndex);
  const data = emptyGameData(idx, calvarioHeroNarrative);
  data.enemies = enemiesTs as Record<string, EnemyDef>;
  data.encounters = encounters as Record<string, Encounter>;
  data.items = itemsTs as Record<string, ItemDef>;
  data.companions = companions as Record<string, CompanionDef>;
  data.spells = spellsTs as Record<string, SpellDef>;
  data.passives = passivesTs;
  data.journeyMarks = { ...journeyMarksTs };
  data.leadStoryPassives = { ...leadStoryPassivesTs };
  return { data, sceneFiles: sceneRaw, ui: calvarioUI };
}

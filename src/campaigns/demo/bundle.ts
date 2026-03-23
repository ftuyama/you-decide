import {
  CampaignIndexSchema,
  type CompanionDef,
  type EnemyDef,
  type Encounter,
  type ItemDef,
  type SpellDef,
} from '../../engine/schema';
import { emptyGameData } from '../../engine/gameData';
import type { CampaignUIAdapter } from '../campaignUi';
import campaignIndex from './index.json';
import { enemies as enemiesTs } from './data/enemies';
import { items as itemsTs } from './data/items';
import encounters from './data/encounters.json';
import companions from './data/companions.json';
import { spells as spellsTs } from './data/spells';
import { demoHeroNarrative } from './heroNarrative';
import { canWalk, renderMap } from './maps';
import { SCENE_ART } from './ascii/art';
import { getHeroClassLabel, getHeroLore } from './classHero';

const sceneRaw = import.meta.glob<string>('./scenes/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export const demoUI: CampaignUIAdapter = {
  canWalk,
  renderMap,
  sceneArt: SCENE_ART,
  getHeroClassLabel,
  getHeroLore,
};

export function loadDemoContent() {
  const idx = CampaignIndexSchema.parse(campaignIndex);
  const data = emptyGameData(idx, demoHeroNarrative);
  data.enemies = enemiesTs as Record<string, EnemyDef>;
  data.encounters = encounters as Record<string, Encounter>;
  data.items = itemsTs as Record<string, ItemDef>;
  data.companions = companions as Record<string, CompanionDef>;
  data.spells = spellsTs as Record<string, SpellDef>;
  return { data, sceneFiles: sceneRaw, ui: demoUI };
}

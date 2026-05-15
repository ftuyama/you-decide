import {
  CampaignIndexSchema,
  EncounterSchema,
  type CompanionDef,
  type DialogueEnemyDef,
  type EnemyDef,
  type Encounter,
  type ItemDef,
  type SpellDef,
} from '../../engine/schema/index.ts';
import { DialogueEnemyDefSchema } from '../../engine/schema/dialogueCombat.ts';
import { emptyGameData } from '../../engine/data/index.ts';
import { validateExplorationGraphCatalog } from '../../engine/world/index.ts';
import type { CampaignUIAdapter } from '../campaignUi.ts';
import campaignIndex from './index.json';
import { enemies as enemiesTs } from './data/enemies.ts';
import { dialogueEnemies as dialogueEnemiesTs } from './data/dialogueEnemies/index.ts';
import { items as itemsTs } from './data/items.ts';
import encounters from './data/encounters.json';
import companions from './data/companions.json';
import { spells as spellsTs } from './data/spells.ts';
import { journeyMarks as journeyMarksTs } from './data/journeyMarks.ts';
import { leadStoryPassives as leadStoryPassivesTs, passives as passivesTs } from './data/passives.ts';
import { calvarioHeroNarrative } from './heroNarrative.ts';
import { renderMap } from './maps.ts';
import { SCENE_ART } from './ascii/art.ts';
import { getHeroClassLabel, getHeroLore, getHeroStoryProgress } from './classHero.ts';
import { getCompanionLore, getCompanionStoryProgress } from './classCompanion.ts';
import { EXPLORATION_GRAPHS } from './exploration/graphs.ts';

validateExplorationGraphCatalog(EXPLORATION_GRAPHS);

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
  getHeroStoryProgress,
  getCompanionLore,
  getCompanionStoryProgress,
  getExplorationGraph: (id: string) => EXPLORATION_GRAPHS[id] ?? null,
};

export function loadCalvarioContent() {
  const idx = CampaignIndexSchema.parse(campaignIndex);
  const data = emptyGameData(idx, calvarioHeroNarrative);
  data.enemies = enemiesTs as Record<string, EnemyDef>;
  for (const def of Object.values(dialogueEnemiesTs)) {
    DialogueEnemyDefSchema.parse(def);
  }
  data.dialogueEnemies = dialogueEnemiesTs as Record<string, DialogueEnemyDef>;
  const encRecord = encounters as unknown as Record<string, Encounter>;
  for (const enc of Object.values(encRecord)) {
    EncounterSchema.parse(enc);
    if (
      enc.combatType === 'battle' &&
      (enc.twists?.length ?? 0) > 0 &&
      !enc.isBoss
    ) {
      throw new Error(`[calvario] Encounter "${enc.id}" has twists but isBoss is not true`);
    }
  }
  data.encounters = encRecord;
  data.items = itemsTs as Record<string, ItemDef>;
  data.companions = companions as Record<string, CompanionDef>;
  data.spells = spellsTs as Record<string, SpellDef>;
  data.passives = passivesTs;
  data.journeyMarks = { ...journeyMarksTs };
  data.leadStoryPassives = { ...leadStoryPassivesTs };
  return { data, sceneFiles: sceneRaw, ui: calvarioUI };
}

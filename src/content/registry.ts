import { CampaignIndexSchema, type CampaignIndex } from '../engine/schema';
import { parseSceneMarkdown, type LoadedScene } from '../engine/sceneRuntime';
import type { EnemyDef, Encounter, ItemDef, CompanionDef } from '../engine/schema';
import type { GameData } from '../engine/gameData';
import { emptyGameData } from '../engine/gameData';

import campaignIndex from '../campaigns/calvario/index.json';
import { enemies as enemiesTs } from '../campaigns/calvario/data/enemies';
import { items as itemsTs } from '../campaigns/calvario/data/items';
import encounters from '../campaigns/calvario/data/encounters.json';
import companions from '../campaigns/calvario/data/companions.json';

const sceneRaw = import.meta.glob<string>('../campaigns/calvario/scenes/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export class ContentRegistry {
  readonly data: GameData;
  private scenes = new Map<string, LoadedScene>();

  constructor() {
    const idx = CampaignIndexSchema.parse(campaignIndex);
    this.data = emptyGameData(idx);
    this.data.enemies = enemiesTs as Record<string, EnemyDef>;
    this.data.encounters = encounters as Record<string, Encounter>;
    this.data.items = itemsTs as Record<string, ItemDef>;
    this.data.companions = companions as Record<string, CompanionDef>;

    for (const [path, raw] of Object.entries(sceneRaw)) {
      const id = pathToSceneId(path);
      try {
        const scene = parseSceneMarkdown(raw, id);
        if (scene.id !== id) {
          console.warn(`ID de cena diverge do caminho: ${id} vs ${scene.id}`);
        }
        this.scenes.set(scene.id, scene);
      } catch (e) {
        console.error(`Falha ao carregar cena ${path}`, e);
        throw e;
      }
    }
  }

  getScene(id: string): LoadedScene | undefined {
    return this.scenes.get(id);
  }

}

function pathToSceneId(path: string): string {
  const base = path.replace(/^.*\/scenes\//, '').replace(/\.md$/, '');
  return base;
}

export function getCampaignIndex(): CampaignIndex {
  return CampaignIndexSchema.parse(campaignIndex);
}

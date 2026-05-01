/** Cenas parseadas e `GameData`; os loaders de campanha estão em `src/campaigns/registry.ts`. */
import { parseSceneMarkdown, type LoadedScene } from '../engine/core/sceneRuntime.ts';
import type { GameData } from '../engine/data/gameData.ts';
import { loadCampaignContent } from '../campaigns/registry.ts';
import type { CampaignUIAdapter } from '../campaigns/campaignUi.ts';

export class ContentRegistry {
  readonly data: GameData;
  readonly ui: CampaignUIAdapter;
  private scenes = new Map<string, LoadedScene>();

  constructor(campaignId: string) {
    const { data, sceneFiles, ui } = loadCampaignContent(campaignId);
    this.data = data;
    this.ui = ui;

    for (const [path, raw] of Object.entries(sceneFiles)) {
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

/**
 * Central registry of playable campaigns. Each campaign folder provides a loader that returns
 * GameData, raw scene files (for parsing), and a CampaignUIAdapter. Add a new campaign by
 * implementing bundle.ts + index.json under src/campaigns/<id>/ and registering the loader below.
 *
 * Cenas já parseadas: `src/content/registry.ts` (ContentRegistry).
 */
import type { CampaignUIAdapter } from './campaignUi.ts';
import { parseSceneMarkdown, type LoadedScene } from '../engine/core/index.ts';
import type { GameData } from '../engine/data/index.ts';
import { loadCalvarioContent } from './calvario/bundle.ts';
import { loadDemoContent } from './demo/bundle.ts';

export type CampaignContentBundle = {
  data: GameData;
  /** Path → raw markdown (Vite glob) */
  sceneFiles: Record<string, string>;
  ui: CampaignUIAdapter;
};

export type CampaignLoader = () => CampaignContentBundle;

export type ParsedCampaignContentBundle = {
  data: GameData;
  ui: CampaignUIAdapter;
  scenes: Map<string, LoadedScene>;
};

const LOADERS: Record<string, CampaignLoader> = {
  calvario: loadCalvarioContent,
  demo: loadDemoContent,
};

export function getRegisteredCampaignIds(): string[] {
  return Object.keys(LOADERS);
}

export function isCampaignRegistered(id: string): boolean {
  return id in LOADERS;
}

export function loadCampaignContent(campaignId: string): CampaignContentBundle {
  const load = LOADERS[campaignId];
  if (!load) {
    throw new Error(`Unknown campaign: "${campaignId}". Registered: ${getRegisteredCampaignIds().join(', ')}`);
  }
  return load();
}

/**
 * Pipeline único de conteúdo:
 * 1) load bundle bruto -> 2) parse markdown -> 3) validar ids -> 4) disponibilizar mapa de cenas.
 */
export function loadParsedCampaignContent(campaignId: string): ParsedCampaignContentBundle {
  const { data, sceneFiles, ui } = loadCampaignContent(campaignId);
  const scenes = new Map<string, LoadedScene>();
  for (const [path, raw] of Object.entries(sceneFiles)) {
    const id = pathToSceneId(path);
    try {
      const scene = parseSceneMarkdown(raw, id);
      if (scene.id !== id) {
        console.warn(`ID de cena diverge do caminho: ${id} vs ${scene.id}`);
      }
      scenes.set(scene.id, scene);
    } catch (e) {
      console.error(`Falha ao carregar cena ${path}`, e);
      throw e;
    }
  }
  return { data, ui, scenes };
}

function pathToSceneId(path: string): string {
  return path.replace(/^.*\/scenes\//, '').replace(/\.md$/, '');
}

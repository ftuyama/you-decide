/**
 * Central registry of playable campaigns. Each campaign folder provides a loader that returns
 * GameData, raw scene files (for parsing), and a CampaignUIAdapter. Add a new campaign by
 * implementing bundle.ts + index.json under src/campaigns/<id>/ and registering the loader below.
 *
 * Cenas já parseadas: `src/content/registry.ts` (ContentRegistry).
 */
import type { CampaignUIAdapter } from './campaignUi.ts';
import type { GameData } from '../engine/gameData.ts';
import { loadCalvarioContent } from './calvario/bundle.ts';
import { loadDemoContent } from './demo/bundle.ts';

export type CampaignContentBundle = {
  data: GameData;
  /** Path → raw markdown (Vite glob) */
  sceneFiles: Record<string, string>;
  ui: CampaignUIAdapter;
};

export type CampaignLoader = () => CampaignContentBundle;

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

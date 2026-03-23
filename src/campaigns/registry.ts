/**
 * Central registry of playable campaigns. Each campaign folder provides a loader that returns
 * GameData, raw scene files (for parsing), and a CampaignUIAdapter. Add a new campaign by
 * implementing bundle.ts + index.json under src/campaigns/<id>/ and registering the loader below.
 */
import type { CampaignUIAdapter } from './campaignUi';
import type { GameData } from '../engine/gameData';
import { loadCalvarioContent } from './calvario/bundle';
import { loadDemoContent } from './demo/bundle';

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

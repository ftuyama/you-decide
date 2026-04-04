import type { ClassId } from '../engine/schema.ts';

/** Maps, ASCII art, and hero copy used only by the UI layer for a campaign. */
export type CampaignUIAdapter = {
  renderMap: (
    mapId: string
  ) => { lines: string[]; width: number; height: number } | null;
  sceneArt: Record<string, string>;
  getHeroClassLabel: (classId: ClassId, path: string | null | undefined) => string;
  getHeroLore: (classId: ClassId, path: string | null | undefined) => string;
};

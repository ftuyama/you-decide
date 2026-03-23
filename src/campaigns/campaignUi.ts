import type { ClassId } from '../engine/schema';

/** Maps, ASCII art, and hero copy used only by the UI layer for a campaign. */
export type CampaignUIAdapter = {
  canWalk: (
    mapId: string,
    x: number,
    y: number,
    nx: number,
    ny: number
  ) => boolean;
  renderMap: (
    mapId: string,
    px: number,
    py: number
  ) => { lines: string[]; width: number; height: number } | null;
  sceneArt: Record<string, string>;
  getHeroClassLabel: (classId: ClassId, path: string | null | undefined) => string;
  getHeroLore: (classId: ClassId, path: string | null | undefined) => string;
};

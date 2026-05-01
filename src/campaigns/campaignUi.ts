import type { ClassId } from '../engine/schema.ts';
import type { ExplorationGraph } from '../engine/exploration.ts';

/** Maps, ASCII art, and hero copy used only by the UI layer for a campaign. */
export type CampaignUIAdapter = {
  renderMap: (
    mapId: string,
    markerCell?: { x: number; y: number }
  ) => { lines: string[]; width: number; height: number } | null;
  sceneArt: Record<string, string>;
  getHeroClassLabel: (classId: ClassId, path: string | null | undefined) => string;
  getHeroLore: (classId: ClassId, path: string | null | undefined) => string;
  /** Grafo de exploração por id (ex.: act2_catacomb); omitido se a campanha não usar. */
  getExplorationGraph?: (graphId: string) => ExplorationGraph | null;
};

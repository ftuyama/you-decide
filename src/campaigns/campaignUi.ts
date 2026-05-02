import type { ClassId, GameState } from '../engine/schema/index.ts';
import type { ExplorationGraphProvider } from '../engine/world/index.ts';

/** Maps, ASCII art, and hero copy used only by the UI layer for a campaign. */
export type CampaignUIAdapter = {
  renderMap: (
    mapId: string,
    markerCell?: { x: number; y: number },
    goalCell?: { x: number; y: number }
  ) => { lines: string[]; width: number; height: number } | null;
  sceneArt: Record<string, string>;
  getHeroClassLabel: (classId: ClassId, path: string | null | undefined) => string;
  getHeroLore: (state: GameState, classId: ClassId, path: string | null | undefined) => string;
  getHeroStoryProgress: (
    state: GameState,
    classId: ClassId,
    path: string | null | undefined
  ) => { unlocked: number; total: number };
  getCompanionLore: (state: GameState, companionId: string) => string;
  getCompanionStoryProgress: (
    state: GameState,
    companionId: string
  ) => { unlocked: number; total: number };
  /** Grafo de exploração por id (ex.: act2_catacomb); omitido se a campanha não usar. */
  getExplorationGraph?: ExplorationGraphProvider;
};

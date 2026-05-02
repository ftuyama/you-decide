import type { GameState } from '../../engine/schema/index.ts';

export function getCompanionLore(_state: GameState, _companionId: string): string {
  return '';
}

export function getCompanionStoryProgress(
  _state: GameState,
  _companionId: string
): { unlocked: number; total: number } {
  return { unlocked: 0, total: 0 };
}

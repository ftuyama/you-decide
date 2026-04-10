/** Shared callbacks for procedural audio modules (`GameAmbientPlayer`, `GameSfxPlayer`). */
export type GameAudioHost = {
  ensureContext(): AudioContext;
  gain(base: number): number;
  getAudioContext(): AudioContext | null;
};

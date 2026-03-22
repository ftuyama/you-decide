import type { FactionId, GameState } from './schema';

function repTier(f: FactionId, state: GameState): string {
  const v = state.reputation[f] ?? 0;
  if (v <= -2) return 'hostil';
  if (v === -1) return 'frio';
  if (v === 0) return 'neutro';
  if (v === 1) return 'cordial';
  if (v === 2) return 'aliado';
  return 'devoto';
}

export function injectText(text: string, state: GameState): string {
  const lead = state.party[0];
  return text
    .replace(/\{\{playerName\}\}/g, state.playerName)
    .replace(/\{\{leadName\}\}/g, lead?.name ?? '???')
    .replace(/\{\{chapter\}\}/g, String(state.chapter))
    .replace(/\{\{corruption\}\}/g, String(state.resources.corruption))
    .replace(/\{\{supply\}\}/g, String(state.resources.supply))
    .replace(/\{\{faith\}\}/g, String(state.resources.faith))
    .replace(/\{\{faction\.vigiliaTier\}\}/g, repTier('vigilia', state))
    .replace(/\{\{faction\.circuloTier\}\}/g, repTier('circulo', state))
    .replace(/\{\{faction\.cultoTier\}\}/g, repTier('culto', state));
}

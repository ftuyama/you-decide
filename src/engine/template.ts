import type { FactionId, GameState } from './schema.ts';
import { MAX_LEVEL, xpToNextLevel } from './progression.ts';

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
  const companions = state.party.slice(1);
  const companionLine =
    companions.length === 0
      ? ''
      : `${companions.map((c) => c.name).join(' e ')} ${companions.length > 1 ? 'trocam' : 'troca'} um olhar que não pede permissão à pedra.`;
  const lv = state.level;
  const xpNext = lv >= MAX_LEVEL ? 0 : xpToNextLevel(lv);
  return text
    .replace(/\{\{playerName\}\}/g, state.playerName)
    .replace(/\{\{leadName\}\}/g, lead?.name ?? '???')
    .replace(/\{\{chapter\}\}/g, String(state.chapter))
    .replace(/\{\{corruption\}\}/g, String(state.resources.corruption))
    .replace(/\{\{supply\}\}/g, String(state.resources.supply))
    .replace(/\{\{gold\}\}/g, String(state.resources.gold ?? 0))
    .replace(/\{\{faith\}\}/g, String(state.resources.faith))
    .replace(/\{\{level\}\}/g, String(state.level))
    .replace(/\{\{xp\}\}/g, String(state.xp))
    .replace(/\{\{xpToNext\}\}/g, String(xpNext))
    .replace(/\{\{faction\.vigiliaTier\}\}/g, repTier('vigilia', state))
    .replace(/\{\{faction\.circuloTier\}\}/g, repTier('circulo', state))
    .replace(/\{\{faction\.cultoTier\}\}/g, repTier('culto', state))
    .replace(/\{\{companionLine\}\}/g, companionLine)
    .replace(/\{\{companionCount\}\}/g, String(companions.length));
}

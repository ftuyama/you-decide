import type { GameEvent } from '../engine/core/index.ts';

/** Legenda do aviso quando o dia narrativo avança (varia com o tempo sob pedra). */
export function dayAdvanceSubtitle(day: number): string {
  if (day >= 30) return 'Até o número parece estranho na língua.';
  if (day >= 25) return 'Quem conta dias conta também medo.';
  if (day >= 20) return 'A pedra não distingue pressa de desespero.';
  if (day >= 15) return 'O subsolo não perdoa quem demora.';
  if (day >= 12) return 'O abismo não tem pressa — tu é que tens.';
  if (day >= 9) return 'Sem sol: só hábito e eco.';
  if (day >= 6) return 'Os túneis não esquecem quem passa.';
  if (day >= 4) return 'Cada viragem arrasta mais silêncio.';
  if (day >= 2) return 'Primeiras marcas na contagem — ainda sabes em voz alta.';
  return 'Passou tempo desde a última paragem.';
}

export type GameEventHandlers = {
  isStoryMode: boolean;
  onCombatVictory: () => void;
  onCombatDefeat: () => void;
  onFaithMiracle: () => void;
  onItemAcquired: (itemId: string) => void;
  onXpGained: (amount: number) => void;
  onDiaryEntryAdded: (text: string) => void;
  onCampRest: () => void;
  onTimeDayAdvanced: (day: number) => void;
  onStatusHighlight: (event: Extract<GameEvent, { type: 'statusHighlight' }>) => void;
  onLevelUp?: (level: number) => void;
};

export function handleGameEvent(ev: GameEvent, h: GameEventHandlers): void {
  if (ev.type === 'combat.end' && ev.victory) h.onCombatVictory();
  if (ev.type === 'combat.end' && !ev.victory) h.onCombatDefeat();
  if (ev.type === 'faith.miracle') h.onFaithMiracle();
  if (ev.type === 'item.acquired') h.onItemAcquired(ev.itemId);
  if (ev.type === 'xp.gained' && ev.amount > 0 && h.isStoryMode) h.onXpGained(ev.amount);
  if (ev.type === 'diary.entryAdded') h.onDiaryEntryAdded(ev.text);
  if (ev.type === 'camp.rest') h.onCampRest();
  if (ev.type === 'time.dayAdvanced') h.onTimeDayAdvanced(ev.day);
  if (ev.type === 'statusHighlight') h.onStatusHighlight(ev);
  if (ev.type === 'level.up') h.onLevelUp?.(ev.level);
}

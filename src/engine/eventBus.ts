export type GameEvent =
  | { type: 'scene.enter'; sceneId: string }
  | { type: 'reputation.changed'; faction: string; value: number }
  | { type: 'combat.start'; encounterId: string }
  | { type: 'combat.end'; victory: boolean }
  /** Combate terminou por milagre de fé: herói salvo, sem game over. */
  | { type: 'faith.miracle' }
  | { type: 'effect.applied'; op: string }
  | { type: 'xp.gained'; amount: number }
  | { type: 'level.up'; level: number }
  | { type: 'item.acquired'; itemId: string }
  | { type: 'camp.rest' }
  | {
      type: 'statusHighlight';
      variant: 'good' | 'bad' | 'neutral' | 'debuff';
      title: string;
      subtitle?: string;
    };

type Listener = (e: GameEvent) => void;

export class EventBus {
  private listeners: Listener[] = [];

  subscribe(fn: Listener): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  emit(e: GameEvent): void {
    for (const l of this.listeners) {
      try {
        l(e);
      } catch {
        /* noop */
      }
    }
  }
}

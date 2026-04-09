import type { FactionId } from './schema.ts';

/** Limita reputação de facção ao intervalo do jogo (−3..+3). */
export function clampReputation(n: number): number {
  return Math.max(-3, Math.min(3, n));
}

export type ComputeAddRepArgs = {
  prevRep: number;
  /** Progresso parcial de ganho lento (0 ou 1) para esta facção. */
  pending: 0 | 1;
  delta: number;
  /** Se true, ganhos positivos aplicam-se de imediato; ignoram `pending`. */
  directGain: boolean | undefined;
};

export type ComputeAddRepResult = {
  rep: number;
  /** Novo pendente para esta facção (sempre 0 após perda). */
  pending: 0 | 1;
};

/**
 * Calcula reputação e pendente após `addRep`.
 * Perdas (`delta < 0`) são imediatas e zeram o pendente.
 */
export function computeAddRepResult(a: ComputeAddRepArgs): ComputeAddRepResult {
  const { prevRep, delta, directGain } = a;
  let pending = a.pending;

  if (delta < 0) {
    let rep = prevRep;
    for (let i = 0; i < -delta; i++) {
      rep = clampReputation(rep - 1);
    }
    return { rep, pending: 0 };
  }

  if (delta > 0 && directGain === true) {
    return {
      rep: clampReputation(prevRep + delta),
      pending,
    };
  }

  let rep = prevRep;
  for (let i = 0; i < delta; i++) {
    if (pending === 0) {
      pending = 1;
    } else {
      rep = clampReputation(rep + 1);
      pending = 0;
    }
  }
  return { rep, pending };
}

/** Valor inicial seguro quando `factionGainPending` falta no estado. */
export const defaultFactionGainPending = (): Record<FactionId, 0 | 1> => ({
  vigilia: 0,
  circulo: 0,
  culto: 0,
});

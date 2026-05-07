import type { FactionId } from '../schema/index.ts';

/** Limite inferior/superior da reputação por facção (jogo). */
export const REPUTATION_MIN = -10;
export const REPUTATION_MAX = 10;
export const FACTION_IDS: readonly FactionId[] = ['vigilia', 'circulo', 'culto'] as const;

/** Reputação mínima para desbloquear bónus de facção (kits, rerrol, favores). */
export const FACTION_PERK_REP_THRESHOLD = 5;

/** Custo em reputação ao pedir rerrolagem de perícia ao Círculo (uma vez por descanso). */
export const CIRCULO_SKILL_REROLL_REP_COST = -4;

type ReputationTierRule = { max: number; tier: string };
const REPUTATION_TIER_RULES: readonly ReputationTierRule[] = [
  { max: -8, tier: 'hostil' },
  { max: -6, tier: 'renitente' },
  { max: -3, tier: 'desconfiado' },
  { max: -1, tier: 'frio' },
  { max: 0, tier: 'neutro' },
  { max: 1, tier: 'cordial' },
  { max: 3, tier: 'aliado' },
  { max: 6, tier: 'devoto' },
  { max: 8, tier: 'eminente' },
  { max: REPUTATION_MAX, tier: 'testemunha' },
] as const;

/** Limita reputação de facção ao intervalo do jogo. */
export function clampReputation(n: number): number {
  return Math.max(REPUTATION_MIN, Math.min(REPUTATION_MAX, n));
}

/** Tier textual usado por templates e UI para reputação de facção. */
export function reputationTier(value: number): string {
  const v = clampReputation(value);
  for (const r of REPUTATION_TIER_RULES) {
    if (v <= r.max) return r.tier;
  }
  return 'neutro';
}

/** Tier textual para uma facção específica no estado atual. */
export function factionRepTier(stateRep: Partial<Record<FactionId, number>>, faction: FactionId): string {
  return reputationTier(stateRep[faction] ?? 0);
}

/** Se a reputação atual já desbloqueia os bônus de facção. */
export function hasFactionPerkUnlocked(repValue: number): boolean {
  return repValue >= FACTION_PERK_REP_THRESHOLD;
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

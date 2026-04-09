import { describe, expect, it } from 'vitest';
import type { CombatLogEntry } from '../../src/engine/schema.ts';
import { parseCombatLogRounds, parseTurnBannerMessage } from '../../src/ui/gameAppUtils.ts';

describe('parseTurnBannerMessage', () => {
  it('reconhece sua vez e inimigos com travessão ou hífen', () => {
    expect(parseTurnBannerMessage('Rodada 2 — sua vez (postura e ataque)')).toEqual({
      round: 2,
      phase: 'player',
    });
    expect(parseTurnBannerMessage('Rodada 1 - inimigos')).toEqual({ round: 1, phase: 'enemy' });
  });
});

describe('parseCombatLogRounds', () => {
  it('agrupa abertura e une fases da mesma rodada', () => {
    const log: CombatLogEntry[] = [
      { kind: 'info', message: 'Goblin aparece.' },
      { kind: 'info', message: 'Ordem: A, B.' },
      { kind: 'turn_banner', message: 'Rodada 1 — sua vez (postura e ataque)' },
      { kind: 'stance', message: 'Postura agressiva.' },
      { kind: 'turn_banner', message: 'Rodada 1 — inimigos' },
      { kind: 'attack', message: 'Goblin erra.' },
      { kind: 'turn_banner', message: 'Rodada 2 — sua vez (postura e ataque)' },
      { kind: 'info', message: 'Vitória!' },
    ];
    const { preamble, rounds } = parseCombatLogRounds(log);
    expect(preamble.map((e) => e.message)).toEqual(['Goblin aparece.', 'Ordem: A, B.']);
    expect(rounds).toHaveLength(2);
    expect(rounds[0]!.round).toBe(1);
    expect(rounds[0]!.sections).toHaveLength(2);
    expect(rounds[0]!.sections[0]!.kind).toBe('player');
    expect(rounds[0]!.sections[0]!.body).toHaveLength(1);
    expect(rounds[0]!.sections[1]!.kind).toBe('enemy');
    expect(rounds[1]!.round).toBe(2);
    expect(rounds[1]!.sections[0]!.body.map((e) => e.message)).toEqual(['Vitória!']);
  });
});

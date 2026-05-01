import { describe, expect, it } from 'vitest';
import {
  buildStoryChoiceRows,
  filterChoices,
} from '../../src/engine/core/index.ts';
import { ChoiceSchema } from '../../src/engine/schema/index.ts';
import type { Choice, GameState } from '../../src/engine/schema/index.ts';
import { createStateWithHero } from '../helpers/engineTestData.ts';

function baseState(level: number): GameState {
  return createStateWithHero({ level });
}

describe('buildStoryChoiceRows', () => {
  it('omits choice when condition fails and showWhenLocked is unset', () => {
    const choices: Choice[] = [
      { text: 'A', next: 'a', effects: [] },
      {
        text: 'B',
        next: 'b',
        condition: { level: { gte: 5 } },
        effects: [],
      },
    ];
    const rows = buildStoryChoiceRows(choices, baseState(3));
    expect(rows.map((r) => r.kind)).toEqual(['enabled']);
    expect(rows[0]?.kind === 'enabled' && rows[0].choice.text).toBe('A');
  });

  it('emits locked row when condition fails, showWhenLocked and lockedHint', () => {
    const choices: Choice[] = [
      {
        text: 'Deep',
        next: 'deep',
        condition: { level: { gte: 5 } },
        showWhenLocked: true,
        lockedHint: 'Precisas de nível 5.',
        effects: [],
      },
    ];
    const rows = buildStoryChoiceRows(choices, baseState(3));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      kind: 'locked',
      choice: choices[0]!,
      hint: 'Precisas de nível 5.',
    });
  });

  it('trims lockedHint', () => {
    const choices: Choice[] = [
      {
        text: 'X',
        condition: { level: { gte: 9 } },
        showWhenLocked: true,
        lockedHint: '  hi  ',
        effects: [],
      },
    ];
    const rows = buildStoryChoiceRows(choices, baseState(1));
    expect(rows[0]?.kind === 'locked' && rows[0].hint).toBe('hi');
  });

  it('enabled when condition passes', () => {
    const choices: Choice[] = [
      {
        text: 'Deep',
        next: 'deep',
        condition: { level: { gte: 5 } },
        showWhenLocked: true,
        lockedHint: 'Precisas de nível 5.',
        effects: [],
      },
    ];
    const rows = buildStoryChoiceRows(choices, baseState(5));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.kind).toBe('enabled');
  });

  it('preserves YAML order with mixed enabled, hidden, locked', () => {
    const choices: Choice[] = [
      { text: 'E1', next: '1', effects: [] },
      {
        text: 'H',
        next: 'h',
        condition: { level: { gte: 10 } },
        effects: [],
      },
      {
        text: 'L',
        next: 'l',
        condition: { level: { gte: 10 } },
        showWhenLocked: true,
        lockedHint: 'lvl 10',
        effects: [],
      },
      { text: 'E2', next: '2', effects: [] },
    ];
    const rows = buildStoryChoiceRows(choices, baseState(3));
    expect(rows.map((r) => (r.kind === 'enabled' ? r.choice.text : r.hint))).toEqual([
      'E1',
      'lvl 10',
      'E2',
    ]);
  });
});

describe('filterChoices', () => {
  it('returns only enabled choices in order', () => {
    const choices: Choice[] = [
      { text: 'E1', effects: [] },
      {
        text: 'L',
        condition: { level: { gte: 10 } },
        showWhenLocked: true,
        lockedHint: 'x',
        effects: [],
      },
      { text: 'E2', effects: [] },
    ];
    const filtered = filterChoices(choices, baseState(3));
    expect(filtered.map((c) => c.text)).toEqual(['E1', 'E2']);
  });

  it('excludes locked teaser from list (UI uses this for timed choices)', () => {
    const choices: Choice[] = [
      {
        text: 'Timed',
        timedMs: 1000,
        fallbackNext: 'fallback',
        condition: { level: { gte: 10 } },
        showWhenLocked: true,
        lockedHint: 'Só com nível 10.',
        effects: [],
      },
    ];
    expect(filterChoices(choices, baseState(1))).toHaveLength(0);
  });
});

describe('ChoiceSchema showWhenLocked', () => {
  it('rejects showWhenLocked without condition', () => {
    const r = ChoiceSchema.safeParse({
      text: 'x',
      showWhenLocked: true,
      lockedHint: 'hint',
      effects: [],
    });
    expect(r.success).toBe(false);
  });

  it('rejects showWhenLocked without lockedHint', () => {
    const r = ChoiceSchema.safeParse({
      text: 'x',
      condition: { level: { gte: 1 } },
      showWhenLocked: true,
      effects: [],
    });
    expect(r.success).toBe(false);
  });

  it('accepts showWhenLocked with condition and lockedHint', () => {
    const r = ChoiceSchema.safeParse({
      text: 'x',
      condition: { level: { gte: 1 } },
      showWhenLocked: true,
      lockedHint: 'Precisas de nível 1.',
      effects: [],
    });
    expect(r.success).toBe(true);
  });
});

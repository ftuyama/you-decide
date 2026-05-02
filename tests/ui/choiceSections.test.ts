import { describe, expect, it } from 'vitest';
import {
  groupStoryChoiceRowsByUiSection,
  normalizeChoiceUiSection,
  shouldUseChoiceSectionLayout,
} from '../../src/ui/story/choiceSections.ts';
import type { StoryChoiceRow } from '../../src/engine/core/index.ts';

function enabled(text: string, uiSection?: string): StoryChoiceRow {
  return {
    kind: 'enabled',
    choice: { text, effects: [], ...(uiSection !== undefined ? { uiSection } : {}) },
  };
}

describe('choiceSections', () => {
  it('normalizeChoiceUiSection trata vazio como ausência', () => {
    expect(normalizeChoiceUiSection({ text: 'x', effects: [] })).toBeUndefined();
    expect(normalizeChoiceUiSection({ text: 'x', effects: [], uiSection: '  ' })).toBeUndefined();
    expect(normalizeChoiceUiSection({ text: 'x', effects: [], uiSection: 'A' })).toBe('A');
  });

  it('agrupa consecutivos com o mesmo uiSection', () => {
    const rows: StoryChoiceRow[] = [
      enabled('c1', 'À venda'),
      enabled('c2', 'À venda'),
      enabled('c3', 'Conversa'),
    ];
    const g = groupStoryChoiceRowsByUiSection(rows);
    expect(g).toHaveLength(2);
    expect(g[0].label).toBe('À venda');
    expect(g[0].rows).toHaveLength(2);
    expect(g[1].label).toBe('Conversa');
    expect(g[1].rows).toHaveLength(1);
  });

  it('shouldUseChoiceSectionLayout: uma lista sem secções fica plana', () => {
    const rows = [enabled('a'), enabled('b')];
    const g = groupStoryChoiceRowsByUiSection(rows);
    expect(shouldUseChoiceSectionLayout(g)).toBe(false);
  });

  it('shouldUseChoiceSectionLayout: vários grupos ou título activa blocos', () => {
    expect(
      shouldUseChoiceSectionLayout(
        groupStoryChoiceRowsByUiSection([enabled('a', 'X'), enabled('b', 'Y')])
      )
    ).toBe(true);
    expect(
      shouldUseChoiceSectionLayout(groupStoryChoiceRowsByUiSection([enabled('a', 'Só eu')]))
    ).toBe(true);
  });
});

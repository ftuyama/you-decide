import type { Choice } from '../../engine/schema/index.ts';
import type { StoryChoiceRow } from '../../engine/core/index.ts';

export type StoryChoiceSection = {
  label: string | undefined;
  rows: StoryChoiceRow[];
};

/** Rótulo de secção na UI; vazio ou só espaços equivale a ausência. */
export function normalizeChoiceUiSection(choice: Choice): string | undefined {
  const s = choice.uiSection?.trim();
  return s && s.length > 0 ? s : undefined;
}

/**
 * Agrupa linhas consecutivas com o mesmo `uiSection` (após normalizar).
 * Cenas sem nenhuma secção definida produzem um único grupo sem rótulo.
 */
export function groupStoryChoiceRowsByUiSection(rows: StoryChoiceRow[]): StoryChoiceSection[] {
  const sections: StoryChoiceSection[] = [];
  let currentLabel: string | undefined;
  let currentRows: StoryChoiceRow[] = [];

  const flush = (): void => {
    if (currentRows.length > 0) {
      sections.push({ label: currentLabel, rows: currentRows });
      currentRows = [];
    }
  };

  for (const row of rows) {
    const label = normalizeChoiceUiSection(row.choice);
    if (currentRows.length > 0 && label !== currentLabel) {
      flush();
    }
    if (currentRows.length === 0) {
      currentLabel = label;
    }
    currentRows.push(row);
  }
  flush();
  return sections;
}

/** Usa layout em blocos só quando há mais do que um grupo ou um grupo com título. */
export function shouldUseChoiceSectionLayout(sections: StoryChoiceSection[]): boolean {
  if (sections.length > 1) return true;
  if (sections.length === 1 && sections[0].label !== undefined) return true;
  return false;
}

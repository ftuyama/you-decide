import type { Choice, Effect } from '../../engine/schema/index.ts';

/** Um carácter dentro de `[]` no início do texto: classe, risco, camp, exploração, descanso, combate. */
const CHOICE_LEAD_BADGE_RE = /^\[([#*+!@>~%])\]\s*/;

export type ChoiceBadgeModifier =
  | 'hash'
  | 'star'
  | 'plus'
  | 'bang'
  | 'at'
  | 'gt'
  | 'tilde'
  | 'pct';

const BADGE_CHAR_TO_MODIFIER: Record<string, ChoiceBadgeModifier> = {
  '#': 'hash',
  '*': 'star',
  '+': 'plus',
  '!': 'bang',
  '@': 'at',
  '>': 'gt',
  '~': 'tilde',
  '%': 'pct',
};

export type ChoiceToneClass =
  | 'choice--tone-risk'
  | 'choice--tone-combat'
  | 'choice--tone-rest'
  | 'choice--tone-camp'
  | 'choice--tone-explore';

export type ChoicePresentation = {
  /** Texto da escolha sem o prefixo `[x] ` quando há badge. */
  bodyText: string;
  /** Conteúdo do span (ex. `[!]`) e classe CSS `choice-badge--*`. */
  badge: { label: string; modifier: ChoiceBadgeModifier } | null;
  /** Classe no botão para borda/fundo discreto; `null` se nenhum tom aplicável. */
  toneClass: ChoiceToneClass | null;
};

/**
 * Precedência do tom do botão (um único `choice--tone-*`):
 * risk (!) > combat (startCombat ou [%]) > rest (campRest ou [~]) > camp ([@]) > explore ([>] ou setExploration ou movimento sintético).
 */
export function parseChoiceLeadBadge(text: string): {
  badgeChar: string | null;
  rawBadge: string | null;
  rest: string;
} {
  const m = text.match(CHOICE_LEAD_BADGE_RE);
  if (!m || !m[1]) {
    return { badgeChar: null, rawBadge: null, rest: text };
  }
  const char = m[1];
  const raw = `[${char}]`;
  const rest = text.slice(m[0].length);
  return { badgeChar: char, rawBadge: raw, rest };
}

export function inferChoiceToneFromEffects(effects: Effect[]): 'combat' | 'rest' | 'explore' | null {
  let found: 'combat' | 'rest' | 'explore' | null = null;
  for (const e of effects) {
    if (e.op === 'startCombat') {
      return 'combat';
    }
    if (e.op === 'campRest') {
      found = 'rest';
      continue;
    }
    if (e.op === 'setExploration' && found !== 'rest') {
      found = 'explore';
    }
  }
  return found;
}

function toneClassFromKind(
  kind: 'risk' | 'combat' | 'rest' | 'camp' | 'explore'
): ChoiceToneClass {
  switch (kind) {
    case 'risk':
      return 'choice--tone-risk';
    case 'combat':
      return 'choice--tone-combat';
    case 'rest':
      return 'choice--tone-rest';
    case 'camp':
      return 'choice--tone-camp';
    case 'explore':
      return 'choice--tone-explore';
  }
}

export function resolveChoicePresentation(
  choice: Choice,
  opts?: { syntheticExplore?: boolean }
): ChoicePresentation {
  const { badgeChar, rawBadge, rest } = parseChoiceLeadBadge(choice.text);
  const bodyText = rawBadge !== null ? rest : choice.text;

  const modifier = badgeChar != null ? BADGE_CHAR_TO_MODIFIER[badgeChar] : undefined;
  const badge =
    rawBadge !== null && modifier !== undefined
      ? { label: rawBadge, modifier }
      : null;

  const effectTone = inferChoiceToneFromEffects(choice.effects);
  const exploreFromEffect = effectTone === 'explore' || opts?.syntheticExplore === true;

  let toneKind: 'risk' | 'combat' | 'rest' | 'camp' | 'explore' | null = null;

  if (badgeChar === '!') {
    toneKind = 'risk';
  } else if (effectTone === 'combat' || badgeChar === '%') {
    toneKind = 'combat';
  } else if (badgeChar === '~' || effectTone === 'rest') {
    toneKind = 'rest';
  } else if (badgeChar === '@') {
    toneKind = 'camp';
  } else if (badgeChar === '>' || exploreFromEffect) {
    toneKind = 'explore';
  }

  const toneClass = toneKind !== null ? toneClassFromKind(toneKind) : null;

  /**
   * Glifo `[…]` alinhado ao tom: injetado quando só os efeitos definem o tom, ou `[%]` quando
   * combate prevalece sobre prefixos fracos `[~]` / `[>]` no texto.
   */
  let outBadge = badge;
  if (toneKind === 'combat') {
    const weakCombatBadge =
      badge === null || badge.modifier === 'tilde' || badge.modifier === 'gt';
    if (weakCombatBadge) {
      outBadge = { label: '[%]', modifier: 'pct' };
    }
  } else if (badge === null && toneKind === 'rest') {
    outBadge = { label: '[~]', modifier: 'tilde' };
  } else if (badge === null && toneKind === 'explore') {
    outBadge = { label: '[>]', modifier: 'gt' };
  }

  return { bodyText, badge: outBadge, toneClass };
}

/** Preenche o rótulo principal do botão: `N -`, badge opcional, corpo do texto. */
export function applyChoiceButtonLabel(
  btn: HTMLButtonElement,
  navNum: number,
  choice: Choice,
  opts?: { syntheticExplore?: boolean }
): void {
  const { bodyText, badge, toneClass } = resolveChoicePresentation(choice, opts);
  if (toneClass) {
    btn.classList.add(toneClass);
  }

  btn.appendChild(document.createTextNode(`${navNum} - `));
  if (badge) {
    const span = document.createElement('span');
    span.className = `choice-badge choice-badge--${badge.modifier}`;
    span.textContent = badge.label;
    btn.appendChild(span);
    btn.appendChild(document.createTextNode(' '));
  }
  btn.appendChild(document.createTextNode(bodyText));
}

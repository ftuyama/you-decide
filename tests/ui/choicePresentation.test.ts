import { describe, expect, it } from 'vitest';
import type { Choice, Effect } from '../../src/engine/schema/index.ts';
import {
  inferChoiceToneFromEffects,
  parseChoiceLeadBadge,
  resolveChoicePresentation,
} from '../../src/ui/story/choicePresentation.ts';

function ch(text: string, effects: Effect[] = []): Choice {
  return { text, effects };
}

describe('parseChoiceLeadBadge', () => {
  it('não altera texto sem marcador reconhecido', () => {
    expect(parseChoiceLeadBadge('Ir em frente')).toEqual({
      badgeChar: null,
      rawBadge: null,
      rest: 'Ir em frente',
    });
  });

  it('ignora colchetes que não são o vocabulário fixo', () => {
    expect(parseChoiceLeadBadge('[x] Nada')).toEqual({
      badgeChar: null,
      rawBadge: null,
      rest: '[x] Nada',
    });
  });

  it('extrai [#] e resto', () => {
    expect(parseChoiceLeadBadge('[#] Forjar o caminho')).toEqual({
      badgeChar: '#',
      rawBadge: '[#]',
      rest: 'Forjar o caminho',
    });
  });

  it('extrai [%] combate', () => {
    expect(parseChoiceLeadBadge('[%] Enfrentar')).toEqual({
      badgeChar: '%',
      rawBadge: '[%]',
      rest: 'Enfrentar',
    });
  });
});

describe('inferChoiceToneFromEffects', () => {
  it('startCombat tem prioridade máxima', () => {
    expect(
      inferChoiceToneFromEffects([
        { op: 'setExploration', graphId: 'g', nodeId: 'n' },
        { op: 'startCombat', encounterId: 'e' },
      ])
    ).toBe('combat');
  });

  it('campRest prevalece sobre setExploration quando vem depois', () => {
    expect(
      inferChoiceToneFromEffects([
        { op: 'setExploration', graphId: 'g', nodeId: 'n' },
        { op: 'campRest' },
      ])
    ).toBe('rest');
  });

  it('só setExploration → explore', () => {
    expect(
      inferChoiceToneFromEffects([{ op: 'setExploration', graphId: 'g', nodeId: 'n' }])
    ).toBe('explore');
  });
});

describe('resolveChoicePresentation', () => {
  it('sem marcador nem efeitos → sem badge nem tom', () => {
    const r = resolveChoicePresentation(ch('Seguir'));
    expect(r.bodyText).toBe('Seguir');
    expect(r.badge).toBeNull();
    expect(r.toneClass).toBeNull();
  });

  it('[!] → badge e tom risk', () => {
    const r = resolveChoicePresentation(ch('[!] Apostar tudo'));
    expect(r.bodyText).toBe('Apostar tudo');
    expect(r.badge).toEqual({ label: '[!]', modifier: 'bang' });
    expect(r.toneClass).toBe('choice--tone-risk');
  });

  it('startCombat sem marcador → combat e badge [%]', () => {
    const r = resolveChoicePresentation(
      ch('Lutar', [{ op: 'startCombat', encounterId: 'x' }])
    );
    expect(r.bodyText).toBe('Lutar');
    expect(r.badge).toEqual({ label: '[%]', modifier: 'pct' });
    expect(r.toneClass).toBe('choice--tone-combat');
  });

  it('[!] + startCombat → risk ganha e mantém badge [!]', () => {
    const r = resolveChoicePresentation(
      ch('[!] Atacar', [{ op: 'startCombat', encounterId: 'x' }])
    );
    expect(r.toneClass).toBe('choice--tone-risk');
    expect(r.badge).toEqual({ label: '[!]', modifier: 'bang' });
  });

  it('campRest → rest e badge [~]', () => {
    const r = resolveChoicePresentation(ch('Dormir', [{ op: 'campRest' }]));
    expect(r.toneClass).toBe('choice--tone-rest');
    expect(r.badge).toEqual({ label: '[~]', modifier: 'tilde' });
  });

  it('[~] → rest', () => {
    const r = resolveChoicePresentation(ch('[~] Respirar'));
    expect(r.bodyText).toBe('Respirar');
    expect(r.badge).toEqual({ label: '[~]', modifier: 'tilde' });
    expect(r.toneClass).toBe('choice--tone-rest');
  });

  it('[~] + startCombat → combat ganha e badge vira [%]', () => {
    const r = resolveChoicePresentation(
      ch('[~] Ilusão', [{ op: 'startCombat', encounterId: 'x' }])
    );
    expect(r.toneClass).toBe('choice--tone-combat');
    expect(r.badge).toEqual({ label: '[%]', modifier: 'pct' });
    expect(r.bodyText).toBe('Ilusão');
  });

  it('[>] + startCombat → combate e badge [%]', () => {
    const r = resolveChoicePresentation(
      ch('[>] Arena', [{ op: 'startCombat', encounterId: 'x' }])
    );
    expect(r.toneClass).toBe('choice--tone-combat');
    expect(r.badge).toEqual({ label: '[%]', modifier: 'pct' });
  });

  it('[@] → camp', () => {
    const r = resolveChoicePresentation(ch('[@] Voltar ao acampamento'));
    expect(r.toneClass).toBe('choice--tone-camp');
  });

  it('[>] → explore', () => {
    const r = resolveChoicePresentation(ch('[>] Descer o corredor'));
    expect(r.badge).toEqual({ label: '[>]', modifier: 'gt' });
    expect(r.toneClass).toBe('choice--tone-explore');
  });

  it('[#] só badge de classe, sem tom no botão', () => {
    const r = resolveChoicePresentation(ch('[#] Ser cavaleiro'));
    expect(r.badge).toEqual({ label: '[#]', modifier: 'hash' });
    expect(r.toneClass).toBeNull();
  });

  it('syntheticExplore sem outros sinais → explore e badge [>]', () => {
    const r = resolveChoicePresentation(ch('Túnel a norte'), { syntheticExplore: true });
    expect(r.toneClass).toBe('choice--tone-explore');
    expect(r.badge).toEqual({ label: '[>]', modifier: 'gt' });
  });

  it('setExploration sem marcador → explore e badge [>]', () => {
    const r = resolveChoicePresentation(
      ch('Entrar nas catacumbas', [{ op: 'setExploration', graphId: 'g', nodeId: 'n' }])
    );
    expect(r.badge).toEqual({ label: '[>]', modifier: 'gt' });
    expect(r.toneClass).toBe('choice--tone-explore');
  });
});

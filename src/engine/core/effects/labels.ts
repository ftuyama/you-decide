import type { GameData } from '../../data/gameData.ts';
import type { LeadStatAttr } from '../../progression/leadStats.ts';

export const ATTR_LABEL: Record<LeadStatAttr, string> = {
  str: 'STR',
  agi: 'AGI',
  mind: 'MEN',
  luck: 'SOR',
};

export function humanizeMarkId(mark: string): string {
  return mark
    .split('_')
    .map((w) => (w.length ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/** Título de marca para UI: registo da campanha, depois humanização do id. */
export function displayTitleForMark(mark: string, data: GameData): string {
  return data.journeyMarks[mark]?.name ?? humanizeMarkId(mark);
}

export const RESOURCE_LABEL: Record<'gold' | 'supply' | 'faith' | 'corruption', string> = {
  gold: 'Gold',
  supply: 'Suprimento',
  faith: 'Fé',
  corruption: 'Corrupção',
};

/** Caps para `addResource` — alinhar com `schema.ts` `resources`. */
export const RESOURCE_MAX = {
  gold: 999,
  supply: 10,
  faith: 5,
  corruption: 10,
} as const;

export function resourceDebuffSubtitle(resource: keyof typeof RESOURCE_LABEL): string {
  switch (resource) {
    case 'corruption':
      return 'Marca sombria — o pacto cobra o preço';
    case 'faith':
      return 'A convicção abala-se';
    case 'supply':
      return 'Recursos a escassear';
    case 'gold':
      return 'Perda material';
    default:
      return '';
  }
}

export function resourceGainSubtitle(resource: keyof typeof RESOURCE_LABEL): string {
  switch (resource) {
    case 'corruption':
      return 'A sombra recua';
    case 'faith':
      return 'A convicção fortalece';
    case 'supply':
      return 'Recursos repostos';
    case 'gold':
      return 'Ganho material';
    default:
      return '';
  }
}

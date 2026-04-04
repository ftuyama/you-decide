import type { ClassId } from '../../../engine/schema.ts';

export type ClassPassiveDef = {
  id: string;
  name: string;
  description: string;
};

export const passives: Record<ClassId, ClassPassiveDef> = {
  knight: {
    id: 'knight_crit_edge',
    name: 'Aço Implacável',
    description: '+3% de chance crítica.',
  },
  cleric: {
    id: 'cleric_sacred_pulse',
    name: 'Pulso Devoto',
    description: 'No início do teu turno, regeneras 1% do HP máximo (arredondado para cima).',
  },
  mage: {
    id: 'mage_ley_trickle',
    name: 'Fio Arcano',
    description: 'No início do teu turno, regeneras 1% da mana máxima (arredondado para cima).',
  },
};

/** Bênção da gruta do monge — alinhado à marca `monk_inner_peace` e ao +1 SOR em `triumph`. */
export const passivesByMark = {
  monk_inner_peace: {
    name: 'Paz interior',
    description: '+1 SOR permanente (bênção do monge da neve).',
  },
} as const;

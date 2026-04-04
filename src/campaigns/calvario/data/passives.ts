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

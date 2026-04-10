import type { LeadStoryPassiveDef } from '../../../engine/gameData.ts';
import type { ClassId } from '../../../engine/schema.ts';

export type ClassPassiveDef = {
  id: string;
  name: string;
  description: string;
};

/** Passivos de classe do líder (combate). Marcas da história: `journeyMarks.ts`. */
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

/**
 * Passivos de história do líder (`state.leadStoryPassives`).
 * Concedidos com `grantLeadStoryPassive` nas cenas — não usam `state.marks`.
 */
export const leadStoryPassives: Record<string, LeadStoryPassiveDef> = {
  monk_inner_peace: {
    name: 'Paz interior',
    description: '+1 SOR permanente — bênção do monge da neve: sorte como disciplina, não como truque.',
  },
};

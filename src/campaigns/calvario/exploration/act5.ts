import type { ExplorationGraph } from '../../../engine/world/index.ts';

/** Grafo do desfiladeiro gelado (act5), com acesso ao caminho do cume. */
export const ACT5_FROST_GRAPH: ExplorationGraph = {
  id: 'act5_frost',
  mapId: 'act5_frost',
  // Mirante quebrado: ponto de distribuição da rota no desfiladeiro.
  startNodeId: 'frost_broken_watch',
  nodes: [
    {
      id: 'frost_camp_line',
      mapCell: { x: 3, y: 8 },
      edges: [
        {
          id: 'd5_camp_to_ridge',
          text: 'Subir para a crista de neve',
          to: 'frost_ridge',
          encounterChance: 0.2,
        },
        {
          id: 'd5_camp_to_ice_chasm',
          text: 'Seguir para a fenda de gelo',
          to: 'frost_ice_chasm',
          encounterChance: 0.26,
        },
      ],
    },
    {
      id: 'frost_ridge',
      mapCell: { x: 5, y: 5 },
      edges: [
        {
          id: 'd5_ridge_to_camp',
          text: 'Descer para o acampamento',
          to: 'frost_camp_line',
          encounterChance: 0.16,
        },
        {
          id: 'd5_ridge_to_watch',
          text: 'Avançar ao mirante quebrado',
          to: 'frost_broken_watch',
          encounterChance: 0.24,
        },
      ],
    },
    {
      id: 'frost_ice_chasm',
      mapCell: { x: 7, y: 9 },
      edges: [
        {
          id: 'd5_chasm_to_camp',
          text: 'Voltar para a linha de tendas',
          to: 'frost_camp_line',
          encounterChance: 0.2,
        },
        {
          id: 'd5_chasm_to_watch',
          text: 'Contornar para o mirante quebrado',
          to: 'frost_broken_watch',
          encounterChance: 0.3,
        },
      ],
    },
    {
      id: 'frost_broken_watch',
      mapCell: { x: 10, y: 6 },
      edges: [
        {
          id: 'd5_watch_to_ridge',
          text: 'Recuar para a crista',
          to: 'frost_ridge',
          encounterChance: 0.2,
        },
        {
          id: 'd5_watch_to_chasm',
          text: 'Descer para a fenda',
          to: 'frost_ice_chasm',
          encounterChance: 0.22,
        },
        {
          id: 'd5_watch_to_ascent',
          text: 'Forçar a trilha de ascensão',
          to: 'frost_black_temple_path',
          encounterChance: 0.36,
        },
      ],
    },
    {
      id: 'frost_black_temple_path',
      isGoal: true,
      goalFlag: 'act5_explore_goal_reached',
      mapCell: { x: 12, y: 3 },
      edges: [
        {
          id: 'd5_ascent_to_watch',
          text: 'Recuar para o mirante',
          to: 'frost_broken_watch',
          encounterChance: 0.2,
        },
      ],
    },
  ],
};

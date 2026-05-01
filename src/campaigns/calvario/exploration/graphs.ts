import type { ExplorationGraph } from '../../../engine/exploration.ts';

/** Grafo do perímetro do cruzeiro (act2). Células alinhadas a `MAPS.act2_catacomb`. */
export const ACT2_CATACOMB_GRAPH: ExplorationGraph = {
  id: 'act2_catacomb',
  mapId: 'act2_catacomb',
  startNodeId: 'cross_start',
  nodes: [
    {
      id: 'cross_start',
      mapCell: { x: 8, y: 2 },
      edges: [
        {
          id: 'e_left',
          text: 'Virar à esquerda — corredor estreito',
          to: 'bend_west',
          encounterChance: 0.22,
        },
        {
          id: 'e_forward',
          text: 'Seguir em frente — laje inclinada',
          to: 'tight_climb',
          encounterChance: 0.28,
        },
        {
          id: 'e_right',
          text: 'Virar à direita — umidade na pedra',
          to: 'bend_east',
          encounterChance: 0.22,
        },
      ],
    },
    {
      id: 'bend_west',
      mapCell: { x: 4, y: 4 },
      edges: [
        {
          id: 'w_back',
          text: 'Recuar para o cruzeiro de túneis',
          to: 'cross_start',
          encounterChance: 0.18,
        },
        {
          id: 'w_forward',
          text: 'Apertar pelo lado — volta à laje',
          to: 'tight_climb',
          encounterChance: 0.3,
        },
      ],
    },
    {
      id: 'bend_east',
      mapCell: { x: 12, y: 4 },
      edges: [
        {
          id: 'e_back',
          text: 'Recuar para o cruzeiro de túneis',
          to: 'cross_start',
          encounterChance: 0.18,
        },
        {
          id: 'e_forward',
          text: 'Contornar pela borda — desce ao patamar',
          to: 'tight_climb',
          encounterChance: 0.3,
        },
      ],
    },
    {
      id: 'tight_climb',
      mapCell: { x: 8, y: 6 },
      edges: [
        {
          id: 't_back',
          text: 'Subir de volta ao patamar aberto',
          to: 'cross_start',
          encounterChance: 0.22,
        },
        {
          id: 't_down',
          text: 'Descer degraus — cheiro de ferro antigo',
          to: 'descent_gate',
          encounterChance: 0.35,
        },
      ],
    },
    {
      id: 'descent_gate',
      isGoal: true,
      goalFlag: 'act2_explore_goal_reached',
      mapCell: { x: 8, y: 8 },
      edges: [
        {
          id: 'g_back',
          text: 'Recuar do limiar (ainda no perímetro)',
          to: 'tight_climb',
          encounterChance: 0.2,
        },
      ],
    },
  ],
};

export const EXPLORATION_GRAPHS: Record<string, ExplorationGraph> = {
  act2_catacomb: ACT2_CATACOMB_GRAPH,
};

import type { ExplorationGraph } from '../../../engine/world/index.ts';

/** Grafo da nave fraturada (act6), com rota ao espelho interior. */
export const ACT6_FRACTURED_NAVE_GRAPH: ExplorationGraph = {
  id: 'act6_fractured_nave',
  mapId: 'act6_fractured_nave',
  // Altar da vontade: centro da nave fraturada para navegação sem deslocamento inicial.
  startNodeId: 'nave_will_altar',
  nodes: [
    {
      id: 'nave_ash_fire',
      mapCell: { x: 3, y: 8 },
      edges: [
        {
          id: 'd6_fire_to_mirror_hall',
          text: 'Subir para o corredor de espelhos',
          to: 'nave_mirror_hall',
          encounterChance: 0.2,
        },
        {
          id: 'd6_fire_to_memory_well',
          text: 'Descer para o poço de memórias',
          to: 'nave_memory_well',
          encounterChance: 0.26,
        },
      ],
    },
    {
      id: 'nave_mirror_hall',
      mapCell: { x: 6, y: 5 },
      edges: [
        {
          id: 'd6_mirror_to_fire',
          text: 'Voltar à fogueira de cinzas',
          to: 'nave_ash_fire',
          encounterChance: 0.18,
        },
        {
          id: 'd6_mirror_to_will_altar',
          text: 'Cruzar até o altar da vontade',
          to: 'nave_will_altar',
          encounterChance: 0.28,
        },
      ],
    },
    {
      id: 'nave_memory_well',
      mapCell: { x: 7, y: 10 },
      edges: [
        {
          id: 'd6_memory_to_fire',
          text: 'Retornar à nave central',
          to: 'nave_ash_fire',
          encounterChance: 0.2,
        },
        {
          id: 'd6_memory_to_will_altar',
          text: 'Subir para o altar da vontade',
          to: 'nave_will_altar',
          encounterChance: 0.3,
        },
      ],
    },
    {
      id: 'nave_will_altar',
      mapCell: { x: 11, y: 7 },
      edges: [
        {
          id: 'd6_altar_to_mirror',
          text: 'Recuar pelo corredor de espelhos',
          to: 'nave_mirror_hall',
          encounterChance: 0.2,
        },
        {
          id: 'd6_altar_to_memory',
          text: 'Descer ao poço de memórias',
          to: 'nave_memory_well',
          encounterChance: 0.22,
        },
        {
          id: 'd6_altar_to_inner_gate',
          text: 'Abrir o portão do espelho interior',
          to: 'nave_inner_mirror_gate',
          encounterChance: 0.34,
        },
      ],
    },
    {
      id: 'nave_inner_mirror_gate',
      isGoal: true,
      goalFlag: 'act6_explore_goal_reached',
      mapCell: { x: 13, y: 4 },
      edges: [
        {
          id: 'd6_gate_to_altar',
          text: 'Voltar ao altar da vontade',
          to: 'nave_will_altar',
          encounterChance: 0.2,
        },
      ],
    },
  ],
};

import type { ExplorationGraph } from '../../../engine/world/index.ts';

/** Grafo das profundezas (act3), ligado ao núcleo e ao corredor do guardião. */
export const ACT3_DEPTHS_GRAPH: ExplorationGraph = {
  id: 'act3_depths',
  mapId: 'act3_depths',
  // Núcleo das profundezas: entrada em ponto central para evitar início deslocado.
  startNodeId: 'depths_drowned_gallery',
  nodes: [
    {
      id: 'depths_anteroom',
      mapCell: { x: 3, y: 2 },
      edges: [
        {
          id: 'd3_anteroom_to_well',
          text: 'Seguir para o poço rachado',
          to: 'depths_well',
          encounterChance: 0.56,
        },
        {
          id: 'd3_anteroom_to_passage',
          text: 'Descer para a passagem de ossos',
          to: 'depths_bone_passage',
          encounterChance: 0.6,
        },
      ],
    },
    {
      id: 'depths_well',
      mapCell: { x: 6, y: 2 },
      edges: [
        {
          id: 'd3_well_to_anteroom',
          text: 'Voltar à antecâmara',
          to: 'depths_anteroom',
          encounterChance: 0.52,
        },
        {
          id: 'd3_well_to_gallery',
          text: 'Cruzar para a galeria afogada',
          to: 'depths_drowned_gallery',
          encounterChance: 0.6,
        },
      ],
    },
    {
      id: 'depths_bone_passage',
      mapCell: { x: 3, y: 5 },
      edges: [
        {
          id: 'd3_passage_to_anteroom',
          text: 'Recuar para a antecâmara',
          to: 'depths_anteroom',
          encounterChance: 0.56,
        },
        {
          id: 'd3_passage_to_gallery',
          text: 'Virar para a galeria afogada',
          to: 'depths_drowned_gallery',
          encounterChance: 0.64,
        },
      ],
    },
    {
      id: 'depths_drowned_gallery',
      mapCell: { x: 7, y: 5 },
      edges: [
        {
          id: 'd3_gallery_to_well',
          text: 'Subir para o poço rachado',
          to: 'depths_well',
          encounterChance: 0.54,
        },
        {
          id: 'd3_gallery_to_passage',
          text: 'Retornar pela passagem de ossos',
          to: 'depths_bone_passage',
          encounterChance: 0.58,
        },
        {
          id: 'd3_gallery_to_stone_gate',
          text: 'Empurrar o portão de pedra',
          to: 'depths_stone_gate',
          encounterChance: 0.7,
        },
      ],
    },
    {
      id: 'depths_stone_gate',
      isGoal: true,
      goalFlag: 'act3_explore_goal_reached',
      mapCell: { x: 10, y: 5 },
      edges: [
        {
          id: 'd3_gate_to_gallery',
          text: 'Voltar para a galeria afogada',
          to: 'depths_drowned_gallery',
          encounterChance: 0.56,
        },
      ],
    },
  ],
};

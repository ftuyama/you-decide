import type { ExplorationGraph } from '../../../engine/world/index.ts';

/** Grafo do perímetro do cruzeiro (act2). Células alinhadas a `MAPS.act2_catacomb`. */
export const ACT2_CATACOMB_GRAPH: ExplorationGraph = {
  id: 'act2_catacomb',
  mapId: 'act2_catacomb',
  // Cruzeiro central: evita início "deslocado" quando a patrulha começa no hub.
  startNodeId: 'center_breach',
  nodes: [
    {
      id: 'west_shrine',
      mapCell: { x: 4, y: 2 },
      edges: [
        {
          id: 'w_to_north_gallery',
          text: 'Subir para a galeria norte do oeste',
          to: 'west_north_gallery',
          encounterChance: 0.2,
        },
        {
          id: 'w_to_mid_corridor',
          text: 'Descer para o corredor central do oeste',
          to: 'west_mid_corridor',
          encounterChance: 0.24,
        },
        {
          id: 'w_to_inner_corner',
          text: 'Contornar para o canto interno do oeste',
          to: 'west_inner_corner',
          encounterChance: 0.22,
        },
      ],
    },
    {
      id: 'west_north_gallery',
      mapCell: { x: 2, y: 1 },
      edges: [
        {
          id: 'wng_back_shrine',
          text: 'Voltar ao santuário do oeste',
          to: 'west_shrine',
          encounterChance: 0.16,
        },
        {
          id: 'wng_to_mid_corridor',
          text: 'Descer pela galeria para o corredor oeste',
          to: 'west_mid_corridor',
          encounterChance: 0.24,
        },
      ],
    },
    {
      id: 'west_mid_corridor',
      mapCell: { x: 3, y: 4 },
      edges: [
        {
          id: 'wmc_to_shrine',
          text: 'Subir ao santuário quebrado',
          to: 'west_shrine',
          encounterChance: 0.18,
        },
        {
          id: 'wmc_to_north_gallery',
          text: 'Retornar à galeria norte',
          to: 'west_north_gallery',
          encounterChance: 0.2,
        },
        {
          id: 'wmc_to_south_shrine',
          text: 'Descer para o santuário sul do oeste',
          to: 'west_south_shrine',
          encounterChance: 0.28,
        },
        {
          id: 'wmc_to_inner_corner',
          text: 'Passar pela curva interna rumo ao centro',
          to: 'west_inner_corner',
          encounterChance: 0.26,
        },
      ],
    },
    {
      id: 'west_south_shrine',
      mapCell: { x: 4, y: 8 },
      edges: [
        {
          id: 'wss_to_mid_corridor',
          text: 'Subir ao corredor do oeste',
          to: 'west_mid_corridor',
          encounterChance: 0.22,
        },
        {
          id: 'wss_to_inner_corner',
          text: 'Acompanhar a parede interna até a fenda',
          to: 'west_inner_corner',
          encounterChance: 0.3,
        },
      ],
    },
    {
      id: 'west_inner_corner',
      mapCell: { x: 7, y: 6 },
      edges: [
        {
          id: 'wic_to_mid_corridor',
          text: 'Voltar ao corredor do oeste',
          to: 'west_mid_corridor',
          encounterChance: 0.2,
        },
        {
          id: 'wic_to_south_shrine',
          text: 'Recuar ao santuário sul do oeste',
          to: 'west_south_shrine',
          encounterChance: 0.2,
        },
        {
          id: 'wic_to_center_breach',
          text: 'Atravessar a abertura para a câmara central',
          to: 'center_breach',
          encounterChance: 0.34,
        },
      ],
    },
    {
      id: 'center_breach',
      mapCell: { x: 8, y: 6 },
      edges: [
        {
          id: 'cb_to_west_corner',
          text: 'Cruzar de volta para o setor oeste',
          to: 'west_inner_corner',
          encounterChance: 0.24,
        },
        {
          id: 'cb_to_east_corner',
          text: 'Seguir para a ala leste pela brecha central',
          to: 'east_inner_corner',
          encounterChance: 0.3,
        },
      ],
    },
    {
      id: 'east_inner_corner',
      mapCell: { x: 9, y: 6 },
      edges: [
        {
          id: 'eic_to_center',
          text: 'Voltar para a câmara central',
          to: 'center_breach',
          encounterChance: 0.22,
        },
        {
          id: 'eic_to_mid_corridor',
          text: 'Virar para o corredor interno do leste',
          to: 'east_mid_corridor',
          encounterChance: 0.28,
        },
        {
          id: 'eic_to_south_gallery',
          text: 'Descer para a galeria sul do leste',
          to: 'east_south_gallery',
          encounterChance: 0.3,
        },
      ],
    },
    {
      id: 'east_mid_corridor',
      mapCell: { x: 13, y: 4 },
      edges: [
        {
          id: 'emc_to_inner_corner',
          text: 'Retornar à curva interna',
          to: 'east_inner_corner',
          encounterChance: 0.2,
        },
        {
          id: 'emc_to_north_shrine',
          text: 'Subir para o santuário norte do leste',
          to: 'east_north_shrine',
          encounterChance: 0.24,
        },
        {
          id: 'emc_to_south_gallery',
          text: 'Descer para a galeria sul',
          to: 'east_south_gallery',
          encounterChance: 0.26,
        },
      ],
    },
    {
      id: 'east_north_shrine',
      mapCell: { x: 12, y: 2 },
      edges: [
        {
          id: 'ens_to_mid_corridor',
          text: 'Descer ao corredor do leste',
          to: 'east_mid_corridor',
          encounterChance: 0.18,
        },
      ],
    },
    {
      id: 'east_south_gallery',
      mapCell: { x: 12, y: 8 },
      edges: [
        {
          id: 'esg_to_inner_corner',
          text: 'Subir pela curva interna',
          to: 'east_inner_corner',
          encounterChance: 0.22,
        },
        {
          id: 'esg_to_mid_corridor',
          text: 'Retornar ao corredor leste',
          to: 'east_mid_corridor',
          encounterChance: 0.2,
        },
        {
          id: 'esg_to_gate',
          text: 'Avançar ao limiar das escadas seladas',
          to: 'descent_gate',
          encounterChance: 0.34,
        },
      ],
    },
    {
      id: 'descent_gate',
      isGoal: true,
      goalFlag: 'act2_explore_goal_reached',
      mapCell: { x: 12, y: 9 },
      edges: [
        {
          id: 'g_back',
          text: 'Recuar das escadas para a galeria sul',
          to: 'east_south_gallery',
          encounterChance: 0.2,
        },
      ],
    },
  ],
};

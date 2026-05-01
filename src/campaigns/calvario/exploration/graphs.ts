import type { ExplorationGraph } from '../../../engine/world/index.ts';
import { ACT2_CATACOMB_GRAPH } from './act2.ts';
import { ACT3_DEPTHS_GRAPH } from './act3.ts';
import { ACT5_FROST_GRAPH } from './act5.ts';
import { ACT6_FRACTURED_NAVE_GRAPH } from './act6.ts';

export const EXPLORATION_GRAPHS: Record<string, ExplorationGraph> = {
  act2_catacomb: ACT2_CATACOMB_GRAPH,
  act3_depths: ACT3_DEPTHS_GRAPH,
  act5_frost: ACT5_FROST_GRAPH,
  act6_fractured_nave: ACT6_FRACTURED_NAVE_GRAPH,
};

/**
 * Contrato:
 * - chave do catálogo == graph.id
 * - startNodeId existente no grafo
 * - arestas com `to` válido e `encounterChance` em 0..1
 * Validação executada no loader da campanha (bundle).
 */

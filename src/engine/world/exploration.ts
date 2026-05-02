import type { Effect, GameState } from '../schema/index.ts';
import { mulberry32 } from '../core/rng.ts';

/** Grafo de navegação por área (dados em campanha). */
export type ExplorationEdge = {
  id: string;
  text: string;
  to: string;
  /** Probabilidade de encontro após atravessar esta aresta (0–1). */
  encounterChance: number;
};

export type ExplorationNode = {
  id: string;
  /** Ao entrar neste nó, define a flag (típico do nó objetivo). */
  isGoal?: boolean;
  goalFlag?: string;
  /** Célula no grid ASCII do `mapId` do grafo (0-based). */
  mapCell?: { x: number; y: number };
  edges: ExplorationEdge[];
};

export type ExplorationGraph = {
  id: string;
  mapId: string;
  startNodeId: string;
  nodes: ExplorationNode[];
};

/** Contrato de leitura de grafos por campanha (UI injeta apenas dados). */
export type ExplorationGraphProvider = (graphId: string) => ExplorationGraph | null;

/** Flag definida ao chegar ao nó objetivo do grafo act2 (catacumba). */
export const ACT2_EXPLORE_GOAL_FLAG = 'act2_explore_goal_reached';

/** Mesmos pesos que `act2/encounters/random_router` → IDs de encontro. */
const ACT2_WILD_WEIGHTS: { weight: number; encounterId: string }[] = [
  { weight: 1, encounterId: 'rats_cellar_pair' },
  { weight: 1, encounterId: 'cellar_mixed' },
  { weight: 1, encounterId: 'cultist_patrol' },
  { weight: 0.2, encounterId: 'act2_rare_bone_sentinel' },
  { weight: 0.2, encounterId: 'act2_rare_lone_swarm' },
];

/** Alinhado a `act3/encounters/random_router` (pesos e encounterId por ramo). */
const ACT3_WILD_WEIGHTS: { weight: number; encounterId: string }[] = [
  { weight: 1, encounterId: 'cult_ambush' },
  { weight: 1, encounterId: 'stone_guard_fight' },
  { weight: 1, encounterId: 'cultist_patrol' },
  { weight: 0.35, encounterId: 'vigil_hunter_fight' },
];

/** Pesos dos encontros aleatórios de navegação do act5. */
const ACT5_WILD_WEIGHTS: { weight: number; encounterId: string }[] = [
  { weight: 1, encounterId: 'frost_whelps' },
  { weight: 1, encounterId: 'frost_whelp_solo' },
  { weight: 1, encounterId: 'cultist_patrol' },
  { weight: 0.25, encounterId: 'frost_hunt_party' },
  { weight: 0.1, encounterId: 'frost_howl_horde' },
];

/** Pesos dos encontros aleatórios de navegação do act6. */
const ACT6_WILD_WEIGHTS: { weight: number; encounterId: string }[] = [
  { weight: 1, encounterId: 'act6_wild_fragment_solo' },
  { weight: 1, encounterId: 'act6_wild_fragments_pair' },
  { weight: 1, encounterId: 'act6_wild_scribe_solo' },
  { weight: 1, encounterId: 'act6_wild_murmur_solo' },
  { weight: 1, encounterId: 'act6_wild_chain_solo' },
  { weight: 0.35, encounterId: 'act6_wild_veil_fragment' },
  { weight: 0.35, encounterId: 'act6_wild_echo_fragment' },
  { weight: 0.2, encounterId: 'act6_wild_triple_fragments' },
  { weight: 0.08, encounterId: 'act6_wild_regent_solo' },
  { weight: 0.6, encounterId: 'act6_wild_stain_horde' },
];

const EXPLORATION_WILD_WEIGHTS_BY_GRAPH: Record<string, { weight: number; encounterId: string }[]> = {
  act3_depths: ACT3_WILD_WEIGHTS,
  act5_frost: ACT5_WILD_WEIGHTS,
  act6_fractured_nave: ACT6_WILD_WEIGHTS,
};

export function validateExplorationGraphContract(graph: ExplorationGraph): void {
  const nodeById = new Map<string, ExplorationNode>();
  for (const node of graph.nodes) {
    if (nodeById.has(node.id)) {
      throw new Error(`ExplorationGraph[${graph.id}] node duplicado: "${node.id}"`);
    }
    nodeById.set(node.id, node);
    for (const edge of node.edges) {
      if (edge.encounterChance < 0 || edge.encounterChance > 1) {
        throw new Error(
          `ExplorationGraph[${graph.id}] edge "${edge.id}" em "${node.id}" com encounterChance fora de 0..1`
        );
      }
    }
  }
  if (!nodeById.has(graph.startNodeId)) {
    throw new Error(`ExplorationGraph[${graph.id}] startNodeId inválido: "${graph.startNodeId}"`);
  }
  for (const node of graph.nodes) {
    for (const edge of node.edges) {
      if (!nodeById.has(edge.to)) {
        throw new Error(`ExplorationGraph[${graph.id}] edge "${edge.id}" aponta para nó inexistente "${edge.to}"`);
      }
    }
  }
}

export function validateExplorationGraphCatalog(graphs: Record<string, ExplorationGraph>): void {
  for (const [id, graph] of Object.entries(graphs)) {
    if (graph.id !== id) {
      throw new Error(`ExplorationGraph catálogo com chave "${id}" divergente do id "${graph.id}"`);
    }
    validateExplorationGraphContract(graph);
  }
}

export function buildExplorationNodeIndex(
  graph: ExplorationGraph
): Map<string, ExplorationNode> {
  return new Map(graph.nodes.map((n) => [n.id, n]));
}

export function getEdgeFromNode(
  graph: ExplorationGraph,
  nodeId: string,
  edgeId: string
): ExplorationEdge | undefined {
  const n = graph.nodes.find((x) => x.id === nodeId);
  return n?.edges.find((e) => e.id === edgeId);
}

/** Escolha pesada (mesma lógica que randomBranch de cena). */
export function pickWeightedEncounterId(
  seed: number,
  graphId?: string
): {
  encounterId: string;
  nextSeed: number;
} {
  const weights =
    (graphId ? EXPLORATION_WILD_WEIGHTS_BY_GRAPH[graphId] : undefined) ?? ACT2_WILD_WEIGHTS;
  const rng = mulberry32(seed ^ weights.length);
  const w = weights.reduce((a, b) => a + b.weight, 0);
  let t = rng() * w;
  let pick = weights[0]!.encounterId;
  for (const b of weights) {
    t -= b.weight;
    if (t <= 0) {
      pick = b.encounterId;
      break;
    }
  }
  return { encounterId: pick, nextSeed: (seed + 41) >>> 0 };
}

export function explorationMoveEffects(args: {
  graph: ExplorationGraph;
  fromNodeId: string;
  edgeId: string;
}): { ok: false } | { ok: true; edge: ExplorationEdge; toNode: ExplorationNode } {
  const edge = getEdgeFromNode(args.graph, args.fromNodeId, args.edgeId);
  if (!edge) return { ok: false };
  const toNode = args.graph.nodes.find((n) => n.id === edge.to);
  if (!toNode) return { ok: false };
  return { ok: true, edge, toNode };
}

export function shouldTriggerEncounter(
  state: GameState,
  chance: number
): { trigger: boolean; nextSeed: number } {
  const leadStress = state.party?.[0]?.stress ?? 0;
  if (leadStress >= 4 && chance > 0) {
    return { trigger: true, nextSeed: (state.rngSeed + 41) >>> 0 };
  }
  const rng = mulberry32(state.rngSeed ^ 0x5bd1e995);
  const roll = rng();
  return { trigger: roll < chance, nextSeed: (state.rngSeed + 41) >>> 0 };
}

export function startExplorationCombatEffects(
  encounterId: string,
  returnSceneId: string,
  /** Quando definido, vitória vai para esta cena em vez de `returnSceneId` (ex.: boss com flag/loot). */
  onVictorySceneId?: string
): Effect[] {
  return [
    {
      op: 'startCombat',
      encounterId,
      onVictory: onVictorySceneId ?? returnSceneId,
      onFlee: returnSceneId,
      onDefeat: 'shared/game_over',
    },
  ];
}

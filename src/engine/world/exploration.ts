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

export const EXPLORE_NAV_SCENE_ID = 'shared/explore_nav';

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
export function pickWeightedEncounterId(seed: number): {
  encounterId: string;
  nextSeed: number;
} {
  const rng = mulberry32(seed ^ ACT2_WILD_WEIGHTS.length);
  const w = ACT2_WILD_WEIGHTS.reduce((a, b) => a + b.weight, 0);
  let t = rng() * w;
  let pick = ACT2_WILD_WEIGHTS[0]!.encounterId;
  for (const b of ACT2_WILD_WEIGHTS) {
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
  const rng = mulberry32(state.rngSeed ^ 0x5bd1e995);
  const roll = rng();
  return { trigger: roll < chance, nextSeed: (state.rngSeed + 41) >>> 0 };
}

export function startExplorationCombatEffects(
  encounterId: string
): Effect[] {
  return [
    {
      op: 'startCombat',
      encounterId,
      onVictory: EXPLORE_NAV_SCENE_ID,
      onFlee: EXPLORE_NAV_SCENE_ID,
      onDefeat: 'shared/game_over',
    },
  ];
}

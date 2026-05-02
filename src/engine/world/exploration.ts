import type { Condition, Effect, GameState } from '../schema/index.ts';
import { evaluateCondition } from '../core/conditions.ts';
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

/** Ramo de tabela wild: combate (`encounterId`) ou salto narrativo (`nextSceneId`). */
export type ExplorationWildBranch =
  | { weight: number; encounterId: string; condition?: Condition }
  | { weight: number; nextSceneId: string; condition?: Condition };

export type WildPickResult =
  | { kind: 'combat'; encounterId: string; nextSeed: number }
  | { kind: 'scene'; sceneId: string; nextSeed: number };

/** Tabela wild do act2 (`act2_catacomb` e fallback quando `graphId` não está no mapa). */
const ACT2_WILD_BRANCHES: ExplorationWildBranch[] = [
  { weight: 1, encounterId: 'rats_cellar_pair' },
  { weight: 1, encounterId: 'cellar_mixed' },
  { weight: 1, encounterId: 'cultist_patrol' },
  { weight: 0.2, encounterId: 'act2_rare_bone_sentinel' },
  { weight: 0.2, encounterId: 'act2_rare_lone_swarm' },
];

const ACT3_WILD_BRANCHES: ExplorationWildBranch[] = [
  { weight: 1, encounterId: 'cult_ambush' },
  { weight: 1, encounterId: 'cultist_patrol' },
  { weight: 0.7, encounterId: 'cultist_horde' },
  { weight: 0.2, encounterId: 'act2_rare_bone_sentinel' },
  { weight: 0.35, encounterId: 'vigil_hunter_fight' },
  { weight: 0.05, encounterId: 'stone_guard_fight' },
];

/** Alinhado ao antigo `frost_random_router` (combates + viajante + hub). */
const ACT5_WILD_BRANCHES: ExplorationWildBranch[] = [
  { weight: 1, encounterId: 'frost_whelps' },
  { weight: 1, encounterId: 'frost_whelp_solo' },
  { weight: 1, encounterId: 'cultist_patrol' },
  { weight: 0.25, encounterId: 'frost_hunt_party' },
  { weight: 0.1, encounterId: 'frost_howl_horde' },
  {
    weight: 0.35,
    nextSceneId: 'act5/encounters/frost_stranded_traveler',
    condition: { noFlag: 'frost_stranded_traveler_done' },
  },
  { weight: 1, nextSceneId: 'act5/frost_hub' },
];

/** Prova da vontade (altar): duelo vs horda conforme corrupção — antigo `will_random_router`. */
const ACT6_WILL_TRIAL_BRANCHES: ExplorationWildBranch[] = [
  { weight: 1, nextSceneId: 'act6/encounters/will_trial_duel' },
  {
    weight: 0.6,
    nextSceneId: 'act6/encounters/will_trial_horde',
    condition: { resource: { corruption: { gte: 3 } } },
  },
];

/** Alinhado ao antigo `fractured_void_router` (+ peso extra de mancha com corrupção alta). */
const ACT6_WILD_BRANCHES: ExplorationWildBranch[] = [
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
  {
    weight: 0.6,
    encounterId: 'act6_wild_stain_horde',
    condition: { resource: { corruption: { gte: 4 } } },
  },
  { weight: 1, nextSceneId: 'act6/hub_fractured_nave' },
];

const EXPLORATION_WILD_BRANCHES_BY_GRAPH: Record<string, ExplorationWildBranch[]> = {
  act3_depths: ACT3_WILD_BRANCHES,
  act5_frost: ACT5_WILD_BRANCHES,
  act6_fractured_nave: ACT6_WILD_BRANCHES,
  /** Não é grafo de mapa; só `startWildEncounterFromGraph` na prova da vontade. */
  act6_will_trial: ACT6_WILL_TRIAL_BRANCHES,
};

function wildBranchesForGraph(graphId?: string): ExplorationWildBranch[] {
  if (graphId && EXPLORATION_WILD_BRANCHES_BY_GRAPH[graphId]) {
    return EXPLORATION_WILD_BRANCHES_BY_GRAPH[graphId]!;
  }
  return ACT2_WILD_BRANCHES;
}

/** Destinos de cena referidos por ramos `nextSceneId` (ex.: grafo estático de campanha). */
export function wildStaticSceneTargetsForGraph(graphId: string): string[] {
  return wildBranchesForGraph(graphId)
    .filter((b): b is ExplorationWildBranch & { nextSceneId: string } => 'nextSceneId' in b)
    .map((b) => b.nextSceneId);
}

/** Vitória especial (loot/cena) para encontros wild ao mover no mapa ou patrulhar. */
export function wildEncounterVictoryOverride(
  graphId: string,
  encounterId: string
): string | undefined {
  if (graphId === 'act3_depths' && encounterId === 'stone_guard_fight') {
    return 'act3/stone_guard_victory';
  }
  return undefined;
}

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

/**
 * Escolha pesada sobre a tabela wild do grafo (combate ou salto de cena).
 * Condições são avaliadas como em `randomBranch`; se nenhuma ramo for elegível, usa a tabela completa.
 */
export function pickWildOutcome(state: GameState, graphId?: string): WildPickResult {
  const branches = wildBranchesForGraph(graphId);
  const eligible = branches.filter((b) => evaluateCondition(b.condition, state));
  const pool = eligible.length > 0 ? eligible : branches;
  const rng = mulberry32(state.rngSeed ^ pool.length);
  const w = pool.reduce((a, b) => a + b.weight, 0);
  let t = rng() * w;
  let pick = pool[0]!;
  for (const b of pool) {
    t -= b.weight;
    if (t <= 0) {
      pick = b;
      break;
    }
  }
  const nextSeed = (state.rngSeed + 41) >>> 0;
  if ('nextSceneId' in pick) {
    return { kind: 'scene', sceneId: pick.nextSceneId, nextSeed };
  }
  return { kind: 'combat', encounterId: pick.encounterId, nextSeed };
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

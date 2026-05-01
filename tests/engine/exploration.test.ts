import { describe, expect, it } from 'vitest';
import {
  explorationMoveEffects,
  pickWeightedEncounterId,
  startExplorationCombatEffects,
  shouldTriggerEncounter,
  type ExplorationGraph,
} from '../../src/engine/world/index.ts';
import type { GameState } from '../../src/engine/schema/index.ts';

const miniGraph: ExplorationGraph = {
  id: 'test',
  mapId: 'demo5',
  startNodeId: 'a',
  nodes: [
    {
      id: 'a',
      edges: [{ id: 'e1', text: 'go', to: 'b', encounterChance: 0.5 }],
    },
    { id: 'b', edges: [] },
  ],
};

describe('explorationMoveEffects', () => {
  it('resolves a valid edge', () => {
    const r = explorationMoveEffects({
      graph: miniGraph,
      fromNodeId: 'a',
      edgeId: 'e1',
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.edge.to).toBe('b');
      expect(r.toNode.id).toBe('b');
    }
  });

  it('fails on bad edge id', () => {
    const r = explorationMoveEffects({
      graph: miniGraph,
      fromNodeId: 'a',
      edgeId: 'nope',
    });
    expect(r.ok).toBe(false);
  });
});

describe('shouldTriggerEncounter', () => {
  it('is deterministic for fixed seed and chance 1', () => {
    const state = { rngSeed: 12345 } as GameState;
    const a = shouldTriggerEncounter(state, 1);
    expect(a.trigger).toBe(true);
    expect(a.nextSeed).toBe((12345 + 41) >>> 0);
  });

  it('guarantees encounter when lead stress is max', () => {
    const state = {
      rngSeed: 12345,
      party: [{ stress: 4 }],
    } as unknown as GameState;
    const a = shouldTriggerEncounter(state, 0.2);
    expect(a.trigger).toBe(true);
  });
});

describe('pickWeightedEncounterId', () => {
  it('returns known encounter ids', () => {
    const p = pickWeightedEncounterId(999);
    expect([
      'rats_cellar_pair',
      'cellar_mixed',
      'cultist_patrol',
      'act2_rare_bone_sentinel',
      'act2_rare_lone_swarm',
    ]).toContain(p.encounterId);
  });

  it('uses act6 encounter pool when graph id is act6_fractured_nave', () => {
    const p = pickWeightedEncounterId(999, 'act6_fractured_nave');
    expect([
      'act6_wild_fragment_solo',
      'act6_wild_fragments_pair',
      'act6_wild_scribe_solo',
      'act6_wild_murmur_solo',
      'act6_wild_chain_solo',
      'act6_wild_veil_fragment',
      'act6_wild_echo_fragment',
      'act6_wild_triple_fragments',
      'act6_wild_regent_solo',
      'act6_wild_stain_horde',
    ]).toContain(p.encounterId);
  });

  it('uses act3 encounter pool when graph id is act3_depths', () => {
    const p = pickWeightedEncounterId(999, 'act3_depths');
    expect(['stone_guard_fight', 'cult_ambush']).toContain(p.encounterId);
  });

  it('uses act5 encounter pool when graph id is act5_frost', () => {
    const p = pickWeightedEncounterId(999, 'act5_frost');
    expect([
      'frost_whelps',
      'frost_whelp_solo',
      'cultist_patrol',
      'frost_hunt_party',
      'frost_howl_horde',
    ]).toContain(p.encounterId);
  });
});

describe('startExplorationCombatEffects', () => {
  it('uses the current exploration scene as return target', () => {
    const effects = startExplorationCombatEffects('rats_cellar_pair', 'shared/explore_nav_act3');
    expect(effects).toHaveLength(1);
    expect(effects[0]).toMatchObject({
      op: 'startCombat',
      encounterId: 'rats_cellar_pair',
      onVictory: 'shared/explore_nav_act3',
      onFlee: 'shared/explore_nav_act3',
      onDefeat: 'shared/game_over',
    });
  });
});

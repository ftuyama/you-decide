import { describe, expect, it } from 'vitest';
import {
  explorationMoveEffects,
  pickWildOutcome,
  startExplorationCombatEffects,
  shouldTriggerEncounter,
  wildEncounterVictoryOverride,
  wildStaticSceneTargetsForGraph,
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

/** Estado mínimo para `evaluateCondition` em picks wild. */
function wildPickState(seed: number, overrides: Partial<GameState> = {}): GameState {
  return {
    rngSeed: seed,
    chapter: 3,
    level: 5,
    day: 1,
    sceneId: 'shared/explore_nav_act3',
    mode: 'story',
    flags: {},
    marks: [],
    reputation: { vigilia: 0, circulo: 0, culto: 0 },
    resources: { supply: 5, faith: 2, corruption: 0, gold: 0 },
    party: [
      {
        stress: 0,
        class: 'knight',
        path: null,
        mana: 0,
      } as GameState['party'][0],
    ],
    inventory: [],
    leadStoryPassives: [],
    diary: [],
    companionsAvailable: [],
    companionFriendship: {},
    visitedScenes: {},
    exploration: null,
    timedChoiceDeadline: null,
    ...overrides,
  } as unknown as GameState;
}

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

describe('pickWildOutcome', () => {
  it('returns act2 combat for default graph', () => {
    const st = wildPickState(999);
    const p = pickWildOutcome(st, undefined);
    expect(p.kind).toBe('combat');
    if (p.kind === 'combat') {
      expect([
        'rats_cellar_pair',
        'cellar_mixed',
        'cultist_patrol',
        'act2_rare_bone_sentinel',
        'act2_rare_lone_swarm',
      ]).toContain(p.encounterId);
    }
  });

  it('uses act6 encounter pool when graph id is act6_fractured_nave', () => {
    const st = wildPickState(999, { resources: { supply: 5, faith: 2, corruption: 0, gold: 0 } });
    const p = pickWildOutcome(st, 'act6_fractured_nave');
    if (p.kind === 'combat') {
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
    } else {
      expect(p.sceneId).toBe('act6/hub_fractured_nave');
    }
  });

  it('uses act3 combat pool when graph id is act3_depths', () => {
    const st = wildPickState(999);
    const p = pickWildOutcome(st, 'act3_depths');
    expect(p.kind).toBe('combat');
    if (p.kind === 'combat') {
      expect(['cult_ambush', 'stone_guard_fight', 'cultist_patrol', 'vigil_hunter_fight']).toContain(
        p.encounterId
      );
    }
  });

  it('act5 can yield combat or scene branch', () => {
    const st = wildPickState(999, {
      flags: { frost_stranded_traveler_done: true },
    });
    const p = pickWildOutcome(st, 'act5_frost');
    if (p.kind === 'combat') {
      expect([
        'frost_whelps',
        'frost_whelp_solo',
        'cultist_patrol',
        'frost_hunt_party',
        'frost_howl_horde',
      ]).toContain(p.encounterId);
    } else {
      expect(['act5/frost_hub', 'act5/encounters/frost_stranded_traveler']).toContain(p.sceneId);
    }
  });

  it('act6_will_trial yields only duel when corruption is low', () => {
    const st = wildPickState(42, {
      resources: { supply: 5, faith: 2, corruption: 0, gold: 0 },
    });
    const p = pickWildOutcome(st, 'act6_will_trial');
    expect(p.kind).toBe('scene');
    if (p.kind === 'scene') {
      expect(p.sceneId).toBe('act6/encounters/will_trial_duel');
    }
  });

  it('act6_will_trial can yield horde when corruption is high', () => {
    const st = wildPickState(42, {
      resources: { supply: 5, faith: 2, corruption: 5, gold: 0 },
    });
    const p = pickWildOutcome(st, 'act6_will_trial');
    expect(p.kind).toBe('scene');
    if (p.kind === 'scene') {
      expect(['act6/encounters/will_trial_duel', 'act6/encounters/will_trial_horde']).toContain(
        p.sceneId
      );
    }
  });
});

describe('wildStaticSceneTargetsForGraph', () => {
  it('lists will trial duel and horde for act6_will_trial', () => {
    expect(wildStaticSceneTargetsForGraph('act6_will_trial')).toEqual([
      'act6/encounters/will_trial_duel',
      'act6/encounters/will_trial_horde',
    ]);
  });
});

describe('wildEncounterVictoryOverride', () => {
  it('routes stone guard in act3', () => {
    expect(wildEncounterVictoryOverride('act3_depths', 'stone_guard_fight')).toBe(
      'act3/stone_guard_victory'
    );
    expect(wildEncounterVictoryOverride('act3_depths', 'cult_ambush')).toBeUndefined();
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

  it('routes victory to override scene when provided (act3 stone guard)', () => {
    const effects = startExplorationCombatEffects(
      'stone_guard_fight',
      'shared/explore_nav_act3',
      'act3/stone_guard_victory'
    );
    expect(effects[0]).toMatchObject({
      op: 'startCombat',
      onVictory: 'act3/stone_guard_victory',
      onFlee: 'shared/explore_nav_act3',
    });
  });
});

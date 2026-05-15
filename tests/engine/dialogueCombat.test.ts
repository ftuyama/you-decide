import { describe, expect, it } from 'vitest';
import { dialogueEnemies } from '../../src/campaigns/calvario/data/dialogueEnemies.ts';
import { beginEncounter, resolveDialogueChoice } from '../../src/engine/combat/index.ts';
import { createInitialState, createPlayerCharacter } from '../../src/engine/core/index.ts';
import {
  DialogueEnemyDefSchema,
  type DialogueEnemyDef,
  type Encounter,
} from '../../src/engine/schema/index.ts';
import { createTestData, testCampaign } from '../helpers/engineTestData.ts';

function incomingEdgeCounts(def: DialogueEnemyDef): Map<string, number> {
  const counts = new Map<string, number>();
  for (const node of Object.values(def.graph.nodes)) {
    for (const ch of node.choices ?? []) {
      const r = ch.resolution;
      const targets = r.kind === 'fixed' ? [r.nextNodeId] : [r.successNodeId, r.failNodeId];
      for (const t of targets) {
        counts.set(t, (counts.get(t) ?? 0) + 1);
      }
    }
  }
  return counts;
}

const tinyDialogueEnemy: DialogueEnemyDef = {
  id: 'dlg_dummy',
  name: 'Voz de teste',
  sprite: 'X',
  tensionMax: 10,
  lootDrops: [{ chance: 1, resource: 'gold', amount: 1 }],
  graph: {
    rootNodeId: 'r',
    nodes: {
      r: {
        linePt: 'Olá.',
        choices: [
          {
            textPt: 'Arrefecer a hostilidade.',
            resolution: { kind: 'fixed', nextNodeId: 'end' },
            effects: { enemyHpDelta: -10 },
          },
        ],
      },
      end: {
        linePt: 'Paz.',
        terminal: 'victory',
      },
    },
  },
};

/** Teste Mente TN 2 com herói cavaleiro (mod 0): 2d6 mínimo 2 → sucesso garantido. */
const skillBranchEffectsEnemy: DialogueEnemyDef = {
  id: 'dlg_skill_fx',
  name: 'Teste de ramos',
  sprite: 'X',
  tensionMax: 12,
  lootDrops: [{ chance: 1, resource: 'gold', amount: 1 }],
  graph: {
    rootNodeId: 'r',
    nodes: {
      r: {
        linePt: 'Rola.',
        choices: [
          {
            textPt: 'Teste fácil',
            resolution: {
              kind: 'skill',
              attr: 'mind',
              tn: 2,
              successNodeId: 'ok',
              failNodeId: 'bad',
            },
            effectsOnSuccess: { enemyHpDelta: -10 },
            effectsOnFailure: { enemyHpDelta: 4 },
          },
        ],
      },
      ok: {
        linePt: 'Passou.',
        choices: [
          {
            textPt: 'Fechar',
            resolution: { kind: 'fixed', nextNodeId: 'end' },
            effects: { enemyHpDelta: -2 },
          },
        ],
      },
      bad: {
        linePt: 'Falhou.',
        terminal: 'victory',
      },
      end: {
        linePt: 'Fim.',
        terminal: 'victory',
      },
    },
  },
};

/** TN impossível com mod 0 → falha garantida. */
const skillFailBranchEnemy: DialogueEnemyDef = {
  id: 'dlg_skill_fail',
  name: 'Teste falha',
  sprite: 'X',
  tensionMax: 20,
  graph: {
    rootNodeId: 'r',
    nodes: {
      r: {
        linePt: 'Rola.',
        choices: [
          {
            textPt: 'Teste impossível',
            resolution: {
              kind: 'skill',
              attr: 'mind',
              tn: 20,
              successNodeId: 'ok',
              failNodeId: 'bad',
            },
            effectsOnSuccess: { enemyHpDelta: -10 },
            effectsOnFailure: { playerHpLossPercent: 10 },
          },
        ],
      },
      ok: { linePt: 'Não devia.', terminal: 'victory' },
      bad: {
        linePt: 'Falhou.',
        choices: [
          {
            textPt: 'Sair',
            resolution: { kind: 'fixed', nextNodeId: 'end' },
            effects: { enemyHpDelta: -20 },
          },
        ],
      },
      end: { linePt: 'Fim.', terminal: 'victory' },
    },
  },
};

describe('dialogue combat', () => {
  it('begins in dialogue_combat mode with runtime node and tension HP', () => {
    const data = createTestData();
    data.dialogueEnemies = { dlg_dummy: tinyDialogueEnemy };
    const enc: Encounter = {
      combatType: 'dialogue',
      id: 'dlg_enc',
      dialogueEnemyId: 'dlg_dummy',
      xpReward: 0,
    };
    data.encounters = { dlg_enc: enc };
    let state = createInitialState(testCampaign, 100);
    state.party = [createPlayerCharacter('Hero', 'knight')];
    state = beginEncounter(state, enc, data, { returnScene: 'hub', onVictory: 'won_scene' });
    expect(state.mode).toBe('dialogue_combat');
    expect(state.combat).toBeNull();
    expect(state.dialogueCombat?.nodeId).toBe('r');
    expect(state.dialogueCombat?.tensionHp).toBe(10);
  });

  it('wins when tension drops to 0 after choice', () => {
    const data = createTestData();
    data.dialogueEnemies = { dlg_dummy: tinyDialogueEnemy };
    const enc: Encounter = {
      combatType: 'dialogue',
      id: 'dlg_enc',
      dialogueEnemyId: 'dlg_dummy',
      xpReward: 0,
    };
    data.encounters = { dlg_enc: enc };
    let state = createInitialState(testCampaign, 100);
    state.party = [createPlayerCharacter('Hero', 'knight')];
    state = beginEncounter(state, enc, data, { returnScene: 'hub', onVictory: 'won_scene' });
    const after = resolveDialogueChoice(state, 0, data);
    expect(after.mode).toBe('story');
    expect(after.combat).toBeNull();
    expect(after.dialogueCombat).toBeNull();
    expect(after.sceneId).toBe('won_scene');
    expect(after.lastCombatXpGain).toBe(15);
    expect(after.xp).toBe(15);
    expect(after.lastCombatLootLines?.some((l) => l.includes('ouro'))).toBe(true);
    expect(after.resources.gold).toBeGreaterThanOrEqual(1);
  });

  it('applies effectsOnSuccess after skill roll (branch effects)', () => {
    DialogueEnemyDefSchema.parse(skillBranchEffectsEnemy);
    const data = createTestData();
    data.dialogueEnemies = { dlg_skill_fx: skillBranchEffectsEnemy };
    const enc: Encounter = {
      combatType: 'dialogue',
      id: 'dlg_skill_enc',
      dialogueEnemyId: 'dlg_skill_fx',
      xpReward: 0,
    };
    data.encounters = { dlg_skill_enc: enc };
    let state = createInitialState(testCampaign, 100);
    state.party = [createPlayerCharacter('Hero', 'knight')];
    state = beginEncounter(state, enc, data, { returnScene: 'hub', onVictory: 'won_scene' });
    expect(state.dialogueCombat?.tensionHp).toBe(12);
    const after = resolveDialogueChoice(state, 0, data);
    expect(after.mode).toBe('dialogue_combat');
    expect(after.dialogueCombat?.nodeId).toBe('ok');
    expect(after.dialogueCombat?.tensionHp).toBe(2);
  });

  it('applies effectsOnFailure after skill roll', () => {
    DialogueEnemyDefSchema.parse(skillFailBranchEnemy);
    const data = createTestData();
    data.dialogueEnemies = { dlg_skill_fail: skillFailBranchEnemy };
    const enc: Encounter = {
      combatType: 'dialogue',
      id: 'dlg_skill_fail_enc',
      dialogueEnemyId: 'dlg_skill_fail',
      xpReward: 0,
    };
    data.encounters = { dlg_skill_fail_enc: enc };
    let state = createInitialState(testCampaign, 101);
    state.party = [createPlayerCharacter('Hero', 'knight')];
    state = beginEncounter(state, enc, data, { returnScene: 'hub', onVictory: 'won_scene' });
    const after = resolveDialogueChoice(state, 0, data);
    expect(after.dialogueCombat?.nodeId).toBe('bad');
    expect(after.party[0]?.hp).toBe(16);
  });

  it('calvario act1_mirror_twin dialogue graph parses, has convergence hubs, rolls + victory leaves', () => {
    const def = dialogueEnemies.act1_mirror_twin;
    DialogueEnemyDefSchema.parse(def);
    const inc = incomingEdgeCounts(def);
    expect([...inc.values()].some((n) => n > 1)).toBe(true);
    expect((inc.get('h_armistice') ?? 0) + (inc.get('h_winter_edge') ?? 0)).toBeGreaterThanOrEqual(4);
    expect((inc.get('h_calm_echo') ?? 0) + (inc.get('h_burn_merge') ?? 0)).toBeGreaterThanOrEqual(3);
    const victoryLeaves = Object.values(def.graph.nodes).filter((n) => n.terminal === 'victory');
    expect(victoryLeaves.length).toBe(2);
    const rollKinds = new Set<string>();
    for (const node of Object.values(def.graph.nodes)) {
      for (const ch of node.choices ?? []) {
        if (ch.resolution.kind === 'skill' || ch.resolution.kind === 'luck') {
          rollKinds.add(ch.resolution.kind);
        }
      }
    }
    expect(rollKinds.has('skill')).toBe(true);
    expect(rollKinds.has('luck')).toBe(true);
  });

  it('calvario mirror twin: fixed-only choice path reaches victory', () => {
    const def = dialogueEnemies.act1_mirror_twin;
    const data = createTestData();
    data.dialogueEnemies = { act1_mirror_twin: def };
    const enc: Encounter = {
      combatType: 'dialogue',
      id: 'dlg_mirror_enc',
      dialogueEnemyId: 'act1_mirror_twin',
      xpReward: 0,
    };
    data.encounters = { dlg_mirror_enc: enc };
    let state = createInitialState(testCampaign, 42);
    state.party = [createPlayerCharacter('Hero', 'knight')];
    state = beginEncounter(state, enc, data, { returnScene: 'hub', onVictory: 'won_scene' });
    expect(state.mode).toBe('dialogue_combat');
    // root[1] b_soft → b_soft[1] c_soft_b → c_soft_b[2] c_soft_b_wry → linger_irony[0] → gate_release[0] → victory
    const indices = [1, 1, 2, 0, 0, 0];
    for (const idx of indices) {
      state = resolveDialogueChoice(state, idx, data);
    }
    expect(state.mode).toBe('story');
    expect(state.sceneId).toBe('won_scene');
    expect(state.dialogueCombat).toBeNull();
  });
});

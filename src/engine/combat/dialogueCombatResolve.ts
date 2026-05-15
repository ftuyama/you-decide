import { mulberry32, nextRngSeed, roll2d6 } from '../core/rng.ts';
import type {
  DialogueChoiceEffects,
  DialogueCombatLogEntry,
  DialogueEnemyDef,
  DialogueNode,
  GameState,
} from '../schema/index.ts';
import { isDialogueEncounter } from '../schema/index.ts';
import type { GameData } from '../data/gameData.ts';
import { getEffectiveLuck } from '../progression/luck.ts';
import { finishDialogueCombat } from './resolution.ts';
import type { EventBus } from '../core/eventBus.ts';

function bumpRngSeedLocal(state: GameState): GameState {
  return { ...state, rngSeed: (state.rngSeed + 0x1f) >>> 0 };
}

function attrMod(lead: GameState['party'][0], attr: 'str' | 'agi' | 'mind'): number {
  const v =
    attr === 'str' ? lead?.str ?? 0 : attr === 'agi' ? lead?.agi ?? 0 : lead?.mind ?? 0;
  return Math.floor((v - 6) / 2);
}

function applyPercentHpLoss(lead: GameState['party'][0], percent: number): number {
  if (!lead || percent <= 0) return 0;
  const raw = Math.ceil((lead.maxHp * percent) / 100);
  return Math.max(1, raw);
}

export function getCurrentDialogueContext(
  state: GameState,
  data: GameData
): { def: DialogueEnemyDef; node: DialogueNode } | null {
  const d = state.dialogueCombat;
  if (!d) return null;
  const enc = data.encounters[d.encounterId];
  if (!isDialogueEncounter(enc)) return null;
  const def = data.dialogueEnemies[enc.dialogueEnemyId];
  if (!def) return null;
  const node = def.graph.nodes[d.nodeId];
  if (!node) return null;
  return { def, node };
}

/**
 * Resolve uma escolha no confronto verbal; actualiza `dialogueCombat`, `party` e `rngSeed`.
 */
export function resolveDialogueChoice(
  state: GameState,
  choiceIndex: number,
  data: GameData,
  bus?: EventBus
): GameState {
  const d = state.dialogueCombat;
  if (!d) return state;
  const enc = data.encounters[d.encounterId];
  if (!isDialogueEncounter(enc)) return state;
  const dlgDef = data.dialogueEnemies[enc.dialogueEnemyId];
  if (!dlgDef) return state;

  const curNode = dlgDef.graph.nodes[d.nodeId];
  if (!curNode?.choices || choiceIndex < 0 || choiceIndex >= curNode.choices.length) {
    return state;
  }
  const choice = curNode.choices[choiceIndex]!;

  let s = state;
  const log: DialogueCombatLogEntry[] = [...d.log];
  log.push({ kind: 'player_choice', message: choice.textPt });

  let rng = mulberry32(s.rngSeed + d.nodeId.length * 3 + choiceIndex * 17 + 409);
  let nextNodeId: string;
  const res = choice.resolution;
  let rollSucceeded: boolean | undefined;

  if (res.kind === 'fixed') {
    nextNodeId = res.nextNodeId;
    s = { ...s, rngSeed: nextRngSeed(rng) };
  } else if (res.kind === 'skill') {
    const [d1, d2] = roll2d6(rng);
    const lead = s.party[0];
    const mod = attrMod(lead, res.attr);
    const total = d1 + d2 + mod;
    const ok = total >= res.tn;
    rollSucceeded = ok;
    nextNodeId = ok ? res.successNodeId : res.failNodeId;
    log.push({
      kind: 'roll',
      message: `Teste (${res.attr.toUpperCase()}): [${d1}][${d2}] +${mod} = ${total} vs TN ${res.tn} → ${ok ? 'sucesso' : 'falha'}.`,
      dice: [d1, d2],
      modifier: mod,
      final: total,
    });
    s = { ...s, rngSeed: nextRngSeed(rng) };
  } else {
    const [d1, d2] = roll2d6(rng);
    const lead = s.party[0];
    const effLuck = lead ? getEffectiveLuck(lead, data, s) : 8;
    const mod = Math.floor((effLuck - 6) / 2);
    const penalty = res.luckPenalty ?? 0;
    const total = d1 + d2 + mod - penalty;
    const ok = total >= res.tn;
    rollSucceeded = ok;
    nextNodeId = ok ? res.successNodeId : res.failNodeId;
    const curseBit = penalty > 0 ? ` −${penalty} (maldição)` : '';
    log.push({
      kind: 'roll',
      message: `Sorte: [${d1}][${d2}] +${mod}${curseBit} = ${total} vs TN ${res.tn} → ${ok ? 'sucesso' : 'falha'}.`,
      dice: [d1, d2],
      modifier: mod,
      final: total,
    });
    s = { ...s, rngSeed: nextRngSeed(rng) };
  }

  s = bumpRngSeedLocal(s);

  const effectBlocks: DialogueChoiceEffects[] = [];
  if (choice.effects) effectBlocks.push(choice.effects);
  if (rollSucceeded !== undefined) {
    const branch = rollSucceeded ? choice.effectsOnSuccess : choice.effectsOnFailure;
    if (branch) effectBlocks.push(branch);
  }

  let party = s.party;
  let tensionHp = d.tensionHp;

  for (const eff of effectBlocks) {
    if (eff.playerHpLossPercent != null && eff.playerHpLossPercent > 0) {
      const lead = party[0];
      if (lead) {
        const loss = applyPercentHpLoss(lead, eff.playerHpLossPercent);
        const hp = Math.max(0, lead.hp - loss);
        party = [{ ...lead, hp }, ...party.slice(1)];
        if (loss > 0) {
          log.push({
            kind: 'leader_damage',
            message: `A tensão do reflexo arranca-te ${loss} HP.`,
          });
        }
      }
    }

    if (eff.enemyHpDelta != null && eff.enemyHpDelta !== 0) {
      tensionHp = Math.min(d.tensionMax, Math.max(0, tensionHp + eff.enemyHpDelta));
      log.push({
        kind: 'tension_shift',
        message:
          eff.enemyHpDelta < 0
            ? `A hostilidade arrefece (${-eff.enemyHpDelta}).`
            : `A hostilidade aguça (+${eff.enemyHpDelta}).`,
        hostilityDelta: eff.enemyHpDelta,
      });
    }
  }

  const leadHp = party[0]?.hp ?? 0;
  if (leadHp <= 0) {
    const sEnd: GameState = {
      ...s,
      party,
      dialogueCombat: { ...d, tensionHp, log },
    };
    return finishDialogueCombat(sEnd, false, data, bus);
  }

  if (tensionHp <= 0) {
    log.push({
      kind: 'info',
      message: 'A hostilidade do reflexo esgota-se — respiras sem a armadura apertar.',
    });
    const sWin: GameState = {
      ...s,
      party,
      dialogueCombat: { ...d, tensionHp: 0, log },
    };
    return finishDialogueCombat(sWin, true, data, bus);
  }

  const nextNode = dlgDef.graph.nodes[nextNodeId];
  if (!nextNode) {
    return state;
  }

  log.push({ kind: 'interlocutor_line', message: nextNode.linePt });

  if (nextNode.terminal === 'victory') {
    const sWin: GameState = {
      ...s,
      party,
      dialogueCombat: { ...d, tensionHp, nodeId: nextNodeId, log },
    };
    return finishDialogueCombat(sWin, true, data, bus);
  }

  const dialogueCombatNext = {
    ...d,
    tensionHp,
    nodeId: nextNodeId,
    log,
  };
  return { ...s, party, dialogueCombat: dialogueCombatNext };
}

import { mulberry32 } from '../rng.ts';
import type {
  CombatState,
  EnemyLootDrop,
  GameState,
} from '../schema.ts';
import type { GameData } from '../gameData.ts';
import { extraLifeReadyFromFaith } from '../state.ts';
import { tickActiveBuffs } from '../leadStats.ts';
import { addXp, computeCombatXp } from '../progression.ts';
import type { EventBus } from '../eventBus.ts';

/** Milagre: −5 fé, HP a metade do máximo, combate termina em narrativa em returnScene (sem vitória nem derrota). */
export function finishCombatFaithRescue(
  state: GameState,
  c: CombatState,
  data: GameData,
  bus?: EventBus
): GameState {
  const lead = state.party[0];
  if (!lead) {
    return finishCombat(state, c, false, data, bus);
  }
  const newFaith = Math.max(0, state.resources.faith - 5);
  const newHp = Math.max(1, Math.ceil(lead.maxHp / 2));
  const party = state.party.map((p, i) => (i === 0 ? { ...p, hp: newHp } : p));
  const resources = { ...state.resources, faith: newFaith };
  bus?.emit({ type: 'faith.miracle' });
  let s: GameState = {
    ...state,
    party,
    resources,
    extraLifeReady: extraLifeReadyFromFaith(resources.faith),
    lastCombatXpGain: null,
    lastCombatLevelUps: null,
    lastCombatLootLines: null,
  };
  s = reducePartyStressAfterCombat(s);
  s = tickActiveBuffs({
    ...s,
    mode: 'story',
    combat: null,
    sceneId: c.returnScene,
  });
  return s;
}

export function reducePartyStressAfterCombat(state: GameState): GameState {
  const party = state.party.map((member) => ({
    ...member,
    stress: Math.max(0, member.stress - 1),
  }));
  return { ...state, party };
}

export function finishCombat(
  state: GameState,
  c: CombatState,
  victory: boolean,
  data: GameData,
  bus?: EventBus
): GameState {
  /** `??` não trata string vazia; cena inválida travaria a navegação. */
  const pick = (id: string | undefined, fallback: string): string => {
    const t = id?.trim();
    return t && t.length > 0 ? t : fallback;
  };
  const next = victory
    ? pick(c.onVictory ?? c.returnScene, c.returnScene)
    : pick(c.onDefeat, 'shared/game_over');
  let s = state;
  if (victory) {
    const { state: afterLoot, lootLines } = applyEnemyLootOnVictory(s, c, data);
    s = afterLoot;
    let xpGain = 0;
    let lastCombatLevelUps: GameState['lastCombatLevelUps'] = null;
    const enc = data.encounters[c.encounterId];
    if (enc) {
      xpGain = computeCombatXp(enc, data);
      if (xpGain > 0) {
        const { state: afterXp, levelUps } = addXp(s, xpGain, { bus, data });
        s = afterXp;
        lastCombatLevelUps = levelUps.length > 0 ? levelUps : null;
      }
    }
    s = {
      ...s,
      lastCombatXpGain: xpGain > 0 ? xpGain : null,
      lastCombatLevelUps,
      lastCombatLootLines: lootLines.length > 0 ? lootLines : null,
    };
    bus?.emit({ type: 'combat.end', victory: true });
  } else {
    s = {
      ...s,
      lastCombatXpGain: null,
      lastCombatLevelUps: null,
      lastCombatLootLines: null,
    };
    bus?.emit({ type: 'combat.end', victory: false });
  }
  s = reducePartyStressAfterCombat(s);
  return tickActiveBuffs({
    ...s,
    mode: 'story',
    combat: null,
    sceneId: next,
  });
}

function combatVictoryResourceLootLine(
  resource: 'gold' | 'supply' | 'faith' | 'corruption',
  amount: number
): string {
  const n = amount;
  switch (resource) {
    case 'gold':
      return n === 1 ? '+1 ouro' : `+${n} ouro`;
    case 'supply':
      return n === 1 ? '+1 suprimento' : `+${n} suprimento`;
    case 'faith':
      return n === 1 ? '+1 fé' : `+${n} fé`;
    case 'corruption':
      return n === 1 ? '+1 corrupção' : `+${n} corrupção`;
  }
}

function applyEnemyLootOnVictory(
  state: GameState,
  c: CombatState,
  data: GameData
): { state: GameState; lootLines: string[] } {
  let s = state;
  const lootLines: string[] = [];
  const rng = mulberry32(state.rngSeed + c.round * 131 + c.enemies.length * 17);
  for (const inst of c.enemies) {
    const def = data.enemies[inst.defId];
    if (!def?.lootDrops?.length) continue;
    for (const drop of def.lootDrops) {
      if (rng() >= drop.chance) continue;
      const next = applySingleLootDrop(s, drop, data);
      if (next === s) continue;
      s = next;
      if ('itemId' in drop) {
        const item = data.items[drop.itemId];
        lootLines.push(item ? `+ ${item.name}` : `+ ${drop.itemId}`);
      } else {
        lootLines.push(combatVictoryResourceLootLine(drop.resource, drop.amount ?? 1));
      }
    }
  }
  return { state: s, lootLines };
}

function applySingleLootDrop(state: GameState, drop: EnemyLootDrop, data: GameData): GameState {
  if ('itemId' in drop) {
    const item = data.items[drop.itemId];
    if (!item) return state;
    const stackable = item.slot === 'consumable';
    if (!stackable && state.inventory.includes(drop.itemId)) return state;
    return { ...state, inventory: [...state.inventory, drop.itemId] };
  }
  const amount = drop.amount ?? 1;
  const r = drop.resource;
  if (r === 'gold') {
    const before = state.resources.gold ?? 0;
    return {
      ...state,
      resources: { ...state.resources, gold: Math.max(0, Math.min(999, before + amount)) },
    };
  }
  if (r === 'supply') {
    const before = state.resources.supply;
    return {
      ...state,
      resources: { ...state.resources, supply: Math.max(0, Math.min(10, before + amount)) },
    };
  }
  if (r === 'faith') {
    const before = state.resources.faith;
    const faith = Math.max(0, Math.min(5, before + amount));
    return {
      ...state,
      resources: { ...state.resources, faith },
      extraLifeReady: extraLifeReadyFromFaith(faith),
    };
  }
  const before = state.resources.corruption;
  return {
    ...state,
    resources: { ...state.resources, corruption: Math.max(0, Math.min(10, before + amount)) },
  };
}

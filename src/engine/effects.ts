import type { Effect, GameState } from './schema';
import { CampaignIndexSchema, GameStateSchema } from './schema';
import type { EventBus } from './eventBus';
import { beginEncounter } from './combat';
import type { GameData } from './gameData';
import { addXp } from './progression';
import { createInitialState, createPlayerCharacter } from './state';
import { DEFAULT_HERO_NAME } from '../campaigns/calvario/classHero';
import campaignIndex from '../campaigns/calvario/index.json';

function clampRep(n: number): number {
  return Math.max(-3, Math.min(3, n));
}

export function applyEffects(
  state: GameState,
  effects: Effect[],
  ctx: { sceneId: string; data: GameData; bus: EventBus }
): GameState {
  let s: GameState = { ...state, party: state.party.map((p) => ({ ...p })) };
  for (const e of effects) {
    s = applyOne(s, e, ctx);
  }
  return GameStateSchema.parse(s);
}

function applyOne(
  state: GameState,
  e: Effect,
  ctx: { sceneId: string; data: GameData; bus: EventBus }
): GameState {
  const bus = ctx.bus;
  switch (e.op) {
    case 'setFlag':
      bus.emit({ type: 'effect.applied', op: e.op });
      return { ...state, flags: { ...state.flags, [e.key]: e.value } };
    case 'toggleFlag': {
      const cur = !!state.flags[e.key];
      return { ...state, flags: { ...state.flags, [e.key]: !cur } };
    }
    case 'addMark':
      if (state.marks.includes(e.mark)) return state;
      return { ...state, marks: [...state.marks, e.mark] };
    case 'removeMark':
      return { ...state, marks: state.marks.filter((m) => m !== e.mark) };
    case 'addRep': {
      const faction = e.faction;
      const prev = state.reputation[faction] ?? 0;
      const value = clampRep(prev + e.delta);
      bus.emit({ type: 'reputation.changed', faction, value });
      return {
        ...state,
        reputation: { ...state.reputation, [faction]: value },
      };
    }
    case 'setRep':
      bus.emit({ type: 'reputation.changed', faction: e.faction, value: e.value });
      return {
        ...state,
        reputation: { ...state.reputation, [e.faction]: clampRep(e.value) },
      };
    case 'addResource': {
      const r = { ...state.resources };
      const k = e.resource;
      r[k] = Math.max(0, Math.min(10, r[k] + e.delta));
      return { ...state, resources: r };
    }
    case 'setChapter':
      return { ...state, chapter: e.chapter };
    case 'setNarrativeTier':
      return { ...state, narrativeTier: e.tier };
    case 'grantItem':
      if (state.inventory.includes(e.itemId)) return state;
      return { ...state, inventory: [...state.inventory, e.itemId] };
    case 'removeItem':
      return { ...state, inventory: state.inventory.filter((i) => i !== e.itemId) };
    case 'goto':
      return { ...state, sceneId: e.sceneId, mode: 'story' };
    case 'addDiary':
      return { ...state, diary: [...state.diary, e.text] };
    case 'startCombat': {
      const enc = ctx.data.encounters[e.encounterId];
      if (!enc) {
        console.error(`Encounter not found: ${e.encounterId} @ ${ctx.sceneId}`);
        return state;
      }
      bus.emit({ type: 'combat.start', encounterId: e.encounterId });
      return beginEncounter(state, enc, ctx.data, {
        returnScene: ctx.sceneId,
        onVictory: e.onVictory,
        onFlee: e.onFlee,
        onDefeat: e.onDefeat,
      });
    }
    case 'recruit': {
      const def = ctx.data.companions[e.companionId];
      if (!def) return state;
      if (state.party.length >= 3) return state;
      if (state.party.some((p) => p.id === e.companionId)) return state;
      const companion = {
        id: def.id,
        name: def.name,
        class: 'knight' as const,
        str: def.str,
        agi: def.agi,
        mind: def.mind,
        hp: def.hp,
        maxHp: def.maxHp,
        stress: 0,
        weaponId: null,
        armorId: null,
        relicId: null,
        specialUsedThisCombat: false,
      };
      return {
        ...state,
        party: [...state.party, companion],
        companionsAvailable: state.companionsAvailable.filter((c) => c !== e.companionId),
      };
    }
    case 'dismissCompanion':
      return {
        ...state,
        party: state.party.filter((p) => p.id !== e.companionId),
      };
    case 'setAsciiMap':
      return {
        ...state,
        asciiMap: { mapId: e.mapId, playerX: e.playerX, playerY: e.playerY },
      };
    case 'clearAsciiMap':
      return { ...state, asciiMap: null };
    case 'initClass': {
      const heroName = DEFAULT_HERO_NAME[e.class];
      const pc = createPlayerCharacter(heroName, e.class);
      return { ...state, party: [pc], playerName: heroName, level: 1, xp: 0 };
    }
    case 'addXp': {
      return addXp(state, e.amount, { bus });
    }
    case 'resetRun': {
      const idx = CampaignIndexSchema.parse(campaignIndex);
      return createInitialState(idx.entryScene, state.rngSeed);
    }
    default:
      return state;
  }
}

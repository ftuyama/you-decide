import type { Effect, GameState } from '../schema/index.ts';
import { GameStateSchema } from '../schema/index.ts';
import type { EventBus } from './eventBus.ts';
import { beginEncounter } from '../combat/encounter.ts';
import type { GameData } from '../data/gameData.ts';
import { pickWildOutcome, wildEncounterVictoryOverride } from '../world/exploration.ts';
import { addXp } from '../progression/progression.ts';
import { initialKnownSpellIds } from '../progression/spellsKnown.ts';
import {
  createInitialState,
  createPlayerCharacter,
  extraLifeReadyFromFaith,
  syncLeadPassiveStats,
} from './state.ts';
import { clampLeadStat, tickActiveBuffs, type LeadStatAttr } from '../progression/leadStats.ts';
import {
  adjustCompanionFriendshipScore,
  FRIENDSHIP_INITIAL_RECRUIT,
  getCompanionFriendshipScore,
  notifyCompanionFriendshipChange,
  syncCompanionPartyWithFriendship,
} from '../progression/companionFriendship.ts';
import { applyConsumableToCharacter, isConsumable, removeOneInventoryItem } from '../progression/consumables.ts';
import { injectText } from './template.ts';
import {
  clampReputation,
  computeAddRepResult,
  defaultFactionGainPending,
  hasFactionPerkUnlocked,
} from '../progression/reputation.ts';

export { tickActiveBuffs };

import {
  ATTR_LABEL,
  displayTitleForMark,
  humanizeMarkId,
  RESOURCE_LABEL,
  RESOURCE_MAX,
  resourceDebuffSubtitle,
  resourceGainSubtitle,
} from './effects/labels.ts';
import { emitReputationUi } from './effects/reputationUi.ts';
import {
  buildCompoundLegacyFlags,
  buildLegacySummary,
  computeLegacyEchoGain,
  resolveLegacyTitle,
  uniqueTitles,
} from './effects/legacySummary.ts';

export { displayTitleForMark };

/** Validação Zod completa só em dev; em build de produção confia nos ramos de `applyOne` (save/load valida à parte). */
function finalizeAppliedState(s: GameState): GameState {
  if (import.meta.env.DEV) {
    return GameStateSchema.parse(s);
  }
  return s;
}

export function applyEffects(
  state: GameState,
  effects: Effect[],
  ctx: { sceneId: string; data: GameData; bus: EventBus }
): GameState {
  let s: GameState = { ...state, party: state.party.map((p) => ({ ...p })) };
  for (const e of effects) {
    s = applyOne(s, e, ctx);
    s = syncLeadPassiveStats(s);
  }
  return finalizeAppliedState(s);
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
    case 'addMark': {
      if (state.marks.includes(e.mark)) return state;
      const isBad =
        /wound|curse|maled|bleed|fract|broken|rot|po[cç]o|mire|hex|scarred|spoiled|snare|burned|taint|torn|jarred/i.test(
          e.mark
        );
      bus.emit({
        type: 'statusHighlight',
        variant: isBad ? 'bad' : 'neutral',
        title: displayTitleForMark(e.mark, ctx.data),
        subtitle: 'Nova marca no personagem',
        ...(isBad ? { autoDismissMs: 0 } : {}),
      });
      return { ...state, marks: [...state.marks, e.mark] };
    }
    case 'removeMark':
      return { ...state, marks: state.marks.filter((m) => m !== e.mark) };
    case 'grantLeadStoryPassive': {
      if (state.leadStoryPassives.includes(e.id)) return state;
      const def = ctx.data.leadStoryPassives[e.id];
      bus.emit({
        type: 'statusHighlight',
        variant: 'neutral',
        title: def?.name ?? humanizeMarkId(e.id),
        subtitle: 'Novo passivo de história',
      });
      return { ...state, leadStoryPassives: [...state.leadStoryPassives, e.id] };
    }
    case 'addRep': {
      const faction = e.faction;
      const prev = state.reputation[faction] ?? 0;
      const fgp = state.factionGainPending ?? defaultFactionGainPending();
      const pendingIn: 0 | 1 = fgp[faction] === 1 ? 1 : 0;

      if (e.delta === 0) {
        return state;
      }

      const { rep, pending } = computeAddRepResult({
        prevRep: prev,
        pending: pendingIn,
        delta: e.delta,
        directGain: e.directGain,
      });

      bus.emit({ type: 'reputation.changed', faction, value: rep });

      if (rep !== prev) {
        emitReputationUi(bus, faction, prev, rep, 'standing');
      } else if (e.delta > 0 && e.directGain) {
        emitReputationUi(bus, faction, prev, rep, 'cappedDirect');
      } else if (e.delta > 0 && !e.directGain) {
        emitReputationUi(bus, faction, prev, rep, 'slowLedger');
      }

      const isDirectPositiveGain = e.delta > 0 && e.directGain === true;
      const unlockedCirculoPerkNow =
        faction === 'circulo' && !hasFactionPerkUnlocked(prev) && hasFactionPerkUnlocked(rep);
      const nextFlags: Record<string, boolean> = {
        ...state.flags,
        add_rep_ever: true,
      };
      if (state.flags['ui_faccoes_intro_shown'] !== true) {
        nextFlags['ui_faccoes_intro_shown'] = true;
        bus.emit({
          type: 'statusHighlight',
          variant: 'good',
          title: 'Facções desbloqueadas',
          subtitle:
            'Agora podes ver o tabuleiro de reputação na barra lateral (Vigília, Círculo, Culto).',
        });
      }
      if (isDirectPositiveGain) {
        return {
          ...state,
          flags: nextFlags,
          reputation: { ...state.reputation, [faction]: rep },
          ...(unlockedCirculoPerkNow ? { circuloSkillRerollReady: true } : {}),
        };
      }

      return {
        ...state,
        flags: nextFlags,
        reputation: { ...state.reputation, [faction]: rep },
        factionGainPending: { ...fgp, [faction]: pending },
        ...(unlockedCirculoPerkNow ? { circuloSkillRerollReady: true } : {}),
      };
    }
    case 'setRep': {
      const prev = state.reputation[e.faction] ?? 0;
      const next = clampReputation(e.value);
      bus.emit({ type: 'reputation.changed', faction: e.faction, value: next });
      if (next !== prev) {
        emitReputationUi(bus, e.faction, prev, next, 'standing');
      }
      return {
        ...state,
        reputation: { ...state.reputation, [e.faction]: next },
      };
    }
    case 'addResource': {
      const r = { ...state.resources };
      let actual = 0;
      const res = e.resource;
      if (res === 'gold') {
        const before = r.gold ?? 0;
        r.gold = Math.max(0, Math.min(RESOURCE_MAX.gold, before + e.delta));
        actual = r.gold - before;
      } else if (res === 'supply') {
        const before = r.supply;
        r.supply = Math.max(0, Math.min(RESOURCE_MAX.supply, r.supply + e.delta));
        actual = r.supply - before;
      } else if (res === 'faith') {
        const before = r.faith;
        r.faith = Math.max(0, Math.min(RESOURCE_MAX.faith, r.faith + e.delta));
        actual = r.faith - before;
      } else {
        const before = r.corruption;
        r.corruption = Math.max(0, Math.min(RESOURCE_MAX.corruption, r.corruption + e.delta));
        actual = r.corruption - before;
      }
      if (actual !== 0) {
        const isDebuff =
          (res === 'corruption' && actual > 0) ||
          (res === 'faith' && actual < 0) ||
          (res === 'supply' && actual < 0) ||
          (res === 'gold' && actual < 0);
        bus.emit({
          type: 'statusHighlight',
          variant: isDebuff ? 'debuff' : 'good',
          title: `${RESOURCE_LABEL[res]} ${actual > 0 ? '+' : ''}${actual}`,
          subtitle: isDebuff ? resourceDebuffSubtitle(res) : resourceGainSubtitle(res),
          ...(isDebuff ? { autoDismissMs: 0 } : {}),
        });
      }
      return {
        ...state,
        resources: r,
        extraLifeReady: extraLifeReadyFromFaith(r.faith),
      };
    }
    case 'advanceDay': {
      const nextDay = (state.day ?? 1) + 1;
      bus.emit({ type: 'time.dayAdvanced', day: nextDay });
      return GameStateSchema.parse({ ...state, day: nextDay });
    }
    case 'campRest': {
      if (state.resources.supply < 1) return state;
      bus.emit({ type: 'camp.rest' });
      const res = { ...state.resources, supply: state.resources.supply - 1 };
      const party = state.party.map((p) => ({
        ...p,
        hp: p.maxHp,
        mana: p.maxMana,
        stress: 0,
      }));
      return GameStateSchema.parse({
        ...state,
        resources: res,
        party,
        circuloSkillRerollReady: true,
      });
    }
    case 'setChapter':
      return { ...state, chapter: e.chapter };
    case 'grantItem': {
      const def = ctx.data.items[e.itemId];
      if (!def) return state;
      const stackable = isConsumable(def);
      if (!stackable && state.inventory.includes(e.itemId)) return state;
      bus.emit({ type: 'item.acquired', itemId: e.itemId });
      return { ...state, inventory: [...state.inventory, e.itemId] };
    }
    case 'removeItem': {
      const next = removeOneInventoryItem(state.inventory, e.itemId);
      if (!next) return state;
      return { ...state, inventory: next };
    }
    case 'equipItem': {
      const idx = e.partyIndex ?? 0;
      const target = state.party[idx];
      if (!target) return state;
      const def = ctx.data.items[e.itemId];
      if (!def) return state;
      if (def.slot === 'consumable') return state;
      const inInv = state.inventory.includes(e.itemId);
      const alreadyEquipped =
        target.weaponId === e.itemId ||
        target.armorId === e.itemId ||
        target.relicId === e.itemId;
      if (!inInv && !alreadyEquipped) return state;
      const key =
        def.slot === 'weapon' ? 'weaponId' : def.slot === 'armor' ? 'armorId' : 'relicId';
      if (target[key] === e.itemId) return state;
      let inv = [...state.inventory];
      if (inInv) {
        const ix = inv.indexOf(e.itemId);
        if (ix >= 0) inv = [...inv.slice(0, ix), ...inv.slice(ix + 1)];
      }
      const prev = target[key];
      if (prev && prev !== e.itemId) inv = [...inv, prev];
      return {
        ...state,
        inventory: inv,
        party: state.party.map((p, i) => (i === idx ? { ...p, [key]: e.itemId } : p)),
      };
    }
    case 'unequipSlot': {
      const idx = e.partyIndex ?? 0;
      const target = state.party[idx];
      if (!target) return state;
      const key =
        e.slot === 'weapon' ? 'weaponId' : e.slot === 'armor' ? 'armorId' : 'relicId';
      const prev = target[key];
      if (!prev) return state;
      let inv = [...state.inventory];
      if (!inv.includes(prev)) inv = [...inv, prev];
      return {
        ...state,
        inventory: inv,
        party: state.party.map((p, i) => (i === idx ? { ...p, [key]: null } : p)),
      };
    }
    case 'goto':
      return { ...state, sceneId: e.sceneId, mode: 'story' };
    case 'addDiary': {
      const line = injectText(e.text, state);
      bus.emit({ type: 'diary.entryAdded', text: line });
      return { ...state, diary: [...state.diary, line] };
    }
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
    case 'startWildEncounterFromGraph': {
      const pick = pickWildOutcome(state, e.graphId);
      let s: GameState = { ...state, rngSeed: pick.nextSeed };
      const returnTo = e.returnSceneId ?? ctx.sceneId;
      if (pick.kind === 'scene') {
        return tickActiveBuffs({ ...s, sceneId: pick.sceneId, mode: 'story' });
      }
      const enc = ctx.data.encounters[pick.encounterId];
      if (!enc) {
        console.error(`Encounter not found: ${pick.encounterId} @ ${ctx.sceneId}`);
        return s;
      }
      const onVictory = wildEncounterVictoryOverride(e.graphId, pick.encounterId) ?? returnTo;
      bus.emit({ type: 'combat.start', encounterId: pick.encounterId });
      return beginEncounter(s, enc, ctx.data, {
        returnScene: returnTo,
        onVictory,
        onFlee: returnTo,
        onDefeat: 'shared/game_over',
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
        luck: def.luck ?? 8,
        mana: 0,
        maxMana: 0,
        hp: def.hp,
        maxHp: def.maxHp,
        stress: 0,
        weaponId: null,
        armorId: null,
        relicId: null,
        critRatio: 0,
        specialUsedThisCombat: false,
        path: null,
      };
      const priorFriend = state.companionFriendship[e.companionId];
      const friendScore =
        priorFriend !== undefined ? priorFriend : FRIENDSHIP_INITIAL_RECRUIT;
      const withFriend: GameState = {
        ...state,
        party: [...state.party, companion],
        companionsAvailable: state.companionsAvailable.filter((c) => c !== e.companionId),
        companionFriendship: {
          ...state.companionFriendship,
          [e.companionId]: friendScore,
        },
      };
      return syncCompanionPartyWithFriendship(withFriend, ctx.data);
    }
    case 'dismissCompanion':
      return {
        ...state,
        party: state.party.filter((p) => p.id !== e.companionId),
      };
    case 'setAsciiMap':
      return {
        ...state,
        asciiMap: { mapId: e.mapId },
      };
    case 'clearAsciiMap':
      return { ...state, asciiMap: null };
    case 'setExploration': {
      const cur = state.exploration;
      if (cur && cur.graphId === e.graphId && cur.nodeId === e.nodeId) {
        return state;
      }
      return {
        ...state,
        exploration: { graphId: e.graphId, nodeId: e.nodeId },
      };
    }
    case 'clearExploration':
      return { ...state, exploration: null };
    case 'adjustLeadStress': {
      const lead = state.party[0];
      if (!lead) return state;
      const next = Math.max(0, Math.min(4, lead.stress + e.delta));
      return {
        ...state,
        party: state.party.map((p, i) => (i === 0 ? { ...p, stress: next } : p)),
      };
    }
    case 'initClass': {
      const heroName = ctx.data.heroNarrative.defaultHeroName(e.class);
      const pc = createPlayerCharacter(heroName, e.class);
      const knownSpells = initialKnownSpellIds(pc, ctx.data);
      return {
        ...state,
        party: [pc],
        playerName: heroName,
        level: 1,
        xp: 0,
        knownSpells,
        inventory: state.inventory,
      };
    }
    case 'learnSpell': {
      const sp = ctx.data.spells[e.spellId];
      if (!sp) return state;
      if (state.knownSpells.includes(e.spellId)) return state;
      bus.emit({
        type: 'statusHighlight',
        variant: 'good',
        title: `Magia: ${sp.name}`,
        subtitle: 'Nova magia aprendida',
      });
      return { ...state, knownSpells: [...state.knownSpells, e.spellId] };
    }
    case 'addXp': {
      return addXp(state, e.amount, { bus, data: ctx.data }).state;
    }
    case 'addMana': {
      const lead = state.party[0];
      if (!lead) return state;
      const nm = Math.max(0, Math.min(lead.maxMana, lead.mana + e.amount));
      return {
        ...state,
        party: state.party.map((p, i) => (i === 0 ? { ...p, mana: nm } : p)),
      };
    }
    case 'setPath': {
      const lead = state.party[0];
      if (!lead) return state;
      let s: GameState = {
        ...state,
        party: state.party.map((p, i) => (i === 0 ? { ...p, path: e.path } : p)),
        lastPathPromotion: null,
      };
      if (e.path) {
        const label = ctx.data.heroNarrative.getHeroClassLabel(lead.class, e.path);
        const bonus = ctx.data.heroNarrative.getPathUnlockBonus(lead.class, e.path);
        if (bonus) {
          if (bonus.stats) {
            for (const key of ['str', 'agi', 'mind', 'luck'] as const) {
              const delta = bonus.stats[key];
              if (delta !== undefined && delta !== 0) {
                s = applyOne(s, { op: 'adjustLeadStat', attr: key, delta }, ctx);
              }
            }
          }
          if (bonus.addXp !== undefined && bonus.addXp > 0) {
            s = applyOne(s, { op: 'addXp', amount: bonus.addXp }, ctx);
          }
          if (bonus.addResource) {
            s = applyOne(s, {
              op: 'addResource',
              resource: bonus.addResource.resource,
              delta: bonus.addResource.delta,
            }, ctx);
          }
        }
        const narrativePt = ctx.data.heroNarrative.getPathPromotionNarrativePt(lead.class, e.path);
        s = {
          ...s,
          lastPathPromotion:
            narrativePt != null
              ? { label, narrativePt }
              : { label },
        };
      }
      return s;
    }
    case 'adjustLeadStat': {
      const lead = state.party[0];
      if (!lead) return state;
      const attr = e.attr as LeadStatAttr;
      const cur = lead[attr];
      const nextVal = clampLeadStat(attr, cur + e.delta);
      const actual = nextVal - cur;
      if (actual !== 0) {
        const label = ATTR_LABEL[attr];
        bus.emit({
          type: 'statusHighlight',
          variant: actual < 0 ? 'bad' : 'good',
          title: `${label} ${actual > 0 ? '+' : ''}${actual}`,
          subtitle:
            actual < 0
              ? 'Efeito permanente no personagem'
              : 'Melhoria permanente no personagem',
        });
      }
      return {
        ...state,
        party: state.party.map((p, i) => (i === 0 ? { ...p, [attr]: nextVal } : p)),
      };
    }
    case 'multiplyLeadHp': {
      const lead = state.party[0];
      if (!lead) return state;
      const f = e.factor;
      const newMaxHp = Math.max(1, Math.floor(lead.maxHp * f));
      const newHp = Math.min(newMaxHp, Math.max(1, Math.floor(lead.hp * f)));
      const lostMax = lead.maxHp - newMaxHp;
      bus.emit({
        type: 'statusHighlight',
        variant: 'bad',
        title: lostMax > 0 ? `−${lostMax} PV máx.` : `PV máx. ${newMaxHp}`,
        subtitle: 'O altar cobra quem recua — carne e teto de vida',
      });
      return {
        ...state,
        party: state.party.map((p, i) =>
          i === 0 ? { ...p, maxHp: newMaxHp, hp: newHp } : p,
        ),
      };
    }
    case 'grantTemporaryBuff': {
      const id = `buff_${ctx.sceneId}_${state.rngSeed}_${e.attr}_${state.activeBuffs.length}`;
      const label = ATTR_LABEL[e.attr as LeadStatAttr];
      bus.emit({
        type: 'statusHighlight',
        variant: e.delta >= 0 ? 'good' : 'bad',
        title: `${label} ${e.delta >= 0 ? '+' : ''}${e.delta} · ${e.remainingScenes} cena(s)`,
        subtitle: 'Buff temporário (decresce ao mudar de cena)',
      });
      return {
        ...state,
        activeBuffs: [
          ...state.activeBuffs,
          {
            id,
            attr: e.attr,
            delta: e.delta,
            remainingScenes: e.remainingScenes,
          },
        ],
        rngSeed: (state.rngSeed + 0x9e37) >>> 0,
      };
    }
    case 'useConsumable': {
      const def = ctx.data.items[e.itemId];
      if (!def || !isConsumable(def)) return state;
      const ti = e.targetIndex ?? 0;
      if (ti < 0 || ti >= state.party.length) return state;
      const target = state.party[ti];
      if (!target || target.hp <= 0) return state;
      const inv = removeOneInventoryItem(state.inventory, e.itemId);
      if (!inv) return state;
      const updated = applyConsumableToCharacter(def, target);
      const party = state.party.map((p, i) => (i === ti ? updated : p));
      bus.emit({
        type: 'statusHighlight',
        variant: 'good',
        title: def.name,
        subtitle: ti === 0 ? 'Usada' : `Usada em ${target.name}`,
      });
      return { ...state, inventory: inv, party };
    }
    case 'adjustCompanionFriendship': {
      const key = e.onceFlag;
      if (key && state.flags[key]) return state;
      const before = getCompanionFriendshipScore(state, e.companionId);
      let s = adjustCompanionFriendshipScore(state, e.companionId, e.delta);
      const after = getCompanionFriendshipScore(s, e.companionId);
      s = syncCompanionPartyWithFriendship(s, ctx.data);
      if (key) {
        s = { ...s, flags: { ...s.flags, [key]: true } };
      }
      notifyCompanionFriendshipChange(ctx.bus, ctx.data, e.companionId, before, after);
      return s;
    }
    case 'registerEnding': {
      const id = e.endingId.trim();
      if (!id) return state;
      const cur = state.legacy?.discoveredEndings ?? [];
      if (cur.includes(id)) return state;
      return {
        ...state,
        legacy: {
          ...state.legacy,
          discoveredEndings: [...cur, id],
        },
      };
    }
    case 'resetRun': {
      const gain = computeLegacyEchoGain(state);
      const title = resolveLegacyTitle(state);
      const nextLegacy: GameState['legacy'] = {
        echoes: Math.max(0, (state.legacy?.echoes ?? 0) + gain),
        titles: uniqueTitles([...(state.legacy?.titles ?? []), title]),
        discoveredEndings: [...(state.legacy?.discoveredEndings ?? [])],
        lastRunSummary: buildLegacySummary(state),
        lastRunEchoGain: gain,
      };
      const next = createInitialState(ctx.data.campaign, state.rngSeed);
      const legacyFlags = buildCompoundLegacyFlags(state);
      return {
        ...next,
        legacy: nextLegacy,
        flags: { ...next.flags, ...legacyFlags },
        diary: [
          ...next.diary,
          `${nextLegacy.lastRunSummary} +${gain} ecos herdados; título registrado: ${title}.`,
        ],
      };
    }
    default:
      return state;
  }
}

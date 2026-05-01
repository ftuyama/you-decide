import { SCHEMA_VERSION, type CampaignIndex, type ClassId, type GameState } from './schema.ts';
import { parseSeedFromSearch } from './rng.ts';

const defaultRep = { vigilia: 0, circulo: 0, culto: 0 } as GameState['reputation'];
export const PASSIVE_UNLOCK_ITEM_ID = 'morvayn_heart_shard';
const KNIGHT_PASSIVE_CRIT_RATIO_BONUS = 0.03;

/** Vida extra automática: fé >= 5 (sem acúmulo além da disponibilidade). */
export function extraLifeReadyFromFaith(faith: number): boolean {
  return faith >= 5;
}

export function createInitialState(campaign: CampaignIndex, seed?: number): GameState {
  const rngSeed = (seed ?? parseSeedFromSearch() ?? Date.now()) >>> 0;
  return {
    schemaVersion: SCHEMA_VERSION,
    campaignId: campaign.id,
    rngSeed,
    chapter: 1,
    narrativeTier: 1,
    sceneId: campaign.entryScene,
    playerName: 'Viajante',
    level: 1,
    xp: 0,
    day: 1,
    party: [],
    companionsAvailable: [...campaign.startingCompanionPool],
    inventory: [],
    reputation: { ...defaultRep },
    factionGainPending: { vigilia: 0, circulo: 0, culto: 0 },
    flags: {},
    marks: [],
    legacy: { echoes: 0, titles: [], lastRunSummary: '', lastRunEchoGain: 0 },
    leadStoryPassives: [],
    resources: { supply: 5, faith: 3, corruption: 0, gold: 8 },
    extraLifeReady: false,
    combat: null,
    mode: 'story',
    modal: null,
    diary: [],
    knownSpells: [],
    visitedScenes: {},
    sceneArtHighlightShown: {},
    asciiMap: null,
    exploration: null,
    pendingInterleave: null,
    timedChoiceDeadline: null,
    lastCombatXpGain: null,
    lastCombatLevelUps: null,
    lastCombatLootLines: null,
    activeBuffs: [],
  };
}

export function createPlayerCharacter(name: string, cls: ClassId): GameState['party'][0] {
  const base = {
    id: 'player',
    name,
    class: cls,
    str: 8,
    agi: 8,
    mind: 8,
    luck: 8,
    hp: 12,
    maxHp: 12,
    stress: 0,
    weaponId: null as string | null,
    armorId: null as string | null,
    relicId: null as string | null,
    critRatio: 0,
    specialUsedThisCombat: false,
    mana: 0,
    maxMana: 0,
    path: null,
  };
  if (cls === 'knight') {
    return {
      ...base,
      str: 12,
      agi: 9,
      mind: 7,
      luck: 8,
      hp: 18,
      maxHp: 18,
      mana: 2,
      maxMana: 2,
      critRatio: 0.03,
      weaponId: 'rusty_sword',
      armorId: 'leather',
      path: null,
    };
  }
  if (cls === 'mage') {
    return {
      ...base,
      str: 6,
      agi: 8,
      mind: 13,
      luck: 10,
      hp: 12,
      maxHp: 12,
      mana: 12,
      maxMana: 15,
      critRatio: 0.01,
      weaponId: 'oak_staff',
      armorId: 'cloth_robe',
      path: null,
    };
  }
  return {
    ...base,
    str: 8,
    agi: 8,
    mind: 11,
    luck: 9,
    hp: 14,
    maxHp: 14,
    mana: 8,
    maxMana: 10,
    critRatio: 0.01,
    weaponId: 'mace',
    armorId: 'chain_shirt',
    path: null,
  };
}

function baseCritRatioForClass(cls: ClassId): number {
  if (cls === 'knight') return 0.03;
  if (cls === 'mage') return 0.01;
  return 0.01;
}

/** Passivos de classe (Pulso Devoto, Fio Arcano, bónus de crítico do cavaleiro) exigem o fragmento de Morvayn. */
export function isLeadPassiveUnlocked(state: GameState): boolean {
  const lead = state.party[0];
  if (!lead) return false;
  return (
    state.inventory.includes(PASSIVE_UNLOCK_ITEM_ID) ||
    lead.weaponId === PASSIVE_UNLOCK_ITEM_ID ||
    lead.armorId === PASSIVE_UNLOCK_ITEM_ID ||
    lead.relicId === PASSIVE_UNLOCK_ITEM_ID
  );
}

export function syncLeadPassiveStats(state: GameState): GameState {
  const lead = state.party[0];
  if (!lead) return state;
  const baseCritRatio = baseCritRatioForClass(lead.class);
  const passiveCritBonus =
    lead.class === 'knight' && isLeadPassiveUnlocked(state) ? KNIGHT_PASSIVE_CRIT_RATIO_BONUS : 0;
  const nextCritRatio = baseCritRatio + passiveCritBonus;
  if (lead.critRatio === nextCritRatio) return state;
  return {
    ...state,
    party: [{ ...lead, critRatio: nextCritRatio }, ...state.party.slice(1)],
  };
}

export function serializeState(state: GameState): string {
  const {
    lastCombatXpGain: _x,
    lastCombatLevelUps: _l,
    lastCombatLootLines: _loot,
    timedChoiceDeadline: _td,
    ...rest
  } = state;
  return JSON.stringify(rest);
}

export function deserializeState(json: string): GameState {
  const raw = JSON.parse(json) as unknown;
  if (typeof raw !== 'object' || raw === null) throw new Error('Save inválido');
  const o = raw as GameState;
  if (o.schemaVersion !== SCHEMA_VERSION) {
    console.warn('Save de versão diferente; tentando carregar mesmo assim.');
  }
  const rawParty = (o as GameState).party ?? [];
  const rawRes = (o as GameState).resources;
  const resources = {
    supply: typeof rawRes?.supply === 'number' ? rawRes.supply : 5,
    faith: typeof rawRes?.faith === 'number' ? rawRes.faith : 3,
    corruption: typeof rawRes?.corruption === 'number' ? rawRes.corruption : 0,
    gold: typeof rawRes?.gold === 'number' ? rawRes.gold : 0,
  };
  const legacyId = (o as Partial<GameState>).campaignId;
  const campaignId = typeof legacyId === 'string' && legacyId.length > 0 ? legacyId : 'calvario';
  const fgp = (o as GameState).factionGainPending;
  const factionGainPending: GameState['factionGainPending'] = {
    vigilia: fgp?.vigilia === 1 ? 1 : 0,
    circulo: fgp?.circulo === 1 ? 1 : 0,
    culto: fgp?.culto === 1 ? 1 : 0,
  };

  let marks = Array.isArray((o as GameState).marks) ? [...(o as GameState).marks] : [];
  let leadStoryPassives = Array.isArray((o as GameState).leadStoryPassives)
    ? [...(o as GameState).leadStoryPassives]
    : [];
  if (marks.includes('monk_inner_peace') && !leadStoryPassives.includes('monk_inner_peace')) {
    leadStoryPassives.push('monk_inner_peace');
  }
  if (leadStoryPassives.includes('monk_inner_peace') && !marks.includes('monk_inner_peace')) {
    marks.push('monk_inner_peace');
  }

  const rawFlags = (o as GameState).flags;
  const flags: GameState['flags'] =
    rawFlags && typeof rawFlags === 'object' ? { ...rawFlags } : {};
  const rawLegacy = (o as Partial<GameState>).legacy;
  const legacy: GameState['legacy'] = {
    echoes:
      typeof rawLegacy?.echoes === 'number' && Number.isFinite(rawLegacy.echoes)
        ? Math.max(0, Math.floor(rawLegacy.echoes))
        : 0,
    titles: Array.isArray(rawLegacy?.titles)
      ? rawLegacy.titles.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
      : [],
    lastRunSummary: typeof rawLegacy?.lastRunSummary === 'string' ? rawLegacy.lastRunSummary : '',
    lastRunEchoGain:
      typeof rawLegacy?.lastRunEchoGain === 'number' && Number.isFinite(rawLegacy.lastRunEchoGain)
        ? Math.max(0, Math.floor(rawLegacy.lastRunEchoGain))
        : 0,
  };
  if (
    (marks.includes('monk_inner_peace') || leadStoryPassives.includes('monk_inner_peace')) &&
    !flags.frost_monk_blessing_done
  ) {
    flags.frost_monk_blessing_done = true;
  }

  const rawHighlight = (o as Partial<GameState>).sceneArtHighlightShown;
  const sceneArtHighlightShown: GameState['sceneArtHighlightShown'] =
    rawHighlight && typeof rawHighlight === 'object' && !Array.isArray(rawHighlight)
      ? { ...(rawHighlight as Record<string, boolean>) }
      : {};

  const rawEx = (o as Partial<GameState>).exploration;
  const exploration: GameState['exploration'] =
    rawEx &&
    typeof rawEx === 'object' &&
    typeof rawEx.graphId === 'string' &&
    typeof rawEx.nodeId === 'string'
      ? { graphId: rawEx.graphId, nodeId: rawEx.nodeId }
      : null;

  const merged: GameState = {
    ...(o as GameState),
    campaignId,
    factionGainPending,
    resources,
    marks,
    leadStoryPassives,
    flags,
    legacy,
    sceneArtHighlightShown,
    exploration,
    extraLifeReady: extraLifeReadyFromFaith(resources.faith),
    level: typeof (o as GameState).level === 'number' ? (o as GameState).level : 1,
    xp: typeof (o as GameState).xp === 'number' ? (o as GameState).xp : 0,
    day:
      typeof (o as GameState).day === 'number' && (o as GameState).day! >= 1
        ? (o as GameState).day!
        : 1,
    lastCombatXpGain: null,
    lastCombatLevelUps: null,
    lastCombatLootLines: null,
    timedChoiceDeadline: null,
    activeBuffs: Array.isArray((o as GameState).activeBuffs) ? (o as GameState).activeBuffs : [],
    knownSpells: Array.isArray((o as GameState).knownSpells) ? (o as GameState).knownSpells : [],
    party: rawParty.map((p) => {
      let mana = typeof p.mana === 'number' ? p.mana : 0;
      let maxMana = typeof p.maxMana === 'number' ? p.maxMana : 0;
      if (p.class === 'knight' && maxMana === 0) {
        maxMana = 10;
        mana = Math.min(mana, maxMana);
        if (mana === 0) mana = 8;
      }
      return {
        ...p,
        luck: typeof p.luck === 'number' ? p.luck : 8,
        mana,
        maxMana,
        critRatio: typeof p.critRatio === 'number' ? p.critRatio : 0,
        path: typeof p.path === 'string' ? p.path : null,
      };
    }),
  };
  return syncLeadPassiveStats(merged);
}

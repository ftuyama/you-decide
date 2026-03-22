import { SCHEMA_VERSION, type ClassId, type GameState } from './schema';
import { parseSeedFromSearch } from './rng';

const defaultRep = { vigilia: 0, circulo: 0, culto: 0 } as GameState['reputation'];

export function createInitialState(entryScene: string, seed?: number): GameState {
  const rngSeed = (seed ?? parseSeedFromSearch() ?? Date.now()) >>> 0;
  return {
    schemaVersion: SCHEMA_VERSION,
    rngSeed,
    chapter: 1,
    narrativeTier: 1,
    sceneId: entryScene,
    playerName: 'Viajante',
    level: 1,
    xp: 0,
    party: [],
    companionsAvailable: ['rogue_mira', 'squire_tomas'],
    inventory: [],
    reputation: { ...defaultRep },
    flags: {},
    marks: [],
    resources: { supply: 5, faith: 3, corruption: 0 },
    combat: null,
    mode: 'story',
    modal: null,
    diary: [],
    visitedScenes: {},
    asciiMap: null,
    pendingInterleave: null,
    timedChoiceDeadline: null,
    lastCombatXpGain: null,
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
    specialUsedThisCombat: false,
    mana: 0,
    maxMana: 0,
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
      mana: 0,
      maxMana: 0,
      weaponId: 'rusty_sword',
      armorId: 'leather',
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
      weaponId: 'oak_staff',
      armorId: 'cloth_robe',
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
    weaponId: 'mace',
    armorId: 'chain_shirt',
  };
}

export function serializeState(state: GameState): string {
  const { lastCombatXpGain: _x, ...rest } = state;
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
  const merged: GameState = {
    ...(o as GameState),
    level: typeof (o as GameState).level === 'number' ? (o as GameState).level : 1,
    xp: typeof (o as GameState).xp === 'number' ? (o as GameState).xp : 0,
    lastCombatXpGain: null,
    party: rawParty.map((p) => ({
      ...p,
      luck: typeof p.luck === 'number' ? p.luck : 8,
      mana: typeof p.mana === 'number' ? p.mana : 0,
      maxMana: typeof p.maxMana === 'number' ? p.maxMana : 0,
    })),
  };
  return merged;
}

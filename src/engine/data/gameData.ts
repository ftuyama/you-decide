import type {
  CampaignIndex,
  ClassId,
  CompanionDef,
  EnemyDef,
  Encounter,
  ItemDef,
  SpellDef,
} from '../schema/index.ts';

/** Bónus aplicados uma vez ao ganhar um arquétipo narrativo (`setPath` com path não nulo). */
export type PathUnlockBonus = {
  stats?: Partial<Record<'str' | 'agi' | 'mind' | 'luck', number>>;
  addXp?: number;
  addResource?: { resource: 'faith' | 'corruption' | 'gold' | 'supply'; delta: number };
  /** Parágrafo extra (vício/trauma) mostrado na ficha quando o path está ativo; não persiste no save. */
  backstoryPt?: string;
};

/** Campaign-specific hero names and class labels for effects (no engine imports of campaigns). */
export type HeroNarrative = {
  defaultHeroName(classId: ClassId): string;
  getHeroClassLabel(classId: ClassId, path: string | null | undefined): string;
  getPathUnlockBonus(classId: ClassId, path: string | null | undefined): PathUnlockBonus | null;
  /** Uma ou duas frases para o banner de promoção de arquétipo; `null` usa texto genérico na UI. */
  getPathPromotionNarrativePt(
    classId: ClassId,
    path: string | null | undefined
  ): string | null;
};

/** Marca da jornada (`state.marks`): narrativa no diário / toast. */
export type JourneyMarkDef = {
  name: string;
  description: string;
};

/** Passivo de história do líder (`state.leadStoryPassives`); não é marca nem passivo de classe. */
export type LeadStoryPassiveDef = {
  name: string;
  description: string;
  /** Texto só narrativo na secção História da ficha (opcional). */
  heroLorePt?: string;
};

export type GameData = {
  campaign: CampaignIndex;
  heroNarrative: HeroNarrative;
  enemies: Record<string, EnemyDef>;
  encounters: Record<string, Encounter>;
  items: Record<string, ItemDef>;
  companions: Record<string, CompanionDef>;
  spells: Record<string, SpellDef>;
  passives: Record<ClassId, { id: string; name: string; description: string }>;
  /** Chave = id em `state.marks`. */
  journeyMarks: Record<string, JourneyMarkDef>;
  /** Chave = id em `state.leadStoryPassives`. */
  leadStoryPassives: Record<string, LeadStoryPassiveDef>;
};

export function emptyGameData(campaign: CampaignIndex, heroNarrative: HeroNarrative): GameData {
  return {
    campaign,
    heroNarrative,
    enemies: {},
    encounters: {},
    items: {},
    companions: {},
    spells: {},
    passives: {
      knight: { id: 'knight_crit_edge', name: 'Aço Implacável', description: '+3% de chance crítica.' },
      cleric: {
        id: 'cleric_sacred_pulse',
        name: 'Pulso Devoto',
        description: 'No início do teu turno, regeneras 1% do HP máximo (arredondado para cima).',
      },
      mage: {
        id: 'mage_ley_trickle',
        name: 'Fio Arcano',
        description: 'No início do teu turno, regeneras 1% da mana máxima (arredondado para cima).',
      },
    },
    journeyMarks: {},
    leadStoryPassives: {},
  };
}

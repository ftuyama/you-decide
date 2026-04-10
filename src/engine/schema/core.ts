import { z } from 'zod';

export const SCHEMA_VERSION = '1.0.0';

/** Facções com reputação -3..+3 */
export const FactionIdSchema = z.enum(['vigilia', 'circulo', 'culto']);
export type FactionId = z.infer<typeof FactionIdSchema>;

export const ClassIdSchema = z.enum(['knight', 'mage', 'cleric']);
export type ClassId = z.infer<typeof ClassIdSchema>;

export const StanceSchema = z.enum(['aggressive', 'defensive', 'focus']);
export type Stance = z.infer<typeof StanceSchema>;

export const AppModeSchema = z.enum(['story', 'combat', 'modal']);
export type AppMode = z.infer<typeof AppModeSchema>;

/** Condições declarativas reutilizáveis */
export const ConditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.union([
    z.object({ all: z.array(ConditionSchema) }),
    z.object({ any: z.array(ConditionSchema) }),
    z.object({ not: ConditionSchema }),
    z.object({
      rep: z.object({
        faction: FactionIdSchema,
        gte: z.number().optional(),
        lte: z.number().optional(),
      }),
    }),
    z.object({ flag: z.string() }),
    z.object({ noFlag: z.string() }),
    z.object({ mark: z.string() }),
    z.object({ noMark: z.string() }),
    z.object({ leadStoryPassive: z.string() }),
    z.object({ noLeadStoryPassive: z.string() }),
    z.object({ hasItem: z.string() }),
    z.object({ noItem: z.string() }),
    z.object({
      resource: z.object({
        supply: z.object({ gte: z.number().optional(), lte: z.number().optional() }).optional(),
        faith: z.object({ gte: z.number().optional(), lte: z.number().optional() }).optional(),
        corruption: z
          .object({ gte: z.number().optional(), lte: z.number().optional() })
          .optional(),
        mana: z.object({ gte: z.number().optional(), lte: z.number().optional() }).optional(),
        gold: z.object({ gte: z.number().optional(), lte: z.number().optional() }).optional(),
      }),
    }),
    z.object({ class: ClassIdSchema }),
    z.object({ path: z.string() }),
    z.object({ chapter: z.object({ gte: z.number().optional(), lte: z.number().optional() }) }),
    z.object({ level: z.object({ gte: z.number().optional(), lte: z.number().optional() }) }),
    z.object({ corruption: z.object({ gte: z.number().optional(), lte: z.number().optional() }) }),
    z.object({
      companionCount: z.object({ gte: z.number().optional(), lte: z.number().optional() }),
    }),
    z.object({ companionInParty: z.string() }),
    /** (dia narrativo % mod) === eq — ex.: mod 5, eq 0 → dias 5, 10, … */
    z.object({
      dayMod: z.object({
        mod: z.number().int().min(2).max(30),
        eq: z.number().int().min(0).max(29),
      }),
    }),
    z.object({
      day: z.object({ gte: z.number().optional(), lte: z.number().optional() }),
    }),
  ])
);

export type Condition =
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition }
  | { rep: { faction: FactionId; gte?: number; lte?: number } }
  | { flag: string }
  | { noFlag: string }
  | { mark: string }
  | { noMark: string }
  | { leadStoryPassive: string }
  | { noLeadStoryPassive: string }
  | { hasItem: string }
  | { noItem: string }
  | {
      resource: {
        supply?: { gte?: number; lte?: number };
        faith?: { gte?: number; lte?: number };
        corruption?: { gte?: number; lte?: number };
        mana?: { gte?: number; lte?: number };
        gold?: { gte?: number; lte?: number };
      };
    }
  | { class: ClassId }
  | { path: string }
  | { chapter: { gte?: number; lte?: number } }
  | { level: { gte?: number; lte?: number } }
  | { corruption: { gte?: number; lte?: number } }
  | { companionCount: { gte?: number; lte?: number } }
  | { companionInParty: string }
  | { dayMod: { mod: number; eq: number } }
  | { day: { gte?: number; lte?: number } };

export const EffectSchema: z.ZodType<Effect> = z.discriminatedUnion('op', [
  z.object({ op: z.literal('setFlag'), key: z.string(), value: z.boolean() }),
  z.object({ op: z.literal('toggleFlag'), key: z.string() }),
  z.object({ op: z.literal('addMark'), mark: z.string() }),
  z.object({ op: z.literal('removeMark'), mark: z.string() }),
  z.object({ op: z.literal('grantLeadStoryPassive'), id: z.string() }),
  z.object({
    op: z.literal('addRep'),
    faction: FactionIdSchema,
    delta: z.number().int(),
    /** Se true, ganhos positivos aplicam-se de imediato (comportamento clássico). Omitido ou false: ganhos positivos exigem dois “passos” para subir 1 de reputação. */
    directGain: z.boolean().optional(),
  }),
  z.object({
    op: z.literal('setRep'),
    faction: FactionIdSchema,
    value: z.number().int().min(-3).max(3),
  }),
  z.object({
    op: z.literal('addResource'),
    resource: z.enum(['supply', 'faith', 'corruption', 'gold']),
    delta: z.number().int(),
  }),
  z.object({ op: z.literal('campRest') }),
  z.object({ op: z.literal('setChapter'), chapter: z.number().int().min(1) }),
  z.object({ op: z.literal('setNarrativeTier'), tier: z.number().int().min(1).max(4) }),
  z.object({ op: z.literal('grantItem'), itemId: z.string() }),
  z.object({ op: z.literal('removeItem'), itemId: z.string() }),
  z.object({
    op: z.literal('equipItem'),
    itemId: z.string(),
    partyIndex: z.number().int().min(0).max(2).optional(),
  }),
  z.object({
    op: z.literal('unequipSlot'),
    slot: z.enum(['weapon', 'armor', 'relic']),
    partyIndex: z.number().int().min(0).max(2).optional(),
  }),
  z.object({ op: z.literal('goto'), sceneId: z.string() }),
  z.object({ op: z.literal('addDiary'), text: z.string() }),
  z.object({
    op: z.literal('startCombat'),
    encounterId: z.string(),
    onVictory: z.string().optional(),
    onFlee: z.string().optional(),
    onDefeat: z.string().optional(),
  }),
  z.object({ op: z.literal('recruit'), companionId: z.string() }),
  z.object({ op: z.literal('dismissCompanion'), companionId: z.string() }),
  z.object({ op: z.literal('setAsciiMap'), mapId: z.string() }),
  z.object({ op: z.literal('clearAsciiMap') }),
  z.object({ op: z.literal('initClass'), class: ClassIdSchema }),
  z.object({ op: z.literal('addXp'), amount: z.number().int().min(1) }),
  z.object({ op: z.literal('learnSpell'), spellId: z.string() }),
  z.object({ op: z.literal('addMana'), amount: z.number().int() }),
  z.object({ op: z.literal('setPath'), path: z.string().nullable() }),
  z.object({
    op: z.literal('adjustLeadStat'),
    attr: z.enum(['str', 'agi', 'mind', 'luck']),
    delta: z.number().int(),
  }),
  z.object({
    op: z.literal('multiplyLeadHp'),
    /** Multiplica PV atuais e máximos do líder (ex.: 0,5 = metade, permanente até ganhos de nível). */
    factor: z.number().gt(0).max(1),
  }),
  z.object({
    op: z.literal('grantTemporaryBuff'),
    attr: z.enum(['str', 'agi', 'mind', 'luck']),
    delta: z.number().int(),
    remainingScenes: z.number().int().min(1),
  }),
  z.object({
    op: z.literal('useConsumable'),
    itemId: z.string(),
    targetIndex: z.number().int().min(0).max(2).optional(),
  }),
  z.object({ op: z.literal('advanceDay') }),
  z.object({ op: z.literal('resetRun') }),
]);

export type Effect =
  | { op: 'setFlag'; key: string; value: boolean }
  | { op: 'toggleFlag'; key: string }
  | { op: 'addMark'; mark: string }
  | { op: 'removeMark'; mark: string }
  | { op: 'grantLeadStoryPassive'; id: string }
  | { op: 'addRep'; faction: FactionId; delta: number; directGain?: boolean }
  | { op: 'setRep'; faction: FactionId; value: number }
  | { op: 'addResource'; resource: 'supply' | 'faith' | 'corruption' | 'gold'; delta: number }
  | { op: 'campRest' }
  | { op: 'setChapter'; chapter: number }
  | { op: 'setNarrativeTier'; tier: number }
  | { op: 'grantItem'; itemId: string }
  | { op: 'removeItem'; itemId: string }
  | { op: 'equipItem'; itemId: string; partyIndex?: number }
  | { op: 'unequipSlot'; slot: 'weapon' | 'armor' | 'relic'; partyIndex?: number }
  | { op: 'goto'; sceneId: string }
  | { op: 'addDiary'; text: string }
  | {
      op: 'startCombat';
      encounterId: string;
      onVictory?: string;
      onFlee?: string;
      onDefeat?: string;
    }
  | { op: 'recruit'; companionId: string }
  | { op: 'dismissCompanion'; companionId: string }
  | { op: 'setAsciiMap'; mapId: string }
  | { op: 'clearAsciiMap' }
  | { op: 'initClass'; class: ClassId }
  | { op: 'addXp'; amount: number }
  | { op: 'learnSpell'; spellId: string }
  | { op: 'addMana'; amount: number }
  | { op: 'setPath'; path: string | null }
  | { op: 'adjustLeadStat'; attr: 'str' | 'agi' | 'mind' | 'luck'; delta: number }
  | { op: 'multiplyLeadHp'; factor: number }
  | {
      op: 'grantTemporaryBuff';
      attr: 'str' | 'agi' | 'mind' | 'luck';
      delta: number;
      remainingScenes: number;
    }
  | { op: 'useConsumable'; itemId: string; targetIndex?: number }
  | { op: 'advanceDay' }
  | { op: 'resetRun' };

export const ChoiceSchema = z.object({
  id: z.string().optional(),
  text: z.string(),
  next: z.string().optional(),
  condition: ConditionSchema.optional(),
  /** Texto de preview de consequência (1 linha) */
  preview: z.string().optional(),
  effects: z.array(EffectSchema).default([]),
  /** Escolha com tempo: ms; se expirar, usa fallbackNext */
  timedMs: z.number().positive().optional(),
  fallbackNext: z.string().optional(),
});

export type Choice = z.infer<typeof ChoiceSchema>;

export const SkillCheckSchema = z.object({
  id: z.string(),
  attr: z.enum(['str', 'agi', 'mind']),
  tn: z.number().int(),
  successNext: z.string(),
  failNext: z.string(),
  label: z.string().optional(),
});

export type SkillCheck = z.infer<typeof SkillCheckSchema>;

/** 2d6 + mod(attr1) + mod(attr2) por ronda; sucesso = todas as rondas ≥ TN */
export const DualAttrSkillCheckSchema = z.object({
  id: z.string(),
  attrs: z.tuple([z.enum(['str', 'agi', 'mind']), z.enum(['str', 'agi', 'mind'])]),
  tn: z.number().int(),
  rounds: z.number().int().min(1).max(6).default(3),
  successNext: z.string(),
  failNext: z.string(),
  label: z.string().optional(),
});

export type DualAttrSkillCheck = z.infer<typeof DualAttrSkillCheckSchema>;

/** 2d6 + mod(sorte efetiva) − luckPenalty vs TN — paralelo a skillCheck */
export const LuckCheckSchema = z.object({
  id: z.string(),
  tn: z.number().int(),
  successNext: z.string(),
  failNext: z.string(),
  label: z.string().optional(),
  /** Penalidade ao total do lance (ex.: aposta amaldiçoada). Default 0. */
  luckPenalty: z.number().int().min(0).max(5).optional(),
});

export type LuckCheck = z.infer<typeof LuckCheckSchema>;

export const RandomBranchSchema = z.object({
  id: z.string(),
  branches: z.array(
    z.object({
      weight: z.number().positive(),
      next: z.string(),
      condition: ConditionSchema.optional(),
    })
  ),
});

export type RandomBranch = z.infer<typeof RandomBranchSchema>;

export const ChapterGateSchema = z.object({
  minSupply: z.number().optional(),
  minFaith: z.number().optional(),
  rep: z
    .array(
      z.object({
        faction: FactionIdSchema,
        gte: z.number().optional(),
      })
    )
    .optional(),
  passNext: z.string(),
  failNext: z.string(),
});

export type ChapterGate = z.infer<typeof ChapterGateSchema>;

export const SceneFrontmatterSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  chapter: z.number().int().min(1).default(1),
  type: z.enum(['story', 'hub', 'combat_intro']).default('story'),
  /** Tema ambiente da cena (música/ambiente no UI). */
  ambientTheme: z
    .enum([
      'explore',
      'combat',
      'camp',
      'boss',
      'act3',
      'act5',
      'frost_mystery',
      'merchant',
      'void',
      'ancient_macabre',
      'ash_sky',
    ])
    .optional(),
  /** Dica de combate com aliados no acampamento (UI). */
  campCombatHint: z.boolean().optional(),
  /** Efeitos ao entrar na cena (após primeira renderização; idempotência por visit) */
  onEnter: z.array(EffectSchema).default([]),
  /** Efeitos em **cada** entrada na cena (ex.: avançar dia num hub) */
  repeatOnEnter: z.array(EffectSchema).default([]),
  choices: z.array(ChoiceSchema).default([]),
  skillCheck: SkillCheckSchema.optional(),
  dualAttrSkillCheck: DualAttrSkillCheckSchema.optional(),
  luckCheck: LuckCheckSchema.optional(),
  randomBranch: RandomBranchSchema.optional(),
  chapterGate: ChapterGateSchema.optional(),
  /** Arte ASCII inline (multilinha no YAML) */
  art: z.string().optional(),
  /** Chave para arte na tabela `sceneArt` da campanha ativa */
  artKey: z.string().optional(),
  /** Combate embutido: após texto, se encounterId presente */
  encounterId: z.string().optional(),
  onVictory: z.string().optional(),
  onFlee: z.string().optional(),
  onDefeat: z.string().optional(),
  /** Interleave: sub-passos de texto após combate */
  interleaveAfterCombat: z.string().optional(),
});

export type SceneFrontmatter = z.infer<typeof SceneFrontmatterSchema>;

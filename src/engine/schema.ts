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
    z.object({ hasItem: z.string() }),
    z.object({ noItem: z.string() }),
    z.object({
      resource: z.object({
        supply: z.object({ gte: z.number().optional(), lte: z.number().optional() }).optional(),
        faith: z.object({ gte: z.number().optional(), lte: z.number().optional() }).optional(),
        corruption: z
          .object({ gte: z.number().optional(), lte: z.number().optional() })
          .optional(),
      }),
    }),
    z.object({ class: ClassIdSchema }),
    z.object({ chapter: z.object({ gte: z.number().optional(), lte: z.number().optional() }) }),
    z.object({ corruption: z.object({ gte: z.number().optional(), lte: z.number().optional() }) }),
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
  | { hasItem: string }
  | { noItem: string }
  | {
      resource: {
        supply?: { gte?: number; lte?: number };
        faith?: { gte?: number; lte?: number };
        corruption?: { gte?: number; lte?: number };
      };
    }
  | { class: ClassId }
  | { chapter: { gte?: number; lte?: number } }
  | { corruption: { gte?: number; lte?: number } };

export const EffectSchema: z.ZodType<Effect> = z.discriminatedUnion('op', [
  z.object({ op: z.literal('setFlag'), key: z.string(), value: z.boolean() }),
  z.object({ op: z.literal('toggleFlag'), key: z.string() }),
  z.object({ op: z.literal('addMark'), mark: z.string() }),
  z.object({ op: z.literal('removeMark'), mark: z.string() }),
  z.object({ op: z.literal('addRep'), faction: FactionIdSchema, delta: z.number().int() }),
  z.object({
    op: z.literal('setRep'),
    faction: FactionIdSchema,
    value: z.number().int().min(-3).max(3),
  }),
  z.object({
    op: z.literal('addResource'),
    resource: z.enum(['supply', 'faith', 'corruption']),
    delta: z.number().int(),
  }),
  z.object({ op: z.literal('setChapter'), chapter: z.number().int().min(1) }),
  z.object({ op: z.literal('setNarrativeTier'), tier: z.number().int().min(1).max(4) }),
  z.object({ op: z.literal('grantItem'), itemId: z.string() }),
  z.object({ op: z.literal('removeItem'), itemId: z.string() }),
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
  z.object({ op: z.literal('setAsciiMap'), mapId: z.string(), playerX: z.number(), playerY: z.number() }),
  z.object({ op: z.literal('clearAsciiMap') }),
  z.object({ op: z.literal('initClass'), class: ClassIdSchema }),
  z.object({ op: z.literal('addXp'), amount: z.number().int().min(1) }),
  z.object({ op: z.literal('resetRun') }),
]);

export type Effect =
  | { op: 'setFlag'; key: string; value: boolean }
  | { op: 'toggleFlag'; key: string }
  | { op: 'addMark'; mark: string }
  | { op: 'removeMark'; mark: string }
  | { op: 'addRep'; faction: FactionId; delta: number }
  | { op: 'setRep'; faction: FactionId; value: number }
  | { op: 'addResource'; resource: 'supply' | 'faith' | 'corruption'; delta: number }
  | { op: 'setChapter'; chapter: number }
  | { op: 'setNarrativeTier'; tier: number }
  | { op: 'grantItem'; itemId: string }
  | { op: 'removeItem'; itemId: string }
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
  | { op: 'setAsciiMap'; mapId: string; playerX: number; playerY: number }
  | { op: 'clearAsciiMap' }
  | { op: 'initClass'; class: ClassId }
  | { op: 'addXp'; amount: number }
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

export const RandomBranchSchema = z.object({
  id: z.string(),
  branches: z.array(
    z.object({
      weight: z.number().positive(),
      next: z.string(),
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
  /** Efeitos ao entrar na cena (após primeira renderização; idempotência por visit) */
  onEnter: z.array(EffectSchema).default([]),
  choices: z.array(ChoiceSchema).default([]),
  skillCheck: SkillCheckSchema.optional(),
  randomBranch: RandomBranchSchema.optional(),
  chapterGate: ChapterGateSchema.optional(),
  /** Arte ASCII inline (multilinha no YAML) */
  art: z.string().optional(),
  /** Chave para arte em `campaigns/calvario/ascii/art.ts` */
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

export const EnemyTypeSchema = z.enum(['normal', 'undead', 'armored', 'cultist']);
export type EnemyType = z.infer<typeof EnemyTypeSchema>;

export const EnemyDefSchema = z.object({
  id: z.string(),
  name: z.string(),
  hp: z.number().int().positive(),
  maxHp: z.number().int().positive(),
  str: z.number().int(),
  agi: z.number().int(),
  mind: z.number().int(),
  armor: z.number().int().min(0).default(0),
  type: EnemyTypeSchema.default('normal'),
  /** Para tipo armored: camadas antes do HP “real” */
  armorChips: z.number().int().min(0).default(0),
  sprite: z.string(),
  spriteWounded: z.string().optional(),
  advantageOnFirstRound: z.boolean().optional(),
  /** XP concedido ao derrotar; se omitido, usa fórmula do engine */
  xp: z.number().int().min(0).optional(),
  /** Probabilidade de confirmar crítico após 6+6 em 2d6 (ou equivalente 3d6dl); padrão no engine se omitido */
  critConfirm: z.number().min(0).max(1).optional(),
});

export type EnemyDef = z.infer<typeof EnemyDefSchema>;

export const EncounterSchema = z.object({
  id: z.string(),
  enemies: z.array(z.string()),
  playerAdvantage: z.boolean().optional(),
  enemyAdvantage: z.boolean().optional(),
  /** Substitui o XP calculado por inimigos (chefes, encontros especiais) */
  xpReward: z.number().int().min(0).optional(),
});

export type Encounter = z.infer<typeof EncounterSchema>;

export const ItemDefSchema = z.object({
  id: z.string(),
  name: z.string(),
  slot: z.enum(['weapon', 'armor', 'relic']),
  bonusStr: z.number().int().default(0),
  bonusAgi: z.number().int().default(0),
  bonusMind: z.number().int().default(0),
  armor: z.number().int().default(0),
  damage: z.number().int().default(0),
  bonusLuck: z.number().int().default(0),
  cursed: z.boolean().optional(),
  rumor: z.boolean().optional(),
});

export type ItemDef = z.infer<typeof ItemDefSchema>;

export const CompanionDefSchema = z.object({
  id: z.string(),
  name: z.string(),
  str: z.number().int(),
  agi: z.number().int(),
  mind: z.number().int(),
  hp: z.number().int(),
  maxHp: z.number().int(),
  luck: z.number().int().default(8),
  /** Condição de saída em texto (avaliada por flag) */
  leaveFlag: z.string().optional(),
});

export type CompanionDef = z.infer<typeof CompanionDefSchema>;

export const CharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  class: ClassIdSchema,
  str: z.number().int(),
  agi: z.number().int(),
  mind: z.number().int(),
  luck: z.number().int().default(8),
  hp: z.number().int(),
  maxHp: z.number().int(),
  stress: z.number().int().min(0).max(4).default(0),
  weaponId: z.string().nullable(),
  armorId: z.string().nullable(),
  relicId: z.string().nullable(),
  specialUsedThisCombat: z.boolean().default(false),
});

export type Character = z.infer<typeof CharacterSchema>;

export const EnemyInstanceSchema = z.object({
  defId: z.string(),
  hp: z.number().int(),
  maxHp: z.number().int(),
  armorChipsRemaining: z.number().int().min(0),
  stress: z.number().int().min(0).max(4).default(0),
});

export type EnemyInstance = z.infer<typeof EnemyInstanceSchema>;

export const CombatLogEntrySchema = z.object({
  kind: z.enum([
    'info',
    'attack',
    'damage',
    'heal',
    'stance',
    'stress',
    'armor_break',
    'turn_banner',
  ]),
  message: z.string(),
  dice: z.array(z.number()).optional(),
  total: z.number().optional(),
  modifier: z.number().optional(),
  final: z.number().optional(),
  actor: z.string().optional(),
  target: z.string().optional(),
  /** Ataque: acerto ou erro vs CA */
  outcome: z.enum(['hit', 'miss']).optional(),
  /** CA usada na resolução (para exibir no log) */
  vsDefense: z.number().int().optional(),
  /** Resultado especial dos dados de ataque (2d6 / 3d6dl) */
  rollOutcome: z.enum(['crit_threat', 'fumble_threat', 'normal']).optional(),
  /** Dano crítico vs normal */
  damageKind: z.enum(['crit', 'normal']).optional(),
});

export type CombatLogEntry = z.infer<typeof CombatLogEntrySchema>;

export const CombatStateSchema = z.object({
  encounterId: z.string(),
  enemies: z.array(EnemyInstanceSchema),
  /** IDs dos combatentes na ordem (player party ids + enemy slot ids) */
  turnOrder: z.array(z.string()),
  turnIndex: z.number().int().min(0),
  round: z.number().int().min(1),
  phase: z.enum(['choose_stance', 'choose_target', 'enemy', 'ended']),
  pendingStance: StanceSchema.optional(),
  pendingTargetIndex: z.number().int().optional(),
  playerAdvantage: z.boolean().optional(),
  enemyAdvantage: z.boolean().optional(),
  log: z.array(CombatLogEntrySchema),
  /** Próxima cena após vitória/fuga/derrota */
  returnScene: z.string(),
  onVictory: z.string().optional(),
  onFlee: z.string().optional(),
  onDefeat: z.string().optional(),
});

export type CombatState = z.infer<typeof CombatStateSchema>;

export const GameStateSchema = z.object({
  schemaVersion: z.string(),
  rngSeed: z.number(),
  chapter: z.number().int().min(1),
  narrativeTier: z.number().int().min(1).max(4).default(2),
  sceneId: z.string(),
  playerName: z.string().default('Herói'),
  /** Nível do líder (progressão) */
  level: z.number().int().min(1).default(1),
  /** XP dentro do nível atual (0 até xpToNext(level)-1) */
  xp: z.number().int().min(0).default(0),
  party: z.array(CharacterSchema),
  companionsAvailable: z.array(z.string()).default([]),
  inventory: z.array(z.string()),
  reputation: z.record(FactionIdSchema, z.number().int().min(-3).max(3)),
  flags: z.record(z.string(), z.boolean()),
  marks: z.array(z.string()),
  resources: z.object({
    supply: z.number().int().min(0).max(10).default(5),
    faith: z.number().int().min(0).max(5).default(3),
    corruption: z.number().int().min(0).max(5).default(0),
  }),
  combat: CombatStateSchema.nullable(),
  mode: AppModeSchema.default('story'),
  modal: z
    .object({
      kind: z.enum(['inventory', 'lore', 'confirm']),
      payload: z.record(z.string(), z.unknown()).optional(),
    })
    .nullable()
    .default(null),
  diary: z.array(z.string()).default([]),
  visitedScenes: z.record(z.string(), z.boolean()).default({}),
  /** Mapa ASCII ativo */
  asciiMap: z
    .object({
      mapId: z.string(),
      playerX: z.number().int(),
      playerY: z.number().int(),
    })
    .nullable()
    .default(null),
  /** Sub-passos pós-combate (interleave) */
  pendingInterleave: z.string().nullable().default(null),
  /** Timed choice deadline ms epoch */
  timedChoiceDeadline: z.number().nullable().optional(),
});

export type GameState = z.infer<typeof GameStateSchema>;

export const CampaignIndexSchema = z.object({
  id: z.string(),
  name: z.string(),
  entryScene: z.string(),
  scenes: z.array(
    z.object({
      id: z.string(),
      path: z.string(),
    })
  ),
});

export type CampaignIndex = z.infer<typeof CampaignIndexSchema>;

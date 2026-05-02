import { z } from 'zod';
import {
  AppModeSchema,
  ClassIdSchema,
  FactionIdSchema,
  StanceSchema,
} from './core.ts';

export const EnemyTypeSchema = z.enum(['normal', 'undead', 'armored', 'cultist']);
export type EnemyType = z.infer<typeof EnemyTypeSchema>;

export const EnemyLootDropSchema = z.union([
  z.object({
    chance: z.number().min(0).max(1),
    itemId: z.string(),
  }),
  z.object({
    chance: z.number().min(0).max(1),
    resource: z.enum(['gold', 'supply', 'faith', 'corruption']),
    amount: z.number().int().positive().default(1),
  }),
]);
export type EnemyLootDrop = z.infer<typeof EnemyLootDropSchema>;

export const EnemyAttackStrategySchema = z.enum(['random', 'focus_leader']);
export type EnemyAttackStrategy = z.infer<typeof EnemyAttackStrategySchema>;

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
  advantageOnFirstRound: z.boolean().optional(),
  /** XP base ao derrotar este inimigo; se omitido, usa fórmula do engine (10 + floor(maxHp/2)) */
  xp: z.number().int().min(0).optional(),
  /** Probabilidade de confirmar crítico após 6+6 em 2d6 (ou equivalente 3d6dl); padrão no engine se omitido */
  critConfirm: z.number().min(0).max(1).optional(),
  /** Loot opcional por inimigo; cada entrada testa chance independentemente */
  lootDrops: z.array(EnemyLootDropSchema).optional(),
  /** Quem o inimigo tenta atingir no corpo-a-corpo (turno inimigo) */
  attackStrategy: EnemyAttackStrategySchema.default('random'),
  /** Com `focus_leader`: probabilidade de mirar o líder se estiver vivo; padrão no engine se omitido */
  focusLeaderWeight: z.number().min(0).max(1).optional(),
  /** Frases opcionais ditas pelo inimigo durante o turno dele. */
  combatLines: z.array(z.string()).optional(),
});

export type EnemyDef = z.infer<typeof EnemyDefSchema>;

export const EncounterSchema = z.object({
  id: z.string(),
  enemies: z.array(z.string()),
  playerAdvantage: z.boolean().optional(),
  enemyAdvantage: z.boolean().optional(),
  /** Probabilidade base de fuga (0–1); maior = TN mais baixo no teste 2d6 + mod(AGI). */
  fleeRate: z.number().min(0).max(1).optional(),
  /** XP extra do encontro (soma ao XP base dos inimigos); ex.: bónus por grupo grande */
  xpReward: z.number().int().min(0).optional(),
});

export type Encounter = z.infer<typeof EncounterSchema>;

export const ItemDefSchema = z.object({
  id: z.string(),
  name: z.string(),
  slot: z.enum(['weapon', 'armor', 'relic', 'consumable']),
  bonusStr: z.number().int().default(0),
  bonusAgi: z.number().int().default(0),
  bonusMind: z.number().int().default(0),
  armor: z.number().int().default(0),
  damage: z.number().int().default(0),
  bonusLuck: z.number().int().default(0),
  cursed: z.boolean().optional(),
  rumor: z.boolean().optional(),
  /** Arte ASCII (ex.: ao comprar ou encontrar) */
  sprite: z.string().optional(),
  /** Poções / consumíveis */
  restoreHp: z.number().int().min(0).optional(),
  restoreMana: z.number().int().min(0).optional(),
  /** Reduz stress (0–4) em N */
  stressRelief: z.number().int().min(0).optional(),
  /**
   * Relíquia: em cada acerto físico do líder que cause dano ao HP, consome até N de corrupção
   * e adiciona dano extra por ponto consumido.
   */
  corruptionDrainOnHit: z.number().int().min(0).max(3).optional(),
  damageBonusPerCorruptionDrain: z.number().int().min(1).max(5).optional(),
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
  /** Texto de lore (sidebar / história) */
  lorePt: z.string().optional(),
});

export type CompanionDef = z.infer<typeof CompanionDefSchema>;

/** Magias de campanha — dano, cura em si mesmo ou buffs de combate (cavaleiro) */
export const SpellDefSchema = z.object({
  id: z.string(),
  name: z.string(),
  manaCost: z.number().int().min(0),
  minLevel: z.number().int().min(1).default(1),
  classId: z.enum(['knight', 'mage', 'cleric', 'any']),
  spellKind: z.enum(['damage', 'heal_self', 'buff_attack_roll', 'buff_armor_class']),
  /** Número de dados d6 (ignorado em buffs) */
  dice: z.number().int().min(1),
  /** Valor fixo somado aos dados e ao mod Mente (ignorado em buffs) */
  base: z.number().int().min(0).default(0),
  /** Só via narrativa (learnSpell), não no nível 1 nem ao subir de nível */
  learnOnly: z.boolean().optional(),
});

export type SpellDef = z.infer<typeof SpellDefSchema>;

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
  mana: z.number().int().min(0).default(0),
  maxMana: z.number().int().min(0).default(0),
  weaponId: z.string().nullable(),
  armorId: z.string().nullable(),
  relicId: z.string().nullable(),
  /** Bônus de crítico adicional (0..1), somado às regras normais de crítico pelos dados. */
  critRatio: z.number().min(0).max(1).default(0),
  specialUsedThisCombat: z.boolean().default(false),
  /** Arquétipo narrativo (Cavaleiro caído, Mago das trevas, …); mecânica continua em `class` */
  path: z.string().nullable().default(null),
});

export type Character = z.infer<typeof CharacterSchema>;

export const TemporaryBuffSchema = z.object({
  id: z.string(),
  attr: z.enum(['str', 'agi', 'mind', 'luck']),
  delta: z.number().int(),
  remainingScenes: z.number().int().min(1),
});

export type TemporaryBuff = z.infer<typeof TemporaryBuffSchema>;

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
    'enemy_line',
    'attack',
    'damage',
    'heal',
    'stance',
    'stress',
    'armor_break',
    'turn_banner',
  ]),
  message: z.string(),
  /** Índice em `combat.enemies` — `enemy_line`, ataques/dano/armadura vs inimigo (FX) */
  enemyIndex: z.number().int().min(0).optional(),
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
  /** Este dano reduziu o inimigo a 0 HP */
  lethal: z.boolean().optional(),
  /** Magia associada à linha de log (lançamento, cura, buff) */
  spellId: z.string().optional(),
  /** Item consumido (poção em combate — FX / som) */
  itemId: z.string().optional(),
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
  /** Bônus temporário de dano vindo de sacrifício (reseta ao fim do turno do jogador). */
  pendingSacrificeDamage: z.number().int().min(0).default(0),
  /** Custo de HP aplicado no turno atual pelo selo de sacrifício. */
  pendingSacrificeCost: z.number().int().min(0).default(0),
  /** Bónus de magia do líder: somado ao total do ataque físico (resto do combate). */
  buffAttackRoll: z.number().int().min(0).default(0),
  /** Bónus de magia do líder: somado à CA vs inimigos (resto do combate). */
  buffArmorClass: z.number().int().min(0).default(0),
  playerAdvantage: z.boolean().optional(),
  enemyAdvantage: z.boolean().optional(),
  /** Cópia do encontro; se omitido (save antigo), usa 0,5 na resolução de fuga. */
  fleeRate: z.number().min(0).max(1).optional(),
  log: z.array(CombatLogEntrySchema),
  /** Próxima cena após vitória/fuga/derrota */
  returnScene: z.string(),
  onVictory: z.string().optional(),
  onFlee: z.string().optional(),
  onDefeat: z.string().optional(),
});

export type CombatState = z.infer<typeof CombatStateSchema>;

export const LevelUpStatDeltasSchema = z.object({
  str: z.number(),
  agi: z.number(),
  mind: z.number(),
  maxHp: z.number(),
  hp: z.number(),
  maxMana: z.number(),
  mana: z.number(),
});
export type LevelUpStatDeltas = z.infer<typeof LevelUpStatDeltasSchema>;

export const LevelUpStepSchema = z.object({
  level: z.number().int().min(1),
  deltas: LevelUpStatDeltasSchema,
  /** IDs de magias desbloqueadas neste nível (minLevel + classe), se houver. */
  spellsLearned: z.array(z.string()).default([]),
});
export type LevelUpStep = z.infer<typeof LevelUpStepSchema>;

export const GameStateSchema = z.object({
  schemaVersion: z.string(),
  /** Which campaign this save belongs to (multi-campaign). Legacy saves default to calvario in deserializeState. */
  campaignId: z.string().default('calvario'),
  rngSeed: z.number(),
  chapter: z.number().int().min(1),
  sceneId: z.string(),
  playerName: z.string().default('Herói'),
  /** Nível do líder (progressão) */
  level: z.number().int().min(1).default(1),
  /** XP dentro do nível atual (0 até xpToNext(level)-1) */
  xp: z.number().int().min(0).default(0),
  /** Dia narrativo (1 = início); avança com efeito `{ op: advanceDay }` (em `onEnter`, `choices[].effects`, etc.). */
  day: z.number().int().min(1).default(1),
  party: z.array(CharacterSchema),
  companionsAvailable: z.array(z.string()).default([]),
  inventory: z.array(z.string()),
  reputation: z.record(FactionIdSchema, z.number().int().min(-3).max(3)),
  /**
   * Progresso parcial ao ganhar reputação (modo “lento” sem directGain).
   * 0 = nada pendente; 1 = um ganho positivo já “contou” e falta outro para +1 em reputation.
   */
  factionGainPending: z
    .object({
      vigilia: z.union([z.literal(0), z.literal(1)]),
      circulo: z.union([z.literal(0), z.literal(1)]),
      culto: z.union([z.literal(0), z.literal(1)]),
    })
    .default({ vigilia: 0, circulo: 0, culto: 0 }),
  flags: z.record(z.string(), z.boolean()),
  marks: z.array(z.string()),
  /** Meta-progresso persistente entre runs (não reseta com `resetRun`). */
  legacy: z
    .object({
      echoes: z.number().int().min(0).default(0),
      titles: z.array(z.string()).default([]),
      lastRunSummary: z.string().default(''),
      lastRunEchoGain: z.number().int().min(0).default(0),
    })
    .default({ echoes: 0, titles: [], lastRunSummary: '', lastRunEchoGain: 0 }),
  /** Passivos de história do líder (ids em `GameData.leadStoryPassives`), ex. bênção do monge. */
  leadStoryPassives: z.array(z.string()).default([]),
  resources: z.object({
    supply: z.number().int().min(0).max(10).default(5),
    faith: z.number().int().min(0).max(5).default(3),
    corruption: z.number().int().min(0).max(10).default(0),
    gold: z.number().int().min(0).max(999).default(0),
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
  /** IDs de magias conhecidas pelo líder (combate e sidebar) */
  knownSpells: z.array(z.string()).default([]),
  visitedScenes: z.record(z.string(), z.boolean()).default({}),
  /** Cenas em que o overlay `highlight` da arte já foi mostrado (persiste na gravação). */
  sceneArtHighlightShown: z.record(z.string(), z.boolean()).default({}),
  /** Mapa ASCII ativo; posição do jogador vem do grafo de exploração + `mapCell` do nó. */
  asciiMap: z
    .object({
      mapId: z.string(),
    })
    .nullable()
    .default(null),
  /** Navegação em grafo (cena `shared/explore_nav` e hubs que inicializam com setExploration). */
  exploration: z
    .object({
      graphId: z.string(),
      nodeId: z.string(),
    })
    .nullable()
    .default(null),
  /** Sub-passos pós-combate (interleave) */
  pendingInterleave: z.string().nullable().default(null),
  /** Timed choice deadline ms epoch */
  timedChoiceDeadline: z.number().nullable().optional(),
  /** XP ganho na última vitória — mostrado uma vez na narrativa (omitido no save). */
  lastCombatXpGain: z.number().int().min(0).nullable().default(null),
  /** Subidas de nível na última vitória (com deltas) — mostrado uma vez na narrativa (omitido no save). */
  lastCombatLevelUps: z.array(LevelUpStepSchema).nullable().default(null),
  /** Linhas de loot da última vitória (texto UI) — mostrado uma vez na narrativa (omitido no save). */
  lastCombatLootLines: z.array(z.string()).nullable().default(null),
  /** Arquétipo narrativo recém-adquirido (`setPath`) — banner + som uma vez na narrativa (omitido no save). */
  lastPathPromotion: z
    .object({
      label: z.string(),
      narrativePt: z.string().optional(),
    })
    .nullable()
    .default(null),
  /** Bónus temporários (poções); decrementa ao mudar de cena */
  activeBuffs: z.array(TemporaryBuffSchema).default([]),
  /** Vínculo com companheiros (0–100 por id de `CompanionDef`); afecta stats via patamares. */
  companionFriendship: z.record(z.string(), z.number().int().min(0).max(100)).default({}),
  /**
   * Vida extra por fé: disponível quando fé >= 5.
   * Mantido em sincronia com `resources.faith` (addResource, combate, load).
   */
  extraLifeReady: z.boolean().default(false),
});

export type GameState = z.infer<typeof GameStateSchema>;

export const CampaignIndexSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** Rótulos de UI por capítulo (1 = primeiro ato, …). Chaves como dígitos em string. */
  chapterTitles: z.record(z.string(), z.string()).optional(),
  entryScene: z.string(),
  /** IDs still available to recruit at a new run */
  startingCompanionPool: z.array(z.string()).default([]),
  scenes: z.array(
    z.object({
      id: z.string(),
      path: z.string(),
    })
  ),
});

export type CampaignIndex = z.infer<typeof CampaignIndexSchema>;

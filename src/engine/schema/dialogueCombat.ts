import { z } from 'zod';
import { EnemyLootDropSchema } from './loot.ts';

/** Efeitos após resolver o destino do nó (rolagem + nó seguinte). */
export const DialogueChoiceEffectsSchema = z.object({
  /**
   * Dano ao líder: `ceil(maxHp * playerHpLossPercent / 100)`; se > 0, mínimo 1 HP perdido
   * (exceto quando o líder já estava a 1 HP).
   */
  playerHpLossPercent: z.number().min(0).max(100).optional(),
  /** Delta na “tensão” do interlocutor; negativo acalma. */
  enemyHpDelta: z.number().int().optional(),
});

export type DialogueChoiceEffects = z.infer<typeof DialogueChoiceEffectsSchema>;

/** Soma efeitos para pré-visualização (dev); no runtime aplicam-se em sequência. */
export function mergeDialogueChoiceEffects(
  a: DialogueChoiceEffects | undefined,
  b: DialogueChoiceEffects | undefined,
): DialogueChoiceEffects | undefined {
  if (!a && !b) return undefined;
  if (!a) return { ...b! };
  if (!b) return { ...a };
  const out: DialogueChoiceEffects = {};
  const hp = (a.playerHpLossPercent ?? 0) + (b.playerHpLossPercent ?? 0);
  if (hp > 0) out.playerHpLossPercent = Math.min(100, hp);
  const delta = (a.enemyHpDelta ?? 0) + (b.enemyHpDelta ?? 0);
  if (delta !== 0) out.enemyHpDelta = delta;
  return Object.keys(out).length ? out : undefined;
}

const DialogueResolutionFixedSchema = z.object({
  kind: z.literal('fixed'),
  nextNodeId: z.string(),
});

const DialogueResolutionSkillSchema = z.object({
  kind: z.literal('skill'),
  attr: z.enum(['str', 'agi', 'mind']),
  tn: z.number(),
  successNodeId: z.string(),
  failNodeId: z.string(),
});

const DialogueResolutionLuckSchema = z.object({
  kind: z.literal('luck'),
  tn: z.number(),
  luckPenalty: z.number().min(0).default(0),
  successNodeId: z.string(),
  failNodeId: z.string(),
});

export const DialogueChoiceResolutionSchema = z.discriminatedUnion('kind', [
  DialogueResolutionFixedSchema,
  DialogueResolutionSkillSchema,
  DialogueResolutionLuckSchema,
]);

export type DialogueChoiceResolution = z.infer<typeof DialogueChoiceResolutionSchema>;

export const DialogueChoiceSchema = z.object({
  textPt: z.string(),
  resolution: DialogueChoiceResolutionSchema,
  effects: DialogueChoiceEffectsSchema.optional(),
  /** Só usado com `resolution` skill/luck; aplicado após `effects` se ambos existirem. */
  effectsOnSuccess: DialogueChoiceEffectsSchema.optional(),
  effectsOnFailure: DialogueChoiceEffectsSchema.optional(),
});

export type DialogueChoice = z.infer<typeof DialogueChoiceSchema>;

export const DialogueNodeSchema = z
  .object({
    linePt: z.string(),
    /** Ao entrar neste nó, vitória imediata (combate de diálogo). */
    terminal: z.enum(['victory', 'defeat']).optional(),
    choices: z.array(DialogueChoiceSchema).optional(),
  })
  .superRefine((node, ctx) => {
    if (node.terminal === 'victory' || node.terminal === 'defeat') return;
    if (!node.choices || node.choices.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Nó sem terminal:victory precisa de pelo menos uma escolha.',
      });
    }
  });

export type DialogueNode = z.infer<typeof DialogueNodeSchema>;

export const DialogueGraphSchema = z
  .object({
    rootNodeId: z.string(),
    nodes: z.record(z.string(), DialogueNodeSchema),
  })
  .superRefine((g, ctx) => {
    if (!g.nodes[g.rootNodeId]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `rootNodeId "${g.rootNodeId}" em falta em nodes.`,
      });
    }
    for (const [nid, node] of Object.entries(g.nodes)) {
      const visitChoice = (ch: z.infer<typeof DialogueChoiceSchema>, label: string) => {
        const res = ch.resolution;
        const targets: string[] = [];
        if (res.kind === 'fixed') targets.push(res.nextNodeId);
        else {
          targets.push(res.successNodeId, res.failNodeId);
        }
        for (const t of targets) {
          if (!g.nodes[t]) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `${label} em "${nid}" aponta para nó inexistente "${t}".`,
            });
          }
        }
      };
      if (node.choices) {
        for (let i = 0; i < node.choices.length; i++) {
          visitChoice(node.choices[i]!, `choices[${i}]`);
        }
      }
    }
  });

export type DialogueGraph = z.infer<typeof DialogueGraphSchema>;

export const DialogueEnemyDefSchema = z.object({
  id: z.string(),
  name: z.string(),
  sprite: z.string(),
  /** HP inicial da barra de “tensão” (hostilidade); reduzir a 0 também concede vitória. */
  tensionMax: z.number().int().positive(),
  /** Loot ao vencer o confronto verbal (mesmo modelo que `EnemyDef.lootDrops`). */
  lootDrops: z.array(EnemyLootDropSchema).optional(),
  graph: DialogueGraphSchema,
});

export type DialogueEnemyDef = z.infer<typeof DialogueEnemyDefSchema>;

/** Log próprio do combate de diálogo (separado de `CombatLogEntry`). */
export const DialogueCombatLogEntrySchema = z.object({
  kind: z.enum([
    'info',
    'interlocutor_line',
    'player_choice',
    'roll',
    'tension_shift',
    'leader_damage',
  ]),
  message: z.string(),
  dice: z.array(z.number()).optional(),
  modifier: z.number().optional(),
  final: z.number().optional(),
  /** Só em `tension_shift`: variação de hostilidade (negativo = acalmar / “dano” no reflexo). */
  hostilityDelta: z.number().int().optional(),
});

export type DialogueCombatLogEntry = z.infer<typeof DialogueCombatLogEntrySchema>;

/** Estado runtime do confronto de diálogo (não reutiliza `CombatState`). */
export const DialogueCombatStateSchema = z.object({
  encounterId: z.string(),
  dialogueEnemyId: z.string(),
  nodeId: z.string(),
  tensionHp: z.number().int().min(0),
  tensionMax: z.number().int().positive(),
  log: z.array(DialogueCombatLogEntrySchema),
  returnScene: z.string(),
  onVictory: z.string().optional(),
  onFlee: z.string().optional(),
  onDefeat: z.string().optional(),
});

export type DialogueCombatState = z.infer<typeof DialogueCombatStateSchema>;

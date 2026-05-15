import { z } from 'zod';

/** Loot por derrota (inimigo de batalha ou interlocutor de diálogo). */
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

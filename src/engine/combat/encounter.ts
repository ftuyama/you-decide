import { mulberry32, roll2d6 } from '../core/rng.ts';
import type {
  CombatLogEntry,
  CombatState,
  Encounter,
  EnemyInstance,
  GameState,
} from '../schema/index.ts';
import type { GameData } from '../data/gameData.ts';
import { effectiveLeadAttr } from '../progression/leadStats.ts';

/** Ajusta seed global após consumo de RNG em combate */
export function bumpRngSeed(state: GameState): GameState {
  return { ...state, rngSeed: (state.rngSeed + 0x1f) >>> 0 };
}

export function beginEncounter(
  state: GameState,
  enc: Encounter,
  data: GameData,
  opts: {
    returnScene: string;
    onVictory?: string;
    onFlee?: string;
    onDefeat?: string;
  }
): GameState {
  const rng = mulberry32(state.rngSeed);
  const enemies: EnemyInstance[] = [];
  const log: CombatLogEntry[] = [];
  for (const eid of enc.enemies) {
    const def = data.enemies[eid];
    if (!def) continue;
    enemies.push({
      defId: eid,
      hp: def.hp,
      maxHp: def.maxHp,
      armorChipsRemaining: def.armorChips,
      stress: 0,
    });
    log.push({
      kind: 'info',
      message: `${def.name} aparece.`,
    });
  }
  void rng;

  const combat: CombatState = {
    encounterId: enc.id,
    enemies,
    turnOrder: [],
    turnIndex: 0,
    round: 1,
    phase: 'choose_stance',
    log,
    playerAdvantage: enc.playerAdvantage,
    enemyAdvantage: enc.enemyAdvantage,
    fleeRate: enc.fleeRate,
    pendingSacrificeDamage: 0,
    pendingSacrificeCost: 0,
    buffAttackRoll: 0,
    buffArmorClass: 0,
    returnScene: opts.returnScene,
    onVictory: opts.onVictory,
    onFlee: opts.onFlee,
    onDefeat: opts.onDefeat,
    bossTwistAppliedIds: [],
    bossTwistInitialHpSum: enc.isBoss ? enemies.reduce((s, e) => s + e.hp, 0) : undefined,
  };

  combat.turnOrder = buildTurnOrder(state, combat, data, mulberry32(state.rngSeed));

  log.push({
    kind: 'info',
    message: formatTurnOrderForLog(combat.turnOrder, state, combat, data),
  });
  log.push({
    kind: 'turn_banner',
    message: `Rodada ${combat.round} — sua vez (postura e ataque)`,
  });

  const party = state.party.map((p) => ({ ...p, specialUsedThisCombat: false }));

  return {
    ...bumpRngSeed(state),
    party,
    mode: 'combat',
    combat,
  };
}

function buildTurnOrder(
  state: GameState,
  combat: CombatState,
  data: GameData,
  rng: () => number
): string[] {
  const rolls: { id: string; score: number }[] = [];
  for (const p of state.party) {
    const [d1, d2] = roll2d6(rng);
    const agi = effectiveLeadAttr(state, p, 'agi');
    const score = d1 + d2 + agi;
    rolls.push({ id: `p:${p.id}`, score });
  }
  for (let i = 0; i < combat.enemies.length; i++) {
    const def = data.enemies[combat.enemies[i].defId];
    if (!def) continue;
    const [d1, d2] = roll2d6(rng);
    rolls.push({ id: `e:${i}`, score: d1 + d2 + def.agi });
  }
  rolls.sort((a, b) => b.score - a.score);
  return rolls.map((r) => r.id);
}

/** Texto legível para o log (nomes em vez de p:rogue_mira, e:0…). */
function formatTurnOrderForLog(
  turnOrder: string[],
  state: GameState,
  combat: CombatState,
  data: GameData
): string {
  const enemyNameSeen = new Map<string, number>();
  const labels = turnOrder.map((token) => {
    if (token.startsWith('p:')) {
      const pid = token.slice(2);
      const c = state.party.find((x) => x.id === pid);
      return c?.name ?? pid;
    }
    if (token.startsWith('e:')) {
      const idx = Number(token.slice(2));
      const inst = combat.enemies[idx];
      if (!inst) return `Inimigo ${idx + 1}`;
      const def = data.enemies[inst.defId];
      const base = def?.name ?? `Inimigo ${idx + 1}`;
      const seen = enemyNameSeen.get(base) ?? 0;
      enemyNameSeen.set(base, seen + 1);
      return seen === 0 ? base : `${base} (${seen + 1})`;
    }
    return token;
  });
  return `Ordem de iniciativa: ${labels.join(' → ')}`;
}

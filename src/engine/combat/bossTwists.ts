import type {
  Character,
  CombatLogEntry,
  CombatState,
  EnemyInstance,
  GameState,
} from '../schema/index.ts';
import type { GameData } from '../data/gameData.ts';
import { finishCombat } from './resolution.ts';
import type { EventBus } from '../core/eventBus.ts';

function bossTwistWhenMatches(
  when: { minRound?: number; firstEnemyHpLte?: number; totalHpFractionLte?: number },
  round: number,
  enemies: EnemyInstance[],
  initialHpSum: number
): boolean {
  if (when.minRound != null && round < when.minRound) return false;
  const firstAlive = enemies.find((e) => e.hp > 0);
  if (when.firstEnemyHpLte != null) {
    if (firstAlive == null || firstAlive.hp > when.firstEnemyHpLte) return false;
  }
  if (when.totalHpFractionLte != null && initialHpSum > 0) {
    const sumHp = enemies.reduce((s, e) => s + Math.max(0, e.hp), 0);
    const frac = sumHp / initialHpSum;
    if (frac > when.totalHpFractionLte) return false;
  }
  return true;
}

/**
 * Avalia twists de boss ao passar para a próxima rodada do jogador (após a fase inimiga).
 * Um twist dispara no máximo uma vez por combate (`bossTwistAppliedIds`).
 */
export function applyBossTwistsAfterEnemyPhase(
  data: GameData,
  c: CombatState,
  party: Character[],
  enemies: EnemyInstance[],
  nextRound: number
): {
  party: Character[];
  enemies: EnemyInstance[];
  combatPatch: Partial<CombatState>;
  twistLog: CombatLogEntry[];
} {
  const enc = data.encounters[c.encounterId];
  const twistLog: CombatLogEntry[] = [];
  if (!enc?.isBoss || !enc.twists?.length) {
    return { party, enemies, combatPatch: {}, twistLog };
  }

  const applied = new Set(c.bossTwistAppliedIds ?? []);
  let enemiesNext = enemies;
  const partyNext = party;
  const combatPatch: Partial<CombatState> = {};
  const initialSum = Math.max(
    1,
    c.bossTwistInitialHpSum ?? enemies.reduce((s, e) => s + e.maxHp, 0)
  );

  let buffAC = c.buffArmorClass ?? 0;
  let buffAtk = c.buffAttackRoll ?? 0;
  let enemyBuffAC = c.enemyBuffArmorClass ?? 0;
  let enemyBuffAtk = c.enemyBuffAttackRoll ?? 0;
  let enemyAdv = c.enemyAdvantage === true;
  let playerAdv = c.playerAdvantage === true;

  for (const twist of enc.twists) {
    if (applied.has(twist.id)) continue;
    if (!bossTwistWhenMatches(twist.when, nextRound, enemiesNext, initialSum)) continue;

    applied.add(twist.id);
    for (const op of twist.apply) {
      switch (op.op) {
        case 'combatLog':
          twistLog.push({ kind: 'boss_twist', message: op.message });
          break;
        case 'setEnemyAdvantage':
          enemyAdv = op.value;
          combatPatch.enemyAdvantage = op.value;
          break;
        case 'setPlayerAdvantage':
          playerAdv = op.value;
          combatPatch.playerAdvantage = op.value;
          break;
        case 'buffLeadArmorClass':
          buffAC = Math.max(0, buffAC + op.delta);
          combatPatch.buffArmorClass = buffAC;
          break;
        case 'buffLeadAttackRoll':
          buffAtk = Math.max(0, buffAtk + op.delta);
          combatPatch.buffAttackRoll = buffAtk;
          break;
        case 'buffBossArmorClass':
          enemyBuffAC = Math.max(0, enemyBuffAC + op.delta);
          combatPatch.enemyBuffArmorClass = enemyBuffAC;
          break;
        case 'buffBossAttackRoll':
          enemyBuffAtk = Math.max(0, enemyBuffAtk + op.delta);
          combatPatch.enemyBuffAttackRoll = enemyBuffAtk;
          break;
        case 'damageAllEnemies':
          enemiesNext = enemiesNext.map((e) =>
            e.hp <= 0 ? e : { ...e, hp: Math.max(0, e.hp - op.amount) }
          );
          break;
        default:
          break;
      }
    }
  }

  combatPatch.bossTwistAppliedIds = [...applied];
  combatPatch.enemyAdvantage = enemyAdv;
  combatPatch.playerAdvantage = playerAdv;

  return { party: partyNext, enemies: enemiesNext, combatPatch, twistLog };
}

/** Se os twists mataram o último inimigo, termina o combate com vitória. */
export function finishCombatIfAllEnemiesDead(
  carryState: GameState,
  c: CombatState,
  party: Character[],
  enemies: EnemyInstance[],
  log: CombatLogEntry[],
  combatPatch: Partial<CombatState>,
  data: GameData,
  bus?: EventBus
): GameState | null {
  if (!enemies.every((e) => e.hp <= 0)) return null;
  const outLog = [...log, { kind: 'info' as const, message: 'Vitória!' }];
  return finishCombat(
    { ...carryState, party },
    { ...c, ...combatPatch, enemies, log: outLog, phase: 'ended' },
    true,
    data,
    bus
  );
}

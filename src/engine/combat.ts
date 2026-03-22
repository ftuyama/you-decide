import { mulberry32, roll2d6, roll3d6DropLowest, rollD6 } from './rng';
import type {
  Character,
  CombatLogEntry,
  CombatState,
  EnemyInstance,
  Encounter,
  GameState,
  Stance,
} from './schema';
import type { GameData } from './gameData';
import { addXp, computeCombatXp } from './progression';
import type { EventBus } from './eventBus';

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
    returnScene: opts.returnScene,
    onVictory: opts.onVictory,
    onFlee: opts.onFlee,
    onDefeat: opts.onDefeat,
  };

  combat.turnOrder = buildTurnOrder(state, combat, data, mulberry32(state.rngSeed));

  log.push({
    kind: 'info',
    message: `Ordem: ${combat.turnOrder.join(' → ')}`,
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
    const score = d1 + d2 + p.agi;
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

function getLead(state: GameState): Character {
  return state.party[0]!;
}

function statMod(attr: number): number {
  return Math.floor((attr - 6) / 2);
}

function getWeaponDamage(data: GameData, c: Character): number {
  let bonus = 0;
  if (c.weaponId && data.items[c.weaponId]) {
    bonus += data.items[c.weaponId]!.damage;
  }
  return bonus;
}

function getArmorValue(data: GameData, c: Character): number {
  let a = 0;
  if (c.armorId && data.items[c.armorId]) a += data.items[c.armorId]!.armor;
  if (c.relicId && data.items[c.relicId]) a += data.items[c.relicId]!.armor;
  return a;
}

export function applyPlayerStance(state: GameState, stance: Stance, _data: GameData): GameState {
  void _data;
  const c = state.combat;
  if (!c || c.phase !== 'choose_stance') return state;
  const lead = getLead(state);
  const log = [
    ...c.log,
    {
      kind: 'stance' as const,
      message: `${lead.name} assume postura ${stance}.`,
      actor: lead.name,
    },
  ];
  return {
    ...state,
    combat: { ...c, pendingStance: stance, phase: 'choose_target', log },
  };
}

export function playerAttack(
  state: GameState,
  enemyIndex: number,
  data: GameData,
  useSpecial: boolean,
  bus?: EventBus
): GameState {
  const c = state.combat;
  if (!c || c.phase !== 'choose_target' || !c.pendingStance) return state;
  const rng = mulberry32(state.rngSeed + c.round * 997);
  const lead = getLead(state);
  const stance = c.pendingStance;
  const def = data.enemies[c.enemies[enemyIndex]?.defId ?? ''];
  if (!def) return state;

  let str = lead.str;
  let agi = lead.agi;
  let mind = lead.mind;
  if (lead.weaponId && data.items[lead.weaponId]) {
    const w = data.items[lead.weaponId]!;
    str += w.bonusStr;
    agi += w.bonusAgi;
    mind += w.bonusMind;
  }
  if (lead.armorId && data.items[lead.armorId]) {
    const ar = data.items[lead.armorId]!;
    str += ar.bonusStr;
    agi += ar.bonusAgi;
    mind += ar.bonusMind;
  }
  if (lead.relicId && data.items[lead.relicId]) {
    const r = data.items[lead.relicId]!;
    str += r.bonusStr;
    agi += r.bonusAgi;
    mind += r.bonusMind;
  }

  let atkMod = statMod(str);
  let defMod = statMod(agi);
  if (stance === 'aggressive') {
    atkMod += 1;
    defMod -= 1;
  } else if (stance === 'defensive') {
    atkMod -= 1;
    defMod += 1;
  } else if (stance === 'focus') {
    atkMod = statMod(mind) + 1;
  }

  let dice: number[] = [];
  let total = 0;
  if (c.playerAdvantage) {
    const r = roll3d6DropLowest(rng);
    dice = [...r.dice];
    total = r.sum + atkMod;
  } else {
    const [d1, d2] = roll2d6(rng);
    dice = [d1, d2];
    total = d1 + d2 + atkMod;
  }

  const targetDef = def.agi + def.armor + (stance === 'defensive' ? 0 : 0);
  const defense = 7 + Math.floor(targetDef / 2);

  const log = [...c.log];
  let newEnemies = [...c.enemies];
  let newLead = { ...lead };
  let stress = newLead.stress;
  let rollTotal = total;

  if (useSpecial && !lead.specialUsedThisCombat) {
    newLead.specialUsedThisCombat = true;
    rollTotal += 2;
    stress = Math.min(4, stress + 1);
    log.push({ kind: 'stress', message: 'Golpe especial! +2 no ataque, +1 Stress.', actor: lead.name });
  }

  const hit = rollTotal >= defense;

  log.push({
    kind: 'attack',
    message: hit
      ? `${lead.name} acerta ${def.name}!`
      : `${lead.name} erra o golpe (${rollTotal} vs CA ${defense}).`,
    dice,
    modifier: atkMod,
    final: rollTotal,
    actor: lead.name,
    target: def.name,
    outcome: hit ? 'hit' : 'miss',
    vsDefense: defense,
  });

  if (hit) {
    const dDmg = rollD6(rng);
    let dmg = dDmg + getWeaponDamage(data, lead) + (stance === 'aggressive' ? 1 : 0);
    const chipTarget = newEnemies[enemyIndex]!;
    if (def.type === 'armored' && chipTarget.armorChipsRemaining > 0) {
      chipTarget.armorChipsRemaining -= 1;
      log.push({
        kind: 'armor_break',
        message: 'Camada de armadura quebrada!',
        target: def.name,
      });
      newEnemies[enemyIndex] = { ...chipTarget };
    } else {
      if (def.type === 'undead' && lead.class === 'cleric') {
        dmg += 1;
      }
      const nh = Math.max(0, chipTarget.hp - dmg);
      newEnemies[enemyIndex] = { ...chipTarget, hp: nh };
      log.push({
        kind: 'damage',
        message: `${def.name} sofre ${dmg} de dano.`,
        dice: [dDmg],
        final: dmg,
        target: def.name,
      });
    }
  }

  if (lead.stress >= 4) {
    defMod -= 2;
    log.push({ kind: 'stress', message: 'Pânico! Defesa penalizada no próximo turno inimigo.' });
  }

  newLead.stress = stress;
  const party = state.party.map((p) => (p.id === lead.id ? newLead : p));

  const allDead = newEnemies.every((e) => e.hp <= 0);
  if (allDead) {
    log.push({ kind: 'info', message: 'Vitória!' });
    return finishCombat(
      { ...state, party, rngSeed: (state.rngSeed + 31) >>> 0 },
      { ...c, enemies: newEnemies, log, phase: 'ended' },
      true,
      data,
      bus
    );
  }

  return advanceToEnemyTurn(
    {
      ...state,
      party,
      rngSeed: (state.rngSeed + 31) >>> 0,
    },
    { ...c, enemies: newEnemies, log, phase: 'enemy', pendingStance: undefined },
    data,
    bus
  );
}

function finishCombat(
  state: GameState,
  c: CombatState,
  victory: boolean,
  data: GameData,
  bus?: EventBus
): GameState {
  const next =
    victory ? (c.onVictory ?? c.returnScene) : (c.onDefeat ?? 'act4/game_over');
  let s = state;
  if (victory) {
    const enc = data.encounters[c.encounterId];
    if (enc) {
      const xpGain = computeCombatXp(enc, data);
      if (xpGain > 0) {
        s = addXp(s, xpGain, { bus });
        s = { ...s, diary: [...s.diary, `+${xpGain} XP pela vitória.`] };
      }
    }
    bus?.emit({ type: 'combat.end', victory: true });
  } else {
    bus?.emit({ type: 'combat.end', victory: false });
  }
  return {
    ...s,
    mode: 'story',
    combat: null,
    sceneId: next,
  };
}

function advanceToEnemyTurn(state: GameState, c: CombatState, data: GameData, bus?: EventBus): GameState {
  const rng = mulberry32(state.rngSeed + 999);
  const log = [
    ...c.log,
    {
      kind: 'turn_banner' as const,
      message: `Rodada ${c.round} — inimigos`,
    },
  ];
  const enemies = [...c.enemies];
  let party = state.party.map((p) => ({ ...p }));

  for (let i = 0; i < enemies.length; i++) {
    const inst = enemies[i]!;
    if (inst.hp <= 0) continue;
    const def = data.enemies[inst.defId];
    if (!def) continue;
    const target = party[0]!;
    let atk = 0;
    let dice: number[] = [];
    if (c.enemyAdvantage) {
      const r = roll3d6DropLowest(rng);
      dice = [...r.dice];
      atk = r.sum + statMod(def.str);
    } else {
      const [d1, d2] = roll2d6(rng);
      dice = [d1, d2];
      atk = d1 + d2 + statMod(def.str);
    }
    const defScore =
      7 +
      statMod(target.agi) +
      getArmorValue(data, target) +
      (c.pendingStance === 'defensive' ? 2 : 0);

    const enemyHit = atk >= defScore;
    log.push({
      kind: 'attack',
      message: enemyHit
        ? `${def.name} acerta ${target.name}!`
        : `${def.name} erra (${atk} vs CA ${defScore}).`,
      dice,
      modifier: statMod(def.str),
      final: atk,
      actor: def.name,
      target: target.name,
      outcome: enemyHit ? 'hit' : 'miss',
      vsDefense: defScore,
    });

    if (enemyHit) {
      const dDmg = rollD6(rng);
      const reduc = getArmorValue(data, target);
      const dmg = Math.max(1, dDmg + statMod(def.str) - reduc);
      const nh = Math.max(0, target.hp - dmg);
      party[0] = { ...target, hp: nh };
      log.push({
        kind: 'damage',
        message: `${target.name} sofre ${dmg}.`,
        dice: [dDmg],
        final: dmg,
        target: target.name,
      });
      let st = target.stress;
      st = Math.min(4, st + 1);
      party[0] = { ...party[0]!, stress: st };
    }
  }

  const leadDead = party[0]!.hp <= 0;
  if (leadDead) {
    log.push({ kind: 'info', message: 'Fim de linha.' });
    return finishCombat(
      { ...state, party },
      { ...c, enemies, log, phase: 'ended' },
      false,
      data,
      bus
    );
  }

  const nextRound = c.round + 1;
  log.push({
    kind: 'turn_banner',
    message: `Rodada ${nextRound} — sua vez (postura e ataque)`,
  });

  return {
    ...state,
    party,
    combat: {
      ...c,
      enemies,
      log,
      phase: 'choose_stance',
      round: nextRound,
      pendingStance: undefined,
    },
    rngSeed: (state.rngSeed + 17) >>> 0,
  };
}

/** Postura + ataque ao primeiro inimigo vivo (índice resolvido internamente). */
export function executePlayerTurn(
  state: GameState,
  stance: Stance,
  data: GameData,
  useSpecial: boolean,
  bus?: EventBus
): GameState {
  let s = applyPlayerStance(state, stance, data);
  const c = s.combat;
  if (!c) return s;
  let idx = c.enemies.findIndex((e) => e.hp > 0);
  if (idx < 0) idx = 0;
  return playerAttack(s, idx, data, useSpecial, bus);
}

export function fleeCombat(state: GameState, bus?: EventBus): GameState {
  const c = state.combat;
  if (!c) return state;
  bus?.emit({ type: 'combat.end', victory: false });
  return {
    ...state,
    mode: 'story',
    combat: null,
    sceneId: c.onFlee ?? c.returnScene,
  };
}

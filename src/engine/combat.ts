import {
  attackRollSpecial2d6,
  attackRollSpecial3d6dl,
  mulberry32,
  roll2d6,
  roll3d6DropLowest,
  rollD6,
  type AttackRollSpecial,
} from './rng';
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
import { effectiveLeadAttr, tickActiveBuffs } from './leadStats';
import { addXp, computeCombatXp } from './progression';
import type { EventBus } from './eventBus';

/** Confirmação de crítico inimigo após 6+6 (padrão ~25%) */
export const DEFAULT_ENEMY_CRIT_CONFIRM = 0.25;

function toRollOutcome(
  s: AttackRollSpecial
): 'crit_threat' | 'fumble_threat' | 'normal' {
  if (s === 'crit') return 'crit_threat';
  if (s === 'fumble') return 'fumble_threat';
  return 'normal';
}

/** Sorte base (+ buffs temporários) + bônus de itens equipados */
export function getEffectiveLuck(c: Character, data: GameData, state?: GameState): number {
  let sum = state ? effectiveLeadAttr(state, c, 'luck') : c.luck;
  for (const slot of [c.weaponId, c.armorId, c.relicId] as const) {
    if (slot && data.items[slot]) {
      sum += data.items[slot]!.bonusLuck ?? 0;
    }
  }
  return sum;
}

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
  const lead = state.party[0];
  for (const p of state.party) {
    const [d1, d2] = roll2d6(rng);
    const agi = lead && p.id === lead.id ? effectiveLeadAttr(state, p, 'agi') : p.agi;
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

/** Soma bônus de STR/AGI/MEN/SOR e valores de armadura/dano dos três slots equipados. */
export function sumEquippedItemBonuses(data: GameData, c: Character): {
  str: number;
  agi: number;
  mind: number;
  luck: number;
  armor: number;
  damage: number;
} {
  let str = 0;
  let agi = 0;
  let mind = 0;
  let luck = 0;
  let armor = 0;
  let damage = 0;
  for (const slot of [c.weaponId, c.armorId, c.relicId] as const) {
    if (slot && data.items[slot]) {
      const it = data.items[slot]!;
      str += it.bonusStr ?? 0;
      agi += it.bonusAgi ?? 0;
      mind += it.bonusMind ?? 0;
      luck += it.bonusLuck ?? 0;
      armor += it.armor ?? 0;
      damage += it.damage ?? 0;
    }
  }
  return { str, agi, mind, luck, armor, damage };
}

/** Pontos de armadura vindos só de itens (CA parcial). */
export function getEquippedArmorPoints(data: GameData, c: Character): number {
  return getArmorValue(data, c);
}

/** CA base (ataques inimigos: 7 + mod AGI + bónus de armadura; postura defensiva +2 em combate). */
export function getCharacterArmorClass(data: GameData, c: Character, state?: GameState): number {
  const agi = state ? effectiveLeadAttr(state, c, 'agi') : c.agi;
  return 7 + statMod(agi) + getArmorValue(data, c);
}

function getTotalMind(data: GameData, c: Character, state?: GameState): number {
  let mind = state ? effectiveLeadAttr(state, c, 'mind') : c.mind;
  for (const slot of [c.weaponId, c.armorId, c.relicId] as const) {
    if (slot && data.items[slot]) {
      mind += data.items[slot]!.bonusMind;
    }
  }
  return mind;
}

export function canCastSpell(state: GameState, spellId: string, data: GameData): boolean {
  const c = state.combat;
  const lead = state.party[0];
  const sp = data.spells[spellId];
  if (!c || c.phase !== 'choose_stance' || !lead || !sp) return false;
  if (lead.maxMana <= 0) return false;
  if (lead.mana < sp.manaCost) return false;
  if (state.level < sp.minLevel) return false;
  if (sp.classId !== 'any' && sp.classId !== lead.class) return false;
  return true;
}

export function castSpell(
  state: GameState,
  spellId: string,
  data: GameData,
  bus?: EventBus
): GameState {
  const c = state.combat;
  const lead = getLead(state);
  const sp = data.spells[spellId];
  if (!c || c.phase !== 'choose_stance' || !sp) return state;
  if (!canCastSpell(state, spellId, data)) return state;

  const rng = mulberry32(state.rngSeed + c.round * 701 + spellId.length * 13);
  const mindMod = statMod(getTotalMind(data, lead, state));
  let newLead: Character = { ...lead, mana: lead.mana - sp.manaCost };
  const log = [...c.log];
  log.push({
    kind: 'info',
    message: `${lead.name} lança ${sp.name} (−${sp.manaCost} mana).`,
    actor: lead.name,
  });

  let newEnemies = [...c.enemies];

  if (sp.spellKind === 'damage') {
    const enemyIndex = newEnemies.findIndex((e) => e.hp > 0);
    if (enemyIndex < 0) return state;
    const def = data.enemies[newEnemies[enemyIndex]!.defId];
    if (!def) return state;
    const diceRolls: number[] = [];
    let sum = 0;
    for (let i = 0; i < sp.dice; i++) {
      const d = rollD6(rng);
      diceRolls.push(d);
      sum += d;
    }
    const dmg = Math.max(0, sum + mindMod);
    const chipTarget = newEnemies[enemyIndex]!;
    if (def.type === 'armored' && chipTarget.armorChipsRemaining > 0) {
      chipTarget.armorChipsRemaining -= 1;
      log.push({
        kind: 'armor_break',
        message: 'Camada de armadura quebrada (magia)!',
        target: def.name,
      });
      newEnemies[enemyIndex] = { ...chipTarget };
    } else {
      const nh = Math.max(0, chipTarget.hp - dmg);
      newEnemies[enemyIndex] = { ...chipTarget, hp: nh };
      log.push({
        kind: 'damage',
        message: `${def.name} sofre ${dmg} de dano mágico.`,
        dice: diceRolls,
        final: dmg,
        target: def.name,
        damageKind: 'normal',
      });
    }
  } else {
    const diceRolls: number[] = [];
    let sum = 0;
    for (let i = 0; i < sp.dice; i++) {
      const d = rollD6(rng);
      diceRolls.push(d);
      sum += d;
    }
    const healTotal = Math.max(0, sum + mindMod);
    const healed = Math.min(newLead.maxHp - newLead.hp, healTotal);
    const nh = newLead.hp + healed;
    newLead = { ...newLead, hp: nh };
    log.push({
      kind: 'heal',
      message: `${lead.name} recupera ${healed} HP.`,
      dice: diceRolls,
      final: healed,
      actor: lead.name,
      target: lead.name,
    });
  }

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

export function executeSpellTurn(
  state: GameState,
  spellId: string,
  data: GameData,
  bus?: EventBus
): GameState {
  return castSpell(state, spellId, data, bus);
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

/**
 * Um ataque físico (líder ou companheiro). Na mesma vaga de combate, todos usam a postura escolhida pelo líder.
 * Golpe especial só para o índice 0.
 */
function physicalAttackForCharacter(
  state: GameState,
  c: CombatState,
  party: Character[],
  enemies: EnemyInstance[],
  attackerIndex: number,
  enemyIndex: number,
  stance: Stance,
  useSpecial: boolean,
  data: GameData,
  rng: () => number,
  log: CombatLogEntry[],
  _bus?: EventBus
): { party: Character[]; enemies: EnemyInstance[]; log: CombatLogEntry[] } | null {
  void _bus;
  const attacker = party[attackerIndex];
  if (!attacker || attacker.hp <= 0) return null;
  const inst = enemies[enemyIndex];
  if (!inst || inst.hp <= 0) return null;
  const def = data.enemies[inst.defId];
  if (!def) return null;
  if (useSpecial && attackerIndex !== 0) return null;

  let str = effectiveLeadAttr(state, attacker, 'str');
  let mind = effectiveLeadAttr(state, attacker, 'mind');
  for (const slot of [attacker.weaponId, attacker.armorId, attacker.relicId] as const) {
    if (slot && data.items[slot]) {
      const it = data.items[slot]!;
      str += it.bonusStr;
      mind += it.bonusMind;
    }
  }

  let atkMod = statMod(str);
  if (stance === 'aggressive') {
    atkMod += 1;
  } else if (stance === 'defensive') {
    atkMod -= 1;
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

  const special: AttackRollSpecial = c.playerAdvantage
    ? attackRollSpecial3d6dl(dice as [number, number, number])
    : attackRollSpecial2d6(dice[0]!, dice[1]!);

  const targetDef = def.agi + def.armor;
  const defense = 7 + Math.floor(targetDef / 2);

  const logOut = [...log];
  let newEnemies = [...enemies];
  let newAttacker = { ...attacker };
  let stress = newAttacker.stress;
  let rollTotal = total;

  if (useSpecial && attackerIndex === 0 && !attacker.specialUsedThisCombat) {
    newAttacker.specialUsedThisCombat = true;
    rollTotal += 2;
    stress = Math.min(4, stress + 1);
    logOut.push({
      kind: 'stress',
      message: 'Golpe especial! +2 no ataque, +1 Stress.',
      actor: attacker.name,
    });
  }

  let hit = false;
  if (special === 'fumble') {
    hit = false;
  } else if (special === 'crit') {
    hit = true;
  } else {
    hit = rollTotal >= defense;
  }

  const rollOutcome = toRollOutcome(special);
  let attackMsg: string;
  if (special === 'fumble') {
    attackMsg = `${attacker.name} falha criticamente (dados 1+1).`;
  } else if (special === 'crit') {
    attackMsg = `${attacker.name} acerta ${def.name} em cheio (crítico)!`;
  } else if (hit) {
    attackMsg = `${attacker.name} acerta ${def.name}!`;
  } else {
    attackMsg = `${attacker.name} erra o golpe (${rollTotal} vs CA ${defense}).`;
  }

  logOut.push({
    kind: 'attack',
    message: attackMsg,
    dice,
    modifier: atkMod,
    final: rollTotal,
    actor: attacker.name,
    target: def.name,
    outcome: hit ? 'hit' : 'miss',
    vsDefense: defense,
    rollOutcome,
  });

  if (hit) {
    const dDmg = rollD6(rng);
    const effLuck = getEffectiveLuck(attacker, data, state);
    const luckBonus = statMod(effLuck);
    let wd = getWeaponDamage(data, attacker);
    if (wd === 0 && !attacker.weaponId) wd = 1;
    const baseFlat = wd + (stance === 'aggressive' ? 1 : 0);
    const holyBonus = def.type === 'undead' && attacker.class === 'cleric' ? 1 : 0;
    const isPlayerCrit = special === 'crit';
    const chipTarget = newEnemies[enemyIndex]!;
    if (def.type === 'armored' && chipTarget.armorChipsRemaining > 0) {
      const ct = {
        ...chipTarget,
        armorChipsRemaining: chipTarget.armorChipsRemaining - 1,
      };
      logOut.push({
        kind: 'armor_break',
        message: 'Camada de armadura quebrada!',
        target: def.name,
      });
      newEnemies[enemyIndex] = ct;
    } else {
      const dmg = isPlayerCrit
        ? dDmg * 2 + baseFlat + holyBonus + luckBonus
        : dDmg + baseFlat + holyBonus;
      const nh = Math.max(0, chipTarget.hp - dmg);
      newEnemies[enemyIndex] = { ...chipTarget, hp: nh };
      logOut.push({
        kind: 'damage',
        message: isPlayerCrit
          ? `${def.name} sofre ${dmg} de dano (crítico)!`
          : `${def.name} sofre ${dmg} de dano.`,
        dice: [dDmg],
        final: dmg,
        target: def.name,
        damageKind: isPlayerCrit ? 'crit' : 'normal',
      });
    }
  }

  newAttacker.stress = stress;
  if (attackerIndex === 0 && newAttacker.stress >= 4) {
    logOut.push({
      kind: 'stress',
      message: 'Pânico! Defesa penalizada no próximo turno inimigo.',
    });
  }

  const newParty = party.map((p, i) => (i === attackerIndex ? newAttacker : p));

  return { party: newParty, enemies: newEnemies, log: logOut };
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
  const stance = c.pendingStance;
  const def0 = data.enemies[c.enemies[enemyIndex]?.defId ?? ''];
  if (!def0) return state;

  let rng = mulberry32(state.rngSeed + c.round * 997);
  let log = [...c.log];
  let party = state.party.map((p) => ({ ...p }));
  let enemies = [...c.enemies];

  const st = { ...state, party };
  const r0 = physicalAttackForCharacter(
    st,
    c,
    party,
    enemies,
    0,
    enemyIndex,
    stance,
    useSpecial,
    data,
    rng,
    log,
    bus
  );
  if (!r0) return state;
  party = r0.party;
  enemies = r0.enemies;
  log = r0.log;

  let rngSeed = (state.rngSeed + 31) >>> 0;

  if (enemies.every((e) => e.hp <= 0)) {
    log.push({ kind: 'info', message: 'Vitória!' });
    return finishCombat(
      { ...state, party, rngSeed },
      { ...c, enemies, log, phase: 'ended' },
      true,
      data,
      bus
    );
  }

  for (let pi = 1; pi < party.length; pi++) {
    if (party[pi]!.hp <= 0) continue;
    const eIdx = enemies.findIndex((e) => e.hp > 0);
    if (eIdx < 0) break;
    rng = mulberry32(rngSeed + c.round * 997 + pi * 47);
    const rn = physicalAttackForCharacter(
      { ...state, party, rngSeed },
      c,
      party,
      enemies,
      pi,
      eIdx,
      stance,
      false,
      data,
      rng,
      log,
      bus
    );
    if (!rn) break;
    party = rn.party;
    enemies = rn.enemies;
    log = rn.log;
    rngSeed = (rngSeed + 31) >>> 0;

    if (enemies.every((e) => e.hp <= 0)) {
      log.push({ kind: 'info', message: 'Vitória!' });
      return finishCombat(
        { ...state, party, rngSeed },
        { ...c, enemies, log, phase: 'ended' },
        true,
        data,
        bus
      );
    }
  }

  return advanceToEnemyTurn(
    {
      ...state,
      party,
      rngSeed,
    },
    { ...c, enemies, log, phase: 'enemy', pendingStance: undefined },
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
    let xpGain = 0;
    const enc = data.encounters[c.encounterId];
    if (enc) {
      xpGain = computeCombatXp(enc, data);
      if (xpGain > 0) {
        s = addXp(s, xpGain, { bus });
        s = { ...s, diary: [...s.diary, `+${xpGain} XP pela vitória.`] };
      }
    }
    s = { ...s, lastCombatXpGain: xpGain > 0 ? xpGain : null };
    bus?.emit({ type: 'combat.end', victory: true });
  } else {
    s = { ...s, lastCombatXpGain: null };
    bus?.emit({ type: 'combat.end', victory: false });
  }
  return tickActiveBuffs({
    ...s,
    mode: 'story',
    combat: null,
    sceneId: next,
  });
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
    let special: AttackRollSpecial = 'normal';
    if (c.enemyAdvantage) {
      const r = roll3d6DropLowest(rng);
      dice = [...r.dice];
      atk = r.sum + statMod(def.str);
      special = attackRollSpecial3d6dl(r.dice);
    } else {
      const [d1, d2] = roll2d6(rng);
      dice = [d1, d2];
      atk = d1 + d2 + statMod(def.str);
      special = attackRollSpecial2d6(d1, d2);
    }
    const defScore =
      7 +
      statMod(effectiveLeadAttr(state, target, 'agi')) +
      getArmorValue(data, target) +
      (c.pendingStance === 'defensive' ? 2 : 0);

    const critConfirm = def.critConfirm ?? DEFAULT_ENEMY_CRIT_CONFIRM;
    let enemyHit = false;
    let enemyCritDmg = false;
    if (special === 'fumble') {
      enemyHit = false;
    } else if (special === 'crit') {
      if (rng() < critConfirm) {
        enemyHit = true;
        enemyCritDmg = true;
      } else {
        enemyHit = atk >= defScore;
      }
    } else {
      enemyHit = atk >= defScore;
    }

    const rollOutcome = toRollOutcome(special);
    let enemyAtkMsg: string;
    if (special === 'fumble') {
      enemyAtkMsg = `${def.name} falha criticamente (dados 1+1).`;
    } else if (enemyHit && enemyCritDmg) {
      enemyAtkMsg = `${def.name} acerta ${target.name} em cheio (crítico)!`;
    } else if (enemyHit) {
      enemyAtkMsg = `${def.name} acerta ${target.name}!`;
    } else {
      enemyAtkMsg = `${def.name} erra (${atk} vs CA ${defScore}).`;
    }

    log.push({
      kind: 'attack',
      message: enemyAtkMsg,
      dice,
      modifier: statMod(def.str),
      final: atk,
      actor: def.name,
      target: target.name,
      outcome: enemyHit ? 'hit' : 'miss',
      vsDefense: defScore,
      rollOutcome,
    });

    if (special === 'crit' && !enemyCritDmg && enemyHit) {
      log.push({ kind: 'info', message: 'Quase crítico…' });
    }

    if (enemyHit) {
      const dDmg = rollD6(rng);
      const reduc = getArmorValue(data, target);
      const strMod = statMod(def.str);
      const dmg = enemyCritDmg
        ? Math.max(1, dDmg * 2 + strMod - reduc)
        : Math.max(1, dDmg + strMod - reduc);
      const nh = Math.max(0, target.hp - dmg);
      party[0] = { ...target, hp: nh };
      log.push({
        kind: 'damage',
        message: enemyCritDmg
          ? `${target.name} sofre ${dmg} (crítico)!`
          : `${target.name} sofre ${dmg}.`,
        dice: [dDmg],
        final: dmg,
        target: target.name,
        damageKind: enemyCritDmg ? 'crit' : 'normal',
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
  return tickActiveBuffs({
    ...state,
    lastCombatXpGain: null,
    mode: 'story',
    combat: null,
    sceneId: c.onFlee ?? c.returnScene,
  });
}

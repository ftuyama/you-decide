import { mulberry32, rollD6 } from '../core/rng.ts';
import type { Character, CombatState, GameState } from '../schema/index.ts';
import type { GameData } from '../data/gameData.ts';
import { getTotalMind, statMod } from '../combat/combatStats.ts';
import type { EventBus } from '../core/eventBus.ts';
import { finishCombat } from './resolution.ts';
import { advanceToEnemyTurn } from './turn.ts';

export function canCastSpell(state: GameState, spellId: string, data: GameData): boolean {
  const c = state.combat;
  const lead = state.party[0];
  const sp = data.spells[spellId];
  if (!c || c.phase !== 'choose_stance' || !lead || !sp) return false;
  if (!state.knownSpells.includes(spellId)) return false;
  if (lead.maxMana <= 0) return false;
  if (lead.mana < sp.manaCost) return false;
  if (state.level < sp.minLevel) return false;
  if (sp.classId !== 'any' && sp.classId !== lead.class) return false;
  return true;
}

function getLead(state: GameState): Character {
  return state.party[0]!;
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
    spellId,
  });

  let newEnemies = [...c.enemies];
  let combatBuffs: Pick<CombatState, 'buffAttackRoll' | 'buffArmorClass'> = {
    buffAttackRoll: c.buffAttackRoll ?? 0,
    buffArmorClass: c.buffArmorClass ?? 0,
  };

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
    const dmg = Math.max(0, sp.base + sum + mindMod);
    const chipTarget = newEnemies[enemyIndex]!;
    if (def.type === 'armored' && chipTarget.armorChipsRemaining > 0) {
      chipTarget.armorChipsRemaining -= 1;
      log.push({
        kind: 'armor_break',
        message: 'Camada de armadura quebrada (magia)!',
        target: def.name,
        enemyIndex,
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
        enemyIndex,
        lethal: nh <= 0,
        spellId,
      });
    }
  } else if (sp.spellKind === 'heal_self') {
    const diceRolls: number[] = [];
    let sum = 0;
    for (let i = 0; i < sp.dice; i++) {
      const d = rollD6(rng);
      diceRolls.push(d);
      sum += d;
    }
    const healTotal = Math.max(0, sp.base + sum + mindMod);
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
      spellId,
    });
  } else if (sp.spellKind === 'buff_attack_roll') {
    combatBuffs = { ...combatBuffs, buffAttackRoll: 1 };
    log.push({
      kind: 'info',
      message: `${lead.name} canaliza força — +1 no ataque até ao fim do combate.`,
      actor: lead.name,
      spellId,
    });
  } else {
    combatBuffs = { ...combatBuffs, buffArmorClass: 1 };
    log.push({
      kind: 'info',
      message: `${lead.name} endurece a guarda — +1 CA até ao fim do combate.`,
      actor: lead.name,
      spellId,
    });
  }

  const party = state.party.map((p) => (p.id === lead.id ? newLead : p));

  const allDead = newEnemies.every((e) => e.hp <= 0);
  if (allDead) {
    log.push({ kind: 'info', message: 'Vitória!' });
    return finishCombat(
      { ...state, party, rngSeed: (state.rngSeed + 31) >>> 0 },
      {
        ...c,
        ...combatBuffs,
        enemies: newEnemies,
        log,
        phase: 'ended',
      },
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
    {
      ...c,
      ...combatBuffs,
      enemies: newEnemies,
      log,
      phase: 'enemy',
      pendingStance: undefined,
      defenseStanceForEnemyTurn: undefined,
    },
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

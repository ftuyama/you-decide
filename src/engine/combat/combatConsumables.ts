import type { GameState } from '../schema.ts';
import type { GameData } from '../gameData.ts';
import type { EventBus } from '../eventBus.ts';
import {
  applyConsumableToCharacter,
  isConsumable,
  removeOneInventoryItem,
} from '../consumables.ts';
import { advanceToEnemyTurn } from './turn.ts';

function getLead(state: GameState) {
  return state.party[0]!;
}

export function canUseCombatConsumable(state: GameState, itemId: string, data: GameData): boolean {
  const c = state.combat;
  const lead = state.party[0];
  const def = data.items[itemId];
  if (!c || c.phase !== 'choose_stance' || !lead || lead.hp <= 0) return false;
  if (!def || !isConsumable(def)) return false;
  if (!state.inventory.includes(itemId)) return false;
  const manaOnly =
    !!def.restoreMana &&
    def.restoreMana > 0 &&
    !def.restoreHp &&
    !def.stressRelief;
  if (manaOnly && lead.maxMana <= 0) return false;
  return true;
}

/** Usa poção no líder; consome o turno (como magia). */
export function useCombatConsumable(
  state: GameState,
  itemId: string,
  data: GameData,
  bus?: EventBus
): GameState {
  const c = state.combat;
  const lead = getLead(state);
  const def = data.items[itemId];
  if (!c || !canUseCombatConsumable(state, itemId, data) || !def) return state;

  const inv = removeOneInventoryItem(state.inventory, itemId);
  if (!inv) return state;

  const newLead = applyConsumableToCharacter(def, lead);
  const party = state.party.map((p) => (p.id === lead.id ? newLead : p));
  const log = [...c.log];
  log.push({
    kind: 'info',
    message: `${lead.name} usa ${def.name}.`,
    actor: lead.name,
  });
  if (def.restoreHp && def.restoreHp > 0) {
    const delta = newLead.hp - lead.hp;
    if (delta > 0) {
      log.push({
        kind: 'heal',
        message: `${lead.name} recupera ${delta} HP.`,
        final: delta,
        actor: lead.name,
        target: lead.name,
      });
    } else {
      log.push({ kind: 'info', message: 'Nada a curar — HP já cheio.' });
    }
  }
  if (def.restoreMana && def.restoreMana > 0 && lead.maxMana > 0) {
    const delta = newLead.mana - lead.mana;
    if (delta > 0) {
      log.push({ kind: 'info', message: `${lead.name} recupera ${delta} mana.` });
    } else {
      log.push({ kind: 'info', message: 'Mana já no máximo.' });
    }
  }
  if (def.stressRelief && def.stressRelief > 0) {
    const delta = lead.stress - newLead.stress;
    if (delta > 0) {
      log.push({
        kind: 'stress',
        message: `${lead.name} alivia o stress (−${delta}).`,
        actor: lead.name,
      });
    } else {
      log.push({ kind: 'info', message: 'Stress já no mínimo.' });
    }
  }

  return advanceToEnemyTurn(
    {
      ...state,
      party,
      rngSeed: (state.rngSeed + 31) >>> 0,
      inventory: inv,
    },
    { ...c, enemies: c.enemies, log, phase: 'enemy', pendingStance: undefined },
    data,
    bus
  );
}

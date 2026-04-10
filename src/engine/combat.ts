export {
  DEFAULT_ENEMY_CRIT_CONFIRM,
  DEFAULT_ENEMY_COMBAT_LINE_CHANCE,
  DEFAULT_FOCUS_LEADER_WEIGHT,
  SACRIFICE_MIN_CORRUPTION,
} from './combat/constants.ts';
export { bumpRngSeed, beginEncounter } from './combat/encounter.ts';
export { getCharacterArmorClass, getEquippedArmorPoints, sumEquippedItemBonuses } from './combatStats.ts';
export { canCastSpell, castSpell, executeSpellTurn } from './combat/spells.ts';
export { canUseCombatConsumable, useCombatConsumable } from './combat/combatConsumables.ts';
export {
  applyPlayerStance,
  executePlayerTurn,
  fleeCombat,
  fleeDifficultyTn,
  playerAttack,
} from './combat/turn.ts';

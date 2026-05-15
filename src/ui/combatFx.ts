import type {
  Character,
  ClassId,
  CombatLogEntry,
  CombatState,
  SpellDef,
} from '../engine/schema/index.ts';
import type { GameData } from '../engine/data/index.ts';

/** Per-weapon overlay flavour (items without id here use class fallback). */
const WEAPON_MELEE_STYLE: Partial<Record<string, 'slash' | 'blunt' | 'staff'>> = {
  iron_dagger: 'slash',
  rusty_sword: 'slash',
  oak_staff: 'staff',
  mace: 'blunt',
};

const CLASS_FALLBACK: Record<ClassId, 'slash' | 'blunt' | 'staff'> = {
  knight: 'slash',
  mage: 'staff',
  cleric: 'blunt',
};

export type ResolvedEnemyFx = {
  /** CSS classes on `.enemy-fx-layer` */
  layerClasses: string[];
  /** Add `.enemy-sprite.crit-flash` for one animation */
  spriteCritShake: boolean;
};

/** Pulso na coluna de inimigos + painel de ações (cura, poção, buff). */
export type CombatColumnPulse = 'heal_spell' | 'heal_potion' | 'buff' | null;

/** Flash breve na coluna de inimigos (ex.: Centelha / fogo na cena). */
export type CombatColumnFlash = 'ember' | null;

/** Partículas de poção (cor) — derivado do `itemId` no log. */
export type CombatPotionParticles = 'hp' | 'mana' | 'stress' | null;

export type CombatLogFxResult = {
  byEnemyIndex: Map<number, ResolvedEnemyFx>;
  columnPulse: CombatColumnPulse;
  columnFlash: CombatColumnFlash;
  potionParticles: CombatPotionParticles;
};

function potionParticlesFromItemId(itemId: string, data: GameData): CombatPotionParticles {
  const def = data.items[itemId];
  if (!def || def.slot !== 'consumable') return null;
  if (def.restoreHp != null && def.restoreHp > 0) return 'hp';
  if (def.restoreMana != null && def.restoreMana > 0) return 'mana';
  if (def.stressRelief != null && def.stressRelief > 0) return 'stress';
  return null;
}

/** Estilo de FX corpo-a-corpo (arma + classe) — UI e sons. */
export function getMeleeFxStyleForCharacter(ch: Character | undefined): 'slash' | 'blunt' | 'staff' {
  if (!ch) return 'slash';
  const w = ch.weaponId ? WEAPON_MELEE_STYLE[ch.weaponId] : undefined;
  return w ?? CLASS_FALLBACK[ch.class];
}

function meleeStyleForCharacter(ch: Character | undefined): 'slash' | 'blunt' | 'staff' {
  return getMeleeFxStyleForCharacter(ch);
}

function meleeLayerClass(style: 'slash' | 'blunt' | 'staff', crit: boolean): string {
  let base: string;
  if (style === 'slash') base = 'combat-fx-melee-slash';
  else if (style === 'blunt') base = 'combat-fx-melee-blunt';
  else base = 'combat-fx-melee-staff';
  return crit ? `${base}--crit` : base;
}

/** Uma pancada “corpo a corpo” verbal no reflexo (FX da mesma família que o combate normal). */
export function dialogueVerbalHitFxClass(attacker: Character | undefined, crit: boolean): string {
  return meleeLayerClass(meleeStyleForCharacter(attacker), crit);
}

function spellDamageLayerClass(spell: SpellDef | undefined, spellId: string, crit: boolean): string {
  let base: string;
  if (spellId === 'ember_spark') base = 'combat-fx-spell-ember';
  else if (spellId === 'silver_bolt') base = 'combat-fx-spell-silver';
  else base = spell?.spellKind === 'damage' ? 'combat-fx-spell-arcane' : 'combat-fx-spell-arcane';
  return crit ? `${base}--crit` : base;
}

function mergeFx(
  map: Map<number, ResolvedEnemyFx>,
  enemyIndex: number,
  patch: Partial<ResolvedEnemyFx> & Pick<ResolvedEnemyFx, 'layerClasses'>
): void {
  const prev = map.get(enemyIndex);
  if (!prev) {
    map.set(enemyIndex, {
      layerClasses: [...patch.layerClasses],
      spriteCritShake: patch.spriteCritShake ?? false,
    });
    return;
  }
  const layerClasses = [...new Set([...prev.layerClasses, ...patch.layerClasses])];
  map.set(enemyIndex, {
    layerClasses,
    spriteCritShake: prev.spriteCritShake || (patch.spriteCritShake ?? false),
  });
}

/** Alinhado a `resolveCombatLogFx` — buffs via `info` + `spellId` (Foco, Muralha…). */
export function isBuffInfoEntry(e: CombatLogEntry, data: GameData): boolean {
  if (e.kind !== 'info' || !e.spellId) return false;
  const sp = data.spells[e.spellId];
  return sp?.spellKind === 'buff_attack_roll' || sp?.spellKind === 'buff_armor_class';
}

export function logSliceHasBuffCast(entries: CombatLogEntry[], data: GameData): boolean {
  return entries.some((e) => isBuffInfoEntry(e, data));
}

/**
 * Derives overlay classes from new combat log lines (same slice as sounds).
 * Later entries for the same enemy extend / override visuals for that render.
 */
export function resolveCombatLogFx(
  entries: CombatLogEntry[],
  party: Character[],
  data: GameData
): CombatLogFxResult {
  const byEnemyIndex = new Map<number, ResolvedEnemyFx>();
  let columnPulse: CombatColumnPulse = null;
  let columnFlash: CombatColumnFlash = null;
  let potionParticles: CombatPotionParticles = null;

  let lastPartyAttacker: Character | undefined;

  const partyNames = new Set(party.map((p) => p.name));

  for (const e of entries) {
    if (e.kind === 'attack') {
      const actorMember = party.find((p) => p.name === e.actor);
      if (actorMember) {
        lastPartyAttacker = actorMember;
      }
      if (e.enemyIndex == null) continue;

      if (actorMember && e.outcome === 'miss') {
        const isFumble = e.rollOutcome === 'fumble_threat';
        mergeFx(byEnemyIndex, e.enemyIndex, {
          layerClasses: [isFumble ? 'combat-fx-fumble' : 'combat-fx-miss'],
        });
      } else if (!actorMember && partyNames.has(e.target ?? '') && e.outcome === 'miss') {
        mergeFx(byEnemyIndex, e.enemyIndex, {
          layerClasses: ['combat-fx-enemy-whiff'],
        });
      }
      continue;
    }

    if (e.kind === 'armor_break' && e.enemyIndex != null) {
      mergeFx(byEnemyIndex, e.enemyIndex, {
        layerClasses: ['combat-fx-armor-break'],
      });
      continue;
    }

    if (e.kind === 'damage' && e.enemyIndex != null) {
      const isCrit = e.damageKind === 'crit';
      const layers: string[] = [];
      if (e.spellId) {
        const sp = data.spells[e.spellId];
        layers.push(spellDamageLayerClass(sp, e.spellId, isCrit));
        if (e.spellId === 'ember_spark') {
          columnFlash = 'ember';
        }
      } else {
        const attacker = lastPartyAttacker ?? party[0];
        layers.push(meleeLayerClass(meleeStyleForCharacter(attacker), isCrit));
      }

      mergeFx(byEnemyIndex, e.enemyIndex, {
        layerClasses: layers,
        spriteCritShake: isCrit,
      });
      continue;
    }

    if (e.kind === 'heal' && e.spellId) {
      columnPulse = 'heal_spell';
      continue;
    }

    if (e.kind === 'heal' && e.itemId && !e.spellId) {
      if (columnPulse !== 'heal_spell') {
        columnPulse = 'heal_potion';
      }
      potionParticles = potionParticlesFromItemId(e.itemId, data) ?? potionParticles;
      continue;
    }

    if (e.kind === 'info' && e.itemId) {
      if (columnPulse !== 'heal_spell' && columnPulse !== 'heal_potion') {
        columnPulse = 'heal_potion';
      }
      potionParticles = potionParticlesFromItemId(e.itemId, data) ?? potionParticles;
      continue;
    }

    if (isBuffInfoEntry(e, data)) {
      columnPulse = 'buff';
    }
  }

  return { byEnemyIndex, columnPulse, columnFlash, potionParticles };
}

export type LethalGhostDef = {
  enemyIndex: number;
  name: string;
  sprite: string;
};

export function extractLethalGhosts(
  entries: CombatLogEntry[],
  combat: CombatState,
  data: GameData
): LethalGhostDef[] {
  const out: LethalGhostDef[] = [];
  for (const e of entries) {
    if (e.kind !== 'damage' || !e.lethal || e.enemyIndex == null) continue;
    const inst = combat.enemies[e.enemyIndex];
    if (!inst) continue;
    const def = data.enemies[inst.defId];
    if (!def) continue;
    out.push({ enemyIndex: e.enemyIndex, name: def.name, sprite: def.sprite });
  }
  return out;
}

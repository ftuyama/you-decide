import type { CombatLogEntry, LevelUpStatDeltas, SpellDef } from '../engine/schema.ts';
import { icons, type IconId } from './icons/index.ts';

export type CombatLogDisplayItem =
  | { mode: 'single'; entry: CombatLogEntry }
  | {
      mode: 'merged_hit';
      attack: CombatLogEntry;
      damage: CombatLogEntry;
      quaseCritico?: CombatLogEntry;
    };

export function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Dicas aleatórias de combate (mostradas no acampamento). */
const CAMP_COMBAT_HINTS = [
  'Posturas: Agressivo favorece ataques físicos; Defensivo aumenta a CA contra inimigos; Foco alinha magias com Mente.',
  'Ataques usam 2d6 + modificadores; com vantagem, rola 3d6 e descarta o menor dado.',
  'Dois 6s no ataque ameaçam crítico; dois 1s podem resultar em falha crítica.',
  'Golpe especial acerta mais forte mas aumenta Stress — em 4, entras em pânico.',
  'Iniciativa: cada combatente rola 2d6 + AGI; ordem decrescente decide quem age primeiro.',
  'Em postura Defensiva, contra inimigos ganhas +2 de CA (somado ao equipamento e buffs).',
  'Cada dano que sofreres aumenta o Stress em 1 (até 4).',
  'Em alguns encontros há vantagem para ti ou para os inimigos: 3d6, descarta o menor.',
  'Magias custam mana; no início do teu turno, alguns heróis recuperam um pouco de vida ou mana (passivo).',
  'Fugir termina o combate sem vitória (sem XP nem loot desse embate).',
  'Contra mortos-vivos, clérigos somam +1 de dano sagrado nos ataques físicos.',
  'Ao terminar um combate, o Stress de cada herói baixa um pouco (−1).',
  'Com fé ao máximo (5), se o líder morrer no combate podes ser salvo à custa da fé — não conta como vitória.',
  'Dano físico inclui 1d6, arma e bónus de postura; a armadura equipada reduz o que recebes.',
  'Alguns inimigos têm placas de armadura: absorvem golpes antes de o HP baixar.',
] as const;

const CAMP_COMBAT_HINT_PARTY =
  'Companheiros: cada um age na sua vez com a mesma postura, visando o primeiro inimigo vivo.';

export function randomCampCombatHint(partySize: number): string {
  const pool: string[] = [...CAMP_COMBAT_HINTS];
  if (partySize > 1) pool.push(CAMP_COMBAT_HINT_PARTY);
  return pool[Math.floor(Math.random() * pool.length)]!;
}

export function spellEmoji(spellId: string, spellDef: SpellDef): string {
  const byId: Partial<Record<string, string>> = {
    ember_spark: '🔥',
    arcane_bolt: '✨',
    silver_bolt: '⚡',
    lesser_heal: '💚',
    merciful_light: '🕯️',
    whisper_cache: '🫧',
    pilgrims_benediction: '🙏',
    warriors_focus: '⚔️',
    iron_ward: '🛡️',
  };
  const byKind: Record<SpellDef['spellKind'], string> = {
    damage: '✨',
    heal_self: '💚',
    buff_attack_roll: '⚔️',
    buff_armor_class: '🛡️',
  };
  return byId[spellId] ?? byKind[spellDef.spellKind] ?? '✦';
}

/** SVG inline para passivo de classe (`passives[class].id`) ou chave em `passivesByMark` (marca). */
export function passiveSidebarIconSvg(passiveKey: string): string {
  const byId: Partial<Record<string, IconId>> = {
    knight_crit_edge: 'weapon',
    cleric_sacred_pulse: 'faith',
    mage_ley_trickle: 'spellbook',
    monk_inner_peace: 'faith',
  };
  const id = byId[passiveKey] ?? 'tier';
  return icons[id];
}

/** Uma linha de descrição mecânica para a sidebar (PT). */
export function spellSidebarMechanicsLinePt(sp: SpellDef): string {
  if (sp.spellKind === 'damage') {
    return `dano (${sp.base > 0 ? `${sp.base} + ` : ''}${sp.dice}d6 + Mente)`;
  }
  if (sp.spellKind === 'heal_self') {
    return `cura (${sp.base > 0 ? `${sp.base} + ` : ''}${sp.dice}d6 + Mente)`;
  }
  if (sp.spellKind === 'buff_attack_roll') {
    return '+1 ao ataque (golpes físicos do líder) até ao fim do combate';
  }
  return '+1 CA (líder) até ao fim do combate';
}

export function fmtSignedMod(n: number): string {
  if (n >= 0) return `+${n}`;
  return `−${Math.abs(n)}`;
}

export function buildCombatLogDisplayItems(log: CombatLogEntry[]): CombatLogDisplayItem[] {
  const out: CombatLogDisplayItem[] = [];
  let i = 0;
  while (i < log.length) {
    const e = log[i]!;
    if (e.kind === 'attack' && e.outcome === 'hit') {
      let j = i + 1;
      let quase: CombatLogEntry | undefined;
      const next = log[j];
      if (next?.kind === 'info' && next.message === 'Quase crítico…') {
        quase = next;
        j++;
      }
      const dmg = log[j];
      if (dmg?.kind === 'damage') {
        out.push({ mode: 'merged_hit', attack: e, damage: dmg, quaseCritico: quase });
        i = j + 1;
        continue;
      }
    }
    out.push({ mode: 'single', entry: e });
    i++;
  }
  return out;
}

export function formatLevelUpDeltaLine(d: LevelUpStatDeltas): string {
  const parts: string[] = [];
  if (d.str) parts.push(`Força +${d.str}`);
  if (d.agi) parts.push(`Agilidade +${d.agi}`);
  if (d.mind) parts.push(`Mente +${d.mind}`);
  if (d.maxHp) parts.push(`HP máx +${d.maxHp}`);
  if (d.hp) parts.push(`HP +${d.hp}`);
  if (d.maxMana) parts.push(`Mana máx +${d.maxMana}`);
  if (d.mana) parts.push(`Mana +${d.mana}`);
  return parts.join(' · ');
}

export function hpBarMarkup(
  cur: number,
  max: number,
  trackClass?: string,
  fill: 'xp' | 'hp' = 'xp'
): string {
  const trackCls = trackClass ? `hp-bar-track ${trackClass}` : 'hp-bar-track';
  const fillCls = fill === 'hp' ? 'hp-bar-fill hp-bar-fill--hp' : 'hp-bar-fill hp-bar-fill--xp';
  if (max <= 0) return `<div class="${trackCls} empty"></div>`;
  const pct = Math.min(100, Math.max(0, Math.round((cur / max) * 100)));
  const label = fill === 'hp' ? 'HP' : 'XP';
  return `<div class="${trackCls}" title="${label} ${cur} / ${max}">
      <div class="${fillCls}" style="width:${pct}%"></div>
    </div>`;
}

export function manaBarMarkup(cur: number, max: number): string {
  if (max <= 0) return '';
  const pct = Math.min(100, Math.max(0, Math.round((cur / max) * 100)));
  return `<div class="mana-bar-track" title="Mana ${cur} / ${max}">
      <div class="mana-bar-fill" style="width:${pct}%"></div>
    </div>`;
}

export function stressBarMarkup(cur: number): string {
  const max = 4;
  const pct = Math.min(100, Math.max(0, Math.round((cur / max) * 100)));
  return `<div class="stress-bar-track" title="Stress ${cur} / ${max}">
      <div class="stress-bar-fill" style="width:${pct}%"></div>
    </div>`;
}

export function statBonusParen(n: number): string {
  if (n === 0) return '';
  const sign = n > 0 ? '+' : '';
  return ` <span class="stat-build-bonus">(${sign}${n})</span>`;
}

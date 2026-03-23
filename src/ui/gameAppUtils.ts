import type { CombatLogEntry, LevelUpStatDeltas, SpellDef } from '../engine/schema';

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

export function spellEmoji(spellId: string, spellDef: SpellDef): string {
  const byId: Partial<Record<string, string>> = {
    ember_spark: '🔥',
    arcane_bolt: '✨',
    silver_bolt: '⚡',
    lesser_heal: '💚',
    merciful_light: '🕯️',
    whisper_cache: '🫧',
    pilgrims_benediction: '🙏',
  };
  const byKind: Record<SpellDef['spellKind'], string> = {
    damage: '✨',
    heal_self: '💚',
  };
  return byId[spellId] ?? byKind[spellDef.spellKind] ?? '✦';
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

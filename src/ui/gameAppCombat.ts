import {
  canCastSpell,
  canUseCombatConsumable,
  executePlayerTurn,
  executeSpellTurn,
  fleeCombat,
  SACRIFICE_MIN_CORRUPTION,
  useCombatConsumable,
} from '../engine/combat.ts';
import type { CombatLogEntry, GameState, Stance } from '../engine/schema.ts';
import type { ContentRegistry } from '../content/registry.ts';
import type { EventBus } from '../engine/eventBus.ts';
import { formatDiceAscii } from './diceAscii.ts';
import {
  buildCombatLogDisplayItems,
  escHtml,
  fmtSignedMod,
  spellEmoji,
} from './gameAppUtils.ts';
import type { GameAudio } from './sound/index.ts';

/** Atalhos no combate: 1–9, depois letras (ordem QWERTY). */
const COMBAT_QUICK_KEYS_AFTER_9 = 'qwertyuiopasdfghjklzxcvbnm';

export function combatQuickKeyAt(index: number): string | null {
  if (index < 9) return String(index + 1);
  const j = index - 9;
  return j < COMBAT_QUICK_KEYS_AFTER_9.length ? COMBAT_QUICK_KEYS_AFTER_9[j]! : null;
}

export function playCombatLogSound(
  entry: CombatLogEntry,
  leadName: string | undefined,
  audio: GameAudio
): void {
  if (entry.kind === 'attack' && entry.outcome === 'miss') {
    audio.playMiss();
    return;
  }
  if (entry.kind === 'damage' && leadName && entry.target === leadName) {
    audio.playDamageTaken();
    return;
  }
  if (entry.kind === 'stress') {
    audio.playStressSting();
    return;
  }
  if (entry.kind === 'armor_break') {
    audio.playHit();
  }
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function appendCombatLogMessageWithBoldNames(
  container: HTMLElement,
  message: string,
  combatantNames: readonly string[]
): void {
  if (!combatantNames.length) {
    container.textContent = message;
    return;
  }
  const unique = [...new Set(combatantNames)].filter((name) => name.trim().length > 0);
  if (!unique.length) {
    container.textContent = message;
    return;
  }
  const sorted = unique.sort((a, b) => b.length - a.length);
  const namesSet = new Set(sorted);
  const pattern = new RegExp(
    `(${sorted.map((name) => escapeRegExp(name)).join('|')})`,
    'g'
  );
  const parts = message.split(pattern);
  for (const part of parts) {
    if (!part) continue;
    if (namesSet.has(part)) {
      const strong = document.createElement('strong');
      strong.textContent = part;
      container.appendChild(strong);
      continue;
    }
    container.appendChild(document.createTextNode(part));
  }
}

function appendCombatLogMergedHitMeta(
  wrap: HTMLElement,
  attack: CombatLogEntry,
  damage: CombatLogEntry
): void {
  if (attack.final === undefined || attack.vsDefense === undefined) return;
  const meta = document.createElement('div');
  meta.className = 'combat-log-meta combat-log-meta--attack-roll';
  let line = `${attack.final} vs CA ${attack.vsDefense}`;
  if (attack.modifier !== undefined) {
    line += ` · bônus ${fmtSignedMod(attack.modifier)}`;
  }
  if (damage.final !== undefined) {
    line += ` · dano ${damage.final}`;
  }
  if (damage.damageKind === 'crit') {
    line += ' · crítico';
  }
  meta.textContent = line;
  wrap.appendChild(meta);
}

function appendCombatLogMeta(wrap: HTMLElement, entry: CombatLogEntry): void {
  if (entry.kind === 'attack' && entry.final !== undefined && entry.vsDefense !== undefined) {
    const meta = document.createElement('div');
    meta.className = 'combat-log-meta combat-log-meta--attack-roll';
    let line = `${entry.final} vs CA ${entry.vsDefense}`;
    if (entry.modifier !== undefined) {
      line += ` · bônus ${fmtSignedMod(entry.modifier)}`;
    }
    meta.textContent = line;
    wrap.appendChild(meta);
    return;
  }

  const parts: string[] = [];
  if (entry.modifier !== undefined) {
    parts.push(`Modificador ${fmtSignedMod(entry.modifier)}`);
  }
  if (entry.kind === 'damage' && entry.final !== undefined) {
    parts.push(`Dano ${entry.final}`);
  } else if (entry.kind === 'heal' && entry.final !== undefined) {
    parts.push(`Cura ${entry.final} HP`);
  } else if (entry.final !== undefined) {
    parts.push(`Total ${entry.final}`);
  }

  if (parts.length === 0) return;
  const meta = document.createElement('div');
  meta.className = 'combat-log-meta';
  meta.textContent = parts.join(' · ');
  wrap.appendChild(meta);
}

/**
 * Entorno amarelo no painel do campo: último dano resolvido foi crítico
 * (ignora rodada / vitória / pânico após o golpe).
 */
/** Última fala de combate registada para o inimigo nesse índice (log pode crescer). */
export function lastEnemyCombatLine(
  log: CombatLogEntry[],
  enemyIndex: number
): string | undefined {
  for (let i = log.length - 1; i >= 0; i--) {
    const e = log[i]!;
    if (e.kind === 'enemy_line' && e.enemyIndex === enemyIndex) {
      return e.message;
    }
  }
  return undefined;
}

export function combatLastResolvedDamageWasCrit(log: CombatLogEntry[]): boolean {
  let i = log.length - 1;
  while (i >= 0) {
    const e = log[i]!;
    if (e.kind === 'turn_banner') {
      i--;
      continue;
    }
    if (e.kind === 'enemy_line') {
      i--;
      continue;
    }
    if (e.kind === 'info' && (e.message === 'Vitória!' || e.message === 'Fim de linha.')) {
      i--;
      continue;
    }
    if (e.kind === 'stress' && e.message?.startsWith('Pânico!')) {
      i--;
      continue;
    }
    break;
  }
  if (i < 0) return false;
  const e = log[i]!;
  return e.kind === 'damage' && e.damageKind === 'crit';
}

export type CombatRenderContext = {
  state: GameState;
  registry: ContentRegistry;
  bus: EventBus;
  audio: GameAudio;
  quickNavMode: boolean;
  combatLog: {
    soundCursor: { encounterId: string; index: number };
    setSoundCursor: (v: { encounterId: string; index: number }) => void;
  };
  lifecycle: {
    unlockAudio: () => void;
    stabilize: (s: GameState) => GameState;
    commitState: (s: GameState) => void;
  };
};

export function renderCombatInto(shell: HTMLElement, ctx: CombatRenderContext): void {
  const c = ctx.state.combat;
  if (!c) return;

  const encId = c.encounterId;
  const leadName = ctx.state.party[0]?.name;
  if (ctx.combatLog.soundCursor.encounterId !== encId) {
    ctx.combatLog.setSoundCursor({ encounterId: encId, index: c.log.length });
  } else {
    const newEntries = c.log.slice(ctx.combatLog.soundCursor.index);
    for (const entry of newEntries) {
      playCombatLogSound(entry, leadName, ctx.audio);
    }
    ctx.combatLog.setSoundCursor({ encounterId: encId, index: c.log.length });
  }

  const inner = document.createElement('div');
  inner.className = 'shell combat-shell';
  inner.innerHTML = `<h1>Combate</h1>`;

  const layout = document.createElement('div');
  layout.className = 'combat-layout';

  const left = document.createElement('div');
  left.className = 'combat-enemies-column';
  if (combatLastResolvedDamageWasCrit(c.log)) {
    left.classList.add('combat-enemies-column--crit-damage');
  }
  for (let enemyIdx = 0; enemyIdx < c.enemies.length; enemyIdx++) {
    const inst = c.enemies[enemyIdx]!;
    if (inst.hp <= 0) continue;
    const def = ctx.registry.data.enemies[inst.defId];
    if (!def) continue;
    const panel = document.createElement('div');
    panel.className = 'enemy-panel';
    const sprite = def.sprite;
    const pre = document.createElement('pre');
    pre.className = 'enemy-sprite';
    pre.textContent = sprite;
    const hpPct = Math.max(0, Math.min(100, Math.round((inst.hp / inst.maxHp) * 100)));
    panel.innerHTML = `<div class="enemy-panel-header"><strong>${escHtml(def.name)}</strong><span class="enemy-hp-text">${inst.hp}/${inst.maxHp}</span></div>
      <div class="enemy-hp-track" title="HP ${inst.hp}/${inst.maxHp}">
        <div class="enemy-hp-fill" style="width:${hpPct}%"></div>
      </div>`;
    if (def.type === 'armored') {
      const armorChips = Math.max(0, Math.min(2, inst.armorChipsRemaining));
      const armorLine = document.createElement('div');
      armorLine.className = 'enemy-armor-line';
      armorLine.innerHTML = `Armadura <span class="enemy-armor-slot${armorChips >= 1 ? ' enemy-armor-slot--filled' : ''}">■</span><span class="enemy-armor-slot${armorChips >= 2 ? ' enemy-armor-slot--filled' : ''}">■</span>`;
      panel.appendChild(armorLine);
    }
    panel.appendChild(pre);
    const line = lastEnemyCombatLine(c.log, enemyIdx);
    if (line) {
      const quote = document.createElement('blockquote');
      quote.className = 'enemy-combat-quote';
      quote.textContent = line;
      panel.appendChild(quote);
    }
    left.appendChild(panel);
  }

  const lead = ctx.state.party[0];

  const actionsPanel = document.createElement('div');
  actionsPanel.className = 'combat-actions-panel';
  const actionsHdr = document.createElement('div');
  actionsHdr.className = 'combat-actions-panel-hdr';
  actionsHdr.textContent = 'Ações';
  actionsPanel.appendChild(actionsHdr);
  let combatQuickNavIndex = 0;
  const decorateCombatQuickNav = (
    btn: HTMLButtonElement,
    setLabel: (key: string | null, quickLabel: boolean) => void
  ): void => {
    const key = combatQuickKeyAt(combatQuickNavIndex);
    combatQuickNavIndex += 1;
    if (key != null) {
      btn.dataset.quickNavCombat = key;
      btn.title = `Tecla ${key}`;
    }
    setLabel(key, ctx.quickNavMode);
  };

  if (c.phase === 'choose_stance' && lead) {
    const attackBar = document.createElement('div');
    attackBar.className = 'combat-attack-bar';
    const attackHdr = document.createElement('div');
    attackHdr.className = 'combat-attack-hdr';
    attackHdr.textContent = 'Ataques';
    attackBar.appendChild(attackHdr);
    const bar = document.createElement('div');
    bar.className = 'stance-bar';
    const stances: Stance[] = ['aggressive', 'defensive', 'focus'];
    const labels: Record<Stance, string> = {
      aggressive: 'Agressivo',
      defensive: 'Defensivo',
      focus: 'Foco',
    };
    for (const st of stances) {
      const btn = document.createElement('button');
      btn.className = 'stance';
      decorateCombatQuickNav(btn, (key, quickLabel) => {
        btn.textContent = quickLabel && key != null ? `${key} - ${labels[st]}` : labels[st];
      });
      btn.addEventListener('click', () => {
        ctx.lifecycle.unlockAudio();
        ctx.audio.playDice();
        ctx.lifecycle.commitState(
          ctx.lifecycle.stabilize(executePlayerTurn(ctx.state, st, ctx.registry.data, false, false, ctx.bus))
        );
      });
      bar.appendChild(btn);
    }
    const canSacrificeChoice =
      ctx.state.flags.act6_void_pact && ctx.state.resources.corruption >= SACRIFICE_MIN_CORRUPTION;
    if (canSacrificeChoice) {
      const sacrifice = document.createElement('button');
      sacrifice.className = 'stance special';
      decorateCombatQuickNav(sacrifice, (key, quickLabel) => {
        const corr = ctx.state.resources.corruption;
        const base = 'Selo do Vazio';
        sacrifice.title = `Corrupção: ${corr}`;
        sacrifice.textContent = quickLabel && key != null ? `${key} - ${base}` : base;
      });
      sacrifice.disabled = lead.hp <= 1;
      sacrifice.addEventListener('click', () => {
        if (lead.hp <= 1) return;
        ctx.lifecycle.unlockAudio();
        ctx.audio.playDice();
        ctx.lifecycle.commitState(
          ctx.lifecycle.stabilize(
            executePlayerTurn(ctx.state, 'aggressive', ctx.registry.data, false, true, ctx.bus)
          )
        );
      });
      bar.appendChild(sacrifice);
    }
    const sp = document.createElement('button');
    sp.className = 'stance special';
    decorateCombatQuickNav(sp, (key, quickLabel) => {
      const base = lead.specialUsedThisCombat ? 'Especial já usado' : 'Golpe especial';
      sp.textContent = quickLabel && key != null ? `${key} - ${base}` : base;
    });
    sp.disabled = lead.specialUsedThisCombat;
    sp.addEventListener('click', () => {
      if (!lead.specialUsedThisCombat) {
        ctx.lifecycle.unlockAudio();
        ctx.audio.playDice();
        ctx.lifecycle.commitState(
          ctx.lifecycle.stabilize(
            executePlayerTurn(ctx.state, 'aggressive', ctx.registry.data, true, false, ctx.bus)
          )
        );
      }
    });
    bar.appendChild(sp);
    attackBar.appendChild(bar);
    actionsPanel.appendChild(attackBar);

    if (lead.maxMana > 0) {
      const spellBar = document.createElement('div');
      spellBar.className = 'combat-spell-bar';
      const spellHdr = document.createElement('div');
      spellHdr.className = 'combat-spell-hdr';
      spellHdr.textContent = 'Magias';
      spellBar.appendChild(spellHdr);
      const spells = ctx.registry.data.spells;
      for (const [spellId, spellDef] of Object.entries(spells)) {
        if (!ctx.state.knownSpells.includes(spellId)) continue;
        if (spellDef.classId !== 'any' && spellDef.classId !== lead.class) continue;
        if (ctx.state.level < spellDef.minLevel) continue;
        const btn = document.createElement('button');
        btn.className = 'combat-spell';
        btn.type = 'button';
        decorateCombatQuickNav(btn, (key, quickLabel) => {
          const name =
            quickLabel && key != null
              ? `${key} - ${spellDef.name} (${spellDef.manaCost})`
              : `${spellDef.name} (${spellDef.manaCost})`;
          btn.innerHTML = `<span class="spell-emoji" aria-hidden="true">${spellEmoji(spellId, spellDef)}</span><span>${escHtml(name)}</span>`;
        });
        const castOk = canCastSpell(ctx.state, spellId, ctx.registry.data);
        btn.disabled = !castOk;
        btn.addEventListener('click', () => {
          if (!canCastSpell(ctx.state, spellId, ctx.registry.data)) return;
          ctx.lifecycle.unlockAudio();
          ctx.audio.playDice();
          ctx.lifecycle.commitState(
            ctx.lifecycle.stabilize(executeSpellTurn(ctx.state, spellId, ctx.registry.data, ctx.bus))
          );
        });
        spellBar.appendChild(btn);
      }
      actionsPanel.appendChild(spellBar);
    }

    const potionIds = [...new Set(ctx.state.inventory)].filter((id) => {
      const d = ctx.registry.data.items[id];
      return d?.slot === 'consumable';
    });
    if (potionIds.length) {
      const potionBar = document.createElement('div');
      potionBar.className = 'combat-potion-bar';
      const potionHdr = document.createElement('div');
      potionHdr.className = 'combat-potion-hdr';
      potionHdr.textContent = 'Itens';
      potionBar.appendChild(potionHdr);
      for (const itemId of potionIds) {
        const def = ctx.registry.data.items[itemId];
        if (!def) continue;
        const count = ctx.state.inventory.filter((x) => x === itemId).length;
        const btn = document.createElement('button');
        btn.className = 'combat-potion';
        btn.type = 'button';
        decorateCombatQuickNav(btn, (key, quickLabel) => {
          const base = count > 1 ? `${def.name} (${count})` : def.name;
          btn.textContent = quickLabel && key != null ? `${key} - ${base}` : base;
        });
        const ok = canUseCombatConsumable(ctx.state, itemId, ctx.registry.data);
        btn.disabled = !ok;
        btn.addEventListener('click', () => {
          if (!canUseCombatConsumable(ctx.state, itemId, ctx.registry.data)) return;
          ctx.lifecycle.unlockAudio();
          ctx.audio.playDice();
          ctx.lifecycle.commitState(
            ctx.lifecycle.stabilize(useCombatConsumable(ctx.state, itemId, ctx.registry.data, ctx.bus))
          );
        });
        potionBar.appendChild(btn);
      }
      actionsPanel.appendChild(potionBar);
    }
  }

  const flee = document.createElement('button');
  flee.className = 'combat-flee-btn';
  decorateCombatQuickNav(flee, (key, quickLabel) => {
    flee.textContent = quickLabel && key != null ? `${key} - Tentar fugir` : 'Tentar fugir';
  });
  flee.addEventListener('click', () => {
    ctx.lifecycle.unlockAudio();
    ctx.lifecycle.commitState(ctx.lifecycle.stabilize(fleeCombat(ctx.state, ctx.bus)));
  });
  actionsPanel.appendChild(flee);

  left.appendChild(actionsPanel);
  layout.appendChild(left);

  const right = document.createElement('div');
  right.className = 'combat-log-column';
  const logOuter = document.createElement('div');
  logOuter.className = 'combat-log-outer';
  const dice = document.createElement('div');
  dice.className = 'dice-panel';
  const hdr = document.createElement('div');
  hdr.className = 'dice-panel-header';
  hdr.textContent = 'Dados & log de batalha';
  dice.appendChild(hdr);

  const logScroll = document.createElement('div');
  logScroll.className = 'combat-log-scroll';

  const partyNames = new Set(ctx.state.party.map((x) => x.name));
  const combatantNames = [
    ...ctx.state.party.map((member) => member.name),
    ...c.enemies
      .map((enemy) => ctx.registry.data.enemies[enemy.defId]?.name)
      .filter((name): name is string => Boolean(name)),
  ];

  const displayItems = buildCombatLogDisplayItems(c.log.slice(-64));

  for (const item of displayItems) {
    if (item.mode === 'merged_hit') {
      const { attack, damage, quaseCritico } = item;
      const wrap = document.createElement('div');
      wrap.className = 'combat-log-entry combat-log-attack combat-outcome-hit combat-log-damage';
      if (damage.target) {
        wrap.classList.add(
          partyNames.has(damage.target) ? 'combat-damage-to-hero' : 'combat-damage-to-enemy'
        );
      }
      if (damage.damageKind === 'crit') {
        wrap.classList.add('combat-damage-crit');
      }

      const msg = document.createElement('div');
      msg.className = 'combat-log-msg';
      appendCombatLogMessageWithBoldNames(msg, attack.message, combatantNames);
      wrap.appendChild(msg);

      if (quaseCritico) {
        const qc = document.createElement('div');
        qc.className = 'combat-log-msg combat-log-msg--sub';
        appendCombatLogMessageWithBoldNames(qc, quaseCritico.message, combatantNames);
        wrap.appendChild(qc);
      }

      const diceRow = document.createElement('div');
      diceRow.className = 'dice-ascii-row';
      if (attack.dice?.length) {
        const preAtk = document.createElement('pre');
        preAtk.className = 'dice-ascii-block';
        preAtk.textContent = formatDiceAscii(attack.dice);
        diceRow.appendChild(preAtk);
      }
      if (damage.dice?.length) {
        const preDmg = document.createElement('pre');
        preDmg.className = 'dice-ascii-block';
        preDmg.textContent = formatDiceAscii(damage.dice);
        diceRow.appendChild(preDmg);
      }
      if (diceRow.childElementCount) wrap.appendChild(diceRow);

      appendCombatLogMergedHitMeta(wrap, attack, damage);
      logScroll.appendChild(wrap);
      continue;
    }

    const entry = item.entry;
    if (entry.kind === 'enemy_line') {
      continue;
    }
    const wrap = document.createElement('div');
    wrap.className = `combat-log-entry combat-log-${entry.kind}`;
    if (entry.kind === 'attack' && entry.outcome) {
      wrap.classList.add(entry.outcome === 'hit' ? 'combat-outcome-hit' : 'combat-outcome-miss');
    }
    if (entry.kind === 'damage' && entry.target) {
      wrap.classList.add(
        partyNames.has(entry.target) ? 'combat-damage-to-hero' : 'combat-damage-to-enemy'
      );
    }
    if (entry.kind === 'damage' && entry.damageKind === 'crit') {
      wrap.classList.add('combat-damage-crit');
    }

    const msg = document.createElement('div');
    msg.className = 'combat-log-msg';
    appendCombatLogMessageWithBoldNames(msg, entry.message, combatantNames);
    wrap.appendChild(msg);

    if (entry.dice?.length) {
      const pre = document.createElement('pre');
      pre.className = 'dice-ascii-block';
      pre.textContent = formatDiceAscii(entry.dice);
      wrap.appendChild(pre);
    }

    appendCombatLogMeta(wrap, entry);
    logScroll.appendChild(wrap);
  }
  dice.appendChild(logScroll);

  const scrollLogToEnd = (): void => {
    logScroll.scrollTop = logScroll.scrollHeight;
  };
  requestAnimationFrame(() => {
    scrollLogToEnd();
    requestAnimationFrame(scrollLogToEnd);
  });
  logOuter.appendChild(dice);
  right.appendChild(logOuter);
  layout.appendChild(right);
  inner.appendChild(layout);

  shell.appendChild(inner);
}

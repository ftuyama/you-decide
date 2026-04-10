import {
  canCastSpell,
  canUseCombatConsumable,
  executePlayerTurn,
  executeSpellTurn,
  fleeCombat,
  SACRIFICE_MIN_CORRUPTION,
  useCombatConsumable,
} from '../engine/combat.ts';
import type { Character, CombatLogEntry, GameState, Stance } from '../engine/schema.ts';
import type { ContentRegistry } from '../content/registry.ts';
import type { EventBus } from '../engine/eventBus.ts';
import { formatDiceAscii } from './diceAscii.ts';
import {
  buildCombatLogDisplayItems,
  escHtml,
  fmtSignedMod,
  parseCombatLogRounds,
  spellEmoji,
  type CombatLogDisplayItem,
} from './gameAppUtils.ts';
import type { GameAudio } from './sound/index.ts';
import {
  extractLethalGhosts,
  getMeleeFxStyleForCharacter,
  resolveCombatLogFx,
  type CombatLogFxResult,
} from './combatFx.ts';

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

/** Sons de impacto alinhados aos FX visuais (corte, fogo, arcano…). */
function playCombatFxImpactSounds(
  entries: CombatLogEntry[],
  party: Character[],
  audio: GameAudio
): void {
  const hasPotionHeal = entries.some(
    (e) => e.kind === 'heal' && e.itemId != null && e.spellId == null
  );
  for (const e of entries) {
    if (e.kind === 'heal' && e.spellId) {
      audio.playSpellHeal();
    }
  }
  if (hasPotionHeal) {
    audio.playPotionDrink();
  } else if (entries.some((e) => e.kind === 'info' && e.itemId != null)) {
    audio.playPotionDrink();
  }

  let lastPartyAttacker: Character | undefined;
  for (const e of entries) {
    if (e.kind === 'attack') {
      const actorMember = party.find((p) => p.name === e.actor);
      if (actorMember) lastPartyAttacker = actorMember;
    }
    if (e.kind !== 'damage' || e.enemyIndex == null) continue;
    if (e.spellId) {
      if (e.spellId === 'ember_spark') {
        audio.playSpellFire();
      } else if (e.spellId === 'silver_bolt') {
        audio.playSpellIceSpark();
      } else {
        audio.playSpellArcaneBurst();
      }
      if (e.damageKind === 'crit') {
        audio.playCritImpact();
      }
      continue;
    }
    const style = getMeleeFxStyleForCharacter(lastPartyAttacker ?? party[0]);
    if (style === 'slash') {
      audio.playSwordSlash();
    } else if (style === 'blunt') {
      audio.playBluntImpact();
    } else {
      audio.playStaffWhoosh();
    }
    if (e.damageKind === 'crit') {
      audio.playCritImpact();
    }
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

type CombatLogRenderCtx = {
  partyNames: Set<string>;
  combatantNames: readonly string[];
};

function appendCombatLogDisplayItems(
  parent: HTMLElement,
  items: CombatLogDisplayItem[],
  ctx: CombatLogRenderCtx
): void {
  const { partyNames, combatantNames } = ctx;

  for (const item of items) {
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
      parent.appendChild(wrap);
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
    parent.appendChild(wrap);
  }
}

function scrollCombatLogToLatestRound(scrollEl: HTMLElement, stackEl: HTMLElement): void {
  const lastRound = stackEl.querySelector('.combat-log-round:last-of-type') as HTMLElement | null;
  if (!lastRound) {
    scrollEl.scrollTop = scrollEl.scrollHeight;
    return;
  }
  const top =
    lastRound.getBoundingClientRect().top -
    scrollEl.getBoundingClientRect().top +
    scrollEl.scrollTop;
  scrollEl.scrollTop = Math.max(0, top);
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
  combatLog: {
    soundCursor: { encounterId: string; index: number };
    /** Mesmo índice que sound — FX de combate usam este slice do log. */
    fxCursor: { encounterId: string; index: number };
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
  let newLogEntries: CombatLogEntry[] = [];
  if (ctx.combatLog.soundCursor.encounterId !== encId) {
    const v = { encounterId: encId, index: c.log.length };
    ctx.combatLog.setSoundCursor(v);
  } else {
    newLogEntries = c.log.slice(ctx.combatLog.fxCursor.index);
    for (const entry of newLogEntries) {
      playCombatLogSound(entry, leadName, ctx.audio);
    }
    playCombatFxImpactSounds(newLogEntries, ctx.state.party, ctx.audio);
    const v = { encounterId: encId, index: c.log.length };
    ctx.combatLog.setSoundCursor(v);
  }

  const combatFx: CombatLogFxResult =
    newLogEntries.length > 0
      ? resolveCombatLogFx(newLogEntries, ctx.state.party, ctx.registry.data)
      : { byEnemyIndex: new Map(), columnPulse: null };
  const lethalGhosts =
    newLogEntries.length > 0
      ? extractLethalGhosts(newLogEntries, c, ctx.registry.data)
      : [];

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
  if (combatFx.columnPulse === 'heal_spell') {
    left.classList.add('combat-enemies-column--pulse-heal-spell');
  } else if (combatFx.columnPulse === 'heal_potion') {
    left.classList.add('combat-enemies-column--pulse-potion');
  } else if (combatFx.columnPulse === 'buff') {
    left.classList.add('combat-enemies-column--pulse-buff');
  }

  for (let enemyIdx = 0; enemyIdx < c.enemies.length; enemyIdx++) {
    const inst = c.enemies[enemyIdx]!;
    if (inst.hp <= 0) continue;
    const def = ctx.registry.data.enemies[inst.defId];
    if (!def) continue;
    const panel = document.createElement('div');
    panel.className = 'enemy-panel';
    const sprite = def.sprite;
    const fx = combatFx.byEnemyIndex.get(enemyIdx);
    const stack = document.createElement('div');
    stack.className = 'enemy-sprite-stack';
    const pre = document.createElement('pre');
    pre.className = 'enemy-sprite';
    if (fx?.spriteCritShake) pre.classList.add('crit-flash');
    pre.textContent = sprite;
    const fxLayer = document.createElement('div');
    fxLayer.className = 'enemy-fx-layer';
    fxLayer.setAttribute('aria-hidden', 'true');
    if (fx?.layerClasses.length) {
      for (const cls of fx.layerClasses) {
        fxLayer.classList.add(cls);
      }
    }
    stack.appendChild(pre);
    stack.appendChild(fxLayer);
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
    panel.appendChild(stack);
    const line = lastEnemyCombatLine(c.log, enemyIdx);
    if (line) {
      const quote = document.createElement('blockquote');
      quote.className = 'enemy-combat-quote';
      quote.textContent = line;
      panel.appendChild(quote);
    }
    left.appendChild(panel);
  }

  for (const ghost of lethalGhosts) {
    const panel = document.createElement('div');
    panel.className = 'enemy-panel enemy-panel--defeated';
    const stack = document.createElement('div');
    stack.className = 'enemy-sprite-stack enemy-sprite-stack--defeated';
    const pre = document.createElement('pre');
    pre.className = 'enemy-sprite enemy-sprite--defeated';
    pre.textContent = ghost.sprite;
    const fxLayer = document.createElement('div');
    fxLayer.className = 'enemy-fx-layer combat-fx-death';
    fxLayer.setAttribute('aria-hidden', 'true');
    stack.appendChild(pre);
    stack.appendChild(fxLayer);
    panel.innerHTML = `<div class="enemy-panel-header"><strong>${escHtml(ghost.name)}</strong><span class="enemy-hp-text enemy-hp-text--defeated">Abatido</span></div>`;
    panel.appendChild(stack);
    left.appendChild(panel);
  }

  const lead = ctx.state.party[0];

  const actionsPanel = document.createElement('div');
  actionsPanel.className = 'combat-actions-panel';
  if (combatFx.columnPulse === 'heal_spell') {
    actionsPanel.classList.add('combat-actions-panel--fx-heal-spell');
  } else if (combatFx.columnPulse === 'heal_potion') {
    actionsPanel.classList.add('combat-actions-panel--fx-potion');
  }
  const actionsHdr = document.createElement('div');
  actionsHdr.className = 'combat-actions-panel-hdr';
  actionsHdr.textContent = 'Ações';
  actionsPanel.appendChild(actionsHdr);
  let combatQuickNavIndex = 0;
  const decorateCombatQuickNav = (
    btn: HTMLButtonElement,
    setLabel: (key: string | null) => void
  ): void => {
    const key = combatQuickKeyAt(combatQuickNavIndex);
    combatQuickNavIndex += 1;
    if (key != null) {
      btn.dataset.quickNavCombat = key;
      btn.title = `Tecla ${key}`;
    }
    setLabel(key);
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
      decorateCombatQuickNav(btn, (key) => {
        btn.textContent = key != null ? `${key} - ${labels[st]}` : labels[st];
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
      decorateCombatQuickNav(sacrifice, (key) => {
        const corr = ctx.state.resources.corruption;
        const base = 'Selo do Vazio';
        sacrifice.title = `Corrupção: ${corr}`;
        sacrifice.textContent = key != null ? `${key} - ${base}` : base;
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
    decorateCombatQuickNav(sp, (key) => {
      const base = lead.specialUsedThisCombat ? 'Especial já usado' : 'Golpe especial';
      sp.textContent = key != null ? `${key} - ${base}` : base;
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
      for (const spellId of ctx.state.knownSpells) {
        const spellDef = spells[spellId];
        if (!spellDef) continue;
        if (spellDef.classId !== 'any' && spellDef.classId !== lead.class) continue;
        if (ctx.state.level < spellDef.minLevel) continue;
        const btn = document.createElement('button');
        btn.className = 'combat-spell';
        btn.type = 'button';
        decorateCombatQuickNav(btn, (key) => {
          const name =
            key != null
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
        decorateCombatQuickNav(btn, (key) => {
          const base = count > 1 ? `${def.name} (${count})` : def.name;
          btn.textContent = key != null ? `${key} - ${base}` : base;
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
  const canFlee = c.phase === 'choose_stance' && lead != null && lead.hp > 0;
  flee.disabled = !canFlee;
  decorateCombatQuickNav(flee, (key) => {
    const base = 'Tentar fugir (2d6 + Agilidade)';
    flee.textContent = key != null ? `${key} - ${base}` : base;
  });
  flee.addEventListener('click', () => {
    if (!canFlee) return;
    ctx.lifecycle.unlockAudio();
    ctx.lifecycle.commitState(
      ctx.lifecycle.stabilize(fleeCombat(ctx.state, ctx.registry.data, ctx.bus))
    );
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
  hdr.title =
    'A rodada atual fica visível abaixo; role para cima dentro deste painel para ver rodadas anteriores.';
  dice.appendChild(hdr);

  const logScroll = document.createElement('div');
  logScroll.className = 'combat-log-scroll';
  logScroll.title = hdr.title;

  const partyNames = new Set(ctx.state.party.map((x) => x.name));
  const combatantNames = [
    ...ctx.state.party.map((member) => member.name),
    ...c.enemies
      .map((enemy) => ctx.registry.data.enemies[enemy.defId]?.name)
      .filter((name): name is string => Boolean(name)),
  ];

  const logRenderCtx: CombatLogRenderCtx = { partyNames, combatantNames };

  const stack = document.createElement('div');
  stack.className = 'combat-log-stack';

  const { preamble, rounds } = parseCombatLogRounds(c.log.slice(-64));

  if (preamble.length) {
    const pre = document.createElement('div');
    pre.className = 'combat-log-preamble';
    const preHdr = document.createElement('div');
    preHdr.className = 'combat-log-preamble-hdr';
    preHdr.textContent = 'Abertura';
    pre.appendChild(preHdr);
    const preBody = document.createElement('div');
    preBody.className = 'combat-log-preamble-body';
    appendCombatLogDisplayItems(
      preBody,
      buildCombatLogDisplayItems(preamble),
      logRenderCtx
    );
    pre.appendChild(preBody);
    stack.appendChild(pre);
  }

  for (const bundle of rounds) {
    const roundEl = document.createElement('div');
    roundEl.className = 'combat-log-round';
    const roundHdr = document.createElement('div');
    roundHdr.className = 'combat-log-round-header';
    roundHdr.textContent = `Rodada ${bundle.round}`;
    roundEl.appendChild(roundHdr);

    for (const section of bundle.sections) {
      const phase = document.createElement('div');
      phase.className = `combat-log-phase combat-log-phase--${section.kind}`;
      const label = document.createElement('div');
      label.className = 'combat-log-phase-label';
      label.textContent = section.kind === 'player' ? 'Seu turno' : 'Inimigos';
      phase.appendChild(label);
      const body = document.createElement('div');
      body.className = 'combat-log-phase-body';
      appendCombatLogDisplayItems(
        body,
        buildCombatLogDisplayItems(section.body),
        logRenderCtx
      );
      phase.appendChild(body);
      roundEl.appendChild(phase);
    }
    stack.appendChild(roundEl);
  }

  logScroll.appendChild(stack);
  dice.appendChild(logScroll);

  const scrollLogToLatestRound = (): void => {
    scrollCombatLogToLatestRound(logScroll, stack);
  };
  requestAnimationFrame(() => {
    scrollLogToLatestRound();
    requestAnimationFrame(scrollLogToLatestRound);
  });
  logOuter.appendChild(dice);
  right.appendChild(logOuter);
  layout.appendChild(right);
  inner.appendChild(layout);

  shell.appendChild(inner);
}

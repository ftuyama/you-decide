import { ContentRegistry, getCampaignIndex } from '../content/registry';
import { createInitialState, deserializeState, serializeState } from '../engine/state';
import { EventBus, type GameEvent } from '../engine/eventBus';
import {
  enterScene,
  filterChoices,
  renderSceneBody,
  resolveLuckCheck,
  resolveSkillCheck,
  type LoadedScene,
} from '../engine/sceneRuntime';
import { applyEffects } from '../engine/effects';
import { effectiveLeadAttr, tickActiveBuffs } from '../engine/leadStats';
import type { Character, Choice, ClassId, CombatLogEntry, GameState, SpellDef } from '../engine/schema';
import { migrateLegacyKnownSpells } from '../engine/spellsKnown';
import {
  canCastSpell,
  executePlayerTurn,
  executeSpellTurn,
  fleeCombat,
  getCharacterArmorClass,
  getEffectiveLuck,
  getEquippedArmorPoints,
  sumEquippedItemBonuses,
} from '../engine/combat';
import { MAX_LEVEL, xpToNextLevel } from '../engine/progression';
import type { Stance } from '../engine/schema';
import { canWalk, renderMap } from '../campaigns/calvario/maps';
import { SCENE_ART } from '../campaigns/calvario/ascii/art';
import { getHeroClassLabel, getHeroLore } from '../campaigns/calvario/classHero';
import { formatDiceAscii } from './diceAscii';
import { GameAudio, type AmbientTheme } from './sound';
import './styles.css';

const SAVE_KEY = 'calvario_save_v1';
const SIDEBAR_KEY = 'calvario_sidebar_sections_v1';

export class GameApp {
  private registry: ContentRegistry;
  private bus = new EventBus();
  private audio = new GameAudio();
  private state: GameState;
  private root: HTMLElement;
  private timedTimer: ReturnType<typeof setTimeout> | null = null;
  private menuOpen = false;
  /** Secções colapsáveis (recursos, faccoes, diario) — persistido em sessionStorage */
  private sidebarSections: Record<string, boolean> = {};
  /** Buffs/debuffs/marcas — mostra banner até o jogador fechar */
  private statusHighlightQueue: Extract<GameEvent, { type: 'statusHighlight' }>[] = [];
  /** Itens recém-adquiridos (grantItem) — mostra banner até o jogador fechar */
  private itemAcquireQueue: string[] = [];
  /** Só reproduz efeitos de som para entradas novas do log de combate */
  private combatLogSoundCursor: { encounterId: string; index: number } = { encounterId: '', index: 0 };

  constructor(root: HTMLElement) {
    this.root = root;
    this.registry = new ContentRegistry();
    const idx = getCampaignIndex();
    this.bus.subscribe((ev) => {
      if (ev.type === 'combat.end' && ev.victory) {
        this.audio.playVictory();
      }
      if (ev.type === 'combat.end' && !ev.victory) {
        this.audio.playDefeat();
      }
      if (ev.type === 'item.acquired') {
        this.itemAcquireQueue.push(ev.itemId);
      }
      if (ev.type === 'statusHighlight') {
        this.statusHighlightQueue.push(ev);
      }
    });
    this.state = createInitialState(idx.entryScene);
    this.state = this.stabilize(this.state);
    this.sidebarSections = this.loadSidebarSections();
    window.addEventListener('keydown', (e) => this.onMapKey(e));
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.menuOpen = false;
        this.closeMenu();
      }
    });
    /** Primeiro gesto (toque ou tecla) desbloqueia AudioContext (política dos browsers). */
    const unlockOnce = (): void => {
      this.unlockAudio();
      document.removeEventListener('pointerdown', unlockOnce, true);
      document.removeEventListener('keydown', unlockOnce, true);
    };
    document.addEventListener('pointerdown', unlockOnce, true);
    document.addEventListener('keydown', unlockOnce, true);
    this.render();
  }

  private loadSidebarSections(): Record<string, boolean> {
    try {
      const raw = sessionStorage.getItem(SIDEBAR_KEY);
      if (!raw) return {};
      const o = JSON.parse(raw) as unknown;
      return typeof o === 'object' && o !== null ? (o as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  }

  private saveSidebarSections(): void {
    try {
      sessionStorage.setItem(SIDEBAR_KEY, JSON.stringify(this.sidebarSections));
    } catch {
      /* noop */
    }
  }

  private unlockAudio(): void {
    this.audio.startAmbientWhenReady();
    this.syncAmbientTheme();
  }

  private resolveAmbientTheme(): AmbientTheme {
    if (this.state.mode === 'combat' && this.state.combat) {
      const id = this.state.combat.encounterId;
      if (id.startsWith('boss_') || id.includes('boss')) return 'boss';
      return 'combat';
    }
    const sid = this.state.sceneId;
    if (sid.includes('vigilia_camp') || sid.includes('acamp')) return 'camp';
    if (sid.includes('act5') || sid.includes('frost')) return 'camp';
    return 'explore';
  }

  private syncAmbientTheme(): void {
    if (this.audio.isMuted()) return;
    this.audio.setAmbientTheme(this.resolveAmbientTheme());
  }

  private ctx(): { sceneId: string; data: import('../engine/gameData').GameData; bus: EventBus } {
    return { sceneId: this.state.sceneId, data: this.registry.data, bus: this.bus };
  }

  /** Não reentrar em cenas narrativas enquanto o combate está ativo (evita sobrescrever mode). */
  private stabilize(state: GameState): GameState {
    state = migrateLegacyKnownSpells(state, this.registry.data);
    if (state.mode === 'combat') return state;
    let s = state;
    for (let i = 0; i < 14; i++) {
      const sc = this.registry.getScene(s.sceneId);
      if (!sc) return s;
      const before = s.sceneId;
      s = enterScene(s, sc, this.registry.data, this.bus);
      if (s.sceneId === before) return s;
    }
    return s;
  }

  private applyChoice(choice: Choice): void {
    this.unlockAudio();
    this.audio.playUiClick();
    if (this.timedTimer) {
      clearTimeout(this.timedTimer);
      this.timedTimer = null;
    }
    const prevScene = this.state.sceneId;
    let s = applyEffects(this.state, choice.effects, this.ctx());
    if (choice.next && s.mode === 'story') {
      s = { ...s, sceneId: choice.next };
    }
    if (s.sceneId !== prevScene) {
      s = tickActiveBuffs(s);
    }
    this.state = this.stabilize(s);
    this.render();
  }

  private onSkillRoll(scene: LoadedScene): void {
    this.unlockAudio();
    this.audio.playDice();
    const sc = scene.frontmatter.skillCheck;
    const r = resolveSkillCheck(this.state, scene);
    if (sc) {
      if (r.state.sceneId === sc.failNext) this.audio.playCheckFail();
      else if (r.state.sceneId === sc.successNext) this.audio.playCheckSuccess();
    }
    this.state = this.stabilize(r.state);
    this.render();
  }

  private onLuckRoll(scene: LoadedScene): void {
    this.unlockAudio();
    this.audio.playDice();
    const lc = scene.frontmatter.luckCheck;
    const r = resolveLuckCheck(this.state, scene, this.registry.data);
    if (lc) {
      if (r.state.sceneId === lc.failNext) this.audio.playCheckFail();
      else if (r.state.sceneId === lc.successNext) this.audio.playCheckSuccess();
    }
    this.state = this.stabilize(r.state);
    this.render();
  }

  private onMapKey(e: KeyboardEvent): void {
    const m = this.state.asciiMap;
    if (!m || this.state.mode !== 'story') return;
    const mapId = m.mapId;
    let { playerX: x, playerY: y } = m;
    let nx = x;
    let ny = y;
    if (e.key === 'ArrowUp') ny -= 1;
    else if (e.key === 'ArrowDown') ny += 1;
    else if (e.key === 'ArrowLeft') nx -= 1;
    else if (e.key === 'ArrowRight') nx += 1;
    else return;
    e.preventDefault();
    if (!canWalk(mapId, x, y, nx, ny)) {
      this.audio.playBlocked();
      return;
    }
    let s: GameState = { ...this.state, asciiMap: { ...m, playerX: nx, playerY: ny } };
    if (this.state.resources.supply > 0) {
      const next = applyEffects(s, [{ op: 'addResource', resource: 'supply', delta: -1 }], this.ctx());
      s = { ...next, asciiMap: s.asciiMap };
    }
    this.audio.playUiClick();
    this.state = s;
    this.render();
  }

  private save(): void {
    this.unlockAudio();
    try {
      localStorage.setItem(SAVE_KEY, serializeState(this.state));
    } catch {
      /* noop */
    }
    this.closeMenu();
  }

  private load(): void {
    this.unlockAudio();
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      this.state = deserializeState(raw);
      this.state = this.stabilize(this.state);
      this.render();
    } catch {
      /* noop */
    }
    this.closeMenu();
  }

  private closeMenu(): void {
    this.menuOpen = false;
    const drawer = this.root.querySelector('.menu-drawer');
    const backdrop = this.root.querySelector('.menu-backdrop');
    drawer?.classList.remove('open');
    backdrop?.classList.remove('open');
  }

  private toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
    const drawer = this.root.querySelector('.menu-drawer');
    const backdrop = this.root.querySelector('.menu-backdrop');
    if (this.menuOpen) {
      drawer?.classList.add('open');
      backdrop?.classList.add('open');
      this.unlockAudio();
    } else {
      drawer?.classList.remove('open');
      backdrop?.classList.remove('open');
    }
  }

  private resolveArt(scene: LoadedScene): string | undefined {
    const fm = scene.frontmatter;
    const inline = fm.art?.trim();
    if (inline) return inline;
    const key = fm.artKey;
    if (key && SCENE_ART[key]) return SCENE_ART[key];
    return undefined;
  }

  private render(): void {
    if (this.timedTimer) {
      clearTimeout(this.timedTimer);
      this.timedTimer = null;
    }
    if (this.state.mode !== 'combat') {
      this.combatLogSoundCursor = { encounterId: '', index: 0 };
    }
    this.root.innerHTML = '';

    const frame = document.createElement('div');
    frame.className = 'app-frame';

    const header = document.createElement('header');
    header.className = 'app-top';
    const title = document.createElement('div');
    title.className = 'game-title';
    title.textContent = 'Calvário Subterrâneo';
    const hBtn = document.createElement('button');
    hBtn.type = 'button';
    hBtn.className = 'hamburger';
    hBtn.setAttribute('aria-label', 'Menu');
    hBtn.setAttribute('aria-expanded', 'false');
    hBtn.innerHTML = '☰';
    hBtn.addEventListener('click', () => {
      this.toggleMenu();
      hBtn.setAttribute('aria-expanded', this.menuOpen ? 'true' : 'false');
    });
    header.appendChild(title);
    header.appendChild(hBtn);
    frame.appendChild(header);

    const backdrop = document.createElement('div');
    backdrop.className = 'menu-backdrop';
    backdrop.addEventListener('click', () => {
      this.closeMenu();
      hBtn.setAttribute('aria-expanded', 'false');
    });
    frame.appendChild(backdrop);

    const drawer = document.createElement('aside');
    drawer.className = 'menu-drawer';
    drawer.setAttribute('aria-hidden', 'true');

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'menu-item';
    saveBtn.textContent = 'Salvar jogo';
    saveBtn.addEventListener('click', () => this.save());

    const loadBtn = document.createElement('button');
    loadBtn.type = 'button';
    loadBtn.className = 'menu-item';
    loadBtn.textContent = 'Carregar jogo';
    loadBtn.addEventListener('click', () => this.load());

    const soundRow = document.createElement('label');
    soundRow.className = 'menu-item menu-sound';
    const soundCb = document.createElement('input');
    soundCb.type = 'checkbox';
    soundCb.checked = !this.audio.isMuted();
    soundCb.addEventListener('change', () => {
      this.audio.setMuted(!soundCb.checked);
      if (soundCb.checked) {
        this.unlockAudio();
      } else {
        this.audio.stopAmbient();
      }
    });
    soundRow.appendChild(soundCb);
    soundRow.appendChild(document.createTextNode(' Som ligado'));

    drawer.appendChild(saveBtn);
    drawer.appendChild(loadBtn);
    drawer.appendChild(soundRow);
    frame.appendChild(drawer);

    const bodyRow = document.createElement('div');
    bodyRow.className = 'app-body';

    const sidebar = document.createElement('aside');
    sidebar.className = 'player-sidebar';
    sidebar.appendChild(this.buildSidebar());

    const main = document.createElement('main');
    main.className = 'story-shell';

    if (this.state.mode === 'combat') {
      main.classList.add('main--combat');
      this.renderCombatInto(main);
    } else {
      const scene = this.registry.getScene(this.state.sceneId);
      if (!scene) {
        main.innerHTML = `<div class="shell error">Cena não encontrada: <code>${this.state.sceneId}</code></div>`;
      } else {
        this.renderStoryInto(main, scene);
      }
    }

    bodyRow.appendChild(sidebar);
    bodyRow.appendChild(main);
    frame.appendChild(bodyRow);

    this.root.appendChild(frame);
    if (this.state.lastCombatXpGain != null) {
      this.state = { ...this.state, lastCombatXpGain: null };
    }
    this.syncAmbientTheme();
  }

  private playCombatLogSound(entry: CombatLogEntry, leadName: string | undefined): void {
    if (entry.kind === 'attack' && entry.outcome === 'miss') {
      this.audio.playMiss();
      return;
    }
    if (entry.kind === 'damage' && leadName && entry.target === leadName) {
      this.audio.playDamageTaken();
      return;
    }
    if (entry.kind === 'stress') {
      this.audio.playStressSting();
      return;
    }
    if (entry.kind === 'armor_break') {
      this.audio.playHit();
    }
  }

  private escHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** `fill`: xp = verde (barra de XP), hp = vermelho (HP do herói) */
  private hpBarMarkup(
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

  private manaBarMarkup(cur: number, max: number): string {
    if (max <= 0) return '';
    const pct = Math.min(100, Math.max(0, Math.round((cur / max) * 100)));
    return `<div class="mana-bar-track" title="Mana ${cur} / ${max}">
      <div class="mana-bar-fill" style="width:${pct}%"></div>
    </div>`;
  }

  /** Stress 0–4 (máx. do personagem). */
  private stressBarMarkup(cur: number): string {
    const max = 4;
    const pct = Math.min(100, Math.max(0, Math.round((cur / max) * 100)));
    return `<div class="stress-bar-track" title="Stress ${cur} / ${max}">
      <div class="stress-bar-fill" style="width:${pct}%"></div>
    </div>`;
  }

  /** Bônus só de equipamento; omitido se 0. */
  private statBonusParen(n: number): string {
    if (n === 0) return '';
    const sign = n > 0 ? '+' : '';
    return ` <span class="stat-build-bonus">(${sign}${n})</span>`;
  }

  /** CA, STR, AGI, MEN, SOR com totais e (+X) da build. */
  private formatStatAttrsLineHtml(c: Character, opts?: { compact?: boolean }): string {
    const data = this.registry.data;
    const state = this.state;
    const eq = sumEquippedItemBonuses(data, c);
    const str = effectiveLeadAttr(state, c, 'str') + eq.str;
    const agi = effectiveLeadAttr(state, c, 'agi') + eq.agi;
    const men = effectiveLeadAttr(state, c, 'mind') + eq.mind;
    const sor = getEffectiveLuck(c, data, state);
    const ca = getCharacterArmorClass(data, c, state);
    const caEq = getEquippedArmorPoints(data, c);
    const cls = opts?.compact ? 'sidebar-line attrs party-member-card-stats' : 'sidebar-line attrs';
    return `<div class="${cls}">CA <strong>${ca}</strong>${this.statBonusParen(caEq)} · STR <strong>${str}</strong>${this.statBonusParen(eq.str)} · AGI <strong>${agi}</strong>${this.statBonusParen(eq.agi)} · MEN <strong>${men}</strong>${this.statBonusParen(eq.mind)} · SOR <strong>${sor}</strong>${this.statBonusParen(eq.luck)}</div>`;
  }

  private inventoryMarkup(): string {
    const inv = this.state.inventory;
    if (!inv.length) {
      return `<div class="sidebar-line inventory-empty">Nenhum item ainda.</div>`;
    }
    return inv
      .map((id) => {
        const def = this.registry.data.items[id];
        const label = def?.name ?? id;
        return `<div class="sidebar-line inventory-item">· ${this.escHtml(label)}</div>`;
      })
      .join('');
  }

  /** Bloco lateral por companheiro (party[1..]). */
  private companionCardMarkup(c: Character): string {
    const cid = c.class as ClassId;
    const clsLabel = getHeroClassLabel(cid, c.path);
    const def = this.registry.data.companions[c.id];
    const lore = def?.lorePt;
    const openKey = `companion_lore_${c.id}`;
    const open = this.sidebarSections[openKey] ? ' open' : '';
    const loreHtml = lore
      ? lore
          .split('\n\n')
          .map((para) => `<p>${this.escHtml(para)}</p>`)
          .join('')
      : `<p class="sidebar-muted">Sem história gravada.</p>`;
    return `<div class="companion-sidebar-card">
      <div class="companion-sidebar-name">${this.escHtml(c.name)}</div>
      <div class="companion-sidebar-class">${this.escHtml(clsLabel)}</div>
      <div class="sidebar-line">HP <strong>${c.hp}</strong> / <strong>${c.maxHp}</strong></div>
      ${this.hpBarMarkup(c.hp, c.maxHp, 'hp-bar-resource', 'hp')}
      <div class="sidebar-line sidebar-stress-label">Stress <strong>${c.stress}</strong> / 4</div>
      ${this.stressBarMarkup(c.stress)}
      ${this.formatStatAttrsLineHtml(c, { compact: true })}
      <details class="sidebar-collapse companion-lore"${open} data-section="${openKey}">
        <summary class="sidebar-collapse-trigger">História</summary>
        <div class="sidebar-collapse-body sidebar-lore-body">${loreHtml}</div>
      </details>
    </div>`;
  }

  private companionsSectionMarkup(): string {
    const rest = this.state.party.slice(1);
    if (!rest.length) {
      return `<div class="sidebar-line sidebar-muted">Nenhum companheiro no grupo.</div>`;
    }
    return rest.map((ch) => this.companionCardMarkup(ch)).join('');
  }

  /** Reputação −3…+3 como barra (0% = −3, 100% = +3). */
  private repBarMarkup(
    label: string,
    value: number,
    variant: 'vigilia' | 'circulo' | 'culto'
  ): string {
    const pct = Math.min(100, Math.max(0, Math.round(((value + 3) / 6) * 100)));
    return `<div class="faction-rep-row">
    <div class="sidebar-line faction-rep-label">${label} <strong>${value}</strong></div>
    <div class="faction-rep-track faction-rep-track--${variant}" title="${label}: ${value} (−3 a +3)">
      <div class="faction-rep-fill faction-rep-fill--${variant}" style="width:${pct}%"></div>
    </div>
  </div>`;
  }

  private wireSidebarDetails(hud: HTMLElement): void {
    hud.querySelectorAll('details[data-section]').forEach((el) => {
      const d = el as HTMLDetailsElement;
      const key = d.dataset.section;
      if (!key) return;
      if (this.sidebarSections[key] !== undefined) {
        d.open = this.sidebarSections[key]!;
      }
      d.addEventListener('toggle', () => {
        this.sidebarSections[key] = d.open;
        this.saveSidebarSections();
      });
    });
  }

  private buildSidebar(): HTMLElement {
    const hud = document.createElement('div');
    hud.className = 'sidebar-inner';
    const r = this.state.resources;
    const gold = r.gold ?? 0;
    const p = this.state.party[0];
    const rep = this.state.reputation;

    const openRec = this.sidebarSections['recursos'] ? ' open' : '';
    const openInv = this.sidebarSections['inventario'] ? ' open' : '';
    const openFac = this.sidebarSections['faccoes'] ? ' open' : '';
    const openDiary = this.sidebarSections['diario'] ? ' open' : '';
    const openLore = this.sidebarSections['personagem_lore'] ? ' open' : '';
    const openSpells = this.sidebarSections['personagem_spells'] ? ' open' : '';

    const personagemBlock = (() => {
      if (!p) {
        return `<div class="sidebar-line">Escolha uma classe na narrativa.</div>
        <div class="sidebar-line">Nível <strong>${this.state.level}</strong> · XP <strong>${this.state.xp}</strong></div>`;
      }
      const cid = p.class as ClassId;
      const loreHtml = getHeroLore(cid, p.path)
        .split('\n\n')
        .map((para) => `<p>${this.escHtml(para)}</p>`)
        .join('');
      const lv = this.state.level;
      const need = lv >= MAX_LEVEL ? 0 : xpToNextLevel(lv);
      const xpLine =
        lv >= MAX_LEVEL
          ? `<div class="sidebar-line">Nível <strong>${lv}</strong> · <em>Máx.</em></div>`
          : `<div class="sidebar-line">Nível <strong>${lv}</strong> · XP <strong>${this.state.xp}</strong> / <strong>${need}</strong></div>
        ${this.hpBarMarkup(this.state.xp, need)}`;
      const buffHint =
        this.state.activeBuffs.length > 0
          ? `<div class="sidebar-line sidebar-buffs">${this.state.activeBuffs
              .map((b) => `${b.attr.toUpperCase()} ${b.delta >= 0 ? '+' : ''}${b.delta} (${b.remainingScenes} cena(s))`)
              .join(' · ')}</div>`
          : '';
      return `<div class="sidebar-line">Nome <strong>${this.escHtml(p.name)}</strong></div>
        <div class="sidebar-line sidebar-class-line">${this.escHtml(getHeroClassLabel(cid, p.path))}</div>
        ${xpLine}
        <div class="sidebar-line">HP <strong>${p.hp}/${p.maxHp}</strong></div>
        ${this.hpBarMarkup(p.hp, p.maxHp, 'hp-bar-resource', 'hp')}
        ${p.maxMana > 0 ? `<div class="sidebar-line">Mana <strong>${p.mana}</strong> / <strong>${p.maxMana}</strong></div>${this.manaBarMarkup(p.mana, p.maxMana)}` : ''}
        <div class="sidebar-line sidebar-stress-label">Stress <strong>${p.stress}</strong> / 4</div>
        ${this.stressBarMarkup(p.stress)}
        ${buffHint}
        ${this.formatStatAttrsLineHtml(p)}
        ${(() => {
          const spellLines = this.state.knownSpells
            .map((id) => this.registry.data.spells[id])
            .filter((sp): sp is SpellDef => !!sp);
          const body =
            spellLines.length === 0
              ? `<p class="sidebar-muted">Nenhuma magia aprendida.</p>`
              : spellLines
                  .map(
                    (sp) =>
                      `<p class="sidebar-spell-line"><strong>${this.escHtml(sp.name)}</strong> — ${sp.manaCost} mana · ${sp.spellKind === 'damage' ? 'dano' : 'cura'} (${sp.dice}d6 + Mente)</p>`
                  )
                  .join('');
          return `<details class="sidebar-collapse sidebar-spells"${openSpells} data-section="personagem_spells">
          <summary class="sidebar-collapse-trigger">Magias aprendidas</summary>
          <div class="sidebar-collapse-body sidebar-lore-body">${body}</div>
        </details>`;
        })()}
        <details class="sidebar-collapse sidebar-lore"${openLore} data-section="personagem_lore">
          <summary class="sidebar-collapse-trigger">História do herói</summary>
          <div class="sidebar-collapse-body sidebar-lore-body">${loreHtml}</div>
        </details>`;
    })();

    hud.innerHTML = `
      <h2 class="sidebar-title">Herói</h2>
      <div class="sidebar-static">
        <div class="sidebar-static-title">Progresso</div>
        <div class="sidebar-static-body">
          <div class="sidebar-line">Capítulo <strong>${this.state.chapter}</strong></div>
          <div class="sidebar-line">Tier <strong>${this.state.narrativeTier}</strong></div>
        </div>
      </div>
      <div class="sidebar-static">
        <div class="sidebar-static-title">Personagem</div>
        <div class="sidebar-static-body sidebar-stats">
          ${personagemBlock}
        </div>
      </div>
      <div class="sidebar-static">
        <div class="sidebar-static-title">Companheiros</div>
        <div class="sidebar-static-body sidebar-stats">
          ${this.companionsSectionMarkup()}
        </div>
      </div>
      <details class="sidebar-collapse"${openRec} data-section="recursos">
        <summary class="sidebar-collapse-trigger">Recursos</summary>
        <div class="sidebar-collapse-body">
          <div class="sidebar-line">Gold <strong>${gold}</strong></div>
          <div class="sidebar-line">Suprimento <strong>${r.supply}</strong> <span class="sidebar-resource-hint">(mapa, acampamento)</span></div>
          <div class="sidebar-line">Fé <strong>${r.faith}</strong></div>
          <div class="sidebar-line">Corrupção <strong>${r.corruption}</strong></div>
        </div>
      </details>
      <details class="sidebar-collapse"${openInv} data-section="inventario">
        <summary class="sidebar-collapse-trigger">Inventário</summary>
        <div class="sidebar-collapse-body sidebar-inventory">
          ${this.inventoryMarkup()}
        </div>
      </details>
      <details class="sidebar-collapse"${openFac} data-section="faccoes">
        <summary class="sidebar-collapse-trigger">Facções</summary>
        <div class="sidebar-collapse-body sidebar-faccoes">
          ${this.repBarMarkup('Vigília', rep.vigilia, 'vigilia')}
          ${this.repBarMarkup('Círculo', rep.circulo, 'circulo')}
          ${this.repBarMarkup('Culto', rep.culto, 'culto')}
        </div>
      </details>
    `;

    if (this.state.diary.length) {
      const diary = document.createElement('details');
      diary.className = 'sidebar-collapse';
      if (openDiary) diary.setAttribute('open', '');
      diary.dataset.section = 'diario';
      diary.innerHTML = `
        <summary class="sidebar-collapse-trigger">Diário</summary>
        <div class="sidebar-collapse-body diary-box">
          ${this.state.diary.map((x) => `<p>“${x}”</p>`).join('')}
        </div>
      `;
      hud.appendChild(diary);
    }

    this.wireSidebarDetails(hud);
    return hud;
  }

  private renderStoryInto(shell: HTMLElement, scene: LoadedScene): void {
    const inner = document.createElement('div');
    inner.className = 'shell';

    const bc = document.createElement('div');
    bc.className = 'breadcrumb';
    bc.textContent = `📁 campaigns/calvario/scenes/${scene.id}.md`;
    inner.appendChild(bc);

    if (this.statusHighlightQueue.length > 0) {
      const wrap = document.createElement('div');
      wrap.className = 'status-highlight-stack';
      for (const h of this.statusHighlightQueue) {
        const block = document.createElement('div');
        block.className = `status-highlight-banner status-highlight-banner--${h.variant}`;
        const titleEl = document.createElement('div');
        titleEl.className = 'status-highlight-title';
        titleEl.textContent = h.title;
        block.appendChild(titleEl);
        if (h.subtitle) {
          const sub = document.createElement('div');
          sub.className = 'status-highlight-subtitle';
          sub.textContent = h.subtitle;
          block.appendChild(sub);
        }
        wrap.appendChild(block);
      }
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'status-highlight-dismiss';
      btn.textContent = 'Continuar';
      btn.addEventListener('click', () => {
        this.statusHighlightQueue = [];
        this.audio.playUiClick();
        this.render();
      });
      wrap.appendChild(btn);
      inner.appendChild(wrap);
    }

    if (this.itemAcquireQueue.length > 0) {
      const unique = [...new Set(this.itemAcquireQueue)];
      const wrap = document.createElement('div');
      wrap.className = 'item-acquire-banner';
      const kicker = document.createElement('div');
      kicker.className = 'item-acquire-kicker';
      kicker.textContent = unique.length > 1 ? 'Novos itens adquiridos' : 'Item adquirido';
      wrap.appendChild(kicker);
      for (const itemId of unique) {
        const def = this.registry.data.items[itemId];
        if (!def) continue;
        const block = document.createElement('div');
        block.className = 'item-acquire-block';
        const nameEl = document.createElement('div');
        nameEl.className = 'item-acquire-name';
        nameEl.textContent = def.name;
        block.appendChild(nameEl);
        const art = def.sprite?.trim();
        if (art) {
          const pre = document.createElement('pre');
          pre.className = 'item-sprite';
          pre.textContent = art;
          block.appendChild(pre);
        }
        wrap.appendChild(block);
      }
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'item-acquire-dismiss';
      btn.textContent = 'Continuar';
      btn.addEventListener('click', () => {
        this.itemAcquireQueue = [];
        this.audio.playUiClick();
        this.render();
      });
      wrap.appendChild(btn);
      inner.appendChild(wrap);
    }

    const xpGain = this.state.lastCombatXpGain;
    if (xpGain != null && xpGain > 0) {
      const xpBanner = document.createElement('div');
      xpBanner.className = 'victory-xp-banner';
      xpBanner.textContent = `+${xpGain} XP ganhos nesta batalha.`;
      inner.appendChild(xpBanner);
    }

    const h1 = document.createElement('h1');
    h1.textContent = scene.frontmatter.title ?? scene.id;
    inner.appendChild(h1);

    const artText = this.resolveArt(scene);
    if (artText) {
      const pre = document.createElement('pre');
      pre.className = 'scene-art';
      pre.textContent = artText.trim();
      inner.appendChild(pre);
    }

    const body = document.createElement('div');
    body.className = 'story-body';
    body.innerHTML = renderSceneBody(scene.bodyRaw, this.state);
    inner.appendChild(body);

    if (this.state.asciiMap) {
      const rm = renderMap(
        this.state.asciiMap.mapId,
        this.state.asciiMap.playerX,
        this.state.asciiMap.playerY
      );
      if (rm) {
        const wrap = document.createElement('div');
        wrap.innerHTML = `<div class="map-hint">Mapa (setas; −1 suprimento por passo)</div>`;
        const pre = document.createElement('pre');
        pre.className = 'ascii-map';
        pre.textContent = rm.lines.join('\n');
        wrap.appendChild(pre);
        inner.appendChild(wrap);
      }
    }

    if (scene.frontmatter.skillCheck) {
      const row = document.createElement('div');
      row.className = 'skill-row';
      const b = document.createElement('button');
      b.className = 'choice';
      b.textContent = `Rolar teste: ${scene.frontmatter.skillCheck.label ?? scene.frontmatter.skillCheck.attr} (2d6)`;
      b.addEventListener('click', () => this.onSkillRoll(scene));
      row.appendChild(b);
      inner.appendChild(row);
    }

    if (scene.frontmatter.luckCheck) {
      const row = document.createElement('div');
      row.className = 'skill-row';
      const b = document.createElement('button');
      b.className = 'choice';
      const lc = scene.frontmatter.luckCheck;
      b.textContent = `Rolar sorte: ${lc.label ?? '2d6 + mod(SOR)'} vs TN ${lc.tn}`;
      b.addEventListener('click', () => this.onLuckRoll(scene));
      row.appendChild(b);
      inner.appendChild(row);
    }

    const choices = filterChoices(scene.frontmatter.choices, this.state);
    const chWrap = document.createElement('div');
    chWrap.className = 'choices';

    for (const ch of choices) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice';
      btn.appendChild(document.createTextNode(ch.text));
      if (ch.preview) {
        const span = document.createElement('span');
        span.className = 'preview';
        span.textContent = ch.preview;
        btn.appendChild(span);
      }
      btn.addEventListener('click', () => this.applyChoice(ch));
      chWrap.appendChild(btn);
    }
    inner.appendChild(chWrap);

    this.setupTimedChoices(choices, inner);

    shell.appendChild(inner);
  }

  private setupTimedChoices(choices: Choice[], shell: HTMLElement): void {
    const timed = choices.find((c) => c.timedMs && c.fallbackNext);
    if (!timed || !timed.timedMs || !timed.fallbackNext) return;
    const bar = document.createElement('div');
    bar.className = 'timed-bar';
    const inner = document.createElement('i');
    inner.style.animationDuration = `${timed.timedMs}ms`;
    bar.appendChild(inner);
    shell.appendChild(bar);
    this.timedTimer = setTimeout(() => {
      this.applyChoice({
        text: '',
        next: timed.fallbackNext,
        effects: [],
      });
    }, timed.timedMs);
  }

  private renderCombatInto(shell: HTMLElement): void {
    const c = this.state.combat;
    if (!c) return;

    const encId = c.encounterId;
    const leadName = this.state.party[0]?.name;
    if (this.combatLogSoundCursor.encounterId !== encId) {
      this.combatLogSoundCursor = { encounterId: encId, index: c.log.length };
    } else {
      const newEntries = c.log.slice(this.combatLogSoundCursor.index);
      for (const entry of newEntries) {
        this.playCombatLogSound(entry, leadName);
      }
      this.combatLogSoundCursor.index = c.log.length;
    }

    const inner = document.createElement('div');
    inner.className = 'shell combat-shell';
    inner.innerHTML = `<h1>Combate</h1>`;

    const layout = document.createElement('div');
    layout.className = 'combat-layout';

    const left = document.createElement('div');
    left.className = 'combat-enemies-column';
    for (const inst of c.enemies) {
      if (inst.hp <= 0) continue;
      const def = this.registry.data.enemies[inst.defId];
      if (!def) continue;
      const panel = document.createElement('div');
      panel.className = 'enemy-panel';
      const wounded = inst.hp / inst.maxHp < 0.35;
      const sprite = wounded && def.spriteWounded ? def.spriteWounded : def.sprite;
      const pre = document.createElement('pre');
      pre.className = 'enemy-sprite';
      pre.textContent = sprite;
      const hpBar = `[${'█'.repeat(Math.ceil((inst.hp / inst.maxHp) * 10))}${'░'.repeat(10 - Math.ceil((inst.hp / inst.maxHp) * 10))}]`;
      panel.innerHTML = `<div><strong>${def.name}</strong> · ${hpBar} ${inst.hp}/${inst.maxHp}</div>`;
      if (def.type === 'armored' && inst.armorChipsRemaining > 0) {
        panel.innerHTML += `<div>Armadura: ${inst.armorChipsRemaining} camadas</div>`;
      }
      panel.appendChild(pre);
      left.appendChild(panel);
    }
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

    const partyNames = new Set(this.state.party.map((x) => x.name));

    for (const entry of c.log.slice(-64)) {
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
      msg.textContent = entry.message;
      wrap.appendChild(msg);

      const appendMeta = (metaParts: string[]): void => {
        if (!metaParts.length) return;
        const meta = document.createElement('div');
        meta.className = 'combat-log-meta';
        meta.textContent = metaParts.join(' · ');
        wrap.appendChild(meta);
      };

      if (entry.dice?.length) {
        const pre = document.createElement('pre');
        pre.className = 'dice-ascii-block';
        pre.textContent = formatDiceAscii(entry.dice);
        wrap.appendChild(pre);
        const metaParts: string[] = [];
        if (entry.modifier !== undefined) {
          metaParts.push(`mod ${entry.modifier >= 0 ? '+' : ''}${entry.modifier}`);
        }
        if (entry.kind === 'attack' && entry.vsDefense !== undefined) {
          metaParts.push(`CA ${entry.vsDefense}`);
        }
        if (entry.final !== undefined) {
          metaParts.push(`total ${entry.final}`);
        }
        appendMeta(metaParts);
      } else if (entry.modifier !== undefined || entry.final !== undefined) {
        const metaParts: string[] = [];
        if (entry.modifier !== undefined) {
          metaParts.push(`mod ${entry.modifier >= 0 ? '+' : ''}${entry.modifier}`);
        }
        if (entry.kind === 'attack' && entry.vsDefense !== undefined) {
          metaParts.push(`CA ${entry.vsDefense}`);
        }
        if (entry.final !== undefined) {
          metaParts.push(`total ${entry.final}`);
        }
        appendMeta(metaParts);
      }
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

    const lead = this.state.party[0];
    if (c.phase === 'choose_stance' && lead) {
      if (this.state.party.length > 1) {
        const allyHint = document.createElement('div');
        allyHint.className = 'combat-allies-hint';
        allyHint.textContent =
          'Cada companheiro ataca em seguida (mesma postura), contra o primeiro inimigo vivo.';
        inner.appendChild(allyHint);
      }
      const bar = document.createElement('div');
      bar.className = 'stance-bar';
      const stances: Stance[] = ['aggressive', 'defensive', 'focus'];
      const labels: Record<Stance, string> = {
        aggressive: 'Agressivo (+atk / −def)',
        defensive: 'Defensivo (−atk / +def)',
        focus: 'Foco (magia: Mente)',
      };
      for (const st of stances) {
        const btn = document.createElement('button');
        btn.className = 'stance';
        btn.textContent = labels[st];
        btn.addEventListener('click', () => {
          this.unlockAudio();
          this.audio.playDice();
          this.state = executePlayerTurn(this.state, st, this.registry.data, false, this.bus);
          this.render();
        });
        bar.appendChild(btn);
      }
      const sp = document.createElement('button');
      sp.className = 'stance special';
      sp.textContent = lead.specialUsedThisCombat ? 'Especial já usado' : 'Golpe especial (+2, +Stress)';
      sp.disabled = lead.specialUsedThisCombat;
      sp.addEventListener('click', () => {
        if (!lead.specialUsedThisCombat) {
          this.unlockAudio();
          this.audio.playDice();
          this.state = executePlayerTurn(this.state, 'aggressive', this.registry.data, true, this.bus);
          this.render();
        }
      });
      bar.appendChild(sp);
      inner.appendChild(bar);

      if (lead.maxMana > 0) {
        const spellBar = document.createElement('div');
        spellBar.className = 'combat-spell-bar';
        const spellHdr = document.createElement('div');
        spellHdr.className = 'combat-spell-hdr';
        spellHdr.textContent = 'Magias';
        spellBar.appendChild(spellHdr);
        const spells = this.registry.data.spells;
        for (const [spellId, sp] of Object.entries(spells)) {
          if (!this.state.knownSpells.includes(spellId)) continue;
          if (sp.classId !== 'any' && sp.classId !== lead.class) continue;
          if (this.state.level < sp.minLevel) continue;
          const btn = document.createElement('button');
          btn.className = 'combat-spell';
          btn.type = 'button';
          btn.textContent = `${sp.name} (${sp.manaCost})`;
          const castOk = canCastSpell(this.state, spellId, this.registry.data);
          btn.disabled = !castOk;
          btn.addEventListener('click', () => {
            if (!canCastSpell(this.state, spellId, this.registry.data)) return;
            this.unlockAudio();
            this.audio.playDice();
            this.state = executeSpellTurn(this.state, spellId, this.registry.data, this.bus);
            this.render();
          });
          spellBar.appendChild(btn);
        }
        inner.appendChild(spellBar);
      }
    }

    const flee = document.createElement('button');
    flee.className = 'choice';
    flee.textContent = 'Tentar fugir';
    flee.addEventListener('click', () => {
      this.unlockAudio();
      this.state = fleeCombat(this.state, this.bus);
      this.render();
    });
    inner.appendChild(flee);

    shell.appendChild(inner);
  }
}

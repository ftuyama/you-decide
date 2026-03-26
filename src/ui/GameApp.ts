import { ContentRegistry } from '../content/registry';
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
import type {
  Character,
  Choice,
  ClassId,
  CombatLogEntry,
  GameState,
  ItemDef,
  SpellDef,
} from '../engine/schema';
import { migrateLegacyKnownSpells } from '../engine/spellsKnown';
import {
  canCastSpell,
  canUseCombatConsumable,
  executePlayerTurn,
  executeSpellTurn,
  fleeCombat,
  useCombatConsumable,
  getCharacterArmorClass,
  getEffectiveLuck,
  getEquippedArmorPoints,
  sumEquippedItemBonuses,
} from '../engine/combat';
import { MAX_LEVEL, xpToNextLevel } from '../engine/progression';
import type { Stance } from '../engine/schema';
import { formatDiceAscii } from './diceAscii';
import {
  buildCombatLogDisplayItems,
  escHtml,
  fmtSignedMod,
  formatLevelUpDeltaLine,
  hpBarMarkup,
  manaBarMarkup,
  spellEmoji,
  statBonusParen,
  stressBarMarkup,
} from './gameAppUtils';
import { GameAudio, type AmbientTheme } from './sound';
import { collapseTriggerStart, iconWrap, icons } from './icons';
import './styles.css';
import pkg from '../../package.json' with { type: 'json' };

export class GameApp {
  private readonly campaignId: string;
  private readonly saveKey: string;
  private readonly sidebarKey: string;
  private readonly fontKey: string;
  private readonly quickNavKey: string;
  private readonly devModeKey: string;
  private registry: ContentRegistry;
  private bus = new EventBus();
  private audio: GameAudio;
  private state: GameState;
  private root: HTMLElement;
  private timedTimer: ReturnType<typeof setTimeout> | null = null;
  private menuOpen = false;
  /** 0 = 100%, 1 = 110%, 2 = 120% */
  private fontStep = 0;
  /** Memórias (cenas visitadas), caminho do ficheiro da cena, etc. */
  private devMode = false;
  /** Modo de navegação rápida: mostra números clicáveis antes das escolhas. */
  private quickNavMode = false;
  private readonly choiceHotkeyHandler: (e: KeyboardEvent) => void;
  /** Secções colapsáveis (recursos, faccoes, diario) — persistido em sessionStorage */
  private sidebarSections: Record<string, boolean> = {};
  /** Buffs/debuffs/marcas — mostra banner até o jogador fechar */
  private statusHighlightQueue: Extract<GameEvent, { type: 'statusHighlight' }>[] = [];
  /** Itens recém-adquiridos (grantItem) — mostra banner até o jogador fechar */
  private itemAcquireQueue: string[] = [];
  /** Milagre de fé após quase-morte em combate — banner até fechar */
  private faithMiraclePending = false;
  /** Só reproduz efeitos de som para entradas novas do log de combate */
  private combatLogSoundCursor: { encounterId: string; index: number } = { encounterId: '', index: 0 };

  constructor(root: HTMLElement, campaignId: string) {
    this.root = root;
    this.campaignId = campaignId;
    this.saveKey = `${campaignId}_save_v1`;
    this.sidebarKey = `${campaignId}_sidebar_sections_v1`;
    this.fontKey = `${campaignId}_font_step_v1`;
    this.quickNavKey = `${campaignId}_quick_nav_mode_v1`;
    this.devModeKey = `${campaignId}_dev_mode`;
    this.registry = new ContentRegistry(campaignId);
    this.audio = new GameAudio(campaignId);
    this.fontStep = this.loadFontStep();
    this.quickNavMode = this.loadQuickNavMode();
    this.devMode = this.loadDevMode();
    this.choiceHotkeyHandler = (e: KeyboardEvent): void => {
      if (this.state.mode !== 'story') return;
      const el = e.target;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
        return;
      }
      if (!/^[1-9]$/.test(e.key)) return;
      const idx = parseInt(e.key, 10) - 1;
      const btns = this.root.querySelectorAll<HTMLButtonElement>('.story-shell .choices .choice');
      const btn = btns[idx];
      if (!btn || btn.disabled) return;
      e.preventDefault();
      btn.click();
    };
    document.addEventListener('keydown', this.choiceHotkeyHandler, true);

    this.bus.subscribe((ev) => {
      if (ev.type === 'combat.end' && ev.victory) {
        this.audio.playVictory();
      }
      if (ev.type === 'combat.end' && !ev.victory) {
        this.audio.playDefeat();
      }
      if (ev.type === 'faith.miracle') {
        this.faithMiraclePending = true;
        this.unlockAudio();
        this.audio.playFaithMiracle();
      }
      if (ev.type === 'item.acquired') {
        this.itemAcquireQueue.push(ev.itemId);
        this.unlockAudio();
        this.audio.playItemAcquire();
      }
      if (ev.type === 'statusHighlight') {
        this.statusHighlightQueue.push(ev);
      }
    });
    this.state = createInitialState(this.registry.data.campaign);
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

  private loadFontStep(): number {
    try {
      const raw = localStorage.getItem(this.fontKey);
      const n = raw != null ? parseInt(raw, 10) : 0;
      if (n === 1 || n === 2) return n;
      return 0;
    } catch {
      return 0;
    }
  }

  private saveFontStep(): void {
    try {
      localStorage.setItem(this.fontKey, String(this.fontStep));
    } catch {
      /* noop */
    }
  }

  private loadDevMode(): boolean {
    try {
      return localStorage.getItem(this.devModeKey) === '1';
    } catch {
      return false;
    }
  }

  private loadQuickNavMode(): boolean {
    try {
      return localStorage.getItem(this.quickNavKey) === '1';
    } catch {
      return false;
    }
  }

  private saveQuickNavMode(): void {
    try {
      localStorage.setItem(this.quickNavKey, this.quickNavMode ? '1' : '0');
    } catch {
      /* noop */
    }
  }

  private saveDevMode(): void {
    try {
      localStorage.setItem(this.devModeKey, this.devMode ? '1' : '0');
    } catch {
      /* noop */
    }
  }

  private cycleFontSize(): void {
    this.fontStep = (this.fontStep + 1) % 3;
    this.saveFontStep();
    this.closeMenu();
    this.render();
  }

  private exportSaveToClipboard(): void {
    this.unlockAudio();
    const json = serializeState(this.state);
    void navigator.clipboard.writeText(json).then(
      () => {
        alert('Gravação copiada para a área de transferência (JSON).');
        this.closeMenu();
      },
      () => {
        prompt('Copia manualmente o estado:', json);
        this.closeMenu();
      }
    );
  }

  private showCredits(): void {
    this.unlockAudio();
    const v = (pkg as { version?: string }).version ?? '?';
    alert(
      `${this.registry.data.campaign.name}\nYou Decide · v${v}\n\nMotor: TypeScript, Vite.\nTexto narrativo em Markdown.\n\nObrigado por jogar.`
    );
    this.closeMenu();
  }

  private loadSidebarSections(): Record<string, boolean> {
    try {
      const raw = sessionStorage.getItem(this.sidebarKey);
      if (!raw) return {};
      const o = JSON.parse(raw) as unknown;
      return typeof o === 'object' && o !== null ? (o as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  }

  private saveSidebarSections(): void {
    try {
      sessionStorage.setItem(this.sidebarKey, JSON.stringify(this.sidebarSections));
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
    const afterRoll: GameState = {
      ...r.state,
      visitedScenes: { ...r.state.visitedScenes, [scene.id]: true },
    };
    this.state = this.stabilize(afterRoll);
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
    if (!this.registry.ui.canWalk(mapId, x, y, nx, ny)) {
      this.audio.playBlocked();
      return;
    }
    let s: GameState = { ...this.state, asciiMap: { ...m, playerX: nx, playerY: ny } };
    this.audio.playUiClick();
    this.state = s;
    this.render();
  }

  private save(): void {
    this.unlockAudio();
    try {
      localStorage.setItem(this.saveKey, serializeState(this.state));
    } catch {
      /* noop */
    }
    this.closeMenu();
  }

  private load(): void {
    this.unlockAudio();
    try {
      const raw = localStorage.getItem(this.saveKey);
      if (!raw) return;
      const parsed = deserializeState(raw);
      if (parsed.campaignId !== this.campaignId) {
        alert(
          `Esta gravação é da campanha "${parsed.campaignId}". Campanha ativa: "${this.campaignId}".`
        );
        this.closeMenu();
        return;
      }
      this.state = parsed;
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
    const art = this.registry.ui.sceneArt;
    if (key && art[key]) return art[key];
    return undefined;
  }

  /** Acampamento da Vigília: troca de equipamento fora do combate. */
  private isCampEquipmentScene(): boolean {
    return this.state.sceneId.includes('vigilia_camp');
  }

  private inventoryEquipmentIdsForSlot(slot: 'weapon' | 'armor' | 'relic'): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const id of this.state.inventory) {
      const def = this.registry.data.items[id];
      if (!def || def.slot !== slot) continue;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    }
    return out;
  }

  private applyCampEquip(itemId: string): void {
    this.unlockAudio();
    this.audio.playUiClick();
    const s = applyEffects(this.state, [{ op: 'equipItem', itemId }], this.ctx());
    this.state = this.stabilize(s);
    this.render();
  }

  private appendCampEquipmentPanel(parent: HTMLElement): void {
    if (!this.isCampEquipmentScene() || !this.state.party[0]) return;

    const lead = this.state.party[0];
    const items = this.registry.data.items;

    const panel = document.createElement('div');
    panel.className = 'camp-equip-panel';
    const hdr = document.createElement('div');
    hdr.className = 'camp-equip-hdr camp-equip-hdr--with-icon';
    hdr.innerHTML = `${iconWrap(icons.equipment)}<span>Equipamento no acampamento</span>`;
    panel.appendChild(hdr);

    const slotDefs: { key: 'weapon' | 'armor' | 'relic'; label: string; cur: string | null }[] = [
      { key: 'weapon', label: 'Arma', cur: lead.weaponId },
      { key: 'armor', label: 'Armadura', cur: lead.armorId },
      { key: 'relic', label: 'Relíquia', cur: lead.relicId },
    ];
    const slotSvg: Record<'weapon' | 'armor' | 'relic', string> = {
      weapon: icons.weapon,
      armor: icons.armor,
      relic: icons.relic,
    };

    for (const { key, label, cur } of slotDefs) {
      const row = document.createElement('div');
      row.className = 'camp-equip-slot';
      const lab = document.createElement('div');
      lab.className = 'camp-equip-slot-label camp-equip-slot-label--with-icon';
      lab.innerHTML = `${iconWrap(slotSvg[key])}<span>${label}</span>`;
      row.appendChild(lab);

      const curEl = document.createElement('div');
      curEl.className = 'camp-equip-current';
      if (cur) {
        const def = items[cur];
        curEl.textContent = def?.name ?? cur;
      } else {
        curEl.classList.add('camp-equip-current--empty');
        curEl.textContent = '— vazio —';
      }
      row.appendChild(curEl);

      const candidates = this.inventoryEquipmentIdsForSlot(key);
      if (candidates.length === 0) {
        const hint = document.createElement('div');
        hint.className = 'camp-equip-hint';
        hint.textContent = 'Sem peças deste tipo no inventário.';
        row.appendChild(hint);
      } else {
        const actions = document.createElement('div');
        actions.className = 'camp-equip-actions';
        for (const itemId of candidates) {
          const def = items[itemId];
          if (!def) continue;
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'camp-equip-btn';
          btn.textContent = `Equipar ${def.name}`;
          btn.addEventListener('click', () => this.applyCampEquip(itemId));
          actions.appendChild(btn);
        }
        row.appendChild(actions);
      }
      panel.appendChild(row);
    }

    parent.appendChild(panel);
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
    frame.style.setProperty('--app-font-pct', `${100 + this.fontStep * 10}%`);

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

    const devRow = document.createElement('label');
    devRow.className = 'menu-item menu-sound menu-dev';
    const devCb = document.createElement('input');
    devCb.type = 'checkbox';
    devCb.checked = this.devMode;
    devCb.addEventListener('change', () => {
      this.devMode = devCb.checked;
      this.saveDevMode();
      this.closeMenu();
      this.render();
    });
    devRow.appendChild(devCb);
    devRow.appendChild(document.createTextNode(' Modo desenvolvedor'));

    const quickNavRow = document.createElement('label');
    quickNavRow.className = 'menu-item menu-sound menu-dev';
    const quickNavCb = document.createElement('input');
    quickNavCb.type = 'checkbox';
    quickNavCb.checked = this.quickNavMode;
    quickNavCb.addEventListener('change', () => {
      this.quickNavMode = quickNavCb.checked;
      this.saveQuickNavMode();
      this.closeMenu();
      this.render();
    });
    quickNavRow.appendChild(quickNavCb);
    quickNavRow.appendChild(document.createTextNode(' Navegação rápida (números clicáveis)'));

    const fontBtn = document.createElement('button');
    fontBtn.type = 'button';
    fontBtn.className = 'menu-item';
    fontBtn.textContent = `Tamanho do texto (${100 + this.fontStep * 10}%)`;
    fontBtn.addEventListener('click', () => this.cycleFontSize());

    const exportBtn = document.createElement('button');
    exportBtn.type = 'button';
    exportBtn.className = 'menu-item';
    exportBtn.textContent = 'Exportar gravação (JSON)';
    exportBtn.addEventListener('click', () => this.exportSaveToClipboard());

    const creditsBtn = document.createElement('button');
    creditsBtn.type = 'button';
    creditsBtn.className = 'menu-item';
    creditsBtn.textContent = 'Créditos';
    creditsBtn.addEventListener('click', () => this.showCredits());

    drawer.appendChild(saveBtn);
    drawer.appendChild(loadBtn);
    drawer.appendChild(exportBtn);
    drawer.appendChild(soundRow);
    drawer.appendChild(devRow);
    drawer.appendChild(quickNavRow);
    drawer.appendChild(fontBtn);
    drawer.appendChild(creditsBtn);
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
    if (this.state.lastCombatXpGain != null || this.state.lastCombatLevelUps != null) {
      this.state = {
        ...this.state,
        lastCombatXpGain: null,
        lastCombatLevelUps: null,
      };
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

  /**
   * Resumo compacto sob os dados: ataques = resultado vs CA + bônus;
   * dano/cura = totais com rótulos em português.
   */
  /** Ataque físico com dano: uma linha com resultado vs CA, bônus e dano. */
  private appendCombatLogMergedHitMeta(
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

  private appendCombatLogMeta(wrap: HTMLElement, entry: CombatLogEntry): void {
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

  /** Resumo mecânico do item (dano, armadura, atributos) para a secção Equipamento. */
  private formatItemEquipmentStatsHtml(it: ItemDef): string {
    const parts: string[] = [];
    if (it.damage !== 0) {
      parts.push(it.damage > 0 ? `Dano +${it.damage}` : `Dano ${it.damage}`);
    }
    if (it.armor !== 0) {
      parts.push(it.armor > 0 ? `Armadura +${it.armor}` : `Armadura ${it.armor}`);
    }
    const attrs: [keyof ItemDef, string][] = [
      ['bonusStr', 'STR'],
      ['bonusAgi', 'AGI'],
      ['bonusMind', 'MEN'],
      ['bonusLuck', 'SOR'],
    ];
    for (const [key, label] of attrs) {
      const v = it[key];
      if (typeof v !== 'number' || v === 0) continue;
      parts.push(`${label} ${v > 0 ? '+' : ''}${v}`);
    }
    if (it.cursed) parts.push('Amaldiçoado');
    if (parts.length === 0) return '';
    return `<span class="sidebar-equip-stats">${parts.map((s) => escHtml(s)).join(' · ')}</span>`;
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
    return `<div class="${cls}">CA <strong>${ca}</strong>${statBonusParen(caEq)} · STR <strong>${str}</strong>${statBonusParen(eq.str)} · AGI <strong>${agi}</strong>${statBonusParen(eq.agi)} · MEN <strong>${men}</strong>${statBonusParen(eq.mind)} · SOR <strong>${sor}</strong>${statBonusParen(eq.luck)}</div>`;
  }

  private inventoryMarkup(): string {
    const inv = this.state.inventory;
    if (!inv.length) {
      return `<div class="sidebar-line inventory-empty sidebar-line--with-icon">${iconWrap(icons.inventory)}<span>Nenhum item ainda.</span></div>`;
    }
    const counts = new Map<string, number>();
    for (const id of inv) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    const lines: string[] = [];
    for (const [id, n] of counts) {
      const def = this.registry.data.items[id];
      const label = def?.name ?? id;
      const suffix = n > 1 ? ` ×${n}` : '';
      lines.push(
        `<div class="sidebar-line sidebar-inventory-item sidebar-line--with-icon">${iconWrap(icons.item, 'ui-icon-wrap ui-icon-wrap--sm')}<span>${escHtml(label)}${escHtml(suffix)}</span></div>`
      );
    }
    return lines.join('');
  }

  /** Bloco lateral por companheiro (party[1..]). */
  private companionCardMarkup(c: Character): string {
    const cid = c.class as ClassId;
    const clsLabel = this.registry.ui.getHeroClassLabel(cid, c.path);
    const def = this.registry.data.companions[c.id];
    const lore = def?.lorePt;
    const openKey = `companion_lore_${c.id}`;
    const open = this.sidebarSections[openKey] ? ' open' : '';
    const loreHtml = lore
      ? lore
          .split('\n\n')
          .map((para) => `<p>${escHtml(para)}</p>`)
          .join('')
      : `<p class="sidebar-muted">Sem história gravada.</p>`;
    return `<div class="companion-sidebar-card">
      <div class="companion-sidebar-name">${escHtml(c.name)}</div>
      <div class="companion-sidebar-class">${escHtml(clsLabel)}</div>
      <div class="sidebar-line">HP <strong>${c.hp}</strong> / <strong>${c.maxHp}</strong></div>
      ${hpBarMarkup(c.hp, c.maxHp, 'hp-bar-resource', 'hp')}
      <div class="sidebar-line sidebar-stress-label">Stress <strong>${c.stress}</strong> / 4</div>
      ${stressBarMarkup(c.stress)}
      ${this.formatStatAttrsLineHtml(c, { compact: true })}
      <details class="sidebar-collapse companion-lore"${open} data-section="${openKey}">
        <summary class="sidebar-collapse-trigger">${collapseTriggerStart(icons.scroll, 'História')}</summary>
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
    <div class="sidebar-line faction-rep-label sidebar-line--with-icon">${iconWrap(icons.factions)}<span>${escHtml(label)} <strong>${value}</strong></span></div>
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
    const openEquip = this.sidebarSections['personagem_equip'] ? ' open' : '';
    const openMem = this.sidebarSections['memorias'] ? ' open' : '';

    const personagemBlock = (() => {
      if (!p) {
        return `<div class="sidebar-line">Escolha uma classe na narrativa.</div>
        <div class="sidebar-line">Nível <strong>${this.state.level}</strong> · XP <strong>${this.state.xp}</strong></div>`;
      }
      const cid = p.class as ClassId;
      const loreHtml = this.registry.ui.getHeroLore(cid, p.path)
        .split('\n\n')
        .map((para) => `<p>${escHtml(para)}</p>`)
        .join('');
      const lv = this.state.level;
      const need = lv >= MAX_LEVEL ? 0 : xpToNextLevel(lv);
      const xpLine =
        lv >= MAX_LEVEL
          ? `<div class="sidebar-line">Nível <strong>${lv}</strong> · <em>Máx.</em></div>`
          : `<div class="sidebar-line">Nível <strong>${lv}</strong> · XP <strong>${this.state.xp}</strong> / <strong>${need}</strong></div>
        ${hpBarMarkup(this.state.xp, need)}`;
      const buffHint =
        this.state.activeBuffs.length > 0
          ? `<div class="sidebar-line sidebar-buffs">${this.state.activeBuffs
              .map((b) => `${b.attr.toUpperCase()} ${b.delta >= 0 ? '+' : ''}${b.delta} (${b.remainingScenes} cena(s))`)
              .join(' · ')}</div>`
          : '';
      return `<div class="sidebar-line">Nome <strong>${escHtml(p.name)}</strong></div>
        <div class="sidebar-line sidebar-class-line">${escHtml(this.registry.ui.getHeroClassLabel(cid, p.path))}</div>
        ${xpLine}
        <div class="sidebar-line">HP <strong>${p.hp}/${p.maxHp}</strong></div>
        ${hpBarMarkup(p.hp, p.maxHp, 'hp-bar-resource', 'hp')}
        ${p.maxMana > 0 ? `<div class="sidebar-line">Mana <strong>${p.mana}</strong> / <strong>${p.maxMana}</strong></div>${manaBarMarkup(p.mana, p.maxMana)}` : ''}
        <div class="sidebar-line sidebar-stress-label">Stress <strong>${p.stress}</strong> / 4</div>
        ${stressBarMarkup(p.stress)}
        ${buffHint}
        ${this.formatStatAttrsLineHtml(p)}
        ${(() => {
          const d = this.registry.data.items;
          const slotIcon: Record<string, string> = {
            Arma: icons.weapon,
            Armadura: icons.armor,
            Relíquia: icons.relic,
          };
          const line = (label: string, id: string | null) => {
            const ic = slotIcon[label] ?? icons.equipment;
            if (!id) {
              return `<p class="sidebar-equip-line sidebar-equip-line--empty">${iconWrap(ic)}<span class="sidebar-muted"><strong>${label}</strong> — —</span></p>`;
            }
            const it = d[id];
            const name = it?.name ?? id;
            const stats = it ? this.formatItemEquipmentStatsHtml(it) : '';
            return `<p class="sidebar-equip-line">${iconWrap(ic)}<span><strong>${label}</strong> — ${escHtml(name)}${stats ? `<br>${stats}` : ''}</span></p>`;
          };
          const equipBody = `${line('Arma', p.weaponId)}${line('Armadura', p.armorId)}${line('Relíquia', p.relicId)}`;
          return `<details class="sidebar-collapse sidebar-equip"${openEquip} data-section="personagem_equip">
          <summary class="sidebar-collapse-trigger">${collapseTriggerStart(icons.equipment, 'Equipamento')}</summary>
          <div class="sidebar-collapse-body sidebar-lore-body">${equipBody}</div>
        </details>`;
        })()}
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
                      `<p class="sidebar-spell-line sidebar-line--with-icon"><span class="spell-emoji" aria-hidden="true">${spellEmoji(sp.id, sp)}</span><span><strong>${escHtml(sp.name)}</strong> — ${sp.manaCost} mana · ${sp.spellKind === 'damage' ? 'dano' : 'cura'} (${sp.base > 0 ? `${sp.base} + ` : ''}${sp.dice}d6 + Mente)</span></p>`
                  )
                  .join('');
          return `<details class="sidebar-collapse sidebar-spells"${openSpells} data-section="personagem_spells">
          <summary class="sidebar-collapse-trigger">${collapseTriggerStart(icons.spellbook, 'Magias aprendidas')}</summary>
          <div class="sidebar-collapse-body sidebar-lore-body">${body}</div>
        </details>`;
        })()}
        <details class="sidebar-collapse sidebar-lore"${openLore} data-section="personagem_lore">
          <summary class="sidebar-collapse-trigger">${collapseTriggerStart(icons.scroll, 'História do herói')}</summary>
          <div class="sidebar-collapse-body sidebar-lore-body">${loreHtml}</div>
        </details>`;
    })();

    hud.innerHTML = `
      <h2 class="sidebar-title">Herói</h2>
      <div class="sidebar-static">
        <div class="sidebar-static-title sidebar-static-title--with-icon">${iconWrap(icons.progress)}<span>Progresso</span></div>
        <div class="sidebar-static-body">
          <div class="sidebar-line sidebar-line--with-icon">${iconWrap(icons.progress)}<span>Capítulo <strong>${this.state.chapter}</strong></span></div>
          <div class="sidebar-line sidebar-line--with-icon">${iconWrap(icons.tier)}<span>Tier <strong>${this.state.narrativeTier}</strong></span></div>
        </div>
      </div>
      <div class="sidebar-static">
        <div class="sidebar-static-title sidebar-static-title--with-icon">${iconWrap(icons.person)}<span>Personagem</span></div>
        <div class="sidebar-static-body sidebar-stats">
          ${personagemBlock}
        </div>
      </div>
      <div class="sidebar-static">
        <div class="sidebar-static-title sidebar-static-title--with-icon">${iconWrap(icons.companions)}<span>Companheiros</span></div>
        <div class="sidebar-static-body sidebar-stats">
          ${this.companionsSectionMarkup()}
        </div>
      </div>
      <details class="sidebar-collapse"${openRec} data-section="recursos">
        <summary class="sidebar-collapse-trigger">${collapseTriggerStart(icons.resources, 'Recursos')}</summary>
        <div class="sidebar-collapse-body">
          <div class="sidebar-line sidebar-line--with-icon">${iconWrap(icons.gold)}<span>Gold <strong>${gold}</strong></span></div>
          <div class="sidebar-line sidebar-line--with-icon">${iconWrap(icons.supply)}<span>Suprimento <strong>${r.supply}</strong> <span class="sidebar-resource-hint">(mapa, acampamento)</span></span></div>
          <div class="sidebar-line sidebar-line--with-icon">${iconWrap(icons.faith)}<span>Fé <strong>${r.faith}</strong></span></div>
          ${this.state.extraLifeReady ? `<div class="sidebar-line sidebar-line--with-icon">${iconWrap(icons.tier)}<span>Vida extra <strong>disponível</strong> <span class="sidebar-resource-hint">(5 fé)</span></span></div>` : ''}
          <div class="sidebar-line sidebar-line--with-icon">${iconWrap(icons.corruption)}<span>Corrupção <strong>${r.corruption}</strong></span></div>
        </div>
      </details>
      <details class="sidebar-collapse"${openInv} data-section="inventario">
        <summary class="sidebar-collapse-trigger">${collapseTriggerStart(icons.inventory, 'Inventário')}</summary>
        <div class="sidebar-collapse-body sidebar-inventory">
          ${this.inventoryMarkup()}
        </div>
      </details>
      <details class="sidebar-collapse"${openFac} data-section="faccoes">
        <summary class="sidebar-collapse-trigger">${collapseTriggerStart(icons.factions, 'Facções')}</summary>
        <div class="sidebar-collapse-body sidebar-faccoes">
          ${this.repBarMarkup('Vigília', rep.vigilia, 'vigilia')}
          ${this.repBarMarkup('Círculo', rep.circulo, 'circulo')}
          ${this.repBarMarkup('Culto', rep.culto, 'culto')}
        </div>
      </details>
    `;

    const visitedIds = Object.keys(this.state.visitedScenes)
      .filter((k) => this.state.visitedScenes[k])
      .sort();
    if (this.devMode && visitedIds.length > 0) {
      const max = 48;
      const shown = visitedIds.slice(0, max);
      const rest = visitedIds.length - shown.length;
      const memHtml = shown.map((id) => `<div class="sidebar-line"><code>${escHtml(id)}</code></div>`).join('');
      const more =
        rest > 0 ? `<div class="sidebar-line sidebar-muted">… e mais ${rest} cena(s)</div>` : '';
      const mem = document.createElement('details');
      mem.className = 'sidebar-collapse';
      if (openMem) mem.setAttribute('open', '');
      mem.dataset.section = 'memorias';
      mem.innerHTML = `
        <summary class="sidebar-collapse-trigger">${collapseTriggerStart(icons.memories, 'Memórias (cenas visitadas)')}</summary>
        <div class="sidebar-collapse-body memories-list">${memHtml}${more}</div>
      `;
      hud.appendChild(mem);
    }

    if (this.state.diary.length) {
      const diary = document.createElement('details');
      diary.className = 'sidebar-collapse';
      if (openDiary) diary.setAttribute('open', '');
      diary.dataset.section = 'diario';
      diary.innerHTML = `
        <summary class="sidebar-collapse-trigger">${collapseTriggerStart(icons.diary, 'Diário')}</summary>
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

    if (this.devMode) {
      const bc = document.createElement('div');
      bc.className = 'breadcrumb';
      bc.textContent = `📁 campaigns/${this.campaignId}/scenes/${scene.id}.md`;
      inner.appendChild(bc);
    }

    if (this.faithMiraclePending) {
      const miracle = document.createElement('div');
      miracle.className = 'faith-miracle-banner';
      const kicker = document.createElement('div');
      kicker.className = 'faith-miracle-kicker';
      kicker.textContent = 'Intercessão';
      miracle.appendChild(kicker);
      const titleEl = document.createElement('div');
      titleEl.className = 'faith-miracle-title';
      titleEl.textContent = 'A fé recusa-te à morte.';
      miracle.appendChild(titleEl);
      const sub = document.createElement('div');
      sub.className = 'faith-miracle-subtitle';
      sub.textContent =
        'Algo em ti não cede — acordas ferido, mas de pé. Cinco medidas de convicção consumiram-se para te manter no mundo.';
      miracle.appendChild(sub);
      const btnM = document.createElement('button');
      btnM.type = 'button';
      btnM.className = 'faith-miracle-dismiss';
      btnM.textContent = 'Continuar';
      btnM.addEventListener('click', () => {
        this.faithMiraclePending = false;
        this.audio.playUiClick();
        this.render();
      });
      miracle.appendChild(btnM);
      inner.appendChild(miracle);
    }

    if (this.statusHighlightQueue.length > 0) {
      const wrap = document.createElement('div');
      wrap.className = 'status-highlight-stack';
      if (this.statusHighlightQueue.some((h) => h.variant === 'debuff')) {
        wrap.classList.add('status-highlight-stack--debuff');
      }
      for (const h of this.statusHighlightQueue) {
        const block = document.createElement('div');
        block.className = `status-highlight-banner status-highlight-banner--${h.variant}`;
        if (h.variant === 'debuff') {
          const kicker = document.createElement('div');
          kicker.className = 'status-highlight-debuff-kicker';
          kicker.textContent = 'Penalidade';
          block.appendChild(kicker);
        }
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
    const levelUps = this.state.lastCombatLevelUps;
    if ((xpGain != null && xpGain > 0) || (levelUps != null && levelUps.length > 0)) {
      const wrap = document.createElement('div');
      wrap.className =
        levelUps != null && levelUps.length > 0
          ? 'victory-progress-banner victory-progress-banner--level-up'
          : 'victory-progress-banner';
      if (xpGain != null && xpGain > 0) {
        const xpEl = document.createElement('div');
        xpEl.className = 'victory-xp-line';
        xpEl.textContent = `+${xpGain} XP ganhos nesta batalha.`;
        wrap.appendChild(xpEl);
      }
      if (levelUps != null && levelUps.length > 0) {
        this.unlockAudio();
        this.audio.playLevelUpCelebration();
        const hero = this.state.party[0];
        const kicker = document.createElement('div');
        kicker.className = 'level-up-kicker';
        kicker.textContent =
          levelUps.length === 1 ? 'Subiste de nível!' : `${levelUps.length} níveis de uma vez!`;
        wrap.appendChild(kicker);
        for (const step of levelUps) {
          const block = document.createElement('div');
          block.className = 'level-up-block';
          const title = document.createElement('div');
          title.className = 'level-up-title';
          title.textContent = hero ? `Nível ${step.level} — ${hero.name}` : `Nível ${step.level}`;
          block.appendChild(title);
          const attrs = document.createElement('div');
          attrs.className = 'level-up-attrs';
          attrs.textContent = formatLevelUpDeltaLine(step.deltas);
          block.appendChild(attrs);
          wrap.appendChild(block);
        }
      }
      inner.appendChild(wrap);
    }

    const h1 = document.createElement('h1');
    h1.textContent = scene.frontmatter.title ?? scene.id;
    inner.appendChild(h1);

    const artText = this.resolveArt(scene);
    if (artText) {
      const pre = document.createElement('pre');
      pre.className = 'scene-art';
      pre.textContent = artText;
      inner.appendChild(pre);
    }

    const body = document.createElement('div');
    body.className = 'story-body';
    body.innerHTML = renderSceneBody(scene.bodyRaw, this.state);
    inner.appendChild(body);

    if (this.state.asciiMap) {
      const rm = this.registry.ui.renderMap(
        this.state.asciiMap.mapId,
        this.state.asciiMap.playerX,
        this.state.asciiMap.playerY
      );
      if (rm) {
        const wrap = document.createElement('div');
        wrap.innerHTML = `<div class="map-hint sidebar-line--with-icon">${iconWrap(icons.map)}<span>Mapa (setas; −1 suprimento por passo)</span></div>`;
        const pre = document.createElement('pre');
        pre.className = 'ascii-map';
        pre.textContent = rm.lines.join('\n');
        wrap.appendChild(pre);
        inner.appendChild(wrap);
      }
    }

    this.appendCampEquipmentPanel(inner);

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
      const curse =
        lc.luckPenalty && lc.luckPenalty > 0 ? ` · maldição −${lc.luckPenalty}` : '';
      b.textContent = `Rolar sorte: ${lc.label ?? '2d6 + mod(SOR)'} vs TN ${lc.tn}${curse}`;
      b.addEventListener('click', () => this.onLuckRoll(scene));
      row.appendChild(b);
      inner.appendChild(row);
    }

    const choices = filterChoices(scene.frontmatter.choices, this.state);
    const chWrap = document.createElement('div');
    chWrap.className = 'choices';

    choices.forEach((ch, i) => {
      const runChoice = (): void => this.applyChoice(ch);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice';
      if (i < 9) btn.title = `Tecla ${i + 1}`;
      const labelText = this.quickNavMode ? `${i + 1} - ${ch.text}` : ch.text;
      btn.appendChild(document.createTextNode(labelText));
      if (ch.preview) {
        const span = document.createElement('span');
        span.className = 'preview';
        span.textContent = ch.preview;
        btn.appendChild(span);
      }
      btn.addEventListener('click', runChoice);
      chWrap.appendChild(btn);
    });
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

  /**
   * Entorno amarelo no painel do campo: último dano resolvido foi crítico
   * (ignora rodada / vitória / pânico após o golpe).
   */
  private combatLastResolvedDamageWasCrit(log: CombatLogEntry[]): boolean {
    let i = log.length - 1;
    while (i >= 0) {
      const e = log[i]!;
      if (e.kind === 'turn_banner') {
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
    if (this.combatLastResolvedDamageWasCrit(c.log)) {
      left.classList.add('combat-enemies-column--crit-damage');
    }
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

    const lead = this.state.party[0];

    const actionsPanel = document.createElement('div');
    actionsPanel.className = 'combat-actions-panel';
    const actionsHdr = document.createElement('div');
    actionsHdr.className = 'combat-actions-panel-hdr';
    actionsHdr.textContent = 'Ações';
    actionsPanel.appendChild(actionsHdr);

    if (c.phase === 'choose_stance' && lead) {
      if (this.state.party.length > 1) {
        const allyHint = document.createElement('div');
        allyHint.className = 'combat-allies-hint';
        allyHint.textContent =
          'Cada companheiro ataca em seguida (mesma postura), contra o primeiro inimigo vivo.';
        actionsPanel.appendChild(allyHint);
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
          this.state = this.stabilize(
            executePlayerTurn(this.state, st, this.registry.data, false, this.bus)
          );
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
          this.state = this.stabilize(
            executePlayerTurn(this.state, 'aggressive', this.registry.data, true, this.bus)
          );
          this.render();
        }
      });
      bar.appendChild(sp);
      actionsPanel.appendChild(bar);

      if (lead.maxMana > 0) {
        const spellBar = document.createElement('div');
        spellBar.className = 'combat-spell-bar';
        const spellHdr = document.createElement('div');
        spellHdr.className = 'combat-spell-hdr';
        spellHdr.textContent = 'Magias';
        spellBar.appendChild(spellHdr);
        const spells = this.registry.data.spells;
        for (const [spellId, spellDef] of Object.entries(spells)) {
          if (!this.state.knownSpells.includes(spellId)) continue;
          if (spellDef.classId !== 'any' && spellDef.classId !== lead.class) continue;
          if (this.state.level < spellDef.minLevel) continue;
          const btn = document.createElement('button');
          btn.className = 'combat-spell';
          btn.type = 'button';
          btn.innerHTML = `<span class="spell-emoji" aria-hidden="true">${spellEmoji(spellId, spellDef)}</span><span>${escHtml(spellDef.name)} (${spellDef.manaCost})</span>`;
          const castOk = canCastSpell(this.state, spellId, this.registry.data);
          btn.disabled = !castOk;
          btn.addEventListener('click', () => {
            if (!canCastSpell(this.state, spellId, this.registry.data)) return;
            this.unlockAudio();
            this.audio.playDice();
            this.state = this.stabilize(
              executeSpellTurn(this.state, spellId, this.registry.data, this.bus)
            );
            this.render();
          });
          spellBar.appendChild(btn);
        }
        actionsPanel.appendChild(spellBar);
      }

      const potionIds = [...new Set(this.state.inventory)].filter((id) => {
        const d = this.registry.data.items[id];
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
          const def = this.registry.data.items[itemId];
          if (!def) continue;
          const count = this.state.inventory.filter((x) => x === itemId).length;
          const btn = document.createElement('button');
          btn.className = 'combat-potion';
          btn.type = 'button';
          btn.textContent = count > 1 ? `${def.name} (${count})` : def.name;
          const ok = canUseCombatConsumable(this.state, itemId, this.registry.data);
          btn.disabled = !ok;
          btn.addEventListener('click', () => {
            if (!canUseCombatConsumable(this.state, itemId, this.registry.data)) return;
            this.unlockAudio();
            this.audio.playDice();
            this.state = this.stabilize(
              useCombatConsumable(this.state, itemId, this.registry.data, this.bus)
            );
            this.render();
          });
          potionBar.appendChild(btn);
        }
        actionsPanel.appendChild(potionBar);
      }
    }

    const flee = document.createElement('button');
    flee.className = 'combat-flee-btn';
    flee.textContent = 'Tentar fugir';
    flee.addEventListener('click', () => {
      this.unlockAudio();
      this.state = this.stabilize(fleeCombat(this.state, this.bus));
      this.render();
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

    const partyNames = new Set(this.state.party.map((x) => x.name));

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
        msg.textContent = attack.message;
        wrap.appendChild(msg);

        if (quaseCritico) {
          const qc = document.createElement('div');
          qc.className = 'combat-log-msg combat-log-msg--sub';
          qc.textContent = quaseCritico.message;
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

        this.appendCombatLogMergedHitMeta(wrap, attack, damage);
        logScroll.appendChild(wrap);
        continue;
      }

      const entry = item.entry;
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

      if (entry.dice?.length) {
        const pre = document.createElement('pre');
        pre.className = 'dice-ascii-block';
        pre.textContent = formatDiceAscii(entry.dice);
        wrap.appendChild(pre);
      }

      this.appendCombatLogMeta(wrap, entry);
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
}

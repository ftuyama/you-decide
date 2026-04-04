import { ContentRegistry } from '../content/registry';
import { createInitialState, deserializeState, serializeState } from '../engine/state';
import { EventBus, type GameEvent } from '../engine/eventBus';
import {
  enterScene,
  filterChoices,
  renderSceneBody,
  resolveLuckCheck,
  resolveDualAttrSkillCheck,
  resolveSkillCheck,
  type LoadedScene,
  type StoryDiceRollBreakdown,
} from '../engine/sceneRuntime';
import { applyEffects } from '../engine/effects';
import { tickActiveBuffs } from '../engine/leadStats';
import type {
  Choice,
  CombatLogEntry,
  Effect,
  GameState,
} from '../engine/schema';
import { migrateLegacyKnownSpells } from '../engine/spellsKnown';
import {
  canCastSpell,
  canUseCombatConsumable,
  executePlayerTurn,
  executeSpellTurn,
  fleeCombat,
  SACRIFICE_MIN_CORRUPTION,
  useCombatConsumable,
} from '../engine/combat';
import type { Stance } from '../engine/schema';
import { formatDiceAscii } from './diceAscii';
import {
  buildCombatLogDisplayItems,
  escHtml,
  fmtSignedMod,
  formatLevelUpDeltaLine,
  spellEmoji,
} from './gameAppUtils';
import { GameAudio, type AmbientTheme } from './sound';
import { iconWrap, icons } from './icons';
import { buildGameSidebar } from './gameAppSidebar';
import './styles.css';
import gameVersionRaw from '../../VERSION?raw';

const GAME_VERSION = gameVersionRaw.trim() || '?';

const SAVE_SLOT_COUNT = 3;

/** Atalhos no combate: 1–9, depois letras (ordem QWERTY). */
const COMBAT_QUICK_KEYS_AFTER_9 = 'qwertyuiopasdfghjklzxcvbnm';

function combatQuickKeyAt(index: number): string | null {
  if (index < 9) return String(index + 1);
  const j = index - 9;
  return j < COMBAT_QUICK_KEYS_AFTER_9.length ? COMBAT_QUICK_KEYS_AFTER_9[j]! : null;
}

export class GameApp {
  private readonly campaignId: string;
  /** Gravação única antiga (`{campaignId}_save_v1`) — migrada para o slot 1 na primeira execução. */
  private readonly legacySaveKey: string;
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
  /** Rola teste de perícia/sorte: estado só aplica após o overlay (dados já resolvidos no motor). */
  private pendingStoryDiceRoll: {
    nextState: GameState;
    breakdown: StoryDiceRollBreakdown;
  } | null = null;
  private diceRollIntervalTimer: ReturnType<typeof setInterval> | null = null;
  private diceRollEnterHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(root: HTMLElement, campaignId: string) {
    this.root = root;
    this.campaignId = campaignId;
    this.legacySaveKey = `${campaignId}_save_v1`;
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
      const el = e.target;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
        return;
      }
      if (e.key === ' ') {
        let btn: HTMLButtonElement | null = null;
        if (this.pendingStoryDiceRoll) {
          btn = this.root.querySelector<HTMLButtonElement>(
            '.story-dice-banner button[data-quick-nav-continue]:not([disabled])'
          );
        } else {
          btn = this.root.querySelector<HTMLButtonElement>(
            '.story-shell button[data-quick-nav-continue]:not([disabled])'
          );
        }
        if (btn) {
          e.preventDefault();
          btn.click();
        }
        return;
      }
      if (this.pendingStoryDiceRoll) return;
      if (this.state.mode === 'story') {
        if (!/^[1-9]$/.test(e.key)) return;
        const idx = parseInt(e.key, 10) - 1;
        const btns = this.root.querySelectorAll<HTMLButtonElement>(
          '.story-shell .skill-row .choice, .story-shell .choices .choice'
        );
        const btn = btns[idx];
        if (!btn || btn.disabled) return;
        e.preventDefault();
        btn.click();
        return;
      }
      if (this.state.mode === 'combat') {
        const k = e.key.length === 1 ? e.key.toLowerCase() : '';
        const isDigit = /^[1-9]$/.test(e.key);
        const isLetter = /^[a-z]$/.test(k);
        if (!isDigit && !isLetter) return;
        const targetKey = isDigit ? e.key : k;
        const btn = this.root.querySelector<HTMLButtonElement>(
          `.story-shell .combat-actions-panel button[data-quick-nav-combat="${targetKey}"]:not([disabled])`
        );
        if (!btn) return;
        e.preventDefault();
        btn.click();
      }
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
      if (ev.type === 'camp.rest') {
        this.unlockAudio();
        this.audio.playCampRest();
      }
      if (ev.type === 'statusHighlight') {
        this.statusHighlightQueue.push(ev);
      }
    });
    this.state = createInitialState(this.registry.data.campaign);
    this.state = this.stabilize(this.state);
    this.sidebarSections = this.loadSidebarSections();
    this.migrateLegacySaveIfNeeded();
    window.addEventListener('keydown', (e) => this.onMapKey(e));
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.menuOpen = false;
        this.closeMenu();
      }
    });
    document.addEventListener('fullscreenchange', () => {
      this.syncFullscreenCheckbox();
      this.syncAppFullscreenLayout();
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

  private isLocalhostHost(): boolean {
    const host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
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

  private importSaveFromClipboard(): void {
    this.unlockAudio();
    const applyRawSave = (raw: string): void => {
      const parsed = deserializeState(raw);
      if (parsed.campaignId !== this.campaignId) {
        alert(
          `Esta gravação é da campanha "${parsed.campaignId}". Campanha ativa: "${this.campaignId}".`
        );
        return;
      }
      this.state = this.stabilize(parsed);
      this.render();
      this.closeMenu();
    };
    void navigator.clipboard.readText().then(
      (raw) => {
        if (!raw?.trim()) {
          alert('Área de transferência vazia.');
          return;
        }
        try {
          applyRawSave(raw);
        } catch {
          alert('JSON inválido na área de transferência.');
        }
      },
      () => {
        const pasted = prompt('Cole aqui o JSON da gravação:');
        if (!pasted?.trim()) {
          this.closeMenu();
          return;
        }
        try {
          applyRawSave(pasted);
        } catch {
          alert('JSON inválido.');
        }
      }
    );
  }

  private showCredits(): void {
    this.unlockAudio();
    alert(
      `${this.registry.data.campaign.name}\nYou Decide · v${GAME_VERSION}\n\nMotor: TypeScript, Vite.\nTexto narrativo em Markdown.\n\nObrigado por jogar.`
    );
    this.closeMenu();
  }

  private loadSidebarSections(): Record<string, boolean> {
    const defaults: Record<string, boolean> = { recursos: true };
    try {
      const raw = sessionStorage.getItem(this.sidebarKey);
      if (!raw) return { ...defaults };
      const o = JSON.parse(raw) as unknown;
      if (typeof o !== 'object' || o === null) return { ...defaults };
      return { ...defaults, ...(o as Record<string, boolean>) };
    } catch {
      return { ...defaults };
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
    const sceneTheme = this.registry.getScene(this.state.sceneId)?.frontmatter.ambientTheme;
    if (sceneTheme) return sceneTheme;
    return 'explore';
  }

  private syncAmbientTheme(): void {
    if (this.audio.isMuted()) return;
    this.audio.setAmbientTheme(this.resolveAmbientTheme());
  }

  /** Paleta CSS (`html[data-theme]`) — ato 5 neve (escuro frio) / ato 6 vazio. */
  private resolveVisualTheme(): 'snow' | 'void' | null {
    if (this.state.chapter === 6 || this.state.sceneId.startsWith('act6/')) return 'void';
    if (this.state.chapter === 5 || this.state.sceneId.startsWith('act5/')) return 'snow';
    return null;
  }

  private syncVisualTheme(): void {
    const t = this.resolveVisualTheme();
    if (t == null) {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', t);
    }
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
    if (this.pendingStoryDiceRoll) return;
    this.unlockAudio();
    this.audio.playDice();
    const r = resolveSkillCheck(this.state, scene);
    if (!r.breakdown) return;
    this.pendingStoryDiceRoll = { nextState: r.state, breakdown: r.breakdown };
    this.render();
  }

  private onDualAttrSkillRoll(scene: LoadedScene): void {
    if (this.pendingStoryDiceRoll) return;
    this.unlockAudio();
    this.audio.playDice();
    const r = resolveDualAttrSkillCheck(this.state, scene);
    if (!r.breakdown) return;
    const afterRoll: GameState = {
      ...r.state,
      visitedScenes: { ...r.state.visitedScenes, [scene.id]: true },
    };
    this.pendingStoryDiceRoll = { nextState: afterRoll, breakdown: r.breakdown };
    this.render();
  }

  private onLuckRoll(scene: LoadedScene): void {
    if (this.pendingStoryDiceRoll) return;
    this.unlockAudio();
    this.audio.playDice();
    const r = resolveLuckCheck(this.state, scene, this.registry.data);
    if (!r.breakdown) return;
    const afterRoll: GameState = {
      ...r.state,
      visitedScenes: { ...r.state.visitedScenes, [scene.id]: true },
    };
    this.pendingStoryDiceRoll = { nextState: afterRoll, breakdown: r.breakdown };
    this.render();
  }

  private clearDiceRollTimers(): void {
    if (this.diceRollIntervalTimer != null) {
      clearInterval(this.diceRollIntervalTimer);
      this.diceRollIntervalTimer = null;
    }
    if (this.diceRollEnterHandler) {
      window.removeEventListener('keydown', this.diceRollEnterHandler);
      this.diceRollEnterHandler = null;
    }
  }

  /** Banner no topo da história (como penalidade / item adquirido), não overlay em ecrã inteiro. */
  private appendStoryDiceRollBanner(inner: HTMLElement): void {
    const pending = this.pendingStoryDiceRoll;
    if (!pending) return;
    const { nextState, breakdown } = pending;

    const wrap = document.createElement('div');
    wrap.className = 'story-dice-banner';

    const panel = document.createElement('div');
    panel.className = 'story-dice-banner-panel';
    panel.setAttribute('role', 'region');
    panel.setAttribute(
      'aria-label',
      breakdown.kind === 'skill'
        ? 'Resultado do teste de perícia'
        : breakdown.kind === 'dualSkill'
          ? 'Resultado da prova tríplice'
          : 'Resultado do teste de sorte'
    );

    const kicker = document.createElement('div');
    kicker.className = 'story-dice-banner-kicker';
    kicker.textContent =
      breakdown.kind === 'skill'
        ? `Teste de perícia (${breakdown.attr.toUpperCase()})`
        : breakdown.kind === 'dualSkill'
          ? `Prova tríplice (${breakdown.attrs[0].toUpperCase()} + ${breakdown.attrs[1].toUpperCase()})`
          : 'Teste de sorte';
    panel.appendChild(kicker);

    const pre = document.createElement('pre');
    pre.className = 'dice-ascii-block story-dice-pre story-dice-pre--rolling';
    pre.textContent = formatDiceAscii([3, 4]);
    panel.appendChild(pre);

    const resultRegion = document.createElement('div');
    resultRegion.className = 'story-dice-result';
    resultRegion.setAttribute('aria-live', 'polite');
    resultRegion.setAttribute('aria-atomic', 'true');
    resultRegion.hidden = true;
    panel.appendChild(resultRegion);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'story-dice-banner-dismiss';
    btn.dataset.quickNavContinue = '';
    btn.title = 'Barra de espaço';
    btn.textContent = this.quickNavMode ? '[Espaço] — Continuar' : 'Continuar';
    btn.disabled = true;
    panel.appendChild(btn);

    wrap.appendChild(panel);
    inner.appendChild(wrap);

    const dismiss = (): void => {
      this.clearDiceRollTimers();
      this.pendingStoryDiceRoll = null;
      this.state = this.stabilize(nextState);
      this.audio.playUiClick();
      this.render();
    };

    const finishReveal = (): void => {
      const dPair =
        breakdown.kind === 'dualSkill'
          ? (() => {
              const last = breakdown.rounds[breakdown.rounds.length - 1];
              return last ? [last.d1, last.d2] : [1, 1];
            })()
          : [breakdown.d1, breakdown.d2];
      pre.textContent = formatDiceAscii(dPair);
      pre.classList.remove('story-dice-pre--rolling');
      panel.classList.add(
        breakdown.success ? 'story-dice-banner-panel--success' : 'story-dice-banner-panel--fail'
      );
      if (breakdown.success) this.audio.playCheckSuccess();
      else this.audio.playCheckFail();
      resultRegion.hidden = false;
      resultRegion.textContent = breakdown.rollLog;
      btn.disabled = false;
      btn.focus();

      const onEnter = (e: KeyboardEvent): void => {
        if (e.key !== 'Enter' || btn.disabled) return;
        e.preventDefault();
        dismiss();
      };
      this.diceRollEnterHandler = onEnter;
      window.addEventListener('keydown', onEnter);
    };

    let ticks = 0;
    const maxTicks = 10;
    this.diceRollIntervalTimer = setInterval(() => {
      ticks += 1;
      const r1 = Math.floor(Math.random() * 6) + 1;
      const r2 = Math.floor(Math.random() * 6) + 1;
      pre.textContent = formatDiceAscii([r1, r2]);
      if (ticks >= maxTicks) {
        if (this.diceRollIntervalTimer != null) {
          clearInterval(this.diceRollIntervalTimer);
          this.diceRollIntervalTimer = null;
        }
        finishReveal();
      }
    }, 80);

    btn.addEventListener('click', () => dismiss());
  }

  private onMapKey(e: KeyboardEvent): void {
    if (this.pendingStoryDiceRoll) return;
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

  private slotStorageKey(slot: number): string {
    return `${this.campaignId}_save_v1_s${slot}`;
  }

  /** Copia a gravação legada para o slot 1 se o slot 1 ainda estiver vazio. */
  private migrateLegacySaveIfNeeded(): void {
    try {
      const legacy = localStorage.getItem(this.legacySaveKey);
      if (!legacy?.trim()) return;
      const s1 = localStorage.getItem(this.slotStorageKey(1));
      if (s1?.trim()) return;
      localStorage.setItem(this.slotStorageKey(1), legacy);
      localStorage.removeItem(this.legacySaveKey);
    } catch {
      /* noop */
    }
  }

  private readRawSlot(slot: number): string | null {
    if (slot < 1 || slot > SAVE_SLOT_COUNT) return null;
    try {
      return localStorage.getItem(this.slotStorageKey(slot));
    } catch {
      return null;
    }
  }

  private slotPreviewLines(slot: number): { line1: string; line2?: string } {
    const raw = this.readRawSlot(slot);
    if (!raw?.trim()) return { line1: 'Vazio' };
    try {
      const s = deserializeState(raw);
      if (s.campaignId !== this.campaignId) return { line1: 'Outra campanha' };
      const sceneShort = s.sceneId.length > 28 ? `${s.sceneId.slice(0, 25)}…` : s.sceneId;
      return {
        line1: `Cap. ${s.chapter} · ${s.playerName}`,
        line2: sceneShort,
      };
    } catch {
      return { line1: 'Gravação inválida' };
    }
  }

  private saveToSlot(slot: number): void {
    this.unlockAudio();
    if (slot < 1 || slot > SAVE_SLOT_COUNT) return;
    try {
      localStorage.setItem(this.slotStorageKey(slot), serializeState(this.state));
    } catch {
      /* noop */
    }
    this.closeMenu();
    this.render();
  }

  private loadFromSlot(slot: number): void {
    this.unlockAudio();
    if (slot < 1 || slot > SAVE_SLOT_COUNT) return;
    try {
      const raw = this.readRawSlot(slot);
      if (!raw?.trim()) {
        alert('Este slot está vazio.');
        return;
      }
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
      alert('Não foi possível carregar esta gravação.');
    }
    this.closeMenu();
  }

  private buildMenuSaveSlot(slot: number): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'menu-save-slot';

    const info = document.createElement('div');
    info.className = 'menu-save-slot-info';
    const titleEl = document.createElement('div');
    titleEl.className = 'menu-save-slot-title';
    titleEl.textContent = `Slot ${slot}`;
    const meta = document.createElement('div');
    meta.className = 'menu-save-slot-meta';
    const lines = this.slotPreviewLines(slot);
    const line1El = document.createElement('div');
    line1El.className = 'menu-save-slot-meta-line';
    line1El.textContent = lines.line1;
    meta.appendChild(line1El);
    if (lines.line2 !== undefined) {
      const line2El = document.createElement('div');
      line2El.className = 'menu-save-slot-meta-line menu-save-slot-meta-line--scene';
      line2El.textContent = lines.line2;
      meta.appendChild(line2El);
    }
    meta.title =
      lines.line2 !== undefined ? `${lines.line1}\n${lines.line2}` : lines.line1;
    info.appendChild(titleEl);
    info.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'menu-save-slot-actions';

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'menu-item menu-save-slot-btn';
    saveBtn.textContent = 'Salvar';
    saveBtn.addEventListener('click', () => this.saveToSlot(slot));

    const loadBtn = document.createElement('button');
    loadBtn.type = 'button';
    loadBtn.className = 'menu-item menu-save-slot-btn';
    const raw = this.readRawSlot(slot);
    const hasSave = raw != null && raw.trim().length > 0;
    loadBtn.disabled = !hasSave;
    if (!hasSave) loadBtn.classList.add('menu-save-slot-btn--disabled');
    loadBtn.textContent = 'Carregar';
    loadBtn.addEventListener('click', () => {
      if (!hasSave) return;
      this.loadFromSlot(slot);
    });

    actions.appendChild(saveBtn);
    actions.appendChild(loadBtn);
    wrap.appendChild(info);
    wrap.appendChild(actions);
    return wrap;
  }

  private closeMenu(): void {
    this.menuOpen = false;
    this.syncMenuScrollLock();
    const drawer = this.root.querySelector('.menu-drawer');
    const backdrop = this.root.querySelector('.menu-backdrop');
    drawer?.classList.remove('open');
    backdrop?.classList.remove('open');
  }

  private syncMenuScrollLock(): void {
    const lock = this.menuOpen;
    document.body.style.overflow = lock ? 'hidden' : '';
    document.documentElement.style.overflow = lock ? 'hidden' : '';
  }

  private toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
    this.syncMenuScrollLock();
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

  private getFullscreenElement(): Element | null {
    const doc = document as Document & { webkitFullscreenElement?: Element | null };
    return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
  }

  private isFullscreenSupported(): boolean {
    const el = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
    };
    return typeof el.requestFullscreen === 'function' || typeof el.webkitRequestFullscreen === 'function';
  }

  private syncFullscreenCheckbox(): void {
    const cb = this.root.querySelector<HTMLInputElement>('[data-menu-fullscreen-cb]');
    if (cb) cb.checked = this.getFullscreenElement() != null;
  }

  private syncAppFullscreenLayout(): void {
    this.root.classList.toggle('app-fullscreen', this.getFullscreenElement() != null);
  }

  private async requestGameFullscreen(): Promise<void> {
    const el = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
    };
    if (typeof el.requestFullscreen === 'function') {
      await el.requestFullscreen();
      return;
    }
    if (typeof el.webkitRequestFullscreen === 'function') {
      await el.webkitRequestFullscreen();
    }
  }

  private async exitGameFullscreen(): Promise<void> {
    const doc = document as Document & { webkitExitFullscreen?: () => Promise<void> };
    if (typeof document.exitFullscreen === 'function') {
      await document.exitFullscreen();
      return;
    }
    if (typeof doc.webkitExitFullscreen === 'function') {
      await doc.webkitExitFullscreen();
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

  /** Acampamentos/cenas de gestão: troca de equipamento fora do combate. */
  private isCampEquipmentScene(): boolean {
    const campEquipmentScenes = new Set([
      'act2/manage_equip',
      'act5/manage_equip',
      'act6/manage_equip',
    ]);
    return campEquipmentScenes.has(this.state.sceneId);
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

  private applyCampEquip(itemId: string, partyIndex: number): void {
    this.unlockAudio();
    this.audio.playUiClick();
    const eff: Effect = { op: 'equipItem', itemId, partyIndex };
    const s = applyEffects(this.state, [eff], this.ctx());
    this.state = this.stabilize(s);
    this.render();
  }

  private applyCampUnequip(slot: 'weapon' | 'armor' | 'relic', partyIndex: number): void {
    this.unlockAudio();
    this.audio.playUiClick();
    const eff: Effect = { op: 'unequipSlot', slot, partyIndex };
    const s = applyEffects(this.state, [eff], this.ctx());
    this.state = this.stabilize(s);
    this.render();
  }

  private appendCampEquipmentPanel(parent: HTMLElement): void {
    if (!this.isCampEquipmentScene() || this.state.party.length === 0) return;

    const items = this.registry.data.items;

    const panel = document.createElement('div');
    panel.className = 'camp-equip-panel';
    const hdr = document.createElement('div');
    hdr.className = 'camp-equip-hdr camp-equip-hdr--with-icon';
    hdr.innerHTML = `${iconWrap(icons.equipment)}<span>Equipamento no acampamento</span>`;
    panel.appendChild(hdr);

    const slotSvg: Record<'weapon' | 'armor' | 'relic', string> = {
      weapon: icons.weapon,
      armor: icons.armor,
      relic: icons.relic,
    };

    for (let partyIndex = 0; partyIndex < this.state.party.length; partyIndex++) {
      const member = this.state.party[partyIndex]!;
      const memberWrap = document.createElement('div');
      memberWrap.className = 'camp-equip-member';
      const nameEl = document.createElement('div');
      nameEl.className = 'camp-equip-member-name';
      nameEl.textContent = member.name;
      memberWrap.appendChild(nameEl);

      const slotDefs: { key: 'weapon' | 'armor' | 'relic'; label: string; cur: string | null }[] = [
        { key: 'weapon', label: 'Arma', cur: member.weaponId },
        { key: 'armor', label: 'Armadura', cur: member.armorId },
        { key: 'relic', label: 'Relíquia', cur: member.relicId },
      ];

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

        if (cur) {
          const unequipWrap = document.createElement('div');
          unequipWrap.className = 'camp-equip-unequip';
          const unequipBtn = document.createElement('button');
          unequipBtn.type = 'button';
          unequipBtn.className = 'camp-equip-btn camp-equip-btn--unequip';
          unequipBtn.textContent = 'Retirar ao inventário';
          const pi = partyIndex;
          const sk = key;
          unequipBtn.addEventListener('click', () => this.applyCampUnequip(sk, pi));
          unequipWrap.appendChild(unequipBtn);
          row.appendChild(unequipWrap);
        }

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
            const pi = partyIndex;
            btn.addEventListener('click', () => this.applyCampEquip(itemId, pi));
            actions.appendChild(btn);
          }
          row.appendChild(actions);
        }
        memberWrap.appendChild(row);
      }

      panel.appendChild(memberWrap);
    }

    parent.appendChild(panel);
  }

  private render(): void {
    if (this.timedTimer) {
      clearTimeout(this.timedTimer);
      this.timedTimer = null;
    }
    this.clearDiceRollTimers();
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
    const drawerScroll = document.createElement('div');
    drawerScroll.className = 'menu-drawer-scroll';
    const createMenuSection = (titleText: string): HTMLDivElement => {
      const section = document.createElement('section');
      section.className = 'menu-section';
      const titleEl = document.createElement('h3');
      titleEl.className = 'menu-section-title';
      titleEl.textContent = titleText;
      const body = document.createElement('div');
      body.className = 'menu-section-body';
      section.appendChild(titleEl);
      section.appendChild(body);
      drawerScroll.appendChild(section);
      return body;
    };

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

    const volumeRow = document.createElement('div');
    volumeRow.className = 'menu-item menu-volume';
    const volumeLabelRow = document.createElement('div');
    volumeLabelRow.className = 'menu-volume-label';
    const volumeLabel = document.createElement('label');
    volumeLabel.htmlFor = 'menu-volume-range';
    volumeLabel.textContent = 'Volume';
    const volumeValue = document.createElement('span');
    volumeValue.className = 'menu-volume-value';
    const volumeRange = document.createElement('input');
    volumeRange.type = 'range';
    volumeRange.min = '0';
    volumeRange.max = '100';
    volumeRange.step = '1';
    volumeRange.id = 'menu-volume-range';
    const syncVolumeUi = (): void => {
      const pct = Math.round(this.audio.getVolume() * 100);
      volumeRange.value = String(pct);
      volumeValue.textContent = `${pct}%`;
      volumeRange.setAttribute('aria-valuetext', `${pct}%`);
    };
    syncVolumeUi();
    volumeRange.addEventListener('input', () => {
      this.audio.setVolume(Number(volumeRange.value) / 100);
      volumeValue.textContent = `${volumeRange.value}%`;
      volumeRange.setAttribute('aria-valuetext', `${volumeRange.value}%`);
    });
    volumeLabelRow.appendChild(volumeLabel);
    volumeLabelRow.appendChild(volumeValue);
    volumeRow.appendChild(volumeLabelRow);
    volumeRow.appendChild(volumeRange);

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

    const fullscreenSupported = this.isFullscreenSupported();
    const fullscreenRow = document.createElement('label');
    fullscreenRow.className = 'menu-item menu-sound';
    if (!fullscreenSupported) {
      fullscreenRow.classList.add('menu-sound--disabled');
      fullscreenRow.title = 'Ecrã inteiro não está disponível neste navegador.';
    }
    const fullscreenCb = document.createElement('input');
    fullscreenCb.type = 'checkbox';
    fullscreenCb.dataset.menuFullscreenCb = '';
    fullscreenCb.checked = this.getFullscreenElement() != null;
    fullscreenCb.disabled = !fullscreenSupported;
    fullscreenCb.addEventListener('change', () => {
      if (!fullscreenSupported) return;
      const goFullscreen = fullscreenCb.checked;
      void (async () => {
        try {
          if (goFullscreen) {
            await this.requestGameFullscreen();
          } else {
            await this.exitGameFullscreen();
          }
        } catch {
          fullscreenCb.checked = this.getFullscreenElement() != null;
        }
      })();
    });
    fullscreenRow.appendChild(fullscreenCb);
    fullscreenRow.appendChild(document.createTextNode(' Ecrã inteiro'));

    const exportBtn = document.createElement('button');
    exportBtn.type = 'button';
    exportBtn.className = 'menu-item';
    exportBtn.textContent = 'Exportar gravação (JSON)';
    exportBtn.addEventListener('click', () => this.exportSaveToClipboard());

    const importBtn = document.createElement('button');
    importBtn.type = 'button';
    importBtn.className = 'menu-item';
    importBtn.textContent = 'Importar gravação (clipboard)';
    importBtn.addEventListener('click', () => this.importSaveFromClipboard());

    const creditsBtn = document.createElement('button');
    creditsBtn.type = 'button';
    creditsBtn.className = 'menu-item';
    creditsBtn.textContent = 'Créditos';
    creditsBtn.addEventListener('click', () => this.showCredits());

    const versionLabel = document.createElement('div');
    versionLabel.className = 'menu-version';
    versionLabel.textContent = `You Decide v${GAME_VERSION}`;

    const saveSection = createMenuSection('Partida');
    for (let s = 1; s <= SAVE_SLOT_COUNT; s++) {
      saveSection.appendChild(this.buildMenuSaveSlot(s));
    }
    if (this.devMode) {
      saveSection.appendChild(importBtn);
    }
    saveSection.appendChild(exportBtn);

    const settingsSection = createMenuSection('Configurações');
    settingsSection.appendChild(soundRow);
    settingsSection.appendChild(volumeRow);
    settingsSection.appendChild(fontBtn);
    settingsSection.appendChild(fullscreenRow);
    settingsSection.appendChild(quickNavRow);
    if (this.isLocalhostHost()) {
      settingsSection.appendChild(devRow);
    }

    const aboutSection = createMenuSection('Sobre');
    aboutSection.appendChild(creditsBtn);

    const footer = document.createElement('div');
    footer.className = 'menu-drawer-footer';
    footer.appendChild(versionLabel);
    drawer.appendChild(drawerScroll);
    drawer.appendChild(footer);
    frame.appendChild(drawer);

    const bodyRow = document.createElement('div');
    bodyRow.className = 'app-body';

    const sidebar = document.createElement('aside');
    sidebar.className = 'player-sidebar';
    sidebar.appendChild(
      buildGameSidebar({
        state: this.state,
        registry: this.registry,
        sidebarSections: this.sidebarSections,
        devMode: this.devMode,
        onSectionToggle: (key, open) => {
          this.sidebarSections[key] = open;
          this.saveSidebarSections();
        },
      })
    );

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
    if (
      this.state.lastCombatXpGain != null ||
      this.state.lastCombatLevelUps != null ||
      this.state.lastCombatLootLines != null
    ) {
      this.state = {
        ...this.state,
        lastCombatXpGain: null,
        lastCombatLevelUps: null,
        lastCombatLootLines: null,
      };
    }
    this.syncAmbientTheme();
    this.syncAppFullscreenLayout();
    this.syncVisualTheme();
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

  private static escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private appendCombatLogMessageWithBoldNames(
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
      `(${sorted.map((name) => GameApp.escapeRegExp(name)).join('|')})`,
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

  private renderStoryInto(shell: HTMLElement, scene: LoadedScene): void {
    const inner = document.createElement('div');
    inner.className = 'shell';

    if (this.devMode) {
      const bc = document.createElement('div');
      bc.className = 'breadcrumb';
      bc.textContent = `📁 campaigns/${this.campaignId}/scenes/${scene.id}.md`;
      inner.appendChild(bc);
    }

    if (this.pendingStoryDiceRoll) {
      this.appendStoryDiceRollBanner(inner);
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
      btnM.dataset.quickNavContinue = '';
      btnM.title = 'Barra de espaço';
      btnM.textContent = this.quickNavMode ? '[Espaço] — Continuar' : 'Continuar';
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
      btn.dataset.quickNavContinue = '';
      btn.title = 'Barra de espaço';
      btn.textContent = this.quickNavMode ? '[Espaço] — Continuar' : 'Continuar';
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
      btn.dataset.quickNavContinue = '';
      btn.title = 'Barra de espaço';
      btn.textContent = this.quickNavMode ? '[Espaço] — Continuar' : 'Continuar';
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
    const lootLines = this.state.lastCombatLootLines;
    const hasLootLines = lootLines != null && lootLines.length > 0;
    if (
      (xpGain != null && xpGain > 0) ||
      (levelUps != null && levelUps.length > 0) ||
      hasLootLines
    ) {
      const wrap = document.createElement('div');
      wrap.className =
        levelUps != null && levelUps.length > 0
          ? 'victory-progress-banner victory-progress-banner--level-up'
          : 'victory-progress-banner';
      if ((xpGain != null && xpGain > 0) || hasLootLines) {
        const rewardsWrap = document.createElement('div');
        rewardsWrap.className = 'victory-combat-rewards';
        if (xpGain != null && xpGain > 0) {
          const xpEl = document.createElement('div');
          xpEl.className = 'victory-xp-line';
          xpEl.textContent = `+${xpGain} XP ganhos nesta batalha.`;
          rewardsWrap.appendChild(xpEl);
        }
        if (hasLootLines) {
          for (const line of lootLines) {
            const lootEl = document.createElement('div');
            lootEl.className = 'victory-loot-line';
            lootEl.textContent = line;
            rewardsWrap.appendChild(lootEl);
          }
        }
        wrap.appendChild(rewardsWrap);
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

    let storyNavIndex = 0;

    if (scene.frontmatter.skillCheck) {
      storyNavIndex += 1;
      const row = document.createElement('div');
      row.className = 'skill-row';
      const b = document.createElement('button');
      b.className = 'choice';
      const base = `Rolar teste: ${scene.frontmatter.skillCheck.label ?? scene.frontmatter.skillCheck.attr} (2d6)`;
      b.textContent = this.quickNavMode ? `${storyNavIndex} - ${base}` : base;
      if (storyNavIndex < 10) b.title = `Tecla ${storyNavIndex}`;
      b.addEventListener('click', () => this.onSkillRoll(scene));
      row.appendChild(b);
      inner.appendChild(row);
    }

    if (scene.frontmatter.dualAttrSkillCheck) {
      storyNavIndex += 1;
      const row = document.createElement('div');
      row.className = 'skill-row';
      const b = document.createElement('button');
      b.className = 'choice';
      const dc = scene.frontmatter.dualAttrSkillCheck;
      const lbl =
        dc.label ??
        `${dc.attrs[0].toUpperCase()} + ${dc.attrs[1].toUpperCase()} · ${dc.rounds} lançamentos`;
      const base = `Rolar prova tríplice: ${lbl} (2d6 + dois mods vs TN ${dc.tn})`;
      b.textContent = this.quickNavMode ? `${storyNavIndex} - ${base}` : base;
      if (storyNavIndex < 10) b.title = `Tecla ${storyNavIndex}`;
      b.addEventListener('click', () => this.onDualAttrSkillRoll(scene));
      row.appendChild(b);
      inner.appendChild(row);
    }

    if (scene.frontmatter.luckCheck) {
      storyNavIndex += 1;
      const row = document.createElement('div');
      row.className = 'skill-row';
      const b = document.createElement('button');
      b.className = 'choice';
      const lc = scene.frontmatter.luckCheck;
      const curse =
        lc.luckPenalty && lc.luckPenalty > 0 ? ` · maldição −${lc.luckPenalty}` : '';
      const base = `Rolar sorte: ${lc.label ?? '2d6 + mod(SOR)'} vs TN ${lc.tn}${curse}`;
      b.textContent = this.quickNavMode ? `${storyNavIndex} - ${base}` : base;
      if (storyNavIndex < 10) b.title = `Tecla ${storyNavIndex}`;
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
      const navNum = storyNavIndex + i + 1;
      if (navNum < 10) btn.title = `Tecla ${navNum}`;
      const labelText = this.quickNavMode ? `${navNum} - ${ch.text}` : ch.text;
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
      const hpPct = Math.max(0, Math.min(100, Math.round((inst.hp / inst.maxHp) * 100)));
      panel.innerHTML = `<div class="enemy-panel-header"><strong>${def.name}</strong><span class="enemy-hp-text">${inst.hp}/${inst.maxHp}</span></div>
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
      left.appendChild(panel);
    }

    const lead = this.state.party[0];

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
      setLabel(key, this.quickNavMode);
    };

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
        decorateCombatQuickNav(btn, (key, quickLabel) => {
          btn.textContent = quickLabel && key != null ? `${key} - ${labels[st]}` : labels[st];
        });
        btn.addEventListener('click', () => {
          this.unlockAudio();
          this.audio.playDice();
          this.state = this.stabilize(
            executePlayerTurn(this.state, st, this.registry.data, false, false, this.bus)
          );
          this.render();
        });
        bar.appendChild(btn);
      }
      const canSacrificeChoice =
        this.state.flags.act6_void_pact && this.state.resources.corruption >= SACRIFICE_MIN_CORRUPTION;
      if (canSacrificeChoice) {
        const sacrifice = document.createElement('button');
        sacrifice.className = 'stance special';
        decorateCombatQuickNav(sacrifice, (key, quickLabel) => {
          const corr = this.state.resources.corruption;
          const base = `Selo do Vazio (Corr ${corr})`;
          sacrifice.textContent = quickLabel && key != null ? `${key} - ${base}` : base;
        });
        sacrifice.disabled = lead.hp <= 1;
        sacrifice.addEventListener('click', () => {
          if (lead.hp <= 1) return;
          this.unlockAudio();
          this.audio.playDice();
          this.state = this.stabilize(
            executePlayerTurn(this.state, 'aggressive', this.registry.data, false, true, this.bus)
          );
          this.render();
        });
        bar.appendChild(sacrifice);
      }
      const sp = document.createElement('button');
      sp.className = 'stance special';
      decorateCombatQuickNav(sp, (key, quickLabel) => {
        const base = lead.specialUsedThisCombat ? 'Especial já usado' : 'Golpe especial (+2, +Stress)';
        sp.textContent = quickLabel && key != null ? `${key} - ${base}` : base;
      });
      sp.disabled = lead.specialUsedThisCombat;
      sp.addEventListener('click', () => {
        if (!lead.specialUsedThisCombat) {
          this.unlockAudio();
          this.audio.playDice();
          this.state = this.stabilize(
            executePlayerTurn(this.state, 'aggressive', this.registry.data, true, false, this.bus)
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
          decorateCombatQuickNav(btn, (key, quickLabel) => {
            const name =
              quickLabel && key != null
                ? `${key} - ${spellDef.name} (${spellDef.manaCost})`
                : `${spellDef.name} (${spellDef.manaCost})`;
            btn.innerHTML = `<span class="spell-emoji" aria-hidden="true">${spellEmoji(spellId, spellDef)}</span><span>${escHtml(name)}</span>`;
          });
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
          decorateCombatQuickNav(btn, (key, quickLabel) => {
            const base = count > 1 ? `${def.name} (${count})` : def.name;
            btn.textContent = quickLabel && key != null ? `${key} - ${base}` : base;
          });
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
    decorateCombatQuickNav(flee, (key, quickLabel) => {
      flee.textContent = quickLabel && key != null ? `${key} - Tentar fugir` : 'Tentar fugir';
    });
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
    const combatantNames = [
      ...this.state.party.map((member) => member.name),
      ...c.enemies
        .map((enemy) => this.registry.data.enemies[enemy.defId]?.name)
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
        this.appendCombatLogMessageWithBoldNames(msg, attack.message, combatantNames);
        wrap.appendChild(msg);

        if (quaseCritico) {
          const qc = document.createElement('div');
          qc.className = 'combat-log-msg combat-log-msg--sub';
          this.appendCombatLogMessageWithBoldNames(qc, quaseCritico.message, combatantNames);
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
      this.appendCombatLogMessageWithBoldNames(msg, entry.message, combatantNames);
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

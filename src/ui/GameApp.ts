import { ContentRegistry } from '../content/registry.ts';
import { createInitialState, deserializeState, serializeState } from '../engine/state.ts';
import { EventBus, type GameEvent } from '../engine/eventBus.ts';
import {
  enterScene,
  resolveLuckCheck,
  resolveDualAttrSkillCheck,
  resolveSkillCheck,
  type LoadedScene,
  type StoryDiceRollBreakdown,
} from '../engine/sceneRuntime.ts';
import { applyEffects } from '../engine/effects.ts';
import { tickActiveBuffs } from '../engine/leadStats.ts';
import type { Choice, GameState } from '../engine/schema.ts';
import { migrateLegacyKnownSpells } from '../engine/spellsKnown.ts';
import { GameAudio, type AmbientTheme } from './sound/index.ts';
import { buildScenesGraphHref } from './campaignUrl.ts';
import {
  SAVE_SLOT_COUNT,
  migrateLegacySaveIfNeeded as migrateLegacySaveSlot,
  saveStateToSlot,
  readRawSlot as readSaveSlotRaw,
} from './gameAppSaveSlots.ts';
import { renderCombatInto } from './gameAppCombat.ts';
import {
  renderStoryInto,
  type StoryDiceBannerHost,
  type StoryRenderContext,
} from './gameAppStory.ts';
import { formatCampaignHeaderTitle } from './campaignHeaderTitle.ts';
import { mountAppChrome } from './gameAppShell.ts';
import './css/styles.css';
import gameVersionRaw from '../../VERSION?raw';

const GAME_VERSION = gameVersionRaw.trim() || '?';

/** Legenda do aviso quando o dia narrativo avança (varia com o tempo sob pedra). */
function dayAdvanceSubtitle(day: number): string {
  if (day >= 30) return 'Até o número parece estranho na língua.';
  if (day >= 25) return 'Quem conta dias conta também medo.';
  if (day >= 20) return 'A pedra não distingue pressa de desespero.';
  if (day >= 15) return 'O subsolo não perdoa quem demora.';
  if (day >= 12) return 'O abismo não tem pressa — tu é que tens.';
  if (day >= 9) return 'Sem sol: só hábito e eco.';
  if (day >= 6) return 'Os túneis não esquecem quem passa.';
  if (day >= 4) return 'Cada viragem arrasta mais silêncio.';
  if (day >= 2) return 'Primeiras marcas na contagem — ainda sabes em voz alta.';
  return 'Passou tempo desde a última paragem.';
}

export class GameApp {
  private readonly campaignId: string;
  /** Gravação única antiga (`{campaignId}_save_v1`) — migrada para o slot 1 na primeira execução. */
  private readonly legacySaveKey: string;
  private readonly sidebarKey: string;
  private readonly fontKey: string;
  private readonly quickNavKey: string;
  private readonly timedChoiceKey: string;
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
  /** Escolhas com `timedMs` + barra / auto-navegação. */
  private timedChoiceMode = false;
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
    this.timedChoiceKey = `${campaignId}_timed_choice_v1`;
    this.devModeKey = `${campaignId}_dev_mode`;
    this.registry = new ContentRegistry(campaignId);
    this.audio = new GameAudio(campaignId);
    this.fontStep = this.loadFontStep();
    this.quickNavMode = this.loadQuickNavMode();
    this.timedChoiceMode = this.loadTimedChoiceMode();
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
      if (ev.type === 'time.dayAdvanced') {
        this.unlockAudio();
        this.audio.playDayAdvance();
        this.statusHighlightQueue.push({
          type: 'statusHighlight',
          variant: 'good',
          title: `Dia ${ev.day}`,
          subtitle: dayAdvanceSubtitle(ev.day),
        });
      }
      if (ev.type === 'statusHighlight') {
        this.statusHighlightQueue.push(ev);
      }
    });
    this.state = createInitialState(this.registry.data.campaign);
    this.state = this.stabilize(this.state);
    this.sidebarSections = this.loadSidebarSections();
    this.migrateLegacySaveIfNeeded();
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

  private loadTimedChoiceMode(): boolean {
    try {
      return localStorage.getItem(this.timedChoiceKey) === '1';
    } catch {
      return false;
    }
  }

  private saveTimedChoiceMode(): void {
    try {
      localStorage.setItem(this.timedChoiceKey, this.timedChoiceMode ? '1' : '0');
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

  /** Copia a gravação legada para o slot 1 se o slot 1 ainda estiver vazio. */
  private migrateLegacySaveIfNeeded(): void {
    migrateLegacySaveSlot(this.campaignId, this.legacySaveKey);
  }

  private saveToSlot(slot: number): void {
    this.unlockAudio();
    saveStateToSlot(this.campaignId, slot, this.state);
    this.closeMenu();
    this.render();
  }

  private loadFromSlot(slot: number): void {
    this.unlockAudio();
    if (slot < 1 || slot > SAVE_SLOT_COUNT) return;
    try {
      const raw = readSaveSlotRaw(this.campaignId, slot);
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

  private storyDiceHostBinding(): StoryDiceBannerHost {
    return {
      quickNavMode: this.quickNavMode,
      clearDiceRollTimers: () => this.clearDiceRollTimers(),
      setDiceRollIntervalTimer: (t) => {
        this.diceRollIntervalTimer = t;
      },
      setDiceRollEnterHandler: (h) => {
        this.diceRollEnterHandler = h;
      },
      dismissStoryDiceRoll: (nextState) => {
        this.clearDiceRollTimers();
        this.pendingStoryDiceRoll = null;
        const prevScene = this.state.sceneId;
        let s = nextState;
        if (s.sceneId !== prevScene) {
          s = tickActiveBuffs(s);
        }
        this.state = this.stabilize(s);
        this.audio.playUiClick();
        this.render();
      },
      playCheckSuccess: () => this.audio.playCheckSuccess(),
      playCheckFail: () => this.audio.playCheckFail(),
    };
  }

  private buildStoryRenderContext(scene: LoadedScene): StoryRenderContext {
    return {
      campaignId: this.campaignId,
      devMode: this.devMode,
      quickNavMode: this.quickNavMode,
      timedChoiceEnabled: this.timedChoiceMode,
      state: this.state,
      registry: this.registry,
      scene,
      overlay: {
        pendingStoryDiceRoll: this.pendingStoryDiceRoll,
        storyDiceHost: this.storyDiceHostBinding(),
        faithMiraclePending: this.faithMiraclePending,
        setFaithMiraclePending: (v) => {
          this.faithMiraclePending = v;
        },
        statusHighlightQueue: this.statusHighlightQueue,
        setStatusHighlightQueue: (q) => {
          this.statusHighlightQueue = q;
        },
        itemAcquireQueue: this.itemAcquireQueue,
        setItemAcquireQueue: (q) => {
          this.itemAcquireQueue = q;
        },
      },
      audio: {
        unlockAudio: () => this.unlockAudio(),
        playUiClick: () => this.audio.playUiClick(),
        playLevelUpCelebration: () => this.audio.playLevelUpCelebration(),
      },
      render: () => this.render(),
      navigation: {
        applyChoice: (ch) => this.applyChoice(ch),
        onSkillRoll: (sc) => this.onSkillRoll(sc),
        onDualAttrSkillRoll: (sc) => this.onDualAttrSkillRoll(sc),
        onLuckRoll: (sc) => this.onLuckRoll(sc),
      },
      campCallbacks: {
        unlockAudio: () => this.unlockAudio(),
        playUiClick: () => this.audio.playUiClick(),
        commitEquipEffects: (effects) => {
          this.state = this.stabilize(applyEffects(this.state, effects, this.ctx()));
          this.render();
        },
      },
      setTimedChoiceTimer: (t) => {
        this.timedTimer = t;
      },
    };
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

    const headerTitle = formatCampaignHeaderTitle(this.registry.data.campaign, this.state.chapter);
    document.title = headerTitle;

    mountAppChrome(this.root, {
      headerTitle,
      gameVersion: GAME_VERSION,
      fontStep: this.fontStep,
      campaignId: this.campaignId,
      devMode: this.devMode,
      quickNavMode: this.quickNavMode,
      timedChoiceEnabled: this.timedChoiceMode,
      state: this.state,
      registry: this.registry,
      sidebarSections: this.sidebarSections,
      audio: this.audio,
      onMenuHamburgerClick: (hBtn) => {
        this.toggleMenu();
        hBtn.setAttribute('aria-expanded', this.menuOpen ? 'true' : 'false');
      },
      onMenuBackdropClick: (hBtn) => {
        this.closeMenu();
        hBtn.setAttribute('aria-expanded', 'false');
      },
      onSoundMuteChange: (muted) => {
        this.audio.setMuted(muted);
        if (!muted) {
          this.unlockAudio();
        } else {
          this.audio.stopAmbient();
        }
      },
      getVolume: () => this.audio.getVolume(),
      setVolume: (n) => this.audio.setVolume(n),
      onDevModeChange: (v) => {
        this.devMode = v;
        this.saveDevMode();
        this.closeMenu();
        this.render();
      },
      onQuickNavChange: (v) => {
        this.quickNavMode = v;
        this.saveQuickNavMode();
        this.closeMenu();
        this.render();
      },
      onTimedChoiceChange: (v) => {
        this.timedChoiceMode = v;
        this.saveTimedChoiceMode();
        this.closeMenu();
        this.render();
      },
      onCycleFont: () => this.cycleFontSize(),
      fullscreenSupported: this.isFullscreenSupported(),
      getFullscreenActive: () => this.getFullscreenElement() != null,
      onFullscreenChange: async (want) => {
        if (want) {
          await this.requestGameFullscreen();
        } else {
          await this.exitGameFullscreen();
        }
      },
      onExportSave: () => this.exportSaveToClipboard(),
      onImportSave: () => this.importSaveFromClipboard(),
      onCredits: () => this.showCredits(),
      onScenesGraph: () => {
        window.location.href = buildScenesGraphHref(this.campaignId);
      },
      showImportInPartida: this.devMode,
      showGraphInSettings: this.devMode,
      showDevModeToggle: this.isLocalhostHost(),
      onSaveSlot: (slot) => this.saveToSlot(slot),
      onLoadSlot: (slot) => this.loadFromSlot(slot),
      onSidebarSectionToggle: (key, open) => {
        this.sidebarSections[key] = open;
        this.saveSidebarSections();
      },
      fillMain: (main) => {
        if (this.state.mode === 'combat') {
          main.classList.add('main--combat');
          renderCombatInto(main, {
            state: this.state,
            registry: this.registry,
            bus: this.bus,
            audio: this.audio,
            quickNavMode: this.quickNavMode,
            combatLog: {
              soundCursor: this.combatLogSoundCursor,
              setSoundCursor: (v) => {
                this.combatLogSoundCursor = v;
              },
            },
            lifecycle: {
              unlockAudio: () => this.unlockAudio(),
              stabilize: (s) => this.stabilize(s),
              commitState: (s) => {
                this.state = this.stabilize(s);
                this.render();
              },
            },
          });
        } else {
          const scene = this.registry.getScene(this.state.sceneId);
          if (!scene) {
            main.innerHTML = `<div class="shell error">Cena não encontrada: <code>${this.state.sceneId}</code></div>`;
          } else {
            renderStoryInto(main, this.buildStoryRenderContext(scene));
          }
        }
      },
    });

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

}

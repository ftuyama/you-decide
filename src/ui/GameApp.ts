import { ContentRegistry } from '../content/registry.ts';
import {
  applyEffects,
  createInitialState,
  deserializeState,
  enterScene,
  EventBus,
  resolveDualAttrSkillCheck,
  resolveLuckCheck,
  resolveSkillCheck,
  serializeState,
  type GameEvent,
  type LoadedScene,
  type StoryDiceRollBreakdown,
} from '../engine/core/index.ts';
import {
  explorationMoveEffects,
  pickWildOutcome,
  shouldTriggerEncounter,
  startExplorationCombatEffects,
  wildEncounterVictoryOverride,
} from '../engine/world/index.ts';
import {
  migrateLegacyKnownSpells,
  syncCompanionPartyWithFriendship,
  tickActiveBuffs,
} from '../engine/progression/index.ts';
import {
  CIRCULO_SKILL_REROLL_REP_COST,
  hasFactionPerkUnlocked,
} from '../engine/progression/reputation.ts';
import type { Choice, Effect, GameState } from '../engine/schema/index.ts';
import { GameAudio, type AmbientTheme } from './sound/index.ts';
import { buildDevToolsHref, buildScenesGraphHref } from './campaignUrl.ts';
import { preserveExplorationNodeForChoiceEffects } from './gameAppUtils.ts';
import {
  saveSlotLimit,
  migrateLegacySaveIfNeeded as migrateLegacySaveSlot,
  saveStateToSlot,
  readRawSlot as readSaveSlotRaw,
  slotReturnRewardDateKey,
} from './gameAppSaveSlots.ts';
import { appendCombatLogMessageWithBoldNames, renderCombatInto } from './gameAppCombat.ts';
import {
  renderStoryInto,
  resolveSceneArt,
  type StoryDiceBannerHost,
  type StoryRenderContext,
  type StoryStatusHighlightRow,
} from './gameAppStory.ts';
import { formatCampaignHeaderTitle } from './campaignHeaderTitle.ts';
import { showAppToast } from './appToast.ts';
import { attachFocusTrap, focusableElementsIn } from './focusTrap.ts';
import { mountAppChrome, syncAppChrome, type AppChromeRefs } from './gameAppShell.ts';
import { openChronicleModal, openCreditsModal } from './gameAppSidebar.ts';
import { dayAdvanceSubtitle, handleGameEvent } from './gameAppEvents.ts';
import {
  buildGameAppStorageKeys,
  loadDevMode,
  loadFontStep,
  loadOnboardingPrimerVisible,
  loadSceneArtHighlightEnabled,
  loadSidebarSections,
  loadTimedChoiceMode,
  saveDevMode,
  saveFontStep,
  saveOnboardingPrimerVisible,
  saveSceneArtHighlightEnabled,
  saveSidebarSections,
  saveTimedChoiceMode,
  type GameAppStorageKeys,
} from './gameAppPreferences.ts';
import './css/styles.css';
import gameVersionRaw from '../../VERSION?raw';

const GAME_VERSION = gameVersionRaw.trim() || '?';

/** Atraso em cascata entre o início do fade+slide de cada cartão (1.º imediato). */
const STORY_BANNER_BETWEEN_DISMISS_MS = 350;
/** Duração do fade-out (animação CSS). Espelha `--story-banner-fade-duration` em `theme-tokens.css`. */
const STORY_BANNER_FADE_MS = 1000;

export class GameApp {
  private readonly campaignId: string;
  /** Gravação única antiga (`{campaignId}_save_v1`) — migrada para o slot 1 na primeira execução. */
  private readonly legacySaveKey: string;
  private readonly storageKeys: GameAppStorageKeys;
  private registry: ContentRegistry;
  private bus = new EventBus();
  private audio: GameAudio;
  private state: GameState;
  private root: HTMLElement;
  private chromeRefs: AppChromeRefs | null = null;
  /** `mode:sceneId` após último `scrollTop = 0` em `main` — evita reset em re-render da mesma cena. */
  private lastMainScrollResetKey: string | null = null;
  /** Após escolher uma opção em narrativa, força o scroll ao topo (mesmo se a cena não mudar). */
  private pendingStoryMainScrollTop = false;
  private timedTimer: ReturnType<typeof setTimeout> | null = null;
  private menuOpen = false;
  private menuFocusTrapRelease: (() => void) | null = null;
  /** 0 = 100%, 1 = 110%, 2 = 120% */
  private fontStep = 0;
  /** Modo dev (ferramentas de autor). */
  private devMode = false;
  /** Escolhas com `timedMs` + barra / auto-navegação. */
  private timedChoiceMode = false;
  /** Overlay em ecrã inteiro da arte na primeira visita (`highlight: true`). */
  private sceneArtHighlightEnabled = true;
  /** Dica de primeiros passos (mostrada uma vez por campanha). */
  private onboardingPrimerVisible = false;
  /** Meta da sessão aparece apenas até a primeira mudança de cena. */
  private sessionObjectiveVisible = true;
  /** Barra superior oculta — trilho compacto à esquerda do `#app`. */
  private topBarCollapsed = false;
  private readonly choiceHotkeyHandler: (e: KeyboardEvent) => void;
  /** Secções colapsáveis (recursos, inventário, facções, personagem…) — persistido em sessionStorage */
  private sidebarSections: Record<string, boolean> = {};
  /** Buffs/debuffs/marcas — fila com fade sequencial no `GameApp` */
  private statusHighlightQueue: StoryStatusHighlightRow[] = [];
  /** Itens recém-adquiridos (grantItem) — mostra banner até o jogador fechar */
  private itemAcquireQueue: string[] = [];
  /** Entradas novas de diário (`addDiary`) — banner até fechar */
  private diaryEntryQueue: string[] = [];
  /** Milagre de fé após quase-morte em combate — banner até fechar */
  private faithMiraclePending = false;
  /** Onda de dismiss da stack: um `render` ao iniciar (delays CSS) e um ao limpar a fila. */
  private statusHighlightDismissChainActive = false;
  private statusHighlightDismissEndTimer: ReturnType<typeof setTimeout> | null = null;
  private diaryBannerFadeTimer: ReturnType<typeof setTimeout> | null = null;
  private diaryBannerExiting = false;
  private itemBannerFadeTimer: ReturnType<typeof setTimeout> | null = null;
  private itemAcquireBannerExiting = false;
  /** Índice até onde som/FX do log de combate já foram consumidos (som e FX partilham o mesmo cursor). */
  private combatLogCursor: { encounterId: string; index: number } = { encounterId: '', index: 0 };
  /** Filas de mensagens de twist de boss (cada entrada = um lote mostrado de uma vez). */
  private bossTwistRevealQueue: string[][] = [];
  private bossTwistLayer: HTMLElement | null = null;
  private bossTwistFocusRelease: (() => void) | null = null;
  private bossTwistKeydownHandler: ((e: KeyboardEvent) => void) | null = null;
  /** Rola teste de perícia/sorte: estado só aplica após o overlay (dados já resolvidos no motor). */
  private pendingStoryDiceRoll: {
    nextState: GameState;
    breakdown: StoryDiceRollBreakdown;
    reroll?: {
      preRollState: GameState;
      rolledScene: LoadedScene;
      rollKind: 'skill' | 'dualSkill' | 'luck';
    };
  } | null = null;
  private diceRollIntervalTimer: ReturnType<typeof setInterval> | null = null;
  private diceRollEnterHandler: ((e: KeyboardEvent) => void) | null = null;
  /** Overlay `highlight`: cena ativa se o jogador re-renderizar antes do fim da animação. */
  private activeSceneArtHighlight: string | null = null;
  /** Incrementado a cada `render()` para cancelar timeouts do overlay de arte. */
  private sceneArtHighlightGen = 0;

  constructor(root: HTMLElement, campaignId: string) {
    this.root = root;
    this.campaignId = campaignId;
    this.legacySaveKey = `${campaignId}_save_v1`;
    this.storageKeys = buildGameAppStorageKeys(campaignId);
    this.registry = new ContentRegistry(campaignId);
    this.audio = new GameAudio(campaignId);
    this.fontStep = loadFontStep(this.storageKeys.fontKey);
    this.timedChoiceMode = loadTimedChoiceMode(this.storageKeys.timedChoiceKey);
    this.sceneArtHighlightEnabled = loadSceneArtHighlightEnabled(this.storageKeys.sceneArtHighlightKey);
    this.devMode = loadDevMode(this.storageKeys.devModeKey);
    this.onboardingPrimerVisible = loadOnboardingPrimerVisible(this.storageKeys.onboardingPrimerKey);
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
          // During status-banner exit, the dismiss control is removed from the DOM; a second
          // Space would otherwise hit the next overlay (diary/item). Consume the key until clear.
          if (
            this.statusHighlightQueue.length > 0 &&
            (this.statusHighlightDismissChainActive ||
              this.statusHighlightDismissEndTimer != null ||
              this.statusHighlightQueue.some((h) => h.exiting))
          ) {
            e.preventDefault();
            return;
          }
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

    this.bus.subscribe((ev) =>
      handleGameEvent(ev, {
        isStoryMode: this.state.mode === 'story',
        onCombatVictory: () => this.audio.playVictory(),
        onCombatFlee: () => this.audio.playFlee(),
        onCombatDefeat: () => this.audio.playDefeat(),
        onFaithMiracle: () => {
          this.faithMiraclePending = true;
          this.unlockAudio();
          this.audio.playFaithMiracle();
        },
        onItemAcquired: (itemId) => {
          this.itemAcquireQueue.push(itemId);
          this.unlockAudio();
          this.audio.playItemAcquire();
        },
        onXpGained: (amount) => {
          this.enqueueStatusHighlight({
            type: 'statusHighlight',
            variant: 'good',
            title: `+${amount} XP`,
            subtitle: 'Experiência recebida',
          });
          this.unlockAudio();
        },
        onDiaryEntryAdded: (text) => {
          this.diaryEntryQueue.push(text);
          this.unlockAudio();
        },
        onCampRest: () => {
          this.unlockAudio();
          this.audio.playCampRest();
        },
        onTimeDayAdvanced: (day) => {
          this.unlockAudio();
          this.audio.playDayAdvance();
          this.enqueueStatusHighlight({
            type: 'statusHighlight',
            variant: 'good',
            title: `Dia ${day}`,
            subtitle: dayAdvanceSubtitle(day),
          });
        },
        onStatusHighlight: (event) => {
          this.enqueueStatusHighlight(event);
        },
        onLevelUp: (level) => {
          if (this.state.mode !== 'story') return;
          this.unlockAudio();
          this.audio.playLevelUpCelebration();
          this.enqueueStatusHighlight({
            type: 'statusHighlight',
            variant: 'good',
            title: `Nível ${level}`,
            subtitle: 'Subiste de nível.',
          });
        },
      })
    );
    this.state = createInitialState(this.registry.data.campaign);
    this.state = this.stabilize(this.state);
    this.applyLegacyBriefingIfNeeded();
    this.sidebarSections = loadSidebarSections(this.storageKeys.sidebarKey);
    this.migrateLegacySaveIfNeeded();
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.menuOpen) {
        this.closeMenu();
      }
    });
    document.addEventListener('fullscreenchange', () => {
      this.syncFullscreenUi();
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
    this.root.addEventListener('click', this.onAppChromeDelegatedClick);
    this.render();
  }

  /** Controlo da barra superior / trilho — delegado em `#app` para evitar cliques bloqueados por camadas. */
  private onAppChromeDelegatedClick = (e: MouseEvent): void => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    if (t.closest('.app-top-collapse')) {
      this.topBarCollapsed = true;
      this.syncTopBarCollapsePresentation();
      this.audio.playUiClick();
      return;
    }
    if (t.closest('[data-app-edge-restore]')) {
      this.topBarCollapsed = false;
      this.syncTopBarCollapsePresentation();
      this.audio.playUiClick();
      this.chromeRefs?.collapseTopBtn.focus();
      return;
    }
    if (t.closest('[data-app-edge-menu]')) {
      const hBtn = this.chromeRefs?.hamburgerBtn;
      if (!hBtn) return;
      this.toggleMenu();
      hBtn.setAttribute('aria-expanded', this.menuOpen ? 'true' : 'false');
      return;
    }
    if (t.closest('.app-top-fullscreen')) {
      const btn = t.closest('.app-top-fullscreen');
      if (!(btn instanceof HTMLButtonElement) || btn.disabled || !this.isFullscreenSupported()) return;
      const want = this.getFullscreenElement() == null;
      void (async () => {
        try {
          if (want) await this.requestGameFullscreen();
          else await this.exitGameFullscreen();
        } catch {
          /* mantém checkbox / botão alinhados ao estado real */
        }
        this.syncFullscreenUi();
      })();
    }
  };

  /** Bônus diário de retorno: primeira carga de cada slot no dia (gravação existente). */
  private applyReturnRewardIfNeededForLoadedSlot(slot: number): void {
    const today = new Date().toISOString().slice(0, 10);
    const key = slotReturnRewardDateKey(this.campaignId, slot);
    try {
      if (localStorage.getItem(key) === today) return;
      this.state = this.stabilize(
        applyEffects(
          this.state,
          [
            { op: 'addResource', resource: 'supply', delta: 1 },
            { op: 'addResource', resource: 'gold', delta: 4 },
          ],
          this.ctx()
        )
      );
      localStorage.setItem(key, today);
      this.enqueueStatusHighlight({
        type: 'statusHighlight',
        variant: 'good',
        title: 'Retorno às catacumbas',
        subtitle: '+1 suprimento e +4 ouro por voltares hoje.',
      });
    } catch {
      /* noop */
    }
  }

  private buildSessionObjective(): string {
    const { chapter, day, sceneId } = this.state;
    const supply = this.state.resources.supply;
    const faith = this.state.resources.faith ?? 0;
    const corruption = this.state.resources.corruption ?? 0;
    const gold = this.state.resources.gold ?? 0;
    if (chapter === 1 && day <= 2) {
      return 'Meta da sessão: usar atalhos [1-9] e concluir as 2 primeiras escolhas sem pressa.';
    }
    if (supply <= 2) {
      return 'Meta da sessão: recuperar suprimento antes da próxima decisão de risco.';
    }
    if (faith >= 5) {
      return 'Meta da sessão: preservar a fé para um momento crítico.';
    }
    if (chapter <= 2) {
      return 'Meta da sessão: avançar 3 cenas sem cair para 0 de suprimento.';
    }
    if (corruption >= 6) {
      return 'Meta da sessão: concluir 1 decisão de risco sem aumentar corrupção.';
    }
    if (faith <= 1) {
      return 'Meta da sessão: recuperar fé ou evitar combate desnecessário.';
    }
    if (chapter >= 4 && chapter <= 5 && gold >= 20) {
      return 'Meta da sessão: gastar ouro para reforçar o grupo antes do próximo confronto maior.';
    }
    if (sceneId.startsWith('act2/camp/') || sceneId.startsWith('act5/camp/')) {
      return 'Meta da sessão: revisar equipamento e sair do acampamento com vantagem clara.';
    }
    return 'Meta da sessão: concluir 1 ramificação nova e registrar 1 novo marco de jornada.';
  }

  private applyLegacyBriefingIfNeeded(): void {
    const legacy = this.state.legacy;
    if (legacy.echoes <= 0) return;
    const stamp = `${legacy.echoes}:${legacy.lastRunSummary}:${legacy.titles.join('|')}`;
    try {
      if (localStorage.getItem(this.storageKeys.legacyBriefingKey) === stamp) return;
      const topTitle = legacy.titles[legacy.titles.length - 1];
      if (topTitle) {
        this.enqueueStatusHighlight({
          type: 'statusHighlight',
          variant: 'neutral',
          title: `Legado ativo — ${topTitle}`,
          subtitle:
            legacy.lastRunEchoGain > 0
              ? `+${legacy.lastRunEchoGain} ecos preservados entre runs.`
              : 'Ecos preservados entre runs.',
        });
      }
      if (legacy.lastRunSummary.trim().length > 0) {
        this.state = this.stabilize(
          applyEffects(
            this.state,
            [{ op: 'addDiary', text: `Legado: ${legacy.lastRunSummary}` }],
            this.ctx()
          )
        );
      }
      localStorage.setItem(this.storageKeys.legacyBriefingKey, stamp);
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
    saveFontStep(this.storageKeys.fontKey, this.fontStep);
    this.closeMenu();
    this.render();
  }

  private showToast(message: string, variant: 'info' | 'error' = 'info'): void {
    const el = this.chromeRefs?.toastRegion;
    if (!el) return;
    showAppToast(el, message, variant);
  }

  private focusFirstInMenuDrawer(): void {
    const drawer =
      this.chromeRefs?.menuDrawer ?? this.root.querySelector<HTMLElement>('.menu-drawer');
    if (!drawer) return;
    focusableElementsIn(drawer)[0]?.focus();
  }

  private exportSaveToClipboard(): void {
    this.unlockAudio();
    const json = serializeState(this.state);
    void navigator.clipboard.writeText(json).then(
      () => {
        this.showToast('Gravação copiada para a área de transferência (JSON).');
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
        this.showToast(
          `Esta gravação é da campanha "${parsed.campaignId}". Campanha ativa: "${this.campaignId}".`,
          'error'
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
          this.showToast('Área de transferência vazia.', 'error');
          return;
        }
        try {
          applyRawSave(raw);
        } catch {
          this.showToast('JSON inválido na área de transferência.', 'error');
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
          this.showToast('JSON inválido.', 'error');
        }
      }
    );
  }

  private showCredits(): void {
    this.unlockAudio();
    openCreditsModal({
      campaignName: this.registry.data.campaign.name,
      gameVersion: GAME_VERSION,
      playUiClick: () => this.audio.playUiClick(),
    });
    this.closeMenu();
  }

  private canOpenSidebarSection(key: string): boolean {
    const visitedCount = Object.keys(this.state.visitedScenes).length;
    if (key === 'inventario') {
      return this.state.chapter >= 2 || visitedCount >= 6;
    }
    if (key === 'faccoes') {
      const rep = this.state.reputation;
      const repTouched = rep.vigilia !== 0 || rep.circulo !== 0 || rep.culto !== 0;
      if (this.state.flags['add_rep_ever']) return true;
      return this.state.chapter >= 2 || visitedCount >= 10 || repTouched;
    }
    return true;
  }

  private syncSidebarDisclosureSections(): void {
    let changed = false;
    for (const key of Object.keys(this.sidebarSections)) {
      if (this.sidebarSections[key] === true && !this.canOpenSidebarSection(key)) {
        this.sidebarSections[key] = false;
        changed = true;
      }
    }
    if (changed) saveSidebarSections(this.storageKeys.sidebarKey, this.sidebarSections);
  }

  private unlockAudio(): void {
    this.audio.startAmbientWhenReady();
    this.syncAmbientTheme();
  }

  private removeBossTwistOverlayListeners(): void {
    if (this.bossTwistFocusRelease) {
      this.bossTwistFocusRelease();
      this.bossTwistFocusRelease = null;
    }
    if (this.bossTwistKeydownHandler) {
      window.removeEventListener('keydown', this.bossTwistKeydownHandler, true);
      this.bossTwistKeydownHandler = null;
    }
  }

  private dismissBossTwistOverlay(): void {
    this.audio.playUiClick();
    this.removeBossTwistOverlayListeners();
    if (this.bossTwistLayer) {
      this.bossTwistLayer.remove();
      this.bossTwistLayer = null;
    }
    this.tryShowNextBossTwistOverlay();
  }

  private tryShowNextBossTwistOverlay(): void {
    if (typeof document === 'undefined') return;
    if (this.bossTwistLayer != null || this.bossTwistRevealQueue.length === 0) return;
    const batch = this.bossTwistRevealQueue.shift()!;
    const c = this.state.combat;
    const combatantNames =
      c != null
        ? [
            ...this.state.party.map((m) => m.name),
            ...c.enemies
              .map((e) => this.registry.data.enemies[e.defId]?.name)
              .filter((n): n is string => Boolean(n)),
          ]
        : this.state.party.map((m) => m.name);

    const layer = document.createElement('div');
    layer.className = 'combat-boss-twist-layer';
    layer.setAttribute('role', 'dialog');
    layer.setAttribute('aria-modal', 'true');
    layer.setAttribute('aria-labelledby', 'combat-boss-twist-title');

    const backdrop = document.createElement('button');
    backdrop.type = 'button';
    backdrop.className = 'combat-boss-twist-backdrop';
    backdrop.setAttribute('aria-label', 'Fechar');

    const panel = document.createElement('div');
    panel.className = 'combat-boss-twist-panel';

    const title = document.createElement('h2');
    title.id = 'combat-boss-twist-title';
    title.className = 'combat-boss-twist-title';
    title.textContent = 'Viragem no combate';

    const bodyWrap = document.createElement('div');
    bodyWrap.className = 'combat-boss-twist-body';
    for (const msg of batch) {
      const p = document.createElement('p');
      p.className = 'combat-boss-twist-para';
      appendCombatLogMessageWithBoldNames(p, msg, combatantNames);
      bodyWrap.appendChild(p);
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'combat-boss-twist-continue';
    btn.textContent = '[Espaço] - Continuar';
    btn.addEventListener('click', () => this.dismissBossTwistOverlay());
    backdrop.addEventListener('click', () => this.dismissBossTwistOverlay());

    this.bossTwistKeydownHandler = (e: KeyboardEvent) => {
      const dismiss =
        e.key === 'Escape' || e.key === ' ' || e.code === 'Space';
      if (!dismiss) return;
      e.preventDefault();
      this.dismissBossTwistOverlay();
    };
    window.addEventListener('keydown', this.bossTwistKeydownHandler, true);

    layer.appendChild(backdrop);
    panel.appendChild(title);
    panel.appendChild(bodyWrap);
    panel.appendChild(btn);
    layer.appendChild(panel);
    this.root.appendChild(layer);
    this.bossTwistLayer = layer;
    this.bossTwistFocusRelease = attachFocusTrap(layer);
    btn.focus();
  }

  private enqueueBossTwistReveal(messages: string[]): void {
    if (!messages.length) return;
    this.bossTwistRevealQueue.push([...messages]);
    this.tryShowNextBossTwistOverlay();
  }

  private flushBossTwistOverlayOnLeaveCombat(): void {
    this.bossTwistRevealQueue = [];
    this.removeBossTwistOverlayListeners();
    if (this.bossTwistLayer) {
      this.bossTwistLayer.remove();
      this.bossTwistLayer = null;
    }
  }

  private resolveAmbientTheme(): AmbientTheme {
    if (this.state.mode === 'combat' && this.state.combat) {
      const id = this.state.combat.encounterId;
      if (id.startsWith('boss_') || id.includes('boss')) return 'boss';
      if (id.startsWith('kael_rival')) return 'combat_rival';
      return 'combat';
    }
    const sceneTheme = this.registry.getScene(this.state.sceneId)?.frontmatter.ambientTheme;
    if (sceneTheme) {
      return sceneTheme;
    }
    return 'explore';
  }

  private syncAmbientTheme(): void {
    this.audio.setAmbientTheme(this.resolveAmbientTheme());
  }

  /** Paleta CSS (`html[data-theme]`) — ato 5 neve / ato 6 vazio / ato 7 cinzas. */
  private resolveVisualTheme(): 'snow' | 'void' | 'ash' | null {
    if (this.state.chapter === 6 || this.state.sceneId.startsWith('act6/')) return 'void';
    if (this.state.chapter === 7 || this.state.sceneId.startsWith('act7/')) return 'ash';
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

  private ctx(): { sceneId: string; data: import('../engine/data/index.ts').GameData; bus: EventBus } {
    return { sceneId: this.state.sceneId, data: this.registry.data, bus: this.bus };
  }

  private cancelStatusHighlightDismissalPipeline(): void {
    if (this.statusHighlightDismissEndTimer != null) {
      clearTimeout(this.statusHighlightDismissEndTimer);
      this.statusHighlightDismissEndTimer = null;
    }
    for (const h of this.statusHighlightQueue) {
      if (h.exiting) delete h.exiting;
    }
    this.statusHighlightDismissChainActive = false;
  }

  /**
   * Um clique: marca todos com `exiting`, um único `render` (cada cartão usa
   * `animation-delay` = índice × `STORY_BANNER_BETWEEN_DISMISS_MS`) e limpa a fila
   * após a última animação — sem re-renders intermediários que reiniciavam o CSS.
   */
  private beginStatusHighlightStackDismiss(): void {
    if (this.statusHighlightQueue.length === 0) return;
    if (
      this.statusHighlightDismissChainActive ||
      this.statusHighlightDismissEndTimer != null ||
      this.statusHighlightQueue.some((h) => h.exiting)
    ) {
      return;
    }
    const n = this.statusHighlightQueue.length;
    this.statusHighlightDismissChainActive = true;
    for (const h of this.statusHighlightQueue) {
      h.exiting = true;
    }
    this.render();
    const totalMs = Math.max(0, n - 2) * STORY_BANNER_BETWEEN_DISMISS_MS + STORY_BANNER_FADE_MS;
    this.statusHighlightDismissEndTimer = setTimeout(() => {
      this.statusHighlightDismissEndTimer = null;
      if (!this.statusHighlightDismissChainActive) return;
      this.statusHighlightQueue = [];
      this.statusHighlightDismissChainActive = false;
      this.render();
    }, totalMs);
  }

  /**
   * Fila manual: `autoDismissMs` no evento não agenda timers (só mudança de cena / botão Continuar).
   */
  private enqueueStatusHighlight(event: Extract<GameEvent, { type: 'statusHighlight' }>): void {
    this.statusHighlightQueue.push({ ...event });
  }

  private cancelDiaryBannerPipeline(): void {
    if (this.diaryBannerFadeTimer != null) {
      clearTimeout(this.diaryBannerFadeTimer);
      this.diaryBannerFadeTimer = null;
    }
    this.diaryBannerExiting = false;
  }

  private beginDiaryBannerDismiss(): void {
    if (this.diaryEntryQueue.length === 0) return;
    if (this.diaryBannerFadeTimer != null || this.diaryBannerExiting) return;
    this.diaryBannerExiting = true;
    this.render();
    this.diaryBannerFadeTimer = setTimeout(() => {
      this.diaryBannerFadeTimer = null;
      this.diaryEntryQueue = [];
      this.diaryBannerExiting = false;
      this.render();
    }, STORY_BANNER_FADE_MS);
  }

  private cancelItemBannerPipeline(): void {
    if (this.itemBannerFadeTimer != null) {
      clearTimeout(this.itemBannerFadeTimer);
      this.itemBannerFadeTimer = null;
    }
    this.itemAcquireBannerExiting = false;
  }

  private beginItemAcquireBannerDismiss(): void {
    if (this.itemAcquireQueue.length === 0) return;
    if (this.itemBannerFadeTimer != null || this.itemAcquireBannerExiting) return;
    this.itemAcquireBannerExiting = true;
    this.render();
    this.itemBannerFadeTimer = setTimeout(() => {
      this.itemBannerFadeTimer = null;
      this.itemAcquireQueue = [];
      this.itemAcquireBannerExiting = false;
      this.render();
    }, STORY_BANNER_FADE_MS);
  }

  private cancelAllStoryBannerAnimations(): void {
    this.cancelStatusHighlightDismissalPipeline();
    this.cancelDiaryBannerPipeline();
    this.cancelItemBannerPipeline();
  }

  /** Mantém só overlays ligados à transição atual (como diário / destaques / itens). */
  private trimOverlayQueuesIfSceneChanged(
    prevScene: string,
    prevDiaryLen: number,
    prevStatusLen: number,
    prevItemAcquireLen: number
  ): void {
    if (this.state.sceneId === prevScene) return;
    this.sessionObjectiveVisible = false;
    this.cancelAllStoryBannerAnimations();

    this.diaryEntryQueue = this.diaryEntryQueue.slice(prevDiaryLen);
    this.statusHighlightQueue = this.statusHighlightQueue.slice(prevStatusLen);
    this.itemAcquireQueue = this.itemAcquireQueue.slice(prevItemAcquireLen);
  }

  /** Não reentrar em cenas narrativas enquanto o combate está ativo (evita sobrescrever mode). */
  private stabilize(state: GameState): GameState {
    state = migrateLegacyKnownSpells(state, this.registry.data);
    state = syncCompanionPartyWithFriendship(state, this.registry.data);
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

  private applyExplorationMove(edgeId: string): void {
    const ex = this.state.exploration;
    const getG = this.registry.ui.getExplorationGraph;
    if (!ex || !getG) return;
    const graph = getG(ex.graphId);
    if (!graph) return;
    const lead = this.state.party[0];
    if (lead !== undefined && lead.stress >= 4) return;
    const resolved = explorationMoveEffects({
      graph,
      fromNodeId: ex.nodeId,
      edgeId,
    });
    if (!resolved.ok) return;
    const { edge, toNode } = resolved;
    const goalFlagKey = toNode.goalFlag ?? 'act2_explore_goal_reached';
    const reachedGoalNow = toNode.isGoal === true && this.state.flags[goalFlagKey] !== true;
    const effs: Effect[] = [
      { op: 'adjustLeadStress', delta: 1 },
      { op: 'setExploration', graphId: ex.graphId, nodeId: edge.to },
    ];
    if (toNode.isGoal) {
      effs.push({
        op: 'setFlag',
        key: goalFlagKey,
        value: true,
      });
    }
    let s = applyEffects(this.state, effs, this.ctx());
    s = { ...s, timedChoiceDeadline: null };
    const roll = shouldTriggerEncounter(s, edge.encounterChance);
    s = { ...s, rngSeed: roll.nextSeed };
    if (reachedGoalNow) {
      const exploreGoalSubtitle: Record<string, string> = {
        act2_catacomb:
          'Descida encontrada. A travessia pelas catacumbas valeu a pena.',
        act3_depths:
          'O portão de pedra nas profundezas assinala-se no mapa — Morvayn deixa de ser só rumor.',
        act5_frost:
          'A trilha no gelo fecha-se num ponto que o desfiladeiro não esconde por completo.',
        act6_fractured_nave:
          'Um limiar na nave fraturada deixa de negar o nome que escutas.',
      };
      this.enqueueStatusHighlight({
        type: 'statusHighlight',
        variant: 'good',
        title: 'Objetivo concluído',
        subtitle:
          exploreGoalSubtitle[ex.graphId] ??
          'O objetivo desta exploração ficou marcado.',
      });
      this.unlockAudio();
      this.audio.playCheckSuccess();
    }
    if (!roll.trigger) {
      this.state = this.stabilize(s);
      this.pendingStoryMainScrollTop = true;
      this.render();
      return;
    }
    const pick = pickWildOutcome(s, ex.graphId);
    s = { ...s, rngSeed: pick.nextSeed };
    if (pick.kind === 'scene') {
      s = { ...s, sceneId: pick.sceneId };
      s = tickActiveBuffs(s);
      this.state = this.stabilize(s);
      this.pendingStoryMainScrollTop = true;
      this.render();
      return;
    }
    const stoneVictory = wildEncounterVictoryOverride(ex.graphId, pick.encounterId);
    s = applyEffects(
      s,
      startExplorationCombatEffects(pick.encounterId, this.state.sceneId, stoneVictory),
      this.ctx()
    );
    this.state = this.stabilize(s);
    this.pendingStoryMainScrollTop = true;
    this.render();
  }

  private applyChoice(choice: Choice): void {
    this.unlockAudio();
    this.audio.playUiClick();
    if (this.timedTimer) {
      clearTimeout(this.timedTimer);
      this.timedTimer = null;
    }
    const id = choice.id;
    if (id?.startsWith('explore_move_')) {
      this.applyExplorationMove(id.slice('explore_move_'.length));
      return;
    }
    const prevScene = this.state.sceneId;
    const prevDiaryQueueLen = this.diaryEntryQueue.length;
    const prevStatusQueueLen = this.statusHighlightQueue.length;
    const prevItemAcquireQueueLen = this.itemAcquireQueue.length;
    const effects = preserveExplorationNodeForChoiceEffects(choice.effects, this.state.exploration);
    let s = applyEffects(this.state, effects, this.ctx());
    s = { ...s, timedChoiceDeadline: null };
    if (choice.next && s.mode === 'story') {
      s = { ...s, sceneId: choice.next };
    }
    if (s.sceneId !== prevScene) {
      s = tickActiveBuffs(s);
    }
    this.state = this.stabilize(s);
    this.trimOverlayQueuesIfSceneChanged(
      prevScene,
      prevDiaryQueueLen,
      prevStatusQueueLen,
      prevItemAcquireQueueLen
    );
    this.pendingStoryMainScrollTop = true;
    this.render();
  }

  private onSkillRoll(scene: LoadedScene): void {
    if (this.pendingStoryDiceRoll) return;
    if (this.timedTimer) {
      clearTimeout(this.timedTimer);
      this.timedTimer = null;
    }
    this.state = { ...this.state, timedChoiceDeadline: null };
    this.unlockAudio();
    this.audio.playDice();
    const r = resolveSkillCheck(this.state, scene);
    if (!r.breakdown) return;
    const fail = !r.breakdown.success;
    const circulo = this.state.reputation.circulo ?? 0;
    const canReroll =
      fail &&
      hasFactionPerkUnlocked(circulo) &&
      this.state.circuloSkillRerollReady &&
      !!scene.frontmatter.skillCheck;
    const preRollState: GameState = { ...r.state, sceneId: scene.id };
    const reroll = canReroll
      ? { preRollState, rolledScene: scene, rollKind: 'skill' as const }
      : undefined;
    this.pendingStoryDiceRoll = { nextState: r.state, breakdown: r.breakdown, reroll };
    this.render();
  }

  private onDualAttrSkillRoll(scene: LoadedScene): void {
    if (this.pendingStoryDiceRoll) return;
    if (this.timedTimer) {
      clearTimeout(this.timedTimer);
      this.timedTimer = null;
    }
    this.state = { ...this.state, timedChoiceDeadline: null };
    this.unlockAudio();
    this.audio.playDice();
    const r = resolveDualAttrSkillCheck(this.state, scene);
    if (!r.breakdown) return;
    const afterRoll: GameState = {
      ...r.state,
      visitedScenes: { ...r.state.visitedScenes, [scene.id]: true },
    };
    const fail = !r.breakdown.success;
    const circulo = this.state.reputation.circulo ?? 0;
    const canReroll =
      fail &&
      hasFactionPerkUnlocked(circulo) &&
      this.state.circuloSkillRerollReady &&
      !!scene.frontmatter.dualAttrSkillCheck;
    const preRollState: GameState = { ...r.state, sceneId: scene.id };
    const reroll = canReroll
      ? { preRollState, rolledScene: scene, rollKind: 'dualSkill' as const }
      : undefined;
    this.pendingStoryDiceRoll = { nextState: afterRoll, breakdown: r.breakdown, reroll };
    this.render();
  }

  private onCirculoSkillDiceReroll(): void {
    const p = this.pendingStoryDiceRoll;
    if (!p?.reroll) return;
    this.clearDiceRollTimers();
    if (this.diceRollEnterHandler) {
      window.removeEventListener('keydown', this.diceRollEnterHandler);
      this.diceRollEnterHandler = null;
    }
    this.unlockAudio();
    this.audio.playUiClick();
    this.audio.playDice();
    const ctx = this.ctx();
    const { preRollState, rolledScene, rollKind } = p.reroll;
    let s = applyEffects(preRollState, [{ op: 'addRep', faction: 'circulo', delta: CIRCULO_SKILL_REROLL_REP_COST }], ctx);
    s = { ...s, circuloSkillRerollReady: false };
    if (rollKind === 'skill') {
      const r = resolveSkillCheck(s, rolledScene);
      if (!r.breakdown) {
        this.pendingStoryDiceRoll = null;
        this.state = this.stabilize(s);
        this.render();
        return;
      }
      this.pendingStoryDiceRoll = { nextState: r.state, breakdown: r.breakdown };
    } else if (rollKind === 'dualSkill') {
      const r = resolveDualAttrSkillCheck(s, rolledScene);
      if (!r.breakdown) {
        this.pendingStoryDiceRoll = null;
        this.state = this.stabilize(s);
        this.render();
        return;
      }
      const afterRoll: GameState = {
        ...r.state,
        visitedScenes: { ...r.state.visitedScenes, [rolledScene.id]: true },
      };
      this.pendingStoryDiceRoll = { nextState: afterRoll, breakdown: r.breakdown };
    } else {
      const r = resolveLuckCheck(s, rolledScene, this.registry.data);
      if (!r.breakdown) {
        this.pendingStoryDiceRoll = null;
        this.state = this.stabilize(s);
        this.render();
        return;
      }
      const afterRoll: GameState = {
        ...r.state,
        visitedScenes: { ...r.state.visitedScenes, [rolledScene.id]: true },
      };
      this.pendingStoryDiceRoll = { nextState: afterRoll, breakdown: r.breakdown };
    }
    this.render();
  }

  private onLuckRoll(scene: LoadedScene): void {
    if (this.pendingStoryDiceRoll) return;
    if (this.timedTimer) {
      clearTimeout(this.timedTimer);
      this.timedTimer = null;
    }
    this.state = { ...this.state, timedChoiceDeadline: null };
    this.unlockAudio();
    this.audio.playDice();
    const r = resolveLuckCheck(this.state, scene, this.registry.data);
    if (!r.breakdown) return;
    const fail = !r.breakdown.success;
    const circulo = this.state.reputation.circulo ?? 0;
    const canReroll =
      fail &&
      hasFactionPerkUnlocked(circulo) &&
      this.state.circuloSkillRerollReady &&
      !!scene.frontmatter.luckCheck;
    const preRollState: GameState = { ...r.state, sceneId: scene.id };
    const reroll = canReroll
      ? { preRollState, rolledScene: scene, rollKind: 'luck' as const }
      : undefined;
    const afterRoll: GameState = {
      ...r.state,
      visitedScenes: { ...r.state.visitedScenes, [scene.id]: true },
    };
    this.pendingStoryDiceRoll = { nextState: afterRoll, breakdown: r.breakdown, reroll };
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
    saveStateToSlot(this.campaignId, slot, this.state, this.devMode);
    this.closeMenu();
    this.render();
  }

  private loadFromSlot(slot: number): void {
    this.unlockAudio();
    if (slot < 1 || slot > saveSlotLimit(this.devMode)) return;
    try {
      const raw = readSaveSlotRaw(this.campaignId, slot);
      if (!raw?.trim()) {
        this.showToast('Este slot está vazio.', 'error');
        return;
      }
      const parsed = deserializeState(raw);
      if (parsed.campaignId !== this.campaignId) {
        this.showToast(
          `Esta gravação é da campanha "${parsed.campaignId}". Campanha ativa: "${this.campaignId}".`,
          'error'
        );
        this.closeMenu();
        return;
      }
      this.state = parsed;
      this.state = this.stabilize(this.state);
      this.applyReturnRewardIfNeededForLoadedSlot(slot);
      this.render();
    } catch {
      this.showToast('Não foi possível carregar esta gravação.', 'error');
    }
    this.closeMenu();
  }

  private closeMenu(): void {
    if (this.menuFocusTrapRelease) {
      this.menuFocusTrapRelease();
      this.menuFocusTrapRelease = null;
    }
    const wasOpen = this.menuOpen;
    this.menuOpen = false;
    this.syncMenuScrollLock();
    const drawer =
      this.chromeRefs?.menuDrawer ?? this.root.querySelector<HTMLElement>('.menu-drawer');
    const backdrop = this.root.querySelector<HTMLElement>('.menu-backdrop');
    const hBtn =
      this.chromeRefs?.hamburgerBtn ?? this.root.querySelector<HTMLButtonElement>('.hamburger');
    drawer?.classList.remove('open');
    drawer?.setAttribute('aria-hidden', 'true');
    backdrop?.classList.remove('open');
    hBtn?.setAttribute('aria-expanded', 'false');
    if (wasOpen) {
      hBtn?.focus();
    }
  }

  private syncMenuScrollLock(): void {
    const lock = this.menuOpen;
    document.body.style.overflow = lock ? 'hidden' : '';
    document.documentElement.style.overflow = lock ? 'hidden' : '';
  }

  private syncTopBarCollapsePresentation(): void {
    const refs = this.chromeRefs;
    if (!refs) return;
    refs.topBarEl.hidden = this.topBarCollapsed;
    refs.edgeRail.hidden = !this.topBarCollapsed;
  }

  private toggleMenu(): void {
    if (this.menuOpen) {
      this.closeMenu();
      return;
    }
    this.menuOpen = true;
    this.syncMenuScrollLock();
    const drawer =
      this.chromeRefs?.menuDrawer ?? this.root.querySelector<HTMLElement>('.menu-drawer');
    const backdrop = this.root.querySelector<HTMLElement>('.menu-backdrop');
    const hBtn =
      this.chromeRefs?.hamburgerBtn ?? this.root.querySelector<HTMLButtonElement>('.hamburger');
    drawer?.classList.add('open');
    drawer?.setAttribute('aria-hidden', 'false');
    backdrop?.classList.add('open');
    hBtn?.setAttribute('aria-expanded', 'true');
    this.unlockAudio();
    window.requestAnimationFrame(() => {
      this.focusFirstInMenuDrawer();
      if (drawer) {
        if (this.menuFocusTrapRelease) this.menuFocusTrapRelease();
        this.menuFocusTrapRelease = attachFocusTrap(drawer);
      }
    });
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

  private syncFullscreenTopBarButton(): void {
    const btn = this.chromeRefs?.fullscreenTopBtn;
    if (!btn) return;
    if (btn.disabled || !this.isFullscreenSupported()) {
      btn.removeAttribute('aria-pressed');
      return;
    }
    const active = this.getFullscreenElement() != null;
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    btn.setAttribute('aria-label', active ? 'Sair do ecrã inteiro' : 'Ecrã inteiro');
    btn.title = active ? 'Sair do ecrã inteiro (Esc)' : 'Ecrã inteiro';
  }

  private syncFullscreenUi(): void {
    this.syncFullscreenCheckbox();
    this.syncFullscreenTopBarButton();
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
        const prevDiaryQueueLen = this.diaryEntryQueue.length;
        const prevStatusQueueLen = this.statusHighlightQueue.length;
        const prevItemAcquireQueueLen = this.itemAcquireQueue.length;
        let s: GameState = { ...nextState, timedChoiceDeadline: null };
        if (s.sceneId !== prevScene) {
          s = tickActiveBuffs(s);
        }
        this.state = this.stabilize(s);
        this.trimOverlayQueuesIfSceneChanged(
          prevScene,
          prevDiaryQueueLen,
          prevStatusQueueLen,
          prevItemAcquireQueueLen
        );
        this.audio.playUiClick();
        this.render();
      },
      playCheckSuccess: () => this.audio.playCheckSuccess(),
      playCheckFail: () => this.audio.playCheckFail(),
      onCirculoDiceReroll: () => this.onCirculoSkillDiceReroll(),
    };
  }

  private flushSceneArtHighlightIfInterrupted(): void {
    const sid = this.activeSceneArtHighlight;
    if (sid == null) return;
    this.activeSceneArtHighlight = null;
    if (this.state.sceneArtHighlightShown[sid]) return;
    this.state = {
      ...this.state,
      sceneArtHighlightShown: { ...this.state.sceneArtHighlightShown, [sid]: true },
    };
  }

  private buildSceneArtHighlightPayload(scene: LoadedScene): StoryRenderContext['sceneArtHighlight'] {
    const fm = scene.frontmatter;
    if (fm.highlight !== true) return null;
    const s = this.state;
    if (s.sceneArtHighlightShown[scene.id]) return null;
    const artText = resolveSceneArt(this.registry, scene);
    if (!artText) return null;
    if (!this.sceneArtHighlightEnabled) {
      this.state = {
        ...this.state,
        sceneArtHighlightShown: { ...this.state.sceneArtHighlightShown, [scene.id]: true },
      };
      return null;
    }
    const gen = this.sceneArtHighlightGen;
    const sid = scene.id;
    return {
      sceneId: sid,
      artText,
      onBegin: () => {
        this.activeSceneArtHighlight = sid;
      },
      onEnd: () => {
        this.activeSceneArtHighlight = null;
        this.state = {
          ...this.state,
          sceneArtHighlightShown: { ...this.state.sceneArtHighlightShown, [sid]: true },
        };
        this.render();
      },
      isCurrentGeneration: () => this.sceneArtHighlightGen === gen,
    };
  }

  private buildStoryRenderContext(scene: LoadedScene): StoryRenderContext {
    const sceneArtHighlight = this.buildSceneArtHighlightPayload(scene);
    return {
      campaignId: this.campaignId,
      devMode: this.devMode,
      timedChoiceEnabled: this.timedChoiceMode,
      state: this.state,
      registry: this.registry,
      scene,
      sceneArtHighlight,
      sessionObjective: this.sessionObjectiveVisible ? this.buildSessionObjective() : null,
      onboardingPrimer:
        this.onboardingPrimerVisible && this.state.chapter === 1 && this.state.day <= 2
          ? {
              onDismiss: () => {
                this.onboardingPrimerVisible = false;
                saveOnboardingPrimerVisible(this.storageKeys.onboardingPrimerKey, this.onboardingPrimerVisible);
              },
            }
          : null,
      overlay: {
        pendingStoryDiceRoll: this.pendingStoryDiceRoll,
        storyDiceHost: this.storyDiceHostBinding(),
        faithMiraclePending: this.faithMiraclePending,
        setFaithMiraclePending: (v) => {
          this.faithMiraclePending = v;
        },
        statusHighlightQueue: this.statusHighlightQueue,
        statusHighlightExitStaggerMs: STORY_BANNER_BETWEEN_DISMISS_MS,
        setStatusHighlightQueue: (q) => {
          this.cancelStatusHighlightDismissalPipeline();
          this.statusHighlightQueue = q;
        },
        requestStatusHighlightStackDismiss: () => {
          this.beginStatusHighlightStackDismiss();
        },
        itemAcquireQueue: this.itemAcquireQueue,
        diaryEntryQueue: this.diaryEntryQueue,
        diaryBannerExiting: this.diaryBannerExiting,
        itemAcquireBannerExiting: this.itemAcquireBannerExiting,
        setDiaryEntryQueue: (q) => {
          this.cancelDiaryBannerPipeline();
          this.diaryEntryQueue = q;
        },
        requestDiaryBannerDismiss: () => {
          this.beginDiaryBannerDismiss();
        },
        requestItemAcquireBannerDismiss: () => {
          this.beginItemAcquireBannerDismiss();
        },
      },
      audio: {
        unlockAudio: () => this.unlockAudio(),
        playUiClick: () => this.audio.playUiClick(),
        playLevelUpCelebration: () => this.audio.playLevelUpCelebration(),
        playPathPromotion: () => this.audio.playPathPromotion(),
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
          const prevScene = this.state.sceneId;
          const prevDiaryQueueLen = this.diaryEntryQueue.length;
          const prevStatusQueueLen = this.statusHighlightQueue.length;
          const prevItemAcquireQueueLen = this.itemAcquireQueue.length;
          this.state = this.stabilize({
            ...applyEffects(this.state, effects, this.ctx()),
            timedChoiceDeadline: null,
          });
          this.trimOverlayQueuesIfSceneChanged(
            prevScene,
            prevDiaryQueueLen,
            prevStatusQueueLen,
            prevItemAcquireQueueLen
          );
          this.render();
        },
      },
      setTimedChoiceTimer: (t) => {
        this.timedTimer = t;
      },
      onTimedChoiceScheduled: (deadlineEpochMs) => {
        this.state = { ...this.state, timedChoiceDeadline: deadlineEpochMs };
      },
    };
  }

  private render(): void {
    this.flushSceneArtHighlightIfInterrupted();
    this.sceneArtHighlightGen += 1;
    if (this.state.mode === 'combat' || !this.timedChoiceMode) {
      if (this.state.timedChoiceDeadline != null) {
        this.state = { ...this.state, timedChoiceDeadline: null };
      }
    }
    if (this.timedTimer) {
      clearTimeout(this.timedTimer);
      this.timedTimer = null;
    }
    this.clearDiceRollTimers();
    this.syncSidebarDisclosureSections();
    if (this.state.mode !== 'combat') {
      this.combatLogCursor = { encounterId: '', index: 0 };
      this.flushBossTwistOverlayOnLeaveCombat();
    }

    const headerTitle = formatCampaignHeaderTitle(this.registry.data.campaign, this.state.chapter);
    document.title = headerTitle;

    const chromeOpts = {
      headerTitle,
      gameVersion: GAME_VERSION,
      fontStep: this.fontStep,
      campaignId: this.campaignId,
      devMode: this.devMode,
      timedChoiceEnabled: this.timedChoiceMode,
      sceneArtHighlightEnabled: this.sceneArtHighlightEnabled,
      state: this.state,
      registry: this.registry,
      sidebarSections: this.sidebarSections,
      onMenuHamburgerClick: (hBtn: HTMLButtonElement) => {
        this.toggleMenu();
        hBtn.setAttribute('aria-expanded', this.menuOpen ? 'true' : 'false');
      },
      onMenuBackdropClick: (hBtn: HTMLButtonElement) => {
        this.closeMenu();
        hBtn.setAttribute('aria-expanded', 'false');
      },
      getVolume: () => this.audio.getVolume(),
      setVolume: (n: number) => this.audio.setVolume(n),
      onDevModeChange: (v: boolean) => {
        this.devMode = v;
        saveDevMode(this.storageKeys.devModeKey, this.devMode);
        this.closeMenu();
        this.render();
      },
      onTimedChoiceChange: (v: boolean) => {
        this.timedChoiceMode = v;
        saveTimedChoiceMode(this.storageKeys.timedChoiceKey, this.timedChoiceMode);
        this.closeMenu();
        this.render();
      },
      onSceneArtHighlightChange: (v: boolean) => {
        this.sceneArtHighlightEnabled = v;
        saveSceneArtHighlightEnabled(this.storageKeys.sceneArtHighlightKey, this.sceneArtHighlightEnabled);
        this.closeMenu();
        this.render();
      },
      onCycleFont: () => this.cycleFontSize(),
      fullscreenSupported: this.isFullscreenSupported(),
      getFullscreenActive: () => this.getFullscreenElement() != null,
      onFullscreenChange: async (want: boolean) => {
        if (want) {
          await this.requestGameFullscreen();
        } else {
          await this.exitGameFullscreen();
        }
      },
      onExportSave: () => this.exportSaveToClipboard(),
      onImportSave: () => this.importSaveFromClipboard(),
      onCredits: () => this.showCredits(),
      onChronicle: () => {
        this.unlockAudio();
        openChronicleModal({
          state: this.state,
          campaign: this.registry.data.campaign,
          playUiClick: () => this.audio.playUiClick(),
        });
        this.closeMenu();
      },
      onDevTools: () => {
        window.location.href = buildDevToolsHref(this.campaignId, 'scenes');
      },
      onScenesGraph: () => {
        window.location.href = buildScenesGraphHref(this.campaignId);
      },
      showImportInPartida: this.devMode,
      showGraphInSettings: this.devMode,
      showDevModeToggle: this.isLocalhostHost(),
      onSaveSlot: (slot: number) => this.saveToSlot(slot),
      onLoadSlot: (slot: number) => this.loadFromSlot(slot),
      onSidebarSectionToggle: (key: string, open: boolean) => {
        if (open && !this.canOpenSidebarSection(key)) {
          return;
        }
        this.sidebarSections[key] = open;
        saveSidebarSections(this.storageKeys.sidebarKey, this.sidebarSections);
      },
      playUiClick: () => this.audio.playUiClick(),
      fillMain: (main: HTMLElement) => {
        if (this.state.mode === 'combat') {
          main.classList.add('main--combat');
          renderCombatInto(main, {
            state: this.state,
            registry: this.registry,
            bus: this.bus,
            audio: this.audio,
            combatLog: {
              soundCursor: this.combatLogCursor,
              fxCursor: this.combatLogCursor,
              setSoundCursor: (v) => {
                this.combatLogCursor = v;
              },
            },
            lifecycle: {
              unlockAudio: () => this.unlockAudio(),
              stabilize: (s) => this.stabilize(s),
              commitState: (s) => {
                const prevScene = this.state.sceneId;
                const prevDiaryQueueLen = this.diaryEntryQueue.length;
                const prevStatusQueueLen = this.statusHighlightQueue.length;
                const prevItemAcquireQueueLen = this.itemAcquireQueue.length;
                this.state = this.stabilize(s);
                this.trimOverlayQueuesIfSceneChanged(
                  prevScene,
                  prevDiaryQueueLen,
                  prevStatusQueueLen,
                  prevItemAcquireQueueLen
                );
                this.render();
              },
            },
            onBossTwistReveal: (messages) => this.enqueueBossTwistReveal(messages),
          });
        } else {
          const scene = this.registry.getScene(this.state.sceneId);
          if (!scene) {
            main.innerHTML = `<div class="shell error">Cena não encontrada: <code>${this.state.sceneId}</code></div>`;
          } else {
            renderStoryInto(main, this.buildStoryRenderContext(scene));
          }
        }
        const scrollKey = `${this.state.mode}:${this.state.sceneId}`;
        const storyScrollToTop =
          this.state.mode === 'story' &&
          (this.pendingStoryMainScrollTop || scrollKey !== this.lastMainScrollResetKey);
        const nonStoryScrollToTop =
          this.state.mode !== 'story' && scrollKey !== this.lastMainScrollResetKey;
        if (storyScrollToTop || nonStoryScrollToTop) {
          main.scrollTop = 0;
          this.lastMainScrollResetKey = scrollKey;
          this.pendingStoryMainScrollTop = false;
        }
        // `story-main` tem `tabIndex=-1` (atalho “Ir para a história”); ao substituir o DOM, o foco pode ficar no `<main>`.
        if (document.activeElement === main) {
          main.blur();
        }
      },
    };

    if (this.chromeRefs == null) {
      this.chromeRefs = mountAppChrome(this.root, chromeOpts);
    } else {
      syncAppChrome(this.chromeRefs, chromeOpts);
    }
    this.syncTopBarCollapsePresentation();

    if (
      this.state.lastCombatXpGain != null ||
      this.state.lastCombatLevelUps != null ||
      this.state.lastCombatLootLines != null ||
      this.state.lastPathPromotion != null
    ) {
      this.state = {
        ...this.state,
        lastCombatXpGain: null,
        lastCombatLevelUps: null,
        lastCombatLootLines: null,
        lastPathPromotion: null,
      };
    }
    this.syncAmbientTheme();
    this.syncAppFullscreenLayout();
    this.syncFullscreenUi();
    this.syncVisualTheme();
  }

}

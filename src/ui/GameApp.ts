import { ContentRegistry } from '../content/registry.ts';
import { createInitialState, deserializeState, serializeState } from '../engine/core/state.ts';
import { EventBus, type GameEvent } from '../engine/core/eventBus.ts';
import {
  enterScene,
  resolveLuckCheck,
  resolveDualAttrSkillCheck,
  resolveSkillCheck,
  type LoadedScene,
  type StoryDiceRollBreakdown,
} from '../engine/core/sceneRuntime.ts';
import { applyEffects } from '../engine/core/effects.ts';
import {
  explorationMoveEffects,
  pickWeightedEncounterId,
  shouldTriggerEncounter,
  startExplorationCombatEffects,
} from '../engine/world/exploration.ts';
import { tickActiveBuffs } from '../engine/progression/leadStats.ts';
import type { Choice, Effect, GameState } from '../engine/schema/index.ts';
import { migrateLegacyKnownSpells } from '../engine/progression/spellsKnown.ts';
import { GameAudio, type AmbientTheme } from './sound/index.ts';
import { buildDevToolsHref, buildScenesGraphHref } from './campaignUrl.ts';
import {
  saveSlotLimit,
  migrateLegacySaveIfNeeded as migrateLegacySaveSlot,
  saveStateToSlot,
  readRawSlot as readSaveSlotRaw,
} from './gameAppSaveSlots.ts';
import { renderCombatInto } from './gameAppCombat.ts';
import {
  renderStoryInto,
  resolveSceneArt,
  type StoryDiceBannerHost,
  type StoryRenderContext,
} from './gameAppStory.ts';
import { formatCampaignHeaderTitle } from './campaignHeaderTitle.ts';
import { mountAppChrome, syncAppChrome, type AppChromeRefs } from './gameAppShell.ts';
import { openCreditsModal } from './gameAppSidebar.ts';
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
  private readonly timedChoiceKey: string;
  private readonly sceneArtHighlightKey: string;
  private readonly devModeKey: string;
  private readonly onboardingPrimerKey: string;
  private readonly returnRewardDateKey: string;
  private readonly legacyBriefingKey: string;
  private registry: ContentRegistry;
  private bus = new EventBus();
  private audio: GameAudio;
  private state: GameState;
  private root: HTMLElement;
  private chromeRefs: AppChromeRefs | null = null;
  /** `mode:sceneId` após último `scrollTop = 0` em `main` — evita reset em re-render da mesma cena. */
  private lastMainScrollResetKey: string | null = null;
  private timedTimer: ReturnType<typeof setTimeout> | null = null;
  private menuOpen = false;
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
  private readonly choiceHotkeyHandler: (e: KeyboardEvent) => void;
  /** Secções colapsáveis (recursos, inventário, facções, personagem…) — persistido em sessionStorage */
  private sidebarSections: Record<string, boolean> = {};
  /** Buffs/debuffs/marcas — mostra banner até o jogador fechar */
  private statusHighlightQueue: Extract<GameEvent, { type: 'statusHighlight' }>[] = [];
  /** Itens recém-adquiridos (grantItem) — mostra banner até o jogador fechar */
  private itemAcquireQueue: string[] = [];
  /** Entradas novas de diário (`addDiary`) — banner até fechar */
  private diaryEntryQueue: string[] = [];
  /** Milagre de fé após quase-morte em combate — banner até fechar */
  private faithMiraclePending = false;
  /** Só reproduz efeitos de som para entradas novas do log de combate */
  private combatLogSoundCursor: { encounterId: string; index: number } = { encounterId: '', index: 0 };
  /** Mesmo slice do log que `combatLogSoundCursor` — animações FX por entrada nova. */
  private combatLogFxCursor: { encounterId: string; index: number } = { encounterId: '', index: 0 };
  /** Rola teste de perícia/sorte: estado só aplica após o overlay (dados já resolvidos no motor). */
  private pendingStoryDiceRoll: {
    nextState: GameState;
    breakdown: StoryDiceRollBreakdown;
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
    this.sidebarKey = `${campaignId}_sidebar_sections_v1`;
    this.fontKey = `${campaignId}_font_step_v1`;
    this.timedChoiceKey = `${campaignId}_timed_choice_v1`;
    this.sceneArtHighlightKey = `${campaignId}_scene_art_highlight_v1`;
    this.devModeKey = `${campaignId}_dev_mode`;
    this.onboardingPrimerKey = `${campaignId}_onboarding_primer_v1`;
    this.returnRewardDateKey = `${campaignId}_return_reward_date_v1`;
    this.legacyBriefingKey = `${campaignId}_legacy_briefing_v1`;
    this.registry = new ContentRegistry(campaignId);
    this.audio = new GameAudio(campaignId);
    this.fontStep = this.loadFontStep();
    this.timedChoiceMode = this.loadTimedChoiceMode();
    this.sceneArtHighlightEnabled = this.loadSceneArtHighlightEnabled();
    this.devMode = this.loadDevMode();
    this.onboardingPrimerVisible = this.loadOnboardingPrimerVisible();
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
      if (ev.type === 'xp.gained' && ev.amount > 0 && this.state.mode === 'story') {
        this.statusHighlightQueue.push({
          type: 'statusHighlight',
          variant: 'good',
          title: `+${ev.amount} XP`,
          subtitle: 'Experiência recebida',
        });
        this.unlockAudio();
      }
      if (ev.type === 'diary.entryAdded') {
        this.diaryEntryQueue.push(ev.text);
        this.unlockAudio();
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
    this.applyReturnRewardIfNeeded();
    this.applyLegacyBriefingIfNeeded();
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

  private loadSceneArtHighlightEnabled(): boolean {
    try {
      return localStorage.getItem(this.sceneArtHighlightKey) !== '0';
    } catch {
      return true;
    }
  }

  private saveSceneArtHighlightEnabled(): void {
    try {
      localStorage.setItem(this.sceneArtHighlightKey, this.sceneArtHighlightEnabled ? '1' : '0');
    } catch {
      /* noop */
    }
  }

  private loadOnboardingPrimerVisible(): boolean {
    try {
      return localStorage.getItem(this.onboardingPrimerKey) !== '0';
    } catch {
      return true;
    }
  }

  private saveOnboardingPrimerVisible(): void {
    try {
      localStorage.setItem(this.onboardingPrimerKey, this.onboardingPrimerVisible ? '1' : '0');
    } catch {
      /* noop */
    }
  }

  private applyReturnRewardIfNeeded(): void {
    const today = new Date().toISOString().slice(0, 10);
    try {
      if (localStorage.getItem(this.returnRewardDateKey) === today) return;
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
      localStorage.setItem(this.returnRewardDateKey, today);
      this.statusHighlightQueue.push({
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
      if (localStorage.getItem(this.legacyBriefingKey) === stamp) return;
      const topTitle = legacy.titles[legacy.titles.length - 1];
      if (topTitle) {
        this.statusHighlightQueue.push({
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
      localStorage.setItem(this.legacyBriefingKey, stamp);
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
    openCreditsModal({
      campaignName: this.registry.data.campaign.name,
      gameVersion: GAME_VERSION,
      playUiClick: () => this.audio.playUiClick(),
    });
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

  private canOpenSidebarSection(key: string): boolean {
    const visitedCount = Object.keys(this.state.visitedScenes).length;
    if (key === 'inventario') {
      return this.state.chapter >= 2 || visitedCount >= 6;
    }
    if (key === 'faccoes') {
      const rep = this.state.reputation;
      const repTouched = rep.vigilia !== 0 || rep.circulo !== 0 || rep.culto !== 0;
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
    if (changed) this.saveSidebarSections();
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
    if (sceneTheme) {
      // Act 2 mantém a base "explore", mas com arranjo um pouco mais tenso.
      if (sceneTheme === 'explore' && this.state.chapter === 2) return 'act2';
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
    const effs: Effect[] = [
      { op: 'adjustLeadStress', delta: 1 },
      { op: 'setExploration', graphId: ex.graphId, nodeId: edge.to },
    ];
    if (toNode.isGoal) {
      effs.push({
        op: 'setFlag',
        key: toNode.goalFlag ?? 'act2_explore_goal_reached',
        value: true,
      });
    }
    let s = applyEffects(this.state, effs, this.ctx());
    s = { ...s, timedChoiceDeadline: null };
    const roll = shouldTriggerEncounter(s, edge.encounterChance);
    s = { ...s, rngSeed: roll.nextSeed };
    if (!roll.trigger) {
      this.state = this.stabilize(s);
      this.render();
      return;
    }
    const pick = pickWeightedEncounterId(s.rngSeed);
    s = { ...s, rngSeed: pick.nextSeed };
    s = applyEffects(s, startExplorationCombatEffects(pick.encounterId), this.ctx());
    this.state = this.stabilize(s);
    this.render();
  }

  private applyExplorationForcedCombat(): void {
    if (!this.state.exploration) return;
    const pick = pickWeightedEncounterId(this.state.rngSeed);
    let s: GameState = { ...this.state, rngSeed: pick.nextSeed, timedChoiceDeadline: null };
    s = applyEffects(s, startExplorationCombatEffects(pick.encounterId), this.ctx());
    this.state = this.stabilize(s);
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
    if (id === 'explore_force') {
      this.applyExplorationForcedCombat();
      return;
    }
    const prevScene = this.state.sceneId;
    const prevDiaryQueueLen = this.diaryEntryQueue.length;
    const prevStatusQueueLen = this.statusHighlightQueue.length;
    let s = applyEffects(this.state, choice.effects, this.ctx());
    s = { ...s, timedChoiceDeadline: null };
    if (choice.next && s.mode === 'story') {
      s = { ...s, sceneId: choice.next };
    }
    if (s.sceneId !== prevScene) {
      s = tickActiveBuffs(s);
    }
    this.state = this.stabilize(s);
    if (this.state.sceneId !== prevScene) {
      this.sessionObjectiveVisible = false;
      this.diaryEntryQueue = this.diaryEntryQueue.slice(prevDiaryQueueLen);
      this.statusHighlightQueue = this.statusHighlightQueue.slice(prevStatusQueueLen);
    }
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
    this.pendingStoryDiceRoll = { nextState: r.state, breakdown: r.breakdown };
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
    this.pendingStoryDiceRoll = { nextState: afterRoll, breakdown: r.breakdown };
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
    const hBtn = this.root.querySelector<HTMLButtonElement>('.hamburger');
    drawer?.classList.remove('open');
    drawer?.setAttribute('aria-hidden', 'true');
    backdrop?.classList.remove('open');
    hBtn?.setAttribute('aria-expanded', 'false');
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
    const hBtn = this.root.querySelector<HTMLButtonElement>('.hamburger');
    if (this.menuOpen) {
      drawer?.classList.add('open');
      drawer?.setAttribute('aria-hidden', 'false');
      backdrop?.classList.add('open');
      hBtn?.setAttribute('aria-expanded', 'true');
      this.unlockAudio();
    } else {
      drawer?.classList.remove('open');
      drawer?.setAttribute('aria-hidden', 'true');
      backdrop?.classList.remove('open');
      hBtn?.setAttribute('aria-expanded', 'false');
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
        let s: GameState = { ...nextState, timedChoiceDeadline: null };
        if (s.sceneId !== prevScene) {
          s = tickActiveBuffs(s);
        }
        this.state = this.stabilize(s);
        if (this.state.sceneId !== prevScene) {
          this.sessionObjectiveVisible = false;
          this.diaryEntryQueue = this.diaryEntryQueue.slice(prevDiaryQueueLen);
          this.statusHighlightQueue = this.statusHighlightQueue.slice(prevStatusQueueLen);
        }
        this.audio.playUiClick();
        this.render();
      },
      playCheckSuccess: () => this.audio.playCheckSuccess(),
      playCheckFail: () => this.audio.playCheckFail(),
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
                this.saveOnboardingPrimerVisible();
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
        setStatusHighlightQueue: (q) => {
          this.statusHighlightQueue = q;
        },
        itemAcquireQueue: this.itemAcquireQueue,
        setItemAcquireQueue: (q) => {
          this.itemAcquireQueue = q;
        },
        diaryEntryQueue: this.diaryEntryQueue,
        setDiaryEntryQueue: (q) => {
          this.diaryEntryQueue = q;
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
          this.state = this.stabilize({
            ...applyEffects(this.state, effects, this.ctx()),
            timedChoiceDeadline: null,
          });
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
      this.combatLogSoundCursor = { encounterId: '', index: 0 };
      this.combatLogFxCursor = { encounterId: '', index: 0 };
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
        this.saveDevMode();
        this.closeMenu();
        this.render();
      },
      onTimedChoiceChange: (v: boolean) => {
        this.timedChoiceMode = v;
        this.saveTimedChoiceMode();
        this.closeMenu();
        this.render();
      },
      onSceneArtHighlightChange: (v: boolean) => {
        this.sceneArtHighlightEnabled = v;
        this.saveSceneArtHighlightEnabled();
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
        this.saveSidebarSections();
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
              soundCursor: this.combatLogSoundCursor,
              fxCursor: this.combatLogFxCursor,
              setSoundCursor: (v) => {
                this.combatLogSoundCursor = v;
                this.combatLogFxCursor = v;
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
        const scrollKey = `${this.state.mode}:${this.state.sceneId}`;
        if (scrollKey !== this.lastMainScrollResetKey) {
          main.scrollTop = 0;
          this.lastMainScrollResetKey = scrollKey;
        }
      },
    };

    if (this.chromeRefs == null) {
      this.chromeRefs = mountAppChrome(this.root, chromeOpts);
    } else {
      syncAppChrome(this.chromeRefs, chromeOpts);
    }

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

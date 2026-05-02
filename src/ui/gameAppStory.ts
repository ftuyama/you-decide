import {
  buildStoryChoiceRows,
  renderSceneBody,
  type GameEvent,
  type LoadedScene,
  type StoryChoiceRow,
  type StoryDiceRollBreakdown,
} from '../engine/core/index.ts';
import type { Choice, GameState } from '../engine/schema/index.ts';
import type { ContentRegistry } from '../content/registry.ts';
import { formatLevelUpDeltaLine, randomCampCombatHint } from './gameAppUtils.ts';
import { appendStoryMapPanel } from './storyMapPanel.ts';
import {
  appendCampEquipmentPanel,
  type CampEquipmentCallbacks,
} from './story/storyCampEquipmentPanel.ts';
import { appendStoryDiceRollBanner, type StoryDiceBannerHost } from './story/storyDiceBanner.ts';
import { resolveSceneArt } from './story/storyArt.ts';
import { appendFaithMiracleBanner } from './story/storyFaithMiracleBanner.ts';
import { setupTimedChoices } from './story/storyTimedChoices.ts';
import { applyChoiceButtonLabel } from './story/choicePresentation.ts';
import {
  groupStoryChoiceRowsByUiSection,
  shouldUseChoiceSectionLayout,
} from './story/choiceSections.ts';

export { isCampEquipmentScene } from './story/storyCampEquipmentPanel.ts';
export { resolveSceneArtFromFrontmatter, resolveSceneArt } from './story/storyArt.ts';

function buildExplorationMovementRows(
  state: GameState,
  registry: ContentRegistry
): StoryChoiceRow[] {
  const ex = state.exploration;
  const getG = registry.ui.getExplorationGraph;
  if (!ex || !getG) return [];
  const graph = getG(ex.graphId);
  if (!graph) return [];
  const node = graph.nodes.find((n) => n.id === ex.nodeId);
  if (!node) return [];
  const lead = state.party[0];
  const atMaxStress = lead !== undefined && lead.stress >= 4;
  const rows: StoryChoiceRow[] = [];
  for (const edge of node.edges) {
    const preview = 'Stress +1 · possível encontro';
    if (atMaxStress) {
      rows.push({
        kind: 'locked',
        choice: {
          id: `explore_move_${edge.id}`,
          text: edge.text,
          preview,
          effects: [],
          uiSection: 'Navegação',
        },
        hint: 'Stress no máximo — não consegues avançar pelos túneis.',
      });
    } else {
      rows.push({
        kind: 'enabled',
        choice: {
          id: `explore_move_${edge.id}`,
          text: edge.text,
          preview,
          effects: [],
          uiSection: 'Navegação',
        },
      });
    }
  }
  return rows;
}

export type { CampEquipmentCallbacks } from './story/storyCampEquipmentPanel.ts';
export type { StoryDiceBannerHost } from './story/storyDiceBanner.ts';

/** Fila de destaques na história: tokens TTL + fade geridos no `GameApp`. */
export type StoryStatusHighlightRow = Extract<GameEvent, { type: 'statusHighlight' }> & {
  dismissToken?: number;
  exiting?: boolean;
};

export type StoryOverlayState = {
  pendingStoryDiceRoll: { nextState: GameState; breakdown: StoryDiceRollBreakdown } | null;
  storyDiceHost: StoryDiceBannerHost;
  faithMiraclePending: boolean;
  setFaithMiraclePending: (v: boolean) => void;
  statusHighlightQueue: StoryStatusHighlightRow[];
  setStatusHighlightQueue: (q: StoryStatusHighlightRow[]) => void;
  itemAcquireQueue: string[];
  diaryEntryQueue: string[];
  setDiaryEntryQueue: (q: string[]) => void;
  diaryBannerExiting: boolean;
  itemAcquireBannerExiting: boolean;
};

/** Overlay automático: arte em tela cheia (~1s + fade); `onBegin`/`onEnd` ligam ao ciclo de vida no GameApp. */
export type SceneArtHighlightPayload = {
  sceneId: string;
  artText: string;
  onBegin: () => void;
  onEnd: () => void;
  /** Invalida timeouts se `render()` voltar a correr (novo valor de `sceneArtHighlightGen`). */
  isCurrentGeneration: () => boolean;
};

export type StoryRenderContext = {
  campaignId: string;
  devMode: boolean;
  /** Se true, escolhas com `timedMs` + `fallbackNext` ou `fallbackEffects` disparam barra e auto-navegação. */
  timedChoiceEnabled: boolean;
  /** Grava `timedChoiceDeadline` ao agendar (para sobreviver a `render()` sem reiniciar o relógio). */
  onTimedChoiceScheduled: (deadlineEpochMs: number | null) => void;
  state: GameState;
  registry: ContentRegistry;
  scene: LoadedScene;
  /** Primeira visita + `highlight` no frontmatter + arte resolvida (overlay por cima de diário, facções, itens, dados, etc.). */
  sceneArtHighlight: SceneArtHighlightPayload | null;
  /** Meta curta para orientar a sessão atual. */
  sessionObjective: string | null;
  /** Bloco de primeiros passos mostrado apenas na primeira sessão. */
  onboardingPrimer: { onDismiss: () => void } | null;
  overlay: StoryOverlayState;
  audio: {
    unlockAudio: () => void;
    playUiClick: () => void;
    playLevelUpCelebration: () => void;
    playPathPromotion: () => void;
  };
  render: () => void;
  navigation: {
    applyChoice: (choice: Choice) => void;
    onSkillRoll: (scene: LoadedScene) => void;
    onDualAttrSkillRoll: (scene: LoadedScene) => void;
    onLuckRoll: (scene: LoadedScene) => void;
  };
  campCallbacks: CampEquipmentCallbacks;
  setTimedChoiceTimer: (t: ReturnType<typeof setTimeout> | null) => void;
};

const SCENE_ART_HIGHLIGHT_HOLD_MS = 1000;
const SCENE_ART_HIGHLIGHT_FADE_MS = 350;

function mountSceneArtHighlight(shell: HTMLElement, payload: SceneArtHighlightPayload): void {
  payload.onBegin();
  const layer = document.createElement('div');
  layer.className = 'scene-art-highlight-layer';
  layer.setAttribute('aria-hidden', 'true');
  const pre = document.createElement('pre');
  pre.className = 'scene-art-highlight-pre';
  pre.textContent = payload.artText;
  layer.appendChild(pre);
  shell.appendChild(layer);

  window.setTimeout(() => {
    if (!payload.isCurrentGeneration()) return;
    layer.classList.add('scene-art-highlight-layer--out');
  }, SCENE_ART_HIGHLIGHT_HOLD_MS);

  window.setTimeout(() => {
    if (!payload.isCurrentGeneration()) return;
    payload.onEnd();
  }, SCENE_ART_HIGHLIGHT_HOLD_MS + SCENE_ART_HIGHLIGHT_FADE_MS);
}

export function renderStoryInto(shell: HTMLElement, ctx: StoryRenderContext): void {
  const inner = document.createElement('div');
  inner.className = 'shell';

  if (ctx.overlay.pendingStoryDiceRoll) {
    appendStoryDiceRollBanner(inner, ctx.overlay.storyDiceHost, ctx.overlay.pendingStoryDiceRoll);
  }

  if (ctx.overlay.faithMiraclePending) {
    appendFaithMiracleBanner(inner, {
      setFaithMiraclePending: ctx.overlay.setFaithMiraclePending,
      playUiClick: ctx.audio.playUiClick,
      render: ctx.render,
    });
  }

  if (ctx.overlay.statusHighlightQueue.length > 0) {
    const wrap = document.createElement('div');
    wrap.className = 'status-highlight-stack';
    if (ctx.overlay.statusHighlightQueue.some((h) => h.variant === 'debuff')) {
      wrap.classList.add('status-highlight-stack--debuff');
    }
    for (const h of ctx.overlay.statusHighlightQueue) {
      const block = document.createElement('div');
      block.className = `status-highlight-banner status-highlight-banner--${h.variant}`;
      if (h.exiting) {
        block.classList.add('status-highlight-banner--exiting');
      }
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
    inner.appendChild(wrap);
  }

  if (ctx.overlay.diaryEntryQueue.length > 0) {
    const wrap = document.createElement('div');
    wrap.className = 'diary-entry-banner';
    if (ctx.overlay.diaryBannerExiting) {
      wrap.classList.add('diary-entry-banner--exiting');
    }
    const kicker = document.createElement('div');
    kicker.className = 'diary-entry-kicker';
    kicker.textContent = 'Cronista';
    wrap.appendChild(kicker);
    const subKicker = document.createElement('div');
    subKicker.className = 'diary-entry-subkicker';
    subKicker.textContent =
      ctx.overlay.diaryEntryQueue.length > 1
        ? 'Novas linhas gravadas no diário'
        : 'Nova linha gravada no diário';
    wrap.appendChild(subKicker);
    for (const passage of ctx.overlay.diaryEntryQueue) {
      const p = document.createElement('p');
      p.className = 'diary-entry-body';
      p.textContent = passage;
      wrap.appendChild(p);
    }
    inner.appendChild(wrap);
  }

  if (ctx.overlay.itemAcquireQueue.length > 0) {
    const unique = [...new Set(ctx.overlay.itemAcquireQueue)];
    const wrap = document.createElement('div');
    wrap.className = 'item-acquire-banner';
    if (ctx.overlay.itemAcquireBannerExiting) {
      wrap.classList.add('item-acquire-banner--exiting');
    }
    const kicker = document.createElement('div');
    kicker.className = 'item-acquire-kicker';
    kicker.textContent = unique.length > 1 ? 'Novos itens adquiridos' : 'Item adquirido';
    wrap.appendChild(kicker);
    for (const itemId of unique) {
      const def = ctx.registry.data.items[itemId];
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
    inner.appendChild(wrap);
  }

  if (ctx.onboardingPrimer) {
    const primer = document.createElement('section');
    primer.className = 'session-primer';
    const title = document.createElement('div');
    title.className = 'session-primer-title';
    title.textContent = 'Primeiros passos';
    primer.appendChild(title);
    const list = document.createElement('ul');
    list.className = 'session-primer-list';
    const tips = [
      '[1-9] ativa escolhas sem clicar.',
      '[Espaço] continua rolagens de dados e diálogos com botão “Continuar”.',
      'Menu (☰) para salvar/carregar, ajustar texto e áudio.',
    ];
    for (const tip of tips) {
      const li = document.createElement('li');
      li.textContent = tip;
      list.appendChild(li);
    }
    primer.appendChild(list);
    const dismiss = document.createElement('button');
    dismiss.type = 'button';
    dismiss.className = 'session-primer-dismiss';
    dismiss.textContent = 'Entendi';
    dismiss.addEventListener('click', () => {
      ctx.onboardingPrimer?.onDismiss();
      ctx.audio.playUiClick();
      ctx.render();
    });
    primer.appendChild(dismiss);
    inner.appendChild(primer);
  }

  if (ctx.sessionObjective) {
    const objective = document.createElement('div');
    objective.className = 'session-objective';
    objective.textContent = ctx.sessionObjective;
    inner.appendChild(objective);
  }

  const pathPromo = ctx.state.lastPathPromotion;
  if (pathPromo != null) {
    ctx.audio.unlockAudio();
    ctx.audio.playPathPromotion();
    const promo = document.createElement('div');
    promo.className = 'path-promotion-banner';
    promo.setAttribute('role', 'status');
    const kicker = document.createElement('div');
    kicker.className = 'path-promotion-kicker';
    kicker.textContent = 'Novo arquétipo';
    promo.appendChild(kicker);
    const titleEl = document.createElement('div');
    titleEl.className = 'path-promotion-title';
    titleEl.textContent = pathPromo.label;
    promo.appendChild(titleEl);
    const sub = document.createElement('div');
    sub.className = 'path-promotion-subtitle';
    sub.textContent =
      pathPromo.narrativePt?.trim() ||
      'A ficha passa a mostrar este nome no lugar da classe base; os bónus do arquétipo já estão ativos.';
    promo.appendChild(sub);
    inner.appendChild(promo);
  }

  const xpGain = ctx.state.lastCombatXpGain;
  const levelUps = ctx.state.lastCombatLevelUps;
  const lootLines = ctx.state.lastCombatLootLines;
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
        for (const line of lootLines!) {
          const lootEl = document.createElement('div');
          lootEl.className = 'victory-loot-line';
          lootEl.textContent = line;
          rewardsWrap.appendChild(lootEl);
        }
      }
      wrap.appendChild(rewardsWrap);
    }
    if (levelUps != null && levelUps.length > 0) {
      ctx.audio.unlockAudio();
      ctx.audio.playLevelUpCelebration();
      const hero = ctx.state.party[0];
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
        const sid = step.spellsLearned;
        if (sid != null && sid.length > 0) {
          const names = sid.map((id) => ctx.registry.data.spells[id]?.name ?? id);
          const spellsEl = document.createElement('div');
          spellsEl.className = 'level-up-spells';
          spellsEl.textContent =
            names.length === 1
              ? `Magia aprendida: ${names[0]}.`
              : `Magias aprendidas: ${names.join(', ')}.`;
          block.appendChild(spellsEl);
        }
        wrap.appendChild(block);
      }
    }
    inner.appendChild(wrap);
  }

  const h1 = document.createElement('h1');
  h1.textContent = ctx.scene.frontmatter.title ?? ctx.scene.id;
  inner.appendChild(h1);

  const artText = resolveSceneArt(ctx.registry, ctx.scene);
  if (artText) {
    const pre = document.createElement('pre');
    pre.className = 'scene-art';
    pre.textContent = artText;
    inner.appendChild(pre);
  }

  if (ctx.scene.frontmatter.campCombatHint === true) {
    const campHint = document.createElement('div');
    campHint.className = 'combat-allies-hint camp-combat-hint';
    campHint.textContent = randomCampCombatHint(ctx.state.party.length);
    inner.appendChild(campHint);
  }

  const body = document.createElement('div');
  body.className = 'story-body';
  body.innerHTML = renderSceneBody(ctx.scene.bodyRaw, ctx.state);
  inner.appendChild(body);

  appendStoryMapPanel(inner, {
    state: ctx.state,
    frontmatter: ctx.scene.frontmatter,
    registry: ctx.registry,
  });

  appendCampEquipmentPanel(inner, ctx.state, ctx.registry, ctx.campCallbacks);

  let storyNavIndex = 0;
  const storyQuickKeyHint = (n: number): string =>
    `Pressione ${n} no teclado para ativar esta ação sem clicar`;

  const attrModAbbrev = (attr: 'str' | 'agi' | 'mind'): 'STR' | 'AGI' | 'MEN' =>
    attr === 'str' ? 'STR' : attr === 'agi' ? 'AGI' : 'MEN';

  /** Título curto + fórmula em `.preview`, como nas escolhas com `preview`. */
  const setStoryRollChoiceContent = (
    btn: HTMLButtonElement,
    navNum: number,
    titleLine: string,
    previewLine: string
  ): void => {
    btn.appendChild(document.createTextNode(`${navNum} - ${titleLine}`));
    const span = document.createElement('span');
    span.className = 'preview';
    span.textContent = previewLine;
    btn.appendChild(span);
  };

  if (ctx.scene.frontmatter.skillCheck) {
    storyNavIndex += 1;
    const row = document.createElement('div');
    row.className = 'skill-row';
    const b = document.createElement('button');
    b.className = 'choice';
    const sc = ctx.scene.frontmatter.skillCheck;
    const ab = attrModAbbrev(sc.attr);
    const trimmedLabel = sc.label?.trim();
    const title =
      trimmedLabel !== undefined && trimmedLabel.length > 0
        ? `Rolar teste: ${trimmedLabel}`
        : `Rolar teste: ${ab}`;
    const preview = `2d6 + mod(${ab}) vs TN ${sc.tn}`;
    setStoryRollChoiceContent(b, storyNavIndex, title, preview);
    if (storyNavIndex < 10) b.title = storyQuickKeyHint(storyNavIndex);
    b.addEventListener('click', () => ctx.navigation.onSkillRoll(ctx.scene));
    row.appendChild(b);
    inner.appendChild(row);
  }

  if (ctx.scene.frontmatter.dualAttrSkillCheck) {
    storyNavIndex += 1;
    const row = document.createElement('div');
    row.className = 'skill-row';
    const b = document.createElement('button');
    b.className = 'choice';
    const dc = ctx.scene.frontmatter.dualAttrSkillCheck;
    const trimmedDl = dc.label?.trim();
    const lbl =
      trimmedDl !== undefined && trimmedDl.length > 0
        ? trimmedDl
        : `${dc.attrs[0].toUpperCase()} + ${dc.attrs[1].toUpperCase()} · ${dc.rounds} lançamentos`;
    const title = `Rolar prova tríplice: ${lbl}`;
    const preview = `2d6 + dois mods vs TN ${dc.tn}`;
    setStoryRollChoiceContent(b, storyNavIndex, title, preview);
    if (storyNavIndex < 10) b.title = storyQuickKeyHint(storyNavIndex);
    b.addEventListener('click', () => ctx.navigation.onDualAttrSkillRoll(ctx.scene));
    row.appendChild(b);
    inner.appendChild(row);
  }

  if (ctx.scene.frontmatter.luckCheck) {
    storyNavIndex += 1;
    const row = document.createElement('div');
    row.className = 'skill-row';
    const b = document.createElement('button');
    b.className = 'choice';
    const lc = ctx.scene.frontmatter.luckCheck;
    const curse =
      lc.luckPenalty && lc.luckPenalty > 0 ? ` · maldição −${lc.luckPenalty}` : '';
    const trimmedLl = lc.label?.trim();
    const title =
      trimmedLl !== undefined && trimmedLl.length > 0 ? `Rolar sorte: ${trimmedLl}` : 'Rolar sorte:';
    const preview = `2d6 + mod(SOR) vs TN ${lc.tn}${curse}`;
    setStoryRollChoiceContent(b, storyNavIndex, title, preview);
    if (storyNavIndex < 10) b.title = storyQuickKeyHint(storyNavIndex);
    b.addEventListener('click', () => ctx.navigation.onLuckRoll(ctx.scene));
    row.appendChild(b);
    inner.appendChild(row);
  }

  const explorationMoves =
    ctx.scene.frontmatter.type === 'exploration'
      ? buildExplorationMovementRows(ctx.state, ctx.registry)
      : [];
  const explorationMoveCount = explorationMoves.length;
  const choiceRows = [
    ...explorationMoves,
    ...buildStoryChoiceRows(ctx.scene.frontmatter.choices, ctx.state),
  ];
  const enabledChoices = choiceRows
    .filter((r): r is { kind: 'enabled'; choice: Choice } => r.kind === 'enabled')
    .map((r) => r.choice);
  const chWrap = document.createElement('div');
  chWrap.className = 'choices';

  const choiceSections = groupStoryChoiceRowsByUiSection(choiceRows);
  const useChoiceSections = shouldUseChoiceSectionLayout(choiceSections);

  let choiceRowIndex = 0;
  const appendStoryChoiceButton = (parent: HTMLElement, row: StoryChoiceRow): void => {
    const i = choiceRowIndex;
    choiceRowIndex += 1;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'choice';
    const navNum = storyNavIndex + i + 1;
    const syntheticExplore = i < explorationMoveCount;

    if (row.kind === 'locked') {
      btn.disabled = true;
      btn.classList.add('choice--locked');
      btn.title = row.hint;
      applyChoiceButtonLabel(btn, navNum, row.choice, { syntheticExplore });
      const chLocked = row.choice;
      if (chLocked.preview) {
        const prev = document.createElement('span');
        prev.className = 'preview';
        prev.textContent = chLocked.preview;
        btn.appendChild(prev);
      }
      const hintSpan = document.createElement('span');
      hintSpan.className = 'choice-locked-hint';
      hintSpan.textContent = row.hint;
      btn.appendChild(hintSpan);
      parent.appendChild(btn);
      return;
    }

    const ch = row.choice;
    const runChoice = (): void => ctx.navigation.applyChoice(ch);
    if (navNum < 10) btn.title = storyQuickKeyHint(navNum);
    applyChoiceButtonLabel(btn, navNum, ch, { syntheticExplore });
    if (ch.preview) {
      const span = document.createElement('span');
      span.className = 'preview';
      span.textContent = ch.preview;
      btn.appendChild(span);
    }
    btn.addEventListener('click', runChoice);
    parent.appendChild(btn);
  };

  if (useChoiceSections) {
    chWrap.classList.add('choices--sectioned');
    for (const sec of choiceSections) {
      const secEl = document.createElement('div');
      secEl.className = 'choices-section';
      if (sec.label !== undefined) {
        const titleEl = document.createElement('div');
        titleEl.className = 'choices-section__title';
        titleEl.textContent = sec.label;
        secEl.appendChild(titleEl);
      }
      for (const row of sec.rows) {
        appendStoryChoiceButton(secEl, row);
      }
      chWrap.appendChild(secEl);
    }
  } else {
    for (const row of choiceRows) {
      appendStoryChoiceButton(chWrap, row);
    }
  }
  inner.appendChild(chWrap);

  const hasTimedChoice =
    ctx.timedChoiceEnabled &&
    enabledChoices.some(
      (c) =>
        c.timedMs &&
        ((c.fallbackNext !== undefined && c.fallbackNext.trim() !== '') ||
          (c.fallbackEffects !== undefined && c.fallbackEffects.length > 0))
    );
  setupTimedChoices(enabledChoices, inner, ctx);
  if (!hasTimedChoice) {
    ctx.onTimedChoiceScheduled(null);
  }

  shell.appendChild(inner);

  if (ctx.sceneArtHighlight) {
    mountSceneArtHighlight(shell, ctx.sceneArtHighlight);
  }
}

export { setupTimedChoices } from './story/storyTimedChoices.ts';

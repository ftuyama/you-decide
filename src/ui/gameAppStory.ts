import {
  buildStoryChoiceRows,
  renderSceneBody,
  type LoadedScene,
  type StoryDiceRollBreakdown,
} from '../engine/sceneRuntime.ts';
import type { Choice, Effect, GameState, SceneFrontmatter } from '../engine/schema.ts';
import type { ContentRegistry } from '../content/registry.ts';
import { formatLevelUpDeltaLine, randomCampCombatHint } from './gameAppUtils.ts';
import { formatItemEquipmentStatParts } from './formatItemEquipment.ts';
import { formatDiceAscii } from './diceAscii.ts';
import { iconWrap, icons } from './icons/index.ts';
import type { GameEvent } from '../engine/eventBus.ts';

/** Arte de cena: YAML `art` inline ou `artKey` na tabela `sceneArt` da campanha. */
export function resolveSceneArtFromFrontmatter(
  fm: Pick<SceneFrontmatter, 'art' | 'artKey'>,
  sceneArt: Record<string, string>
): string | undefined {
  const inline = fm.art?.trim();
  if (inline) return inline;
  const key = fm.artKey;
  if (key && sceneArt[key]) return sceneArt[key];
  return undefined;
}

export function resolveSceneArt(registry: ContentRegistry, scene: LoadedScene): string | undefined {
  return resolveSceneArtFromFrontmatter(scene.frontmatter, registry.ui.sceneArt);
}

const CAMP_EQUIPMENT_SCENES = new Set([
  'act2/camp/manage_equip',
  'act5/camp/manage_equip',
  'act6/camp/manage_equip',
]);

export function isCampEquipmentScene(sceneId: string): boolean {
  return CAMP_EQUIPMENT_SCENES.has(sceneId);
}

function inventoryEquipmentIdsForSlot(
  state: GameState,
  registry: ContentRegistry,
  slot: 'weapon' | 'armor' | 'relic'
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of state.inventory) {
    const def = registry.data.items[id];
    if (!def || def.slot !== slot) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export type CampEquipmentCallbacks = {
  unlockAudio: () => void;
  playUiClick: () => void;
  /** applyEffects + stabilize + assign + render */
  commitEquipEffects: (effects: Effect[]) => void;
};

export function appendCampEquipmentPanel(
  parent: HTMLElement,
  state: GameState,
  registry: ContentRegistry,
  cbs: CampEquipmentCallbacks
): void {
  if (!isCampEquipmentScene(state.sceneId) || state.party.length === 0) return;

  const items = registry.data.items;
  const multiParty = state.party.length > 1;

  const panel = document.createElement('div');
  panel.className = 'camp-equip-panel';
  const hdr = document.createElement('div');
  hdr.className = 'camp-equip-hdr camp-equip-hdr--with-icon';
  hdr.innerHTML = `${iconWrap(icons.equipment)}<span>Equipamento no acampamento</span>`;
  panel.appendChild(hdr);

  const intro = document.createElement('p');
  intro.className = 'camp-equip-intro';
  intro.textContent =
    'Retirar devolve a peça ao inventário; equipar usa uma peça que já tens no inventário.';
  panel.appendChild(intro);

  const slotSvg: Record<'weapon' | 'armor' | 'relic', string> = {
    weapon: icons.weapon,
    armor: icons.armor,
    relic: icons.relic,
  };

  const appendMemberHead = (target: HTMLElement, member: (typeof state.party)[number]): void => {
    const nameEl = document.createElement('div');
    nameEl.className = 'camp-equip-member-name';
    nameEl.textContent = member.name;
    target.appendChild(nameEl);
    const classEl = document.createElement('div');
    classEl.className = 'camp-equip-member-class';
    classEl.textContent = registry.ui.getHeroClassLabel(member.class, member.path);
    target.appendChild(classEl);
  };

  for (let partyIndex = 0; partyIndex < state.party.length; partyIndex++) {
    const member = state.party[partyIndex]!;
    const slotGridHost = document.createElement('div');
    slotGridHost.className = 'camp-equip-member-body';

    if (multiParty) {
      const det = document.createElement('details');
      det.className = 'camp-equip-member-details';
      det.open = true;
      const sum = document.createElement('summary');
      sum.className = 'camp-equip-member-summary';
      appendMemberHead(sum, member);
      det.appendChild(sum);
      det.appendChild(slotGridHost);
      panel.appendChild(det);
    } else {
      const flat = document.createElement('div');
      flat.className = 'camp-equip-member camp-equip-member--flat';
      appendMemberHead(flat, member);
      flat.appendChild(slotGridHost);
      panel.appendChild(flat);
    }

    const slotGrid = document.createElement('div');
    slotGrid.className = 'camp-equip-slot-grid';
    slotGridHost.appendChild(slotGrid);

    const slotDefs: { key: 'weapon' | 'armor' | 'relic'; label: string; cur: string | null }[] = [
      { key: 'weapon', label: 'Arma', cur: member.weaponId },
      { key: 'armor', label: 'Armadura', cur: member.armorId },
      { key: 'relic', label: 'Relíquia', cur: member.relicId },
    ];

    for (const { key, label, cur } of slotDefs) {
      const candidates = inventoryEquipmentIdsForSlot(state, registry, key);

      const slotWrap = document.createElement('div');
      slotWrap.className = 'camp-equip-slot-wrap';

      const article = document.createElement('article');
      article.className = cur
        ? 'character-sheet-slot-card'
        : 'character-sheet-slot-card character-sheet-slot-card--empty';

      const head = document.createElement('div');
      head.className = 'character-sheet-slot-head';
      head.innerHTML = `${iconWrap(slotSvg[key], 'character-sheet-slot-icon-wrap')}<span class="character-sheet-slot-label">${label}</span>`;
      article.appendChild(head);

      if (cur) {
        const def = items[cur];
        const unequipBtn = document.createElement('button');
        unequipBtn.type = 'button';
        unequipBtn.className = 'camp-equip-btn camp-equip-candidate camp-equip-btn--unequip';
        unequipBtn.title = 'Retirar ao inventário';
        unequipBtn.setAttribute('aria-label', 'Retirar ao inventário');
        const main = document.createElement('span');
        main.className = 'camp-equip-candidate-main';
        const nm = document.createElement('span');
        nm.className = 'camp-equip-candidate-name';
        nm.textContent = def?.name ?? cur;
        main.appendChild(nm);
        if (def) {
          const statParts = formatItemEquipmentStatParts(def);
          if (statParts.length > 0) {
            const st = document.createElement('span');
            st.className = 'camp-equip-candidate-stats';
            st.textContent = statParts.join(' · ');
            main.appendChild(st);
          }
        }
        unequipBtn.appendChild(main);
        const act = document.createElement('span');
        act.className = 'camp-equip-candidate-action camp-equip-candidate-action--unequip';
        act.textContent = 'Retirar';
        unequipBtn.appendChild(act);
        const pi = partyIndex;
        const sk = key;
        unequipBtn.addEventListener('click', () => {
          cbs.unlockAudio();
          cbs.playUiClick();
          const eff: Effect = { op: 'unequipSlot', slot: sk, partyIndex: pi };
          cbs.commitEquipEffects([eff]);
        });
        article.appendChild(unequipBtn);
      } else {
        const emptyP = document.createElement('p');
        emptyP.className = 'character-sheet-slot-empty';
        emptyP.textContent = 'Nada equipado';
        article.appendChild(emptyP);
      }

      slotWrap.appendChild(article);

      if (candidates.length > 0) {
        const list = document.createElement('div');
        list.className = 'camp-equip-candidate-list';
        for (const itemId of candidates) {
          const def = items[itemId];
          if (!def) continue;
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'camp-equip-btn camp-equip-candidate';
          btn.setAttribute('aria-label', `Equipar ${def.name}`);
          const main = document.createElement('span');
          main.className = 'camp-equip-candidate-main';
          const nm = document.createElement('span');
          nm.className = 'camp-equip-candidate-name';
          nm.textContent = def.name;
          main.appendChild(nm);
          const statParts = formatItemEquipmentStatParts(def);
          if (statParts.length > 0) {
            const st = document.createElement('span');
            st.className = 'camp-equip-candidate-stats';
            st.textContent = statParts.join(' · ');
            main.appendChild(st);
          }
          btn.appendChild(main);
          const act = document.createElement('span');
          act.className = 'camp-equip-candidate-action';
          act.textContent = 'Equipar';
          btn.appendChild(act);
          const pi = partyIndex;
          btn.addEventListener('click', () => {
            cbs.unlockAudio();
            cbs.playUiClick();
            const eff: Effect = { op: 'equipItem', itemId, partyIndex: pi };
            cbs.commitEquipEffects([eff]);
          });
          list.appendChild(btn);
        }
        slotWrap.appendChild(list);
      } else if (!cur) {
        const hint = document.createElement('div');
        hint.className = 'camp-equip-hint';
        hint.textContent = 'Sem peças deste tipo no inventário.';
        article.appendChild(hint);
      }

      slotGrid.appendChild(slotWrap);
    }
  }

  parent.appendChild(panel);
}

export type StoryDiceBannerHost = {
  clearDiceRollTimers(): void;
  setDiceRollIntervalTimer(t: ReturnType<typeof setInterval> | null): void;
  setDiceRollEnterHandler(h: ((e: KeyboardEvent) => void) | null): void;
  /** clear timers, clear pending roll, stabilize, play click, render */
  dismissStoryDiceRoll: (nextState: GameState) => void;
  playCheckSuccess(): void;
  playCheckFail(): void;
};

const STORY_DICE_ROLL_TICK_MS = 128;
const STORY_DICE_ROLL_MAX_TICKS = 18;

/** Par de d6 para a animação cosmética: `crypto.getRandomValues` ou xorshift por banner. */
function storyDiceAnimScratchNext(seedRef: { s: number }): number {
  let x = seedRef.s;
  x ^= x << 13;
  x >>>= 0;
  x ^= x >>> 17;
  x ^= x << 5;
  seedRef.s = x >>> 0;
  return seedRef.s;
}

function randomStoryDicePairForAnim(seedRef: { s: number }): [number, number] {
  const c = globalThis.crypto;
  if (typeof c?.getRandomValues === 'function') {
    const buf = new Uint8Array(2);
    c.getRandomValues(buf);
    return [(buf[0]! % 6) + 1, (buf[1]! % 6) + 1];
  }
  const a = storyDiceAnimScratchNext(seedRef);
  const b = storyDiceAnimScratchNext(seedRef);
  return [(a % 6) + 1, (b % 6) + 1];
}

function storyDiceTargetTn(breakdown: StoryDiceRollBreakdown): number {
  if (breakdown.kind === 'dualSkill') {
    return breakdown.rounds[0]?.tn ?? 0;
  }
  return breakdown.tn;
}

function populateStoryDiceDifficulty(el: HTMLElement, breakdown: StoryDiceRollBreakdown): void {
  el.replaceChildren();
  const tn = storyDiceTargetTn(breakdown);
  const row = document.createElement('div');
  row.className = 'story-dice-difficulty-row';
  const lab = document.createElement('span');
  lab.className = 'story-dice-difficulty-label';
  lab.textContent = 'Dificuldade';
  const val = document.createElement('span');
  val.className = 'story-dice-difficulty-value';
  val.textContent = String(tn);
  row.append(lab, val);
  el.appendChild(row);
  if (breakdown.kind === 'dualSkill') {
    const sub = document.createElement('div');
    sub.className = 'story-dice-difficulty-sub';
    sub.textContent = 'Cada selo precisa alcançar este total.';
    el.appendChild(sub);
  }
}

function formatModSigned(m: number): string {
  if (m > 0) return `+${m}`;
  if (m < 0) return `−${Math.abs(m)}`;
  return '0';
}

/** Cartão de modificador(es) visível desde o início da rolagem (ao lado dos dados ASCII). */
function populateStoryDiceModSlot(slot: HTMLElement, breakdown: StoryDiceRollBreakdown): void {
  slot.replaceChildren();
  slot.className = 'story-dice-mod-slot';

  if (breakdown.kind === 'skill') {
    if (breakdown.mod === 0) return;
    const card = document.createElement('div');
    card.className = 'story-dice-mod-card story-dice-mod-card--inline';
    const line = document.createElement('span');
    line.className = 'story-dice-mod-card-inline';
    line.textContent = `${breakdown.attr.toUpperCase()}${formatModSigned(breakdown.mod)}`;
    card.appendChild(line);
    slot.appendChild(card);
    return;
  }

  if (breakdown.kind === 'luck') {
    if (breakdown.mod === 0 && breakdown.luckPenalty === 0) return;
    const card = document.createElement('div');
    card.className = 'story-dice-mod-card story-dice-mod-card--compact';
    if (breakdown.mod !== 0) {
      const row = document.createElement('div');
      row.className = 'story-dice-mod-card-row';
      const l = document.createElement('span');
      l.className = 'story-dice-mod-card-label';
      l.textContent = 'SOR';
      const v = document.createElement('span');
      v.className = 'story-dice-mod-card-value';
      v.textContent = formatModSigned(breakdown.mod);
      row.append(l, v);
      card.appendChild(row);
    }
    if (breakdown.luckPenalty > 0) {
      const row = document.createElement('div');
      row.className = 'story-dice-mod-card-row';
      const l = document.createElement('span');
      l.className = 'story-dice-mod-card-label';
      l.textContent = 'Maldição';
      const v = document.createElement('span');
      v.className = 'story-dice-mod-card-value story-dice-mod-card-value--curse';
      v.textContent = `−${breakdown.luckPenalty}`;
      row.append(l, v);
      card.appendChild(row);
    }
    slot.appendChild(card);
    return;
  }

  const r0 = breakdown.rounds[0];
  if (!r0) return;
  const [a1, a2] = breakdown.attrs;
  if (r0.mod1 === 0 && r0.mod2 === 0) return;
  const card = document.createElement('div');
  const dualCompact = r0.mod1 !== 0 && r0.mod2 !== 0;
  card.className = dualCompact
    ? 'story-dice-mod-card story-dice-mod-card--compact'
    : 'story-dice-mod-card';
  if (r0.mod1 !== 0) {
    const row = document.createElement('div');
    row.className = 'story-dice-mod-card-row';
    const l = document.createElement('span');
    l.className = 'story-dice-mod-card-label';
    l.textContent = a1.toUpperCase();
    const v = document.createElement('span');
    v.className = 'story-dice-mod-card-value';
    v.textContent = formatModSigned(r0.mod1);
    row.append(l, v);
    card.appendChild(row);
  }
  if (r0.mod2 !== 0) {
    const row = document.createElement('div');
    row.className = 'story-dice-mod-card-row';
    const l = document.createElement('span');
    l.className = 'story-dice-mod-card-label';
    l.textContent = a2.toUpperCase();
    const v = document.createElement('span');
    v.className = 'story-dice-mod-card-value';
    v.textContent = formatModSigned(r0.mod2);
    row.append(l, v);
    card.appendChild(row);
  }
  slot.appendChild(card);
}

/** Modificador após a soma dos dados (ex.: "+ 2" ou "− 1"). */
function formatModAfterDice(mod: number): string {
  if (mod >= 0) return `+ ${mod}`;
  return `− ${Math.abs(mod)}`;
}

/** Lado esquerdo da equação + total destacado (dados já vistos no ASCII acima). */
function appendMathWithTotal(parent: HTMLElement, beforeEquals: string, total: number): void {
  const math = document.createElement('div');
  math.className = 'story-dice-result-math';
  math.append(document.createTextNode(beforeEquals));
  const eq = document.createElement('span');
  eq.className = 'story-dice-result-math-eq';
  eq.textContent = '=';
  const totalEl = document.createElement('span');
  totalEl.className = 'story-dice-result-total';
  totalEl.textContent = String(total);
  math.append(document.createTextNode('\u00a0'), eq, document.createTextNode('\u00a0'), totalEl);
  parent.appendChild(math);
}

function appendOutcomeLine(parent: HTMLElement, success: boolean): void {
  const line = document.createElement('div');
  line.className = success
    ? 'story-dice-result-outcome story-dice-result-outcome--ok'
    : 'story-dice-result-outcome story-dice-result-outcome--fail';
  line.textContent = success ? 'Passou.' : 'Falhou.';
  parent.appendChild(line);
}

function populateStoryDiceRollResult(region: HTMLElement, breakdown: StoryDiceRollBreakdown): void {
  region.replaceChildren();
  region.className = 'story-dice-reveal story-dice-result story-dice-result--rich';
  region.setAttribute('aria-label', breakdown.rollLog);

  if (breakdown.kind === 'skill') {
    appendOutcomeLine(region, breakdown.success);
    const lhs = `${breakdown.d1} + ${breakdown.d2} ${formatModAfterDice(breakdown.mod)}`.replace(/\s+/g, ' ').trim();
    appendMathWithTotal(region, lhs, breakdown.total);
    return;
  }

  if (breakdown.kind === 'luck') {
    appendOutcomeLine(region, breakdown.success);
    let lhs = `${breakdown.d1} + ${breakdown.d2} ${formatModAfterDice(breakdown.mod)}`.replace(/\s+/g, ' ').trim();
    if (breakdown.luckPenalty > 0) {
      lhs += ` − ${breakdown.luckPenalty}`;
    }
    appendMathWithTotal(region, lhs, breakdown.total);
    return;
  }

  const [a1, a2] = breakdown.attrs;
  const totalR = breakdown.rounds.length;
  for (let i = 0; i < totalR; i++) {
    const r = breakdown.rounds[i]!;
    const seal = document.createElement('div');
    seal.className = 'story-dice-result-seal';
    const st = document.createElement('div');
    st.className = 'story-dice-result-seal-title';
    st.textContent = `Selo ${i + 1} de ${totalR}`;
    seal.appendChild(st);
    appendOutcomeLine(seal, r.success);
    const lhs = `${r.d1} + ${r.d2} + ${r.mod1} (${a1.toUpperCase()}) + ${r.mod2} (${a2.toUpperCase()})`;
    appendMathWithTotal(seal, lhs, r.total);
    region.appendChild(seal);
  }
}

export function appendStoryDiceRollBanner(
  inner: HTMLElement,
  host: StoryDiceBannerHost,
  pending: { nextState: GameState; breakdown: StoryDiceRollBreakdown }
): void {
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

  const rollCard = document.createElement('div');
  rollCard.className = 'story-dice-roll-card';

  const difficultyEl = document.createElement('div');
  difficultyEl.className = 'story-dice-difficulty';
  populateStoryDiceDifficulty(difficultyEl, breakdown);
  rollCard.appendChild(difficultyEl);

  const dataRegion = document.createElement('div');
  dataRegion.className = 'story-dice-data-region';

  const diceRow = document.createElement('div');
  diceRow.className = 'story-dice-dice-row';

  const asciiStage = document.createElement('div');
  asciiStage.className = 'story-dice-ascii-stage';
  const pre = document.createElement('pre');
  pre.className = 'dice-ascii-block story-dice-pre story-dice-pre--rolling';
  pre.textContent = formatDiceAscii([3, 4]);
  asciiStage.appendChild(pre);
  diceRow.appendChild(asciiStage);

  const modSlot = document.createElement('div');
  populateStoryDiceModSlot(modSlot, breakdown);
  diceRow.appendChild(modSlot);

  dataRegion.appendChild(diceRow);
  rollCard.appendChild(dataRegion);

  const resultRegion = document.createElement('div');
  resultRegion.className = 'story-dice-reveal story-dice-result';
  resultRegion.setAttribute('aria-live', 'polite');
  resultRegion.setAttribute('aria-atomic', 'true');
  resultRegion.hidden = true;
  rollCard.appendChild(resultRegion);

  panel.appendChild(rollCard);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'story-dice-banner-dismiss';
  btn.dataset.quickNavContinue = '';
  btn.title = 'Barra de espaço';
  btn.textContent = '[Espaço] — Continuar';
  btn.disabled = true;
  panel.appendChild(btn);

  wrap.appendChild(panel);
  inner.appendChild(wrap);
  wrap.classList.add('story-dice-banner--intro');
  panel.classList.add('story-dice-banner-panel--rolling');

  const dismiss = (): void => {
    host.dismissStoryDiceRoll(nextState);
  };

  const finishReveal = (): void => {
    panel.classList.remove('story-dice-banner-panel--rolling');
    const dPair =
      breakdown.kind === 'dualSkill'
        ? (() => {
            const last = breakdown.rounds[breakdown.rounds.length - 1];
            return last ? [last.d1, last.d2] : [1, 1];
          })()
        : [breakdown.d1, breakdown.d2];
    pre.textContent = formatDiceAscii(dPair);
    pre.classList.remove('story-dice-pre--rolling');
    pre.classList.add('story-dice-pre--landed');
    window.setTimeout(() => {
      pre.classList.remove('story-dice-pre--landed');
    }, 620);
    panel.classList.add(
      breakdown.success ? 'story-dice-banner-panel--success' : 'story-dice-banner-panel--fail'
    );
    if (breakdown.success) host.playCheckSuccess();
    else host.playCheckFail();
    resultRegion.hidden = false;
    populateStoryDiceRollResult(resultRegion, breakdown);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resultRegion.classList.add('story-dice-result--animate-in');
      });
    });
    btn.disabled = false;
    btn.focus();

    const onEnter = (e: KeyboardEvent): void => {
      if (e.key !== 'Enter' || btn.disabled) return;
      e.preventDefault();
      dismiss();
    };
    host.setDiceRollEnterHandler(onEnter);
    window.addEventListener('keydown', onEnter);
  };

  let ticks = 0;
  let animSeed =
    (Date.now() ^
      (typeof performance !== 'undefined' ? (performance.now() * 7919) | 0 : 0) ^
      ((Math.random() * 0xffffffff) | 0) ^
      0x9e3779b9) >>>
    0;
  if (animSeed === 0) animSeed = 0xdeadbeef;
  const animRng = { s: animSeed };

  host.setDiceRollIntervalTimer(
    setInterval(() => {
      ticks += 1;
      const [r1, r2] = randomStoryDicePairForAnim(animRng);
      pre.textContent = formatDiceAscii([r1, r2]);
      if (ticks >= STORY_DICE_ROLL_MAX_TICKS) {
        host.clearDiceRollTimers();
        finishReveal();
      }
    }, STORY_DICE_ROLL_TICK_MS)
  );

  btn.addEventListener('click', () => dismiss());
}

export type StoryOverlayState = {
  pendingStoryDiceRoll: { nextState: GameState; breakdown: StoryDiceRollBreakdown } | null;
  storyDiceHost: StoryDiceBannerHost;
  faithMiraclePending: boolean;
  setFaithMiraclePending: (v: boolean) => void;
  statusHighlightQueue: Extract<GameEvent, { type: 'statusHighlight' }>[];
  setStatusHighlightQueue: (q: Extract<GameEvent, { type: 'statusHighlight' }>[]) => void;
  itemAcquireQueue: string[];
  setItemAcquireQueue: (q: string[]) => void;
  diaryEntryQueue: string[];
  setDiaryEntryQueue: (q: string[]) => void;
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
  /** Se true, escolhas com `timedMs` + `fallbackNext` disparam barra e auto-navegação. */
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
    btnM.textContent = '[Espaço] — Continuar';
    btnM.addEventListener('click', () => {
      ctx.overlay.setFaithMiraclePending(false);
      ctx.audio.playUiClick();
      ctx.render();
    });
    miracle.appendChild(btnM);
    inner.appendChild(miracle);
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
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'item-acquire-dismiss';
    btn.dataset.quickNavContinue = '';
    btn.title = 'Barra de espaço';
    btn.textContent = '[Espaço] — Continuar';
    btn.addEventListener('click', () => {
      ctx.overlay.setItemAcquireQueue([]);
      ctx.audio.playUiClick();
      ctx.render();
    });
    wrap.appendChild(btn);
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
      '[Espaço] continua banners e avisos.',
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

  if (ctx.state.asciiMap) {
    const rm = ctx.registry.ui.renderMap(ctx.state.asciiMap.mapId);
    if (rm) {
      const wrap = document.createElement('div');
      wrap.innerHTML = `<div class="map-hint sidebar-line--with-icon">${iconWrap(icons.map)}<span>Mapa</span></div>`;
      const pre = document.createElement('pre');
      pre.className = 'ascii-map';
      pre.textContent = rm.lines.join('\n');
      wrap.appendChild(pre);
      inner.appendChild(wrap);
    }
  }

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

  const choiceRows = buildStoryChoiceRows(ctx.scene.frontmatter.choices, ctx.state);
  const enabledChoices = choiceRows
    .filter((r): r is { kind: 'enabled'; choice: Choice } => r.kind === 'enabled')
    .map((r) => r.choice);
  const chWrap = document.createElement('div');
  chWrap.className = 'choices';

  choiceRows.forEach((row, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'choice';
    const navNum = storyNavIndex + i + 1;

    if (row.kind === 'locked') {
      btn.disabled = true;
      btn.classList.add('choice--locked');
      btn.title = row.hint;
      const labelText = `${navNum} - ${row.choice.text}`;
      btn.appendChild(document.createTextNode(labelText));
      const hintSpan = document.createElement('span');
      hintSpan.className = 'choice-locked-hint';
      hintSpan.textContent = row.hint;
      btn.appendChild(hintSpan);
      chWrap.appendChild(btn);
      return;
    }

    const ch = row.choice;
    const runChoice = (): void => ctx.navigation.applyChoice(ch);
    if (navNum < 10) btn.title = storyQuickKeyHint(navNum);
    const labelText = `${navNum} - ${ch.text}`;
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

  const hasTimedChoice =
    ctx.timedChoiceEnabled && enabledChoices.some((c) => c.timedMs && c.fallbackNext);
  setupTimedChoices(enabledChoices, inner, ctx);
  if (!hasTimedChoice) {
    ctx.onTimedChoiceScheduled(null);
  }

  shell.appendChild(inner);

  if (ctx.sceneArtHighlight) {
    mountSceneArtHighlight(shell, ctx.sceneArtHighlight);
  }
}

export function setupTimedChoices(
  choices: Choice[],
  shell: HTMLElement,
  ctx: Pick<
    StoryRenderContext,
    | 'navigation'
    | 'setTimedChoiceTimer'
    | 'timedChoiceEnabled'
    | 'onTimedChoiceScheduled'
    | 'state'
  >
): void {
  if (!ctx.timedChoiceEnabled) return;
  const timed = choices.find((c) => c.timedMs && c.fallbackNext);
  if (!timed || !timed.timedMs || !timed.fallbackNext) return;
  const now = Date.now();
  const d = ctx.state.timedChoiceDeadline;
  const resumeMs =
    d != null && d > now ? Math.min(timed.timedMs, Math.max(1, d - now)) : timed.timedMs;
  const bar = document.createElement('div');
  bar.className = 'timed-bar';
  const innerBar = document.createElement('i');
  innerBar.style.animationDuration = `${resumeMs}ms`;
  bar.appendChild(innerBar);
  shell.appendChild(bar);
  const deadline = now + resumeMs;
  ctx.onTimedChoiceScheduled(deadline);
  const t = setTimeout(() => {
    ctx.onTimedChoiceScheduled(null);
    ctx.navigation.applyChoice({
      text: '',
      next: timed.fallbackNext,
      effects: [],
    });
  }, resumeMs);
  ctx.setTimedChoiceTimer(t);
}

import type { GameState } from '../../engine/schema/index.ts';
import type { LoadedScene, StoryDiceRollBreakdown } from '../../engine/core/index.ts';
import { CIRCULO_SKILL_REROLL_REP_COST } from '../../engine/progression/reputation.ts';
import { formatDiceAscii } from '../diceAscii.ts';

export type StoryDiceRollPendingPayload = {
  nextState: GameState;
  breakdown: StoryDiceRollBreakdown;
  reroll?: {
    preRollState: GameState;
    rolledScene: LoadedScene;
    rollKind: 'skill' | 'dualSkill' | 'luck';
  };
};

export type StoryDiceBannerHost = {
  clearDiceRollTimers(): void;
  setDiceRollIntervalTimer(t: ReturnType<typeof setInterval> | null): void;
  setDiceRollEnterHandler(h: ((e: KeyboardEvent) => void) | null): void;
  /** clear timers, clear pending roll, stabilize, play click, render */
  dismissStoryDiceRoll: (nextState: GameState) => void;
  playCheckSuccess(): void;
  playCheckFail(): void;
  /** Rerrolagem paga do Círculo após falha em teste elegível (quando `pending.reroll` existe). */
  onCirculoDiceReroll?: () => void;
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
  pending: StoryDiceRollPendingPayload
): void {
  const { nextState, breakdown, reroll } = pending;

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

  const btnRow = document.createElement('div');
  btnRow.className = 'story-dice-banner-actions';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'story-dice-banner-dismiss';
  btn.dataset.quickNavContinue = '';
  btn.title = 'Barra de espaço';
  btn.textContent = '[Espaço] — Continuar';
  btn.disabled = true;
  btnRow.appendChild(btn);

  let circuloRerollBtn: HTMLButtonElement | null = null;
  if (reroll && host.onCirculoDiceReroll) {
    const rerollBtn = document.createElement('button');
    rerollBtn.type = 'button';
    rerollBtn.className = 'story-dice-banner-reroll';
    const costLabel =
      CIRCULO_SKILL_REROLL_REP_COST < 0
        ? `−${Math.abs(CIRCULO_SKILL_REROLL_REP_COST)}`
        : String(CIRCULO_SKILL_REROLL_REP_COST);
    rerollBtn.textContent = `Segunda leitura do Círculo (${costLabel} reputação)`;
    rerollBtn.title = 'Gasta a carga do descanso e paga reputação ao Círculo por nova rolagem de teste.';
    rerollBtn.disabled = true;
    rerollBtn.addEventListener('click', () => {
      host.onCirculoDiceReroll?.();
    });
    btnRow.appendChild(rerollBtn);
    circuloRerollBtn = rerollBtn;
  }

  panel.appendChild(btnRow);

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
    if (circuloRerollBtn) circuloRerollBtn.disabled = false;
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

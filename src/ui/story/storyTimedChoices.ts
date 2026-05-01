import type { Choice, GameState } from '../../engine/schema.ts';

type TimedChoicesContext = {
  navigation: { applyChoice: (choice: Choice) => void };
  setTimedChoiceTimer: (t: ReturnType<typeof setTimeout> | null) => void;
  timedChoiceEnabled: boolean;
  onTimedChoiceScheduled: (deadlineEpochMs: number | null) => void;
  state: Pick<GameState, 'timedChoiceDeadline'>;
};

export function setupTimedChoices(
  choices: Choice[],
  shell: HTMLElement,
  ctx: TimedChoicesContext
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

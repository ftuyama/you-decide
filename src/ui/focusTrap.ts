/** Selector alinhado a `focusFirstInMenuDrawer` / modais — elementos normalmente focáveis. */
const FOCUSABLE_SELECTOR =
  'button:not([disabled]), a[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])';

export function focusableElementsIn(container: HTMLElement): HTMLElement[] {
  const nodes = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
  const out: HTMLElement[] = [];
  for (const n of nodes) {
    if (n.closest('[hidden]')) continue;
    const style = window.getComputedStyle(n);
    if (style.visibility === 'hidden' || style.display === 'none') continue;
    out.push(n);
  }
  return out;
}

/** Mantém Tab / Shift+Tab dentro do contentor até se libertar a função devolvida. */
export function attachFocusTrap(container: HTMLElement): () => void {
  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.key !== 'Tab') return;
    const list = focusableElementsIn(container);
    if (list.length === 0) return;
    if (list.length === 1) {
      e.preventDefault();
      list[0]!.focus();
      return;
    }
    const first = list[0]!;
    const last = list[list.length - 1]!;
    const active = document.activeElement;
    if (e.shiftKey) {
      if (active === first || !(active instanceof Node) || !container.contains(active)) {
        e.preventDefault();
        last.focus();
      }
    } else if (active === last || !(active instanceof Node) || !container.contains(active)) {
      e.preventDefault();
      first.focus();
    }
  };
  document.addEventListener('keydown', onKeyDown, true);
  return (): void => {
    document.removeEventListener('keydown', onKeyDown, true);
  };
}

/** Toast não bloqueante com `aria-live` para substituir `alert()` no jogo. */

const TOAST_MS_INFO = 6000;
const TOAST_MS_ERROR = 10000;

let toastHideTimer: number | null = null;

function clearToastRegion(el: HTMLElement): void {
  el.replaceChildren();
  el.classList.remove('app-toast-region--error');
  el.setAttribute('aria-live', 'polite');
}

export function showAppToast(
  el: HTMLElement,
  message: string,
  variant: 'info' | 'error' = 'info'
): void {
  if (toastHideTimer != null) {
    clearTimeout(toastHideTimer);
    toastHideTimer = null;
  }
  el.classList.toggle('app-toast-region--error', variant === 'error');
  el.setAttribute('aria-live', variant === 'error' ? 'assertive' : 'polite');

  const msg = document.createElement('span');
  msg.className = 'app-toast-msg';
  msg.textContent = message;

  const dismiss = document.createElement('button');
  dismiss.type = 'button';
  dismiss.className = 'app-toast-dismiss';
  dismiss.textContent = 'Fechar';
  dismiss.setAttribute('aria-label', 'Fechar notificação');

  const scheduleHide = (ms: number): void => {
    toastHideTimer = window.setTimeout((): void => {
      clearToastRegion(el);
      toastHideTimer = null;
    }, ms);
  };

  dismiss.addEventListener('click', () => {
    if (toastHideTimer != null) {
      clearTimeout(toastHideTimer);
      toastHideTimer = null;
    }
    clearToastRegion(el);
  });

  el.replaceChildren(msg, dismiss);

  scheduleHide(variant === 'error' ? TOAST_MS_ERROR : TOAST_MS_INFO);
}

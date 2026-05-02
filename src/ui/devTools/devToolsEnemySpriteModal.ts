/** Pausa no hover antes de abrir o modal (evita abrir ao passar rápido). */
const DEV_ENEMY_SPRITE_HOVER_MS = 320;

let devToolsEnemyModalEl: HTMLDivElement | null = null;
let devToolsEnemyModalOnKey: ((e: KeyboardEvent) => void) | null = null;

export function closeDevToolsEnemySpriteModal(): void {
  if (devToolsEnemyModalOnKey) {
    window.removeEventListener('keydown', devToolsEnemyModalOnKey);
    devToolsEnemyModalOnKey = null;
  }
  if (devToolsEnemyModalEl) {
    devToolsEnemyModalEl.remove();
    devToolsEnemyModalEl = null;
  }
  document.body.style.overflow = '';
}

export function openDevToolsEnemySpriteModal(spriteText: string): void {
  closeDevToolsEnemySpriteModal();

  const layer = document.createElement('div');
  layer.className = 'dev-tools-sprite-modal';
  layer.setAttribute('role', 'dialog');
  layer.setAttribute('aria-modal', 'true');
  layer.setAttribute('aria-label', 'Sprite do inimigo ampliada');

  const backdrop = document.createElement('button');
  backdrop.type = 'button';
  backdrop.className = 'dev-tools-sprite-modal-backdrop';
  backdrop.setAttribute('aria-label', 'Fechar');
  backdrop.addEventListener('click', closeDevToolsEnemySpriteModal);

  const panel = document.createElement('div');
  panel.className = 'dev-tools-sprite-modal-panel';
  panel.addEventListener('click', (e) => e.stopPropagation());
  panel.addEventListener('mouseleave', () => {
    closeDevToolsEnemySpriteModal();
  });

  const header = document.createElement('div');
  header.className = 'dev-tools-sprite-modal-header';
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'dev-tools-sprite-modal-close';
  closeBtn.textContent = 'Fechar';
  closeBtn.addEventListener('click', closeDevToolsEnemySpriteModal);
  header.appendChild(closeBtn);

  const pre = document.createElement('pre');
  pre.className = 'enemy-sprite dev-tools-enemy-sprite-modal-pre';
  pre.textContent = spriteText;

  panel.appendChild(header);
  panel.appendChild(pre);
  layer.appendChild(backdrop);
  layer.appendChild(panel);
  document.body.appendChild(layer);
  devToolsEnemyModalEl = layer;

  document.body.style.overflow = 'hidden';

  devToolsEnemyModalOnKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') closeDevToolsEnemySpriteModal();
  };
  window.addEventListener('keydown', devToolsEnemyModalOnKey);
  closeBtn.focus();
}

export function attachDevToolsEnemySpriteThumbnail(wrap: HTMLElement, spriteText: string): void {
  const open = (): void => {
    openDevToolsEnemySpriteModal(spriteText);
  };
  wrap.addEventListener('click', open);
  let hoverTimer: ReturnType<typeof setTimeout> | null = null;
  wrap.addEventListener('mouseenter', () => {
    hoverTimer = setTimeout(() => {
      hoverTimer = null;
      open();
    }, DEV_ENEMY_SPRITE_HOVER_MS);
  });
  wrap.addEventListener('mouseleave', () => {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      hoverTimer = null;
    }
  });
  wrap.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open();
    }
  });
}

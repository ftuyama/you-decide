import type { GameState } from '../engine/schema.ts';
import type { ContentRegistry } from '../content/registry.ts';
import type { GameAudio } from './sound/index.ts';
import { buildGameSidebar } from './gameAppSidebar.ts';
import { SAVE_SLOT_COUNT, buildMenuSaveSlot } from './gameAppSaveSlots.ts';
/** Layout persistente: cabeçalho, menu lateral, sidebar do jogador e área principal (`main.story-shell`). */
export type MountAppChromeOptions = {
  gameVersion: string;
  fontStep: number;
  campaignId: string;
  devMode: boolean;
  quickNavMode: boolean;
  state: GameState;
  registry: ContentRegistry;
  sidebarSections: Record<string, boolean>;
  audio: GameAudio;
  onMenuHamburgerClick: (hBtn: HTMLButtonElement) => void;
  onMenuBackdropClick: (hBtn: HTMLButtonElement) => void;
  onSoundMuteChange: (muted: boolean) => void;
  getVolume: () => number;
  setVolume: (n: number) => void;
  onDevModeChange: (v: boolean) => void;
  onQuickNavChange: (v: boolean) => void;
  onCycleFont: () => void;
  fullscreenSupported: boolean;
  getFullscreenActive: () => boolean;
  onFullscreenChange: (want: boolean) => Promise<void>;
  onExportSave: () => void;
  onImportSave: () => void;
  onCredits: () => void;
  onScenesGraph: () => void;
  showImportInPartida: boolean;
  showGraphInSettings: boolean;
  /** Modo desenvolvedor no menu (apenas em localhost). */
  showDevModeToggle: boolean;
  onSaveSlot: (slot: number) => void;
  onLoadSlot: (slot: number) => void;
  onSidebarSectionToggle: (key: string, open: boolean) => void;
  /** Preenche o `<main class="story-shell">` (combate ou narrativa). */
  fillMain: (main: HTMLElement) => void;
};

/** Monta frame, menu, sidebar e `main`; o chamador deve fazer `root.innerHTML = ''` antes. */
export function mountAppChrome(root: HTMLElement, opts: MountAppChromeOptions): void {
  const frame = document.createElement('div');
  frame.className = 'app-frame';
  frame.style.setProperty('--app-font-pct', `${100 + opts.fontStep * 10}%`);

  const header = document.createElement('header');
  header.className = 'app-top';
  const title = document.createElement('div');
  title.className = 'game-title';
  title.textContent = 'Calvário Subterrâneo';
  const hBtn = document.createElement('button');
  hBtn.type = 'button';
  hBtn.className = 'hamburger';
  hBtn.setAttribute('aria-label', 'Menu');
  hBtn.setAttribute('aria-expanded', 'false');
  hBtn.innerHTML = '☰';
  hBtn.addEventListener('click', () => opts.onMenuHamburgerClick(hBtn));
  header.appendChild(title);
  header.appendChild(hBtn);
  frame.appendChild(header);

  const backdrop = document.createElement('div');
  backdrop.className = 'menu-backdrop';
  backdrop.addEventListener('click', () => opts.onMenuBackdropClick(hBtn));
  frame.appendChild(backdrop);

  const drawer = document.createElement('aside');
  drawer.className = 'menu-drawer';
  drawer.setAttribute('aria-hidden', 'true');
  const drawerScroll = document.createElement('div');
  drawerScroll.className = 'menu-drawer-scroll';
  const createMenuSection = (titleText: string): HTMLDivElement => {
    const section = document.createElement('section');
    section.className = 'menu-section';
    const titleEl = document.createElement('h3');
    titleEl.className = 'menu-section-title';
    titleEl.textContent = titleText;
    const body = document.createElement('div');
    body.className = 'menu-section-body';
    section.appendChild(titleEl);
    section.appendChild(body);
    drawerScroll.appendChild(section);
    return body;
  };

  const soundRow = document.createElement('label');
  soundRow.className = 'menu-item menu-sound';
  const soundCb = document.createElement('input');
  soundCb.type = 'checkbox';
  soundCb.checked = !opts.audio.isMuted();
  soundCb.addEventListener('change', () => {
    opts.onSoundMuteChange(!soundCb.checked);
  });
  soundRow.appendChild(soundCb);
  soundRow.appendChild(document.createTextNode(' Som ligado'));

  const volumeRow = document.createElement('div');
  volumeRow.className = 'menu-item menu-volume';
  const volumeLabelRow = document.createElement('div');
  volumeLabelRow.className = 'menu-volume-label';
  const volumeLabel = document.createElement('label');
  volumeLabel.htmlFor = 'menu-volume-range';
  volumeLabel.textContent = 'Volume';
  const volumeValue = document.createElement('span');
  volumeValue.className = 'menu-volume-value';
  const volumeRange = document.createElement('input');
  volumeRange.type = 'range';
  volumeRange.min = '0';
  volumeRange.max = '100';
  volumeRange.step = '1';
  volumeRange.id = 'menu-volume-range';
  const syncVolumeUi = (): void => {
    const pct = Math.round(opts.getVolume() * 100);
    volumeRange.value = String(pct);
    volumeValue.textContent = `${pct}%`;
    volumeRange.setAttribute('aria-valuetext', `${pct}%`);
  };
  syncVolumeUi();
  volumeRange.addEventListener('input', () => {
    opts.setVolume(Number(volumeRange.value) / 100);
    volumeValue.textContent = `${volumeRange.value}%`;
    volumeRange.setAttribute('aria-valuetext', `${volumeRange.value}%`);
  });
  volumeLabelRow.appendChild(volumeLabel);
  volumeLabelRow.appendChild(volumeValue);
  volumeRow.appendChild(volumeLabelRow);
  volumeRow.appendChild(volumeRange);

  const devRow = document.createElement('label');
  devRow.className = 'menu-item menu-sound menu-dev';
  const devCb = document.createElement('input');
  devCb.type = 'checkbox';
  devCb.checked = opts.devMode;
  devCb.addEventListener('change', () => {
    opts.onDevModeChange(devCb.checked);
  });
  devRow.appendChild(devCb);
  devRow.appendChild(document.createTextNode(' Modo desenvolvedor'));

  const quickNavRow = document.createElement('label');
  quickNavRow.className = 'menu-item menu-sound menu-dev';
  const quickNavCb = document.createElement('input');
  quickNavCb.type = 'checkbox';
  quickNavCb.checked = opts.quickNavMode;
  quickNavCb.addEventListener('change', () => {
    opts.onQuickNavChange(quickNavCb.checked);
  });
  quickNavRow.appendChild(quickNavCb);
  quickNavRow.appendChild(document.createTextNode(' Navegação rápida (números clicáveis)'));

  const fontBtn = document.createElement('button');
  fontBtn.type = 'button';
  fontBtn.className = 'menu-item';
  fontBtn.textContent = `Tamanho do texto (${100 + opts.fontStep * 10}%)`;
  fontBtn.addEventListener('click', () => opts.onCycleFont());

  const fullscreenSupported = opts.fullscreenSupported;
  const fullscreenRow = document.createElement('label');
  fullscreenRow.className = 'menu-item menu-sound';
  if (!fullscreenSupported) {
    fullscreenRow.classList.add('menu-sound--disabled');
    fullscreenRow.title = 'Ecrã inteiro não está disponível neste navegador.';
  }
  const fullscreenCb = document.createElement('input');
  fullscreenCb.type = 'checkbox';
  fullscreenCb.dataset.menuFullscreenCb = '';
  fullscreenCb.checked = opts.getFullscreenActive();
  fullscreenCb.disabled = !fullscreenSupported;
  fullscreenCb.addEventListener('change', () => {
    if (!fullscreenSupported) return;
    const goFullscreen = fullscreenCb.checked;
    void (async () => {
      try {
        await opts.onFullscreenChange(goFullscreen);
      } catch {
        fullscreenCb.checked = opts.getFullscreenActive();
      }
    })();
  });
  fullscreenRow.appendChild(fullscreenCb);
  fullscreenRow.appendChild(document.createTextNode(' Ecrã inteiro'));

  const exportBtn = document.createElement('button');
  exportBtn.type = 'button';
  exportBtn.className = 'menu-item';
  exportBtn.textContent = 'Exportar gravação (JSON)';
  exportBtn.addEventListener('click', () => opts.onExportSave());

  const importBtn = document.createElement('button');
  importBtn.type = 'button';
  importBtn.className = 'menu-item';
  importBtn.textContent = 'Importar gravação (clipboard)';
  importBtn.addEventListener('click', () => opts.onImportSave());

  const creditsBtn = document.createElement('button');
  creditsBtn.type = 'button';
  creditsBtn.className = 'menu-item';
  creditsBtn.textContent = 'Créditos';
  creditsBtn.addEventListener('click', () => opts.onCredits());

  const graphBtn = document.createElement('button');
  graphBtn.type = 'button';
  graphBtn.className = 'menu-item';
  graphBtn.textContent = 'Grafo de cenas';
  graphBtn.title = 'Grafo por act (?view=scenes-graph). Disponível com modo desenvolvedor.';
  graphBtn.addEventListener('click', () => opts.onScenesGraph());

  const versionLabel = document.createElement('div');
  versionLabel.className = 'menu-version';
  versionLabel.textContent = `You Decide v${opts.gameVersion}`;

  const saveSection = createMenuSection('Partida');
  for (let s = 1; s <= SAVE_SLOT_COUNT; s++) {
    saveSection.appendChild(
      buildMenuSaveSlot(s, opts.campaignId, {
        onSave: (slot) => opts.onSaveSlot(slot),
        onLoad: (slot) => opts.onLoadSlot(slot),
      })
    );
  }
  if (opts.showImportInPartida) {
    saveSection.appendChild(importBtn);
  }
  saveSection.appendChild(exportBtn);

  const settingsSection = createMenuSection('Configurações');
  settingsSection.appendChild(soundRow);
  settingsSection.appendChild(volumeRow);
  settingsSection.appendChild(fontBtn);
  settingsSection.appendChild(fullscreenRow);
  settingsSection.appendChild(quickNavRow);
  if (opts.showDevModeToggle) {
    settingsSection.appendChild(devRow);
  }
  if (opts.showGraphInSettings) {
    settingsSection.appendChild(graphBtn);
  }

  const aboutSection = createMenuSection('Sobre');
  aboutSection.appendChild(creditsBtn);

  const footer = document.createElement('div');
  footer.className = 'menu-drawer-footer';
  footer.appendChild(versionLabel);
  drawer.appendChild(drawerScroll);
  drawer.appendChild(footer);
  frame.appendChild(drawer);

  const bodyRow = document.createElement('div');
  bodyRow.className = 'app-body';

  const sidebar = document.createElement('aside');
  sidebar.className = 'player-sidebar';
  sidebar.appendChild(
    buildGameSidebar({
      state: opts.state,
      registry: opts.registry,
      sidebarSections: opts.sidebarSections,
      devMode: opts.devMode,
      onSectionToggle: opts.onSidebarSectionToggle,
    })
  );

  const main = document.createElement('main');
  main.className = 'story-shell';
  opts.fillMain(main);

  bodyRow.appendChild(sidebar);
  bodyRow.appendChild(main);
  frame.appendChild(bodyRow);

  root.appendChild(frame);
}

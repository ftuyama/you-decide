import type { GameState } from '../engine/schema.ts';
import type { ContentRegistry } from '../content/registry.ts';
import { buildGameSidebar, KOFI_SUPPORT_URL } from './gameAppSidebar.ts';
import { buildMenuSaveSlot, saveSlotLimit } from './gameAppSaveSlots.ts';

/** Layout persistente: cabeçalho, menu lateral, sidebar do jogador e área principal (`main.story-shell`). */
export type MountAppChromeOptions = {
  /** Texto do título no topo (`{campanha} / {ato}`). */
  headerTitle: string;
  gameVersion: string;
  fontStep: number;
  campaignId: string;
  devMode: boolean;
  timedChoiceEnabled: boolean;
  /** Overlay em ecrã inteiro da arte ASCII na primeira visita (`highlight: true` na cena). */
  sceneArtHighlightEnabled: boolean;
  state: GameState;
  registry: ContentRegistry;
  sidebarSections: Record<string, boolean>;
  onMenuHamburgerClick: (hBtn: HTMLButtonElement) => void;
  onMenuBackdropClick: (hBtn: HTMLButtonElement) => void;
  getVolume: () => number;
  setVolume: (n: number) => void;
  onDevModeChange: (v: boolean) => void;
  onTimedChoiceChange: (v: boolean) => void;
  onSceneArtHighlightChange: (v: boolean) => void;
  onCycleFont: () => void;
  fullscreenSupported: boolean;
  getFullscreenActive: () => boolean;
  onFullscreenChange: (want: boolean) => Promise<void>;
  onExportSave: () => void;
  onImportSave: () => void;
  onCredits: () => void;
  onDevTools: () => void;
  onScenesGraph: () => void;
  showImportInPartida: boolean;
  showGraphInSettings: boolean;
  /** Modo desenvolvedor no menu (apenas em localhost). */
  showDevModeToggle: boolean;
  onSaveSlot: (slot: number) => void;
  onLoadSlot: (slot: number) => void;
  onSidebarSectionToggle: (key: string, open: boolean) => void;
  /** Som de clique na UI (ex.: abrir/fechar diário). */
  playUiClick?: () => void;
  /** Preenche o `<main class="story-shell">` (combate ou narrativa). */
  fillMain: (main: HTMLElement) => void;
};

/** Referências estáveis ao chrome montado uma vez (menu + layout). */
export type AppChromeRefs = {
  frame: HTMLElement;
  titleEl: HTMLElement;
  sidebarEl: HTMLElement;
  mainEl: HTMLElement;
  hamburgerBtn: HTMLButtonElement;
  volumeRange: HTMLInputElement;
  volumeValue: HTMLElement;
  devCb: HTMLInputElement;
  timedChoiceCb: HTMLInputElement;
  sceneArtHighlightCb: HTMLInputElement;
  fontBtn: HTMLButtonElement;
  fullscreenCb: HTMLInputElement;
  devSaveExtrasEl: HTMLElement;
  devSettingsExtrasEl: HTMLElement;
  /** Só os cartões de slot (actualizado em `syncAppChrome` após gravar/importar). */
  saveSlotsWrap: HTMLElement;
};

function fillMenuSaveSlots(
  wrap: HTMLElement,
  campaignId: string,
  devMode: boolean,
  onSaveSlot: (slot: number) => void,
  onLoadSlot: (slot: number) => void
): void {
  wrap.replaceChildren();
  for (let s = 1; s <= saveSlotLimit(devMode); s++) {
    wrap.appendChild(
      buildMenuSaveSlot(s, campaignId, {
        onSave: onSaveSlot,
        onLoad: onLoadSlot,
      })
    );
  }
}

function buildChromeDom(opts: MountAppChromeOptions): AppChromeRefs {
  const frame = document.createElement('div');
  frame.className = 'app-frame';
  frame.style.setProperty('--app-font-pct', `${100 + opts.fontStep * 10}%`);

  const header = document.createElement('header');
  header.className = 'app-top';
  const title = document.createElement('div');
  title.className = 'game-title';
  title.textContent = opts.headerTitle;
  const hBtn = document.createElement('button');
  hBtn.type = 'button';
  hBtn.className = 'hamburger';
  hBtn.setAttribute('aria-label', 'Menu');
  hBtn.setAttribute('aria-expanded', 'false');
  hBtn.innerHTML = '\u2630';
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
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-modal', 'true');
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

  const timedChoiceRow = document.createElement('label');
  timedChoiceRow.className = 'menu-item menu-sound menu-dev';
  const timedChoiceCb = document.createElement('input');
  timedChoiceCb.type = 'checkbox';
  timedChoiceCb.checked = opts.timedChoiceEnabled;
  timedChoiceCb.addEventListener('change', () => {
    opts.onTimedChoiceChange(timedChoiceCb.checked);
  });
  timedChoiceRow.appendChild(timedChoiceCb);
  timedChoiceRow.appendChild(
    document.createTextNode(' Limite de tempo nas escolhas (barra e decisão automática)')
  );

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

  const sceneArtHighlightRow = document.createElement('label');
  sceneArtHighlightRow.className = 'menu-item menu-sound';
  const sceneArtHighlightCb = document.createElement('input');
  sceneArtHighlightCb.type = 'checkbox';
  sceneArtHighlightCb.checked = opts.sceneArtHighlightEnabled;
  sceneArtHighlightCb.addEventListener('change', () => {
    opts.onSceneArtHighlightChange(sceneArtHighlightCb.checked);
  });
  sceneArtHighlightRow.appendChild(sceneArtHighlightCb);
  sceneArtHighlightRow.appendChild(
    document.createTextNode(' Destaque da arte da cena na primeira visita')
  );

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

  const devToolsBtn = document.createElement('button');
  devToolsBtn.type = 'button';
  devToolsBtn.className = 'menu-item';
  devToolsBtn.textContent = 'Ferramentas de desenvolvimento';
  devToolsBtn.title = 'Itens, cenas, música, inimigos (?view=dev). Disponível com modo desenvolvedor.';
  devToolsBtn.addEventListener('click', () => opts.onDevTools());

  const graphBtn = document.createElement('button');
  graphBtn.type = 'button';
  graphBtn.className = 'menu-item';
  graphBtn.textContent = 'Grafo de cenas';
  graphBtn.title = 'Grafo por act (?view=scenes-graph). Disponível com modo desenvolvedor.';
  graphBtn.addEventListener('click', () => opts.onScenesGraph());

  const versionLabel = document.createElement('div');
  versionLabel.className = 'menu-version';
  versionLabel.textContent = `Silent Dungeon v${opts.gameVersion}`;

  const devSaveExtrasEl = document.createElement('div');
  devSaveExtrasEl.className = 'menu-dev-save-extras';
  devSaveExtrasEl.appendChild(importBtn);

  const devSettingsExtrasEl = document.createElement('div');
  devSettingsExtrasEl.className = 'menu-dev-settings-extras';
  devSettingsExtrasEl.appendChild(devToolsBtn);
  devSettingsExtrasEl.appendChild(graphBtn);

  const saveSection = createMenuSection('Partida');
  const saveSlotsWrap = document.createElement('div');
  saveSlotsWrap.className = 'menu-save-slots';
  fillMenuSaveSlots(saveSlotsWrap, opts.campaignId, opts.devMode, opts.onSaveSlot, opts.onLoadSlot);
  saveSection.appendChild(saveSlotsWrap);
  saveSection.appendChild(devSaveExtrasEl);
  saveSection.appendChild(exportBtn);

  const settingsSection = createMenuSection('Configurações');
  settingsSection.appendChild(volumeRow);
  settingsSection.appendChild(fontBtn);
  settingsSection.appendChild(fullscreenRow);
  settingsSection.appendChild(sceneArtHighlightRow);
  settingsSection.appendChild(timedChoiceRow);

  if (opts.showDevModeToggle || opts.showGraphInSettings) {
    const devSection = createMenuSection('Desenvolvimento');
    if (opts.showDevModeToggle) {
      devSection.appendChild(devRow);
    }
    devSection.appendChild(devSettingsExtrasEl);
  }

  const aboutSection = createMenuSection('Sobre');
  aboutSection.appendChild(creditsBtn);

  const kofiLink = document.createElement('a');
  kofiLink.href = KOFI_SUPPORT_URL;
  kofiLink.target = '_blank';
  kofiLink.rel = 'noopener noreferrer';
  kofiLink.className = 'menu-item menu-item--kofi';
  kofiLink.textContent = 'Apoiar no Ko-fi';
  kofiLink.title = 'Abre a página de apoio no Ko-fi (novo separador)';
  aboutSection.appendChild(kofiLink);

  const footer = document.createElement('div');
  footer.className = 'menu-drawer-footer';
  footer.appendChild(versionLabel);
  drawer.appendChild(drawerScroll);
  drawer.appendChild(footer);
  frame.appendChild(drawer);

  const bodyRow = document.createElement('div');
  bodyRow.className = 'app-body';

  const sidebarEl = document.createElement('aside');
  sidebarEl.className = 'player-sidebar';
  sidebarEl.appendChild(
    buildGameSidebar({
      state: opts.state,
      registry: opts.registry,
      sidebarSections: opts.sidebarSections,
      onSectionToggle: opts.onSidebarSectionToggle,
      playUiClick: opts.playUiClick,
    })
  );

  const mainEl = document.createElement('main');
  mainEl.className = 'story-shell';
  opts.fillMain(mainEl);

  bodyRow.appendChild(sidebarEl);
  bodyRow.appendChild(mainEl);
  frame.appendChild(bodyRow);

  return {
    frame,
    titleEl: title,
    sidebarEl,
    mainEl,
    hamburgerBtn: hBtn,
    volumeRange,
    volumeValue,
    devCb,
    timedChoiceCb,
    sceneArtHighlightCb,
    fontBtn,
    fullscreenCb,
    devSaveExtrasEl,
    devSettingsExtrasEl,
    saveSlotsWrap,
  };
}

/** Monta frame, menu, sidebar e `main` uma vez; anexa a `root`. */
export function mountAppChrome(root: HTMLElement, opts: MountAppChromeOptions): AppChromeRefs {
  const refs = buildChromeDom(opts);
  root.appendChild(refs.frame);
  return refs;
}

/** Atualiza título, tipografia, sidebar, área principal e estado do menu sem destruir listeners. */
export function syncAppChrome(refs: AppChromeRefs, opts: MountAppChromeOptions): void {
  refs.frame.style.setProperty('--app-font-pct', `${100 + opts.fontStep * 10}%`);
  refs.titleEl.textContent = opts.headerTitle;

  refs.devSaveExtrasEl.hidden = !opts.showImportInPartida;
  refs.devSettingsExtrasEl.hidden = !opts.showGraphInSettings;

  const pct = Math.round(opts.getVolume() * 100);
  refs.volumeRange.value = String(pct);
  refs.volumeValue.textContent = `${pct}%`;
  refs.volumeRange.setAttribute('aria-valuetext', `${pct}%`);

  refs.devCb.checked = opts.devMode;
  refs.timedChoiceCb.checked = opts.timedChoiceEnabled;
  refs.sceneArtHighlightCb.checked = opts.sceneArtHighlightEnabled;
  refs.fontBtn.textContent = `Tamanho do texto (${100 + opts.fontStep * 10}%)`;
  refs.fullscreenCb.checked = opts.getFullscreenActive();

  while (refs.sidebarEl.firstChild) {
    refs.sidebarEl.removeChild(refs.sidebarEl.firstChild);
  }
  refs.sidebarEl.appendChild(
    buildGameSidebar({
      state: opts.state,
      registry: opts.registry,
      sidebarSections: opts.sidebarSections,
      onSectionToggle: opts.onSidebarSectionToggle,
      playUiClick: opts.playUiClick,
    })
  );

  refs.mainEl.classList.remove('main--combat');
  refs.mainEl.replaceChildren();
  opts.fillMain(refs.mainEl);

  fillMenuSaveSlots(refs.saveSlotsWrap, opts.campaignId, opts.devMode, opts.onSaveSlot, opts.onLoadSlot);
}

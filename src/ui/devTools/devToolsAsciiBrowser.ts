import {
  buildDevToolsHref,
  resolveDevToolsAsciiPathFromLocation,
  type DevToolsAsciiSort,
  resolveDevToolsAsciiSortFromLocation,
} from '../campaignUrl.ts';
import type { AsciiSceneFileMeta } from '../asciiSceneFileMeta.ts';
import manifest from 'virtual:ascii-scene-dev-manifest';
import { mountSceneArtHighlightPreview } from '../gameAppStory.ts';

/** Fallback do hold na pré-visualização dev se nenhuma cena YAML definir `highlightHoldMs` para esta base. */
const ASCII_HIGHLIGHT_PREVIEW_HOLD_FALLBACK_MS = 2800;

/** Quadros de highlight animado: `dungeon_mouth_hl0`, … (não listar no navegador). */
function isHlVariantKey(key: string): boolean {
  return /_hl\d+$/u.test(key);
}

/** Prefixo antes de `_hl0`, `_hl1`, … (ex.: `dungeon_mouth_hl2` → `dungeon_mouth`). */
function asciiHighlightBaseKey(selectedKey: string): string {
  return selectedKey.replace(/_hl\d+$/u, '');
}

/** Uma linha por arte “principal” (ex.: `dungeon_mouth`, não `dungeon_mouth_hl0`). */
function listCatalogMeta(raw: readonly AsciiSceneFileMeta[]): AsciiSceneFileMeta[] {
  return raw.filter((m) => !isHlVariantKey(m.key));
}

/** Chaves base das artes com highlight animado (para filtro e meta). */
function animatedHighlightBaseKeys(frameKeys: ReadonlySet<string>): Set<string> {
  const bases = new Set<string>();
  for (const k of frameKeys) {
    bases.add(asciiHighlightBaseKey(k));
  }
  return bases;
}

/** URL `asciiPath` apontando a `_hlN` → caminho do `.txt` base no catálogo, se existir. */
function catalogPathForAsciiPath(
  path: string,
  raw: readonly AsciiSceneFileMeta[],
  catalog: readonly AsciiSceneFileMeta[]
): string {
  const found = raw.find((m) => m.path === path);
  if (!found) return catalog[0]?.path ?? '';
  if (!isHlVariantKey(found.key)) {
    return catalog.some((m) => m.path === path) ? path : catalog[0]?.path ?? '';
  }
  const baseKey = asciiHighlightBaseKey(found.key);
  const base = catalog.find((m) => m.key === baseKey);
  return base?.path ?? catalog[0]?.path ?? '';
}

/** Quadros `base_hl0`, `base_hl1`, … com chave e texto. */
function collectHlFrameEntries(
  sceneArt: Record<string, string>,
  selectedKey: string
): { key: string; text: string }[] {
  const base = asciiHighlightBaseKey(selectedKey);
  const out: { key: string; text: string }[] = [];
  for (let n = 0; ; n++) {
    const k = `${base}_hl${n}`;
    if (sceneArt[k] === undefined || isEmptyAsciiSceneArt(sceneArt, k)) break;
    out.push({ key: k, text: sceneArt[k]! });
  }
  return out;
}

function formatMtimePt(ms: number): string {
  try {
    return new Date(ms).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return String(ms);
  }
}

/** Alinha a `scripts/check-pending-ascii-art.mjs`: em falta, só espaços, ou só PLACEHOLDER. */
function isEmptyAsciiSceneArt(sceneArt: Record<string, string>, key: string): boolean {
  const text = sceneArt[key];
  if (text === undefined) return true;
  const t = text.trim();
  if (t === '') return true;
  return t.toUpperCase() === 'PLACEHOLDER';
}

function sortFiles(
  items: readonly AsciiSceneFileMeta[],
  sort: DevToolsAsciiSort
): AsciiSceneFileMeta[] {
  const copy = [...items];
  switch (sort) {
    case 'name-desc':
      copy.sort((a, b) => b.key.localeCompare(a.key) || b.path.localeCompare(a.path));
      break;
    case 'mtime-desc':
      copy.sort((a, b) => b.mtimeMs - a.mtimeMs || a.path.localeCompare(b.path));
      break;
    case 'mtime-asc':
      copy.sort((a, b) => a.mtimeMs - b.mtimeMs || a.path.localeCompare(b.path));
      break;
    case 'name-asc':
    default:
      copy.sort((a, b) => a.key.localeCompare(b.key) || a.path.localeCompare(b.path));
  }
  return copy;
}

export function mountAsciiBrowserPanel(
  parent: HTMLElement,
  campaignId: string,
  sceneArt: Record<string, string>,
  /** Chaves referenciadas em `artHighlightFrames` com overlay animado (2+ quadros). */
  animatedHighlightArtKeys: ReadonlySet<string>,
  /**
   * Chave base da arte (`dungeon_mouth` a partir de `dungeon_mouth_hl0`, …) → `highlightHoldMs` efectivo
   * nas cenas com highlight animado (para pré-visualização alinhar ao jogo).
   */
  highlightHoldMsByBase: ReadonlyMap<string, number>
): void {
  let highlightPreviewCancel: (() => void) | null = null;

  const initialPath = resolveDevToolsAsciiPathFromLocation();
  const initialSort = resolveDevToolsAsciiSortFromLocation();

  const rawMeta = manifest[campaignId] ?? [];
  const listMeta = listCatalogMeta(rawMeta);
  const animatedBases = animatedHighlightBaseKeys(animatedHighlightArtKeys);
  const layout = document.createElement('div');
  layout.className = 'dev-tools-scene-layout';

  const sidebar = document.createElement('div');
  sidebar.className = 'dev-tools-scene-sidebar';

  const sortRow = document.createElement('div');
  sortRow.className = 'dev-tools-filter-row';
  const sortLab = document.createElement('label');
  sortLab.className = 'dev-tools-filter';
  sortLab.textContent = 'Ordenar ';
  const sortSel = document.createElement('select');
  sortSel.className = 'dev-tools-select';
  const sortOpts: { value: DevToolsAsciiSort; label: string }[] = [
    { value: 'name-asc', label: 'Nome (A→Z)' },
    { value: 'name-desc', label: 'Nome (Z→A)' },
    { value: 'mtime-desc', label: 'Mais recentes' },
    { value: 'mtime-asc', label: 'Mais antigos' },
  ];
  for (const o of sortOpts) {
    const opt = document.createElement('option');
    opt.value = o.value;
    opt.textContent = o.label;
    if (o.value === initialSort) opt.selected = true;
    sortSel.appendChild(opt);
  }
  sortLab.appendChild(sortSel);
  sortRow.appendChild(sortLab);

  const searchRow = document.createElement('div');
  searchRow.className = 'dev-tools-filter-row';
  const searchLab = document.createElement('label');
  searchLab.className = 'dev-tools-filter';
  searchLab.textContent = 'Filtrar ';
  const searchInp = document.createElement('input');
  searchInp.type = 'search';
  searchInp.className = 'dev-tools-search';
  searchInp.placeholder = 'nome do ficheiro ou pasta…';
  searchLab.appendChild(searchInp);
  searchRow.appendChild(searchLab);

  const emptyRow = document.createElement('div');
  emptyRow.className = 'dev-tools-filter-row';
  const emptyLab = document.createElement('label');
  emptyLab.className = 'dev-tools-filter';
  emptyLab.textContent = 'Mostrar ';
  const emptySel = document.createElement('select');
  emptySel.className = 'dev-tools-select';
  const emptyOpts: { value: 'all' | 'empty' | 'animated'; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'empty', label: 'Só vazios ou PLACEHOLDER' },
    {
      value: 'animated',
      label: `Só keys em highlight animado (${animatedBases.size})`,
    },
  ];
  for (const o of emptyOpts) {
    const opt = document.createElement('option');
    opt.value = o.value;
    opt.textContent = o.label;
    emptySel.appendChild(opt);
  }
  emptyLab.appendChild(emptySel);
  emptyRow.appendChild(emptyLab);

  const listEl = document.createElement('ul');
  listEl.className = 'dev-tools-scene-list';

  const note = document.createElement('p');
  note.className = 'dev-tools-note';
  note.textContent =
    animatedBases.size > 0
      ? 'Lista de ASCII Arts da campanha'
      : 'Lista de ASCII Arts da campanha (nenhuma cena com artHighlightFrames animado ainda)';

  sidebar.appendChild(note);
  sidebar.appendChild(sortRow);
  sidebar.appendChild(searchRow);
  sidebar.appendChild(emptyRow);
  sidebar.appendChild(listEl);

  const detail = document.createElement('div');
  detail.className = 'dev-tools-scene-detail dev-tools-scene-detail--ascii-browser';

  let selectedPath =
    initialPath && rawMeta.some((m) => m.path === initialPath)
      ? catalogPathForAsciiPath(initialPath, rawMeta, listMeta)
      : listMeta[0]?.path ?? '';

  function currentSort(): DevToolsAsciiSort {
    return sortSel.value as DevToolsAsciiSort;
  }

  function filteredSorted(): AsciiSceneFileMeta[] {
    const q = searchInp.value.trim().toLowerCase();
    const showMode = emptySel.value as 'all' | 'empty' | 'animated';
    let base = q
      ? listMeta.filter(
          (m) =>
            m.key.toLowerCase().includes(q) ||
            m.path.toLowerCase().includes(q)
        )
      : [...listMeta];
    if (showMode === 'empty') {
      base = base.filter((m) => isEmptyAsciiSceneArt(sceneArt, m.key));
    } else if (showMode === 'animated') {
      base = base.filter((m) => animatedBases.has(m.key));
    }
    return sortFiles(base, currentSort());
  }

  function renderList(): void {
    listEl.innerHTML = '';
    const rows = filteredSorted();
    if (rows.length === 0) {
      const li = document.createElement('li');
      li.className = 'dev-tools-ascii-browser-empty';
      const mode = emptySel.value as 'all' | 'empty' | 'animated';
      li.textContent =
        mode === 'animated' && animatedBases.size === 0
          ? 'Nenhuma cena com highlight animado (artHighlightFrames com 2+ chaves resolvidas em sceneArt).'
          : 'Nenhum ficheiro corresponde ao filtro.';
      listEl.appendChild(li);
      return;
    }
    for (const m of rows) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.className = 'dev-tools-scene-link';
      a.href = buildDevToolsHref(campaignId, 'ascii-browser', {
        asciiPath: m.path,
        asciiSort: currentSort(),
      });
      a.textContent = m.path;
      a.dataset.asciiPath = m.path;
      if (m.path === selectedPath) a.classList.add('dev-tools-scene-link--active');
      li.appendChild(a);
      listEl.appendChild(li);
    }
  }

  function showDetail(meta: AsciiSceneFileMeta): void {
    detail.innerHTML = '';
    const h2 = document.createElement('h2');
    h2.className = 'dev-tools-detail-title';
    h2.textContent = meta.key;
    detail.appendChild(h2);

    const pathLine = document.createElement('div');
    pathLine.className = 'dev-tools-detail-meta';
    pathLine.appendChild(document.createTextNode('ascii/scenes/'));
    const codePath = document.createElement('code');
    codePath.textContent = meta.path;
    pathLine.appendChild(codePath);
    detail.appendChild(pathLine);

    const timeLine = document.createElement('div');
    timeLine.className = 'dev-tools-detail-meta';
    timeLine.textContent = `Modificado: ${formatMtimePt(meta.mtimeMs)}`;
    detail.appendChild(timeLine);

    if (animatedBases.has(meta.key)) {
      const animLine = document.createElement('div');
      animLine.className = 'dev-tools-detail-meta dev-tools-detail-meta--accent';
      animLine.textContent =
        'Referenciada em artHighlightFrames de uma cena com highlight animado';
      detail.appendChild(animLine);
    }

    const text = sceneArt[meta.key];
    if (text !== undefined) {
      const hlEntries = collectHlFrameEntries(sceneArt, meta.key);
      const hlFrames = hlEntries.map((e) => e.text);
      if (hlFrames.length >= 2) {
        const previewHoldMs =
          highlightHoldMsByBase.get(meta.key) ?? ASCII_HIGHLIGHT_PREVIEW_HOLD_FALLBACK_MS;
        const previewRow = document.createElement('div');
        previewRow.className = 'dev-tools-ascii-highlight-preview-row';
        const previewBtn = document.createElement('button');
        previewBtn.type = 'button';
        previewBtn.className = 'dev-tools-btn dev-tools-btn--primary';
        previewBtn.textContent = 'Pré-visualizar highlight (overlay)';
        previewBtn.title = `Simula o overlay do jogo com ${hlFrames.length} quadros (_hl0…). Hold ${previewHoldMs} ms (YAML ou fallback dev). Esc ou Fechar para sair.`;
        previewBtn.addEventListener('click', () => {
          highlightPreviewCancel?.();
          highlightPreviewCancel = mountSceneArtHighlightPreview({
            frames: hlFrames,
            holdMs: previewHoldMs,
          });
        });
        previewRow.appendChild(previewBtn);
        const previewHint = document.createElement('span');
        previewHint.className = 'dev-tools-ascii-highlight-preview-hint';
        const holdSource = highlightHoldMsByBase.has(meta.key) ? 'YAML' : 'fallback dev';
        previewHint.textContent = `${hlFrames.length} quadros · hold ${previewHoldMs} ms (${holdSource})`;
        previewRow.appendChild(previewHint);
        detail.appendChild(previewRow);
      }

      const artWrap = document.createElement('div');
      artWrap.className = 'scene-art';
      artWrap.textContent = text;
      detail.appendChild(artWrap);

      if (hlEntries.length >= 1) {
        const stackToggleRow = document.createElement('div');
        stackToggleRow.className = 'dev-tools-ascii-hl-stack-toggle-row';
        const stackToggleBtn = document.createElement('button');
        stackToggleBtn.type = 'button';
        stackToggleBtn.className = 'dev-tools-btn dev-tools-btn--secondary';
        stackToggleBtn.textContent = 'Ocultar quadros (_hl)';
        stackToggleBtn.title = 'Esconde ou mostra cada quadro de highlight (chave + ASCII) abaixo.';
        const stackWrap = document.createElement('div');
        stackWrap.className = 'dev-tools-ascii-hl-stack';
        stackWrap.hidden = false;
        stackWrap.setAttribute('aria-hidden', 'false');

        function populateHlStackIfNeeded(): void {
          if (stackWrap.childElementCount > 0) return;
          for (const { key: hlKey, text: hlText } of hlEntries) {
            const block = document.createElement('section');
            block.className = 'dev-tools-ascii-hl-stack__frame';
            const cap = document.createElement('div');
            cap.className = 'dev-tools-ascii-hl-stack__caption';
            const keyCode = document.createElement('code');
            keyCode.textContent = hlKey;
            cap.appendChild(keyCode);
            const hlArt = document.createElement('div');
            hlArt.className = 'scene-art';
            hlArt.textContent = hlText;
            block.appendChild(cap);
            block.appendChild(hlArt);
            stackWrap.appendChild(block);
          }
        }

        stackToggleBtn.addEventListener('click', () => {
          const wasHidden = stackWrap.hidden;
          if (wasHidden) populateHlStackIfNeeded();
          stackWrap.hidden = !wasHidden;
          stackWrap.setAttribute('aria-hidden', wasHidden ? 'false' : 'true');
          stackToggleBtn.textContent = wasHidden
            ? 'Ocultar quadros (_hl)'
            : 'Mostrar todos os quadros (_hl)';
        });
        stackToggleRow.appendChild(stackToggleBtn);
        detail.appendChild(stackToggleRow);
        detail.appendChild(stackWrap);
        populateHlStackIfNeeded();
      }
    } else {
      const p = document.createElement('p');
      p.className = 'dev-tools-missing';
      p.textContent =
        'Conteúdo não encontrado em SCENE_ART (chave não coincide ou campanha sem bundle).';
      detail.appendChild(p);
    }
  }

  listEl.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const a = t.closest('a');
    if (!a?.dataset.asciiPath) return;
    e.preventDefault();
    selectedPath = a.dataset.asciiPath;
    const sort = currentSort();
    window.history.pushState(
      {},
      '',
      buildDevToolsHref(campaignId, 'ascii-browser', { asciiPath: selectedPath, asciiSort: sort })
    );
    const meta = listMeta.find((m) => m.path === selectedPath);
    renderList();
    if (meta) showDetail(meta);
  });

  sortSel.addEventListener('change', () => {
    const sort = currentSort();
    window.history.pushState(
      {},
      '',
      buildDevToolsHref(campaignId, 'ascii-browser', {
        asciiPath: selectedPath || null,
        asciiSort: sort,
      })
    );
    renderList();
    const meta = listMeta.find((m) => m.path === selectedPath);
    if (meta) showDetail(meta);
  });

  searchInp.addEventListener('input', () => {
    renderList();
    const visible = filteredSorted();
    if (selectedPath && !visible.some((m) => m.path === selectedPath)) {
      selectedPath = visible[0]?.path ?? '';
    }
    const meta = listMeta.find((m) => m.path === selectedPath);
    if (meta) showDetail(meta);
    else detail.innerHTML = '';
  });

  emptySel.addEventListener('change', () => {
    renderList();
    const visible = filteredSorted();
    if (selectedPath && !visible.some((m) => m.path === selectedPath)) {
      selectedPath = visible[0]?.path ?? '';
      window.history.pushState(
        {},
        '',
        buildDevToolsHref(campaignId, 'ascii-browser', {
          asciiPath: selectedPath || null,
          asciiSort: currentSort(),
        })
      );
    }
    const meta = listMeta.find((m) => m.path === selectedPath);
    if (meta) showDetail(meta);
    else detail.innerHTML = '';
  });

  renderList();
  const firstMeta = listMeta.find((m) => m.path === selectedPath);
  if (firstMeta) showDetail(firstMeta);
  else {
    detail.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'dev-tools-missing';
    p.textContent =
      rawMeta.length === 0
        ? 'Esta campanha não tem ficheiros em ascii/scenes/.'
        : listMeta.length === 0
          ? 'Nenhum ficheiro base listável (só variantes _hlN?).'
          : 'Seleciona um ficheiro na lista.';
    detail.appendChild(p);
  }

  layout.appendChild(sidebar);
  layout.appendChild(detail);
  parent.appendChild(layout);
}

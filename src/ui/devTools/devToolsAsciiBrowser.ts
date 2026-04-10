import {
  buildDevToolsHref,
  resolveDevToolsAsciiPathFromLocation,
  type DevToolsAsciiSort,
  resolveDevToolsAsciiSortFromLocation,
} from '../campaignUrl.ts';
import type { AsciiSceneFileMeta } from '../asciiSceneFileMeta.ts';
import manifest from 'virtual:ascii-scene-dev-manifest';

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
  sceneArt: Record<string, string>
): void {
  const initialPath = resolveDevToolsAsciiPathFromLocation();
  const initialSort = resolveDevToolsAsciiSortFromLocation();

  const rawMeta = manifest[campaignId] ?? [];
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
  const emptyOpts: { value: 'all' | 'empty'; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'empty', label: 'Só vazios ou PLACEHOLDER' },
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
    'Lista de ASCII Arts da campanha';

  sidebar.appendChild(note);
  sidebar.appendChild(sortRow);
  sidebar.appendChild(searchRow);
  sidebar.appendChild(emptyRow);
  sidebar.appendChild(listEl);

  const detail = document.createElement('div');
  detail.className = 'dev-tools-scene-detail';

  let selectedPath =
    initialPath && rawMeta.some((m) => m.path === initialPath) ? initialPath : rawMeta[0]?.path ?? '';

  function currentSort(): DevToolsAsciiSort {
    return sortSel.value as DevToolsAsciiSort;
  }

  function filteredSorted(): AsciiSceneFileMeta[] {
    const q = searchInp.value.trim().toLowerCase();
    const emptyOnly = emptySel.value === 'empty';
    let base = q
      ? rawMeta.filter(
          (m) =>
            m.key.toLowerCase().includes(q) ||
            m.path.toLowerCase().includes(q)
        )
      : [...rawMeta];
    if (emptyOnly) {
      base = base.filter((m) => isEmptyAsciiSceneArt(sceneArt, m.key));
    }
    return sortFiles(base, currentSort());
  }

  function renderList(): void {
    listEl.innerHTML = '';
    const rows = filteredSorted();
    if (rows.length === 0) {
      const li = document.createElement('li');
      li.className = 'dev-tools-ascii-browser-empty';
      li.textContent = 'Nenhum ficheiro corresponde ao filtro.';
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

    const text = sceneArt[meta.key];
    if (text !== undefined) {
      const artWrap = document.createElement('div');
      artWrap.className = 'scene-art';
      artWrap.textContent = text;
      detail.appendChild(artWrap);
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
    const meta = rawMeta.find((m) => m.path === selectedPath);
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
    const meta = rawMeta.find((m) => m.path === selectedPath);
    if (meta) showDetail(meta);
  });

  searchInp.addEventListener('input', () => {
    renderList();
    const visible = filteredSorted();
    if (selectedPath && !visible.some((m) => m.path === selectedPath)) {
      selectedPath = visible[0]?.path ?? '';
    }
    const meta = rawMeta.find((m) => m.path === selectedPath);
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
    const meta = rawMeta.find((m) => m.path === selectedPath);
    if (meta) showDetail(meta);
    else detail.innerHTML = '';
  });

  renderList();
  const firstMeta = rawMeta.find((m) => m.path === selectedPath);
  if (firstMeta) showDetail(firstMeta);
  else {
    detail.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'dev-tools-missing';
    p.textContent =
      rawMeta.length === 0
        ? 'Esta campanha não tem ficheiros em ascii/scenes/.'
        : 'Seleciona um ficheiro na lista.';
    detail.appendChild(p);
  }

  layout.appendChild(sidebar);
  layout.appendChild(detail);
  parent.appendChild(layout);
}

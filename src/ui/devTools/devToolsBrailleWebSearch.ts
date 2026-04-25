import {
  brailleAsciiFromImageSource,
  type BrailleAsciiOptions,
  type BrailleDithererName,
} from '../../dev/brailleAsciiFromImage.ts';
import type { PexelsImageHit } from '../../dev/pexelsImageSearch.ts';

const DEV_IMAGE_PROXY = '/__dev/image-proxy';
const DEV_IMAGE_SEARCH = '/__dev/image-search';

function parseDitherer(value: string): BrailleDithererName {
  if (
    value === 'threshold' ||
    value === 'floydSteinberg' ||
    value === 'stucki' ||
    value === 'atkinson'
  ) {
    return value;
  }
  return 'atkinson';
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function parseSearchResponse(json: unknown): { hits: PexelsImageHit[]; error?: string } {
  if (!isRecord(json)) return { hits: [], error: 'Resposta inválida' };
  if (typeof json.error === 'string') return { hits: [], error: json.error };
  const hitsRaw = json.hits;
  if (!Array.isArray(hitsRaw)) return { hits: [], error: 'Resposta inválida' };
  const hits: PexelsImageHit[] = [];
  for (const h of hitsRaw) {
    if (!isRecord(h)) continue;
    const id = typeof h.id === 'string' ? h.id : '';
    const pageUrl = typeof h.pageUrl === 'string' ? h.pageUrl : '';
    const photographer = typeof h.photographer === 'string' ? h.photographer : '';
    const photographerUrl = typeof h.photographerUrl === 'string' ? h.photographerUrl : '';
    const imageUrl = typeof h.imageUrl === 'string' ? h.imageUrl : '';
    const thumbUrl = typeof h.thumbUrl === 'string' ? h.thumbUrl : imageUrl;
    if (!id || !imageUrl) continue;
    hits.push({ id, pageUrl, photographer, photographerUrl, imageUrl, thumbUrl });
  }
  return { hits };
}

async function fetchBitmapViaProxy(imageUrl: string): Promise<ImageBitmap> {
  const fetchUrl = `${DEV_IMAGE_PROXY}?url=${encodeURIComponent(imageUrl)}`;
  const res = await fetch(fetchUrl);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const blob = await res.blob();
  return createImageBitmap(blob);
}

async function mapPool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>): Promise<void> {
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx]!);
    }
  });
  await Promise.all(workers);
}

export function mountBrailleWebSearchPanel(parent: HTMLElement): void {
  const wrap = document.createElement('div');
  wrap.className = 'dev-tools-websearch';

  const intro = document.createElement('div');
  intro.className = 'dev-tools-websearch-intro';
  const title = document.createElement('h2');
  title.className = 'dev-tools-websearch-title';
  title.textContent = 'Busca na Web → Braille';
  const blurb = document.createElement('p');
  blurb.className = 'dev-tools-websearch-blurb';
  blurb.textContent =
    'Pesquisa fotos (Pexels), converte cada resultado para Braille Unicode e copia para colar nas cenas. Requer npm run dev e PEXELS_API_KEY em .env.local — ver comentário em vite.config.ts.';
  intro.appendChild(title);
  intro.appendChild(blurb);

  const devOnly = document.createElement('div');
  devOnly.className = 'dev-tools-websearch-devonly';
  devOnly.hidden = import.meta.env.DEV;
  devOnly.textContent =
    'Esta ferramenta só está disponível em desenvolvimento (npm run dev): o servidor Vite expõe a busca e o proxy de imagens.';

  const toolbar = document.createElement('div');
  toolbar.className = 'dev-tools-websearch-toolbar';
  toolbar.hidden = !import.meta.env.DEV;

  const searchRow = document.createElement('div');
  searchRow.className = 'dev-tools-websearch-search-row';
  const searchInp = document.createElement('input');
  searchInp.type = 'search';
  searchInp.className = 'dev-tools-search dev-tools-websearch-query';
  searchInp.placeholder = 'Termo de busca (ex.: dungeon, fog, ruins)…';
  searchInp.autocomplete = 'off';
  searchInp.name = 'websearch-q';
  const searchBtn = document.createElement('button');
  searchBtn.type = 'button';
  searchBtn.className = 'dev-tools-btn dev-tools-btn--primary';
  searchBtn.textContent = 'Buscar';
  searchRow.appendChild(searchInp);
  searchRow.appendChild(searchBtn);

  const tuneCard = document.createElement('section');
  tuneCard.className = 'dev-tools-websearch-tune dev-tools-braille-card';
  const tuneTitle = document.createElement('h3');
  tuneTitle.className = 'dev-tools-braille-card-title';
  tuneTitle.textContent = 'Conversão nos cartões';
  tuneCard.appendChild(tuneTitle);

  const widthRow = document.createElement('div');
  widthRow.className = 'dev-tools-braille-field';
  const widthLab = document.createElement('label');
  widthLab.className = 'dev-tools-braille-label';
  widthLab.textContent = 'Largura (caracteres por linha)';
  const widthInner = document.createElement('div');
  widthInner.className = 'dev-tools-braille-slider-row';
  const widthNum = document.createElement('input');
  widthNum.type = 'number';
  widthNum.min = '20';
  widthNum.max = '200';
  widthNum.value = '72';
  widthNum.className = 'dev-tools-braille-num';
  widthNum.setAttribute('aria-label', 'Largura numérica');
  const widthRange = document.createElement('input');
  widthRange.type = 'range';
  widthRange.min = '20';
  widthRange.max = '200';
  widthRange.value = '72';
  widthRange.className = 'dev-tools-braille-range dev-tools-braille-range--grow';
  widthInner.appendChild(widthNum);
  widthInner.appendChild(widthRange);
  widthRow.appendChild(widthLab);
  widthRow.appendChild(widthInner);

  const ditherRow = document.createElement('div');
  ditherRow.className = 'dev-tools-braille-field';
  const ditherLab = document.createElement('label');
  ditherLab.className = 'dev-tools-braille-label';
  ditherLab.textContent = 'Dither';
  const ditherSel = document.createElement('select');
  ditherSel.className = 'dev-tools-select dev-tools-braille-select';
  for (const opt of [
    ['atkinson', 'Atkinson'],
    ['floydSteinberg', 'Floyd–Steinberg'],
    ['threshold', 'Limiar'],
    ['stucki', 'Stucki'],
  ] as const) {
    const o = document.createElement('option');
    o.value = opt[0];
    o.textContent = opt[1];
    ditherSel.appendChild(o);
  }
  ditherRow.appendChild(ditherLab);
  ditherRow.appendChild(ditherSel);

  const thrRow = document.createElement('div');
  thrRow.className = 'dev-tools-braille-field';
  const thrLab = document.createElement('label');
  thrLab.className = 'dev-tools-braille-label';
  thrLab.textContent = 'Limiar';
  const thrInner = document.createElement('div');
  thrInner.className = 'dev-tools-braille-slider-row';
  const thrRange = document.createElement('input');
  thrRange.type = 'range';
  thrRange.min = '0';
  thrRange.max = '255';
  thrRange.value = '127';
  thrRange.className = 'dev-tools-braille-range dev-tools-braille-range--grow';
  const thrVal = document.createElement('span');
  thrVal.className = 'dev-tools-braille-value-pill';
  thrVal.textContent = '127';
  thrInner.appendChild(thrRange);
  thrInner.appendChild(thrVal);
  thrRow.appendChild(thrLab);
  thrRow.appendChild(thrInner);

  const invRow = document.createElement('div');
  invRow.className = 'dev-tools-braille-field dev-tools-braille-field--inline';
  const invLab = document.createElement('label');
  invLab.className = 'dev-tools-braille-check';
  const invCb = document.createElement('input');
  invCb.type = 'checkbox';
  invCb.checked = true;
  invLab.appendChild(invCb);
  invLab.appendChild(document.createTextNode(' Inverter tons'));
  invRow.appendChild(invLab);

  const preFontRow = document.createElement('div');
  preFontRow.className = 'dev-tools-braille-field';
  const preFontLab = document.createElement('label');
  preFontLab.className = 'dev-tools-braille-label';
  preFontLab.textContent = 'Tamanho do texto no cartão';
  const preFontInner = document.createElement('div');
  preFontInner.className = 'dev-tools-braille-slider-row';
  const preFontRange = document.createElement('input');
  preFontRange.type = 'range';
  preFontRange.min = '6';
  preFontRange.max = '14';
  preFontRange.value = '8';
  preFontRange.className = 'dev-tools-braille-range dev-tools-braille-range--grow';
  const preFontVal = document.createElement('span');
  preFontVal.className = 'dev-tools-braille-value-pill';
  preFontVal.textContent = '8px';
  preFontInner.appendChild(preFontRange);
  preFontInner.appendChild(preFontVal);
  preFontRow.appendChild(preFontLab);
  preFontRow.appendChild(preFontInner);

  tuneCard.appendChild(widthRow);
  tuneCard.appendChild(ditherRow);
  tuneCard.appendChild(thrRow);
  tuneCard.appendChild(invRow);
  tuneCard.appendChild(preFontRow);

  const globalStatus = document.createElement('div');
  globalStatus.className = 'dev-tools-websearch-status dev-tools-braille-status';
  globalStatus.setAttribute('aria-live', 'polite');

  const grid = document.createElement('div');
  grid.className = 'dev-tools-websearch-grid';

  const attr = document.createElement('p');
  attr.className = 'dev-tools-websearch-attribution';
  attr.innerHTML =
    'Fotos fornecidas por <a href="https://www.pexels.com" rel="noopener noreferrer" target="_blank">Pexels</a>.';

  toolbar.appendChild(searchRow);
  toolbar.appendChild(tuneCard);

  wrap.appendChild(intro);
  wrap.appendChild(devOnly);
  wrap.appendChild(toolbar);
  wrap.appendChild(globalStatus);
  wrap.appendChild(grid);
  wrap.appendChild(attr);
  parent.appendChild(wrap);

  function readOptions(): BrailleAsciiOptions {
    const asciiWidth = Math.max(20, Math.min(200, parseInt(widthNum.value, 10) || 72));
    return {
      asciiWidth,
      ditherer: parseDitherer(ditherSel.value),
      threshold: Math.max(0, Math.min(255, parseInt(thrRange.value, 10) || 127)),
      invert: invCb.checked,
    };
  }

  function syncWidth(): void {
    const w = Math.max(20, Math.min(200, parseInt(widthNum.value, 10) || 72));
    widthNum.value = String(w);
    widthRange.value = String(w);
  }

  widthNum.addEventListener('change', () => {
    syncWidth();
    void reconvertAll();
  });
  widthRange.addEventListener('input', () => {
    widthNum.value = widthRange.value;
  });
  widthRange.addEventListener('change', () => {
    syncWidth();
    void reconvertAll();
  });

  thrRange.addEventListener('input', () => {
    thrVal.textContent = thrRange.value;
  });
  thrRange.addEventListener('change', () => void reconvertAll());

  ditherSel.addEventListener('change', () => void reconvertAll());
  invCb.addEventListener('change', () => void reconvertAll());

  preFontRange.addEventListener('input', () => {
    preFontVal.textContent = `${preFontRange.value}px`;
    for (const pre of grid.querySelectorAll<HTMLPreElement>('.dev-tools-websearch-card-pre')) {
      pre.style.fontSize = `${preFontRange.value}px`;
    }
  });

  type CardState = {
    hit: PexelsImageHit;
    pre: HTMLPreElement;
    statusEl: HTMLElement;
    copyBtn: HTMLButtonElement;
    lastAscii: string;
  };

  let cards: CardState[] = [];
  let convertToken = 0;

  function clearGrid(): void {
    convertToken++;
    grid.replaceChildren();
    cards = [];
  }

  async function reconvertAll(): Promise<void> {
    const token = convertToken;
    const opts = readOptions();
    const list = cards.slice();
    await mapPool(list, 4, async (c) => {
      if (token !== convertToken) return;
      c.statusEl.textContent = 'A converter…';
      c.pre.textContent = '';
      c.copyBtn.disabled = true;
      c.lastAscii = '';
      try {
        const bmp = await fetchBitmapViaProxy(c.hit.imageUrl);
        try {
          if (token !== convertToken) return;
          const text = brailleAsciiFromImageSource(bmp, opts);
          c.lastAscii = text;
          c.pre.textContent = text;
          c.statusEl.textContent = `${text.length.toLocaleString()} caracteres`;
          c.copyBtn.disabled = !text;
        } finally {
          bmp.close();
        }
      } catch (e) {
        if (token !== convertToken) return;
        const msg = e instanceof Error ? e.message : String(e);
        c.statusEl.textContent = `Erro: ${msg}`;
        c.copyBtn.disabled = true;
      }
    });
  }

  async function runSearch(): Promise<void> {
    const q = searchInp.value.trim();
    if (!q) {
      globalStatus.textContent = 'Indica um termo de busca.';
      return;
    }
    globalStatus.textContent = 'A pesquisar…';
    clearGrid();
    try {
      const sp = new URLSearchParams();
      sp.set('q', q);
      sp.set('per_page', '12');
      const res = await fetch(`${DEV_IMAGE_SEARCH}?${sp.toString()}`);
      const json: unknown = await res.json().catch(() => ({}));
      if (res.status === 503 && isRecord(json) && json.error === 'missing_api_key') {
        globalStatus.textContent =
          'Chave Pexels em falta. Cria .env.local na raiz do projeto com PEXELS_API_KEY=… (https://www.pexels.com/api/) e reinicia o servidor.';
        return;
      }
      if (!res.ok) {
        const err =
          isRecord(json) && typeof json.error === 'string' ? json.error : `${res.status} ${res.statusText}`;
        globalStatus.textContent = `Erro na busca: ${err}`;
        return;
      }
      const parsed = parseSearchResponse(json);
      if (parsed.error) {
        globalStatus.textContent = parsed.error;
        return;
      }
      if (parsed.hits.length === 0) {
        globalStatus.textContent = 'Nenhum resultado.';
        return;
      }
      globalStatus.textContent = `${parsed.hits.length} imagens — a converter…`;

      const token = ++convertToken;
      const opts = readOptions();
      const newCards: CardState[] = [];

      for (const hit of parsed.hits) {
        const card = document.createElement('article');
        card.className = 'dev-tools-websearch-card';

        const thumbWrap = document.createElement('div');
        thumbWrap.className = 'dev-tools-websearch-card-thumb';
        const img = document.createElement('img');
        img.alt = hit.photographer ? `Foto: ${hit.photographer}` : 'Miniatura';
        img.loading = 'lazy';
        img.src = `${DEV_IMAGE_PROXY}?url=${encodeURIComponent(hit.thumbUrl)}`;
        thumbWrap.appendChild(img);

        const credit = document.createElement('div');
        credit.className = 'dev-tools-websearch-card-credit';
        if (hit.photographer && hit.photographerUrl) {
          const a = document.createElement('a');
          a.href = hit.photographerUrl;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.textContent = hit.photographer;
          credit.appendChild(document.createTextNode('Foto: '));
          credit.appendChild(a);
        } else if (hit.photographer) {
          credit.textContent = `Foto: ${hit.photographer}`;
        }
        if (hit.pageUrl) {
          const pLink = document.createElement('a');
          pLink.href = hit.pageUrl;
          pLink.target = '_blank';
          pLink.rel = 'noopener noreferrer';
          pLink.className = 'dev-tools-websearch-card-pexels';
          pLink.textContent = 'Ver no Pexels';
          credit.appendChild(document.createTextNode(' · '));
          credit.appendChild(pLink);
        }

        const pre = document.createElement('pre');
        pre.className = 'dev-tools-websearch-card-pre dev-tools-braille-pre';
        pre.style.fontSize = `${preFontRange.value}px`;

        const row = document.createElement('div');
        row.className = 'dev-tools-websearch-card-actions';
        const copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.className = 'dev-tools-btn dev-tools-btn--primary';
        copyBtn.textContent = 'Copiar Braille';
        copyBtn.disabled = true;

        const statusEl = document.createElement('div');
        statusEl.className = 'dev-tools-websearch-card-status';
        statusEl.textContent = 'A converter…';

        const cardState: CardState = { hit, pre, statusEl, copyBtn, lastAscii: '' };
        copyBtn.addEventListener('click', () => {
          const t = cardState.lastAscii;
          if (!t) return;
          void navigator.clipboard.writeText(t).then(
            () => {
              cardState.statusEl.textContent = 'Copiado.';
            },
            () => {
              cardState.statusEl.textContent = 'Não foi possível copiar.';
            }
          );
        });
        row.appendChild(copyBtn);

        card.appendChild(thumbWrap);
        card.appendChild(credit);
        card.appendChild(pre);
        card.appendChild(row);
        card.appendChild(statusEl);
        grid.appendChild(card);

        newCards.push(cardState);
      }

      cards = newCards;

      await mapPool(newCards, 4, async (c) => {
        if (token !== convertToken) return;
        try {
          const bmp = await fetchBitmapViaProxy(c.hit.imageUrl);
          try {
            if (token !== convertToken) return;
            const text = brailleAsciiFromImageSource(bmp, opts);
            c.lastAscii = text;
            c.pre.textContent = text;
            c.statusEl.textContent = `${text.length.toLocaleString()} caracteres`;
            c.copyBtn.disabled = !text;
          } finally {
            bmp.close();
          }
        } catch (e) {
          if (token !== convertToken) return;
          const msg = e instanceof Error ? e.message : String(e);
          c.statusEl.textContent = `Erro: ${msg}`;
        }
      });

      if (token === convertToken) {
        globalStatus.textContent = 'Pronto. Ajusta a conversão acima para regenerar todos os cartões.';
      }
    } catch (e) {
      globalStatus.textContent = `Erro: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  searchBtn.addEventListener('click', () => void runSearch());
  searchInp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void runSearch();
    }
  });
}

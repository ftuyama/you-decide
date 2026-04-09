import {
  brailleAsciiFromImageSource,
  type BrailleAsciiOptions,
  type BrailleDithererName,
} from '../dev/brailleAsciiFromImage.ts';

/** Vite dev server only — see `vite.config.ts`. */
const DEV_IMAGE_PROXY = '/__dev/image-proxy';

function parseDitherer(value: string): BrailleDithererName {
  if (
    value === 'threshold' ||
    value === 'floydSteinberg' ||
    value === 'stucki' ||
    value === 'atkinson'
  ) {
    return value;
  }
  return 'floydSteinberg';
}

export function mountBrailleAsciiPanel(parent: HTMLElement): void {
  let currentSource: CanvasImageSource | null = null;
  let lastAscii = '';

  const wrap = document.createElement('div');
  wrap.className = 'dev-tools-braille';

  const intro = document.createElement('div');
  intro.className = 'dev-tools-braille-intro';
  const title = document.createElement('h2');
  title.className = 'dev-tools-braille-title';
  title.textContent = 'Imagem → Braille Unicode';
  intro.appendChild(title);

  const grid = document.createElement('div');
  grid.className = 'dev-tools-braille-grid';

  const cardImage = document.createElement('section');
  cardImage.className = 'dev-tools-braille-card';
  const hImage = document.createElement('h3');
  hImage.className = 'dev-tools-braille-card-title';
  hImage.textContent = 'Imagem';
  cardImage.appendChild(hImage);

  const fileRow = document.createElement('div');
  fileRow.className = 'dev-tools-braille-field';
  const fileLab = document.createElement('label');
  fileLab.className = 'dev-tools-braille-file-wrap';
  const fileBtn = document.createElement('span');
  fileBtn.className = 'dev-tools-btn dev-tools-braille-file-face';
  fileBtn.textContent = 'Escolher ficheiro…';
  const fileInp = document.createElement('input');
  fileInp.type = 'file';
  fileInp.accept = 'image/*';
  fileInp.className = 'dev-tools-braille-file-input';
  fileLab.appendChild(fileBtn);
  fileLab.appendChild(fileInp);
  const fileHint = document.createElement('p');
  fileHint.className = 'dev-tools-braille-hint';
  fileHint.textContent = 'Ou cole uma imagem com Ctrl+V em qualquer parte deste painel.';
  fileRow.appendChild(fileLab);
  fileRow.appendChild(fileHint);

  const urlRow = document.createElement('div');
  urlRow.className = 'dev-tools-braille-field';
  const urlLab = document.createElement('label');
  urlLab.className = 'dev-tools-braille-label';
  urlLab.textContent = 'URL (dev: proxy anti-CORS)';
  const urlInp = document.createElement('input');
  urlInp.type = 'url';
  urlInp.className = 'dev-tools-search dev-tools-braille-url-input';
  urlInp.placeholder = 'https://exemplo.com/imagem.png';
  urlInp.autocomplete = 'off';
  urlInp.name = 'braille-image-url';
  const urlBtn = document.createElement('button');
  urlBtn.type = 'button';
  urlBtn.className = 'dev-tools-btn dev-tools-btn--secondary';
  urlBtn.textContent = 'Carregar URL';
  const urlActions = document.createElement('div');
  urlActions.className = 'dev-tools-braille-url-actions';
  urlActions.appendChild(urlInp);
  urlActions.appendChild(urlBtn);
  urlRow.appendChild(urlLab);
  urlRow.appendChild(urlActions);

  cardImage.appendChild(fileRow);
  cardImage.appendChild(urlRow);

  const cardTuning = document.createElement('section');
  cardTuning.className = 'dev-tools-braille-card';
  const hTune = document.createElement('h3');
  hTune.className = 'dev-tools-braille-card-title';
  hTune.textContent = 'Conversão';
  cardTuning.appendChild(hTune);

  const widthRow = document.createElement('div');
  widthRow.className = 'dev-tools-braille-field';
  const widthLab = document.createElement('label');
  widthLab.className = 'dev-tools-braille-label';
  widthLab.textContent = 'Largura (caracteres por linha)';
  const widthInner = document.createElement('div');
  widthInner.className = 'dev-tools-braille-slider-row';
  const widthNum = document.createElement('input');
  widthNum.type = 'number';
  widthNum.min = '1';
  widthNum.max = '500';
  widthNum.value = '80';
  widthNum.className = 'dev-tools-braille-num';
  widthNum.setAttribute('aria-label', 'Largura numérica');
  const widthRange = document.createElement('input');
  widthRange.type = 'range';
  widthRange.min = '20';
  widthRange.max = '500';
  widthRange.value = '80';
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
    ['floydSteinberg', 'Floyd–Steinberg'],
    ['threshold', 'Limiar'],
    ['stucki', 'Stucki'],
    ['atkinson', 'Atkinson'],
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
  invLab.appendChild(invCb);
  invLab.appendChild(document.createTextNode(' Inverter tons'));
  invRow.appendChild(invLab);

  const fontRow = document.createElement('div');
  fontRow.className = 'dev-tools-braille-field';
  const fontLab = document.createElement('label');
  fontLab.className = 'dev-tools-braille-label';
  fontLab.textContent = 'Tamanho da pré-visualização';
  const fontInner = document.createElement('div');
  fontInner.className = 'dev-tools-braille-slider-row';
  const fontRange = document.createElement('input');
  fontRange.type = 'range';
  fontRange.min = '6';
  fontRange.max = '18';
  fontRange.value = '10';
  fontRange.className = 'dev-tools-braille-range dev-tools-braille-range--grow';
  const fontVal = document.createElement('span');
  fontVal.className = 'dev-tools-braille-value-pill';
  fontVal.textContent = '10px';
  fontInner.appendChild(fontRange);
  fontInner.appendChild(fontVal);
  fontRow.appendChild(fontLab);
  fontRow.appendChild(fontInner);

  cardTuning.appendChild(widthRow);
  cardTuning.appendChild(ditherRow);
  cardTuning.appendChild(thrRow);
  cardTuning.appendChild(invRow);
  cardTuning.appendChild(fontRow);

  grid.appendChild(cardImage);
  grid.appendChild(cardTuning);

  const outSection = document.createElement('section');
  outSection.className = 'dev-tools-braille-out';

  const outHead = document.createElement('div');
  outHead.className = 'dev-tools-braille-out-head';
  const outTitle = document.createElement('h3');
  outTitle.className = 'dev-tools-braille-card-title dev-tools-braille-card-title--plain';
  outTitle.textContent = 'Resultado';
  const meta = document.createElement('div');
  meta.className = 'dev-tools-braille-meta';
  meta.setAttribute('aria-live', 'polite');
  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.className = 'dev-tools-btn dev-tools-btn--primary';
  copyBtn.textContent = 'Copiar texto';
  copyBtn.title = 'Copia o Braille para a área de transferência';
  outHead.appendChild(outTitle);
  outHead.appendChild(meta);
  outHead.appendChild(copyBtn);

  const status = document.createElement('div');
  status.className = 'dev-tools-braille-status';
  status.setAttribute('aria-live', 'polite');

  const preWrap = document.createElement('div');
  preWrap.className = 'dev-tools-braille-pre-wrap';
  const emptyHint = document.createElement('div');
  emptyHint.className = 'dev-tools-braille-empty';
  emptyHint.textContent = 'Nenhuma imagem carregada. Escolha um ficheiro, cole uma imagem ou carregue uma URL (em dev).';
  const pre = document.createElement('pre');
  pre.className = 'dev-tools-braille-pre';
  pre.classList.add('dev-tools-braille-pre--hidden');
  pre.tabIndex = 0;
  pre.title = 'Cole uma imagem (Ctrl+V) com o foco aqui';
  preWrap.appendChild(emptyHint);
  preWrap.appendChild(pre);

  outSection.appendChild(outHead);
  outSection.appendChild(status);
  outSection.appendChild(preWrap);

  wrap.appendChild(intro);
  wrap.appendChild(grid);
  wrap.appendChild(outSection);
  parent.appendChild(wrap);

  pre.style.fontSize = `${fontRange.value}px`;

  function setOutputShell(hasImage: boolean): void {
    emptyHint.classList.toggle('dev-tools-braille-empty--gone', hasImage);
    pre.classList.toggle('dev-tools-braille-pre--hidden', !hasImage);
  }

  function readOptions(): BrailleAsciiOptions {
    const asciiWidth = Math.max(1, Math.min(500, parseInt(widthNum.value, 10) || 80));
    return {
      asciiWidth,
      ditherer: parseDitherer(ditherSel.value),
      threshold: Math.max(0, Math.min(255, parseInt(thrRange.value, 10) || 127)),
      invert: invCb.checked,
    };
  }

  function render(): void {
    if (!currentSource) {
      pre.textContent = '';
      lastAscii = '';
      meta.textContent = '';
      status.textContent = '';
      setOutputShell(false);
      return;
    }
    setOutputShell(true);
    try {
      const opts = readOptions();
      lastAscii = brailleAsciiFromImageSource(currentSource, opts);
      pre.textContent = lastAscii;
      meta.textContent = `${lastAscii.length.toLocaleString()} caracteres · ${lastAscii.split('\n').length} linhas`;
      status.textContent = '';
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      status.textContent = `Erro: ${msg}`;
      meta.textContent = '';
      pre.textContent = '';
      lastAscii = '';
    }
  }

  function setSourceFromBitmap(bmp: ImageBitmap): void {
    if (currentSource instanceof ImageBitmap && currentSource !== bmp) {
      currentSource.close();
    }
    currentSource = bmp;
    render();
  }

  fileInp.addEventListener('change', () => {
    const f = fileInp.files?.[0];
    if (!f) return;
    void (async () => {
      try {
        const bmp = await createImageBitmap(f);
        setSourceFromBitmap(bmp);
      } catch (e) {
        status.textContent = `Erro ao ler ficheiro: ${e instanceof Error ? e.message : String(e)}`;
      }
    })();
  });

  function loadFromUrlField(): void {
    const raw = urlInp.value.trim();
    if (!raw) {
      status.textContent = 'Indique uma URL.';
      return;
    }
    void (async () => {
      try {
        status.textContent = 'A carregar…';
        const fetchUrl = import.meta.env.DEV ? `${DEV_IMAGE_PROXY}?url=${encodeURIComponent(raw)}` : raw;
        const res = await fetch(fetchUrl);
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const blob = await res.blob();
        if (!blob.type.startsWith('image/') && blob.size > 0) {
          /* some servers omit type */
        }
        const bmp = await createImageBitmap(blob);
        setSourceFromBitmap(bmp);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        status.textContent = import.meta.env.DEV
          ? `Falha: ${msg}`
          : `Falha ao carregar (CORS ou rede). Use ficheiro ou execute npm run dev. ${msg}`;
      }
    })();
  }

  urlBtn.addEventListener('click', loadFromUrlField);
  urlInp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      loadFromUrlField();
    }
  });

  function onPaste(ev: ClipboardEvent): void {
    const items = ev.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it?.kind === 'file' && it.type.startsWith('image/')) {
        ev.preventDefault();
        const f = it.getAsFile();
        if (!f) continue;
        void (async () => {
          try {
            const bmp = await createImageBitmap(f);
            setSourceFromBitmap(bmp);
          } catch (e) {
            status.textContent = `Colar: ${e instanceof Error ? e.message : String(e)}`;
          }
        })();
        return;
      }
    }
  }

  wrap.addEventListener('paste', onPaste);
  pre.addEventListener('paste', onPaste);

  widthNum.addEventListener('input', () => {
    const n = Math.max(1, Math.min(500, parseInt(widthNum.value, 10) || 80));
    widthNum.value = String(n);
    widthRange.value = String(Math.max(20, Math.min(500, n)));
    render();
  });
  widthRange.addEventListener('input', () => {
    const n = parseInt(widthRange.value, 10);
    widthNum.value = String(n);
    render();
  });
  ditherSel.addEventListener('change', render);
  thrRange.addEventListener('input', () => {
    thrVal.textContent = thrRange.value;
    render();
  });
  invCb.addEventListener('change', render);
  fontRange.addEventListener('input', () => {
    const px = fontRange.value;
    fontVal.textContent = `${px}px`;
    pre.style.fontSize = `${px}px`;
  });

  copyBtn.addEventListener('click', async () => {
    if (!lastAscii) {
      status.textContent = 'Nada para copiar.';
      return;
    }
    try {
      await navigator.clipboard.writeText(lastAscii);
      status.textContent = 'Copiado.';
      window.setTimeout(() => {
        if (status.textContent === 'Copiado.') status.textContent = '';
      }, 1200);
    } catch {
      status.textContent = 'Clipboard indisponível.';
    }
  });
}

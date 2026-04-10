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

  const sourceList = document.createElement('div');
  sourceList.className = 'dev-tools-braille-source-list';

  const step1 = document.createElement('div');
  step1.className = 'dev-tools-braille-step';
  const step1Num = document.createElement('span');
  step1Num.className = 'dev-tools-braille-step-num';
  step1Num.textContent = '1';
  step1Num.setAttribute('aria-hidden', 'true');
  const step1Body = document.createElement('div');
  step1Body.className = 'dev-tools-braille-step-body';
  const step1Title = document.createElement('div');
  step1Title.className = 'dev-tools-braille-step-title';
  step1Title.textContent = 'Ficheiro no disco';
  const fileRow = document.createElement('div');
  fileRow.className = 'dev-tools-braille-step-content';
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
  fileRow.appendChild(fileLab);
  step1Body.appendChild(step1Title);
  step1Body.appendChild(fileRow);
  step1.appendChild(step1Num);
  step1.appendChild(step1Body);

  const step2 = document.createElement('div');
  step2.className = 'dev-tools-braille-step';
  const step2Num = document.createElement('span');
  step2Num.className = 'dev-tools-braille-step-num';
  step2Num.textContent = '2';
  step2Num.setAttribute('aria-hidden', 'true');
  const step2Body = document.createElement('div');
  step2Body.className = 'dev-tools-braille-step-body';
  const step2Title = document.createElement('div');
  step2Title.className = 'dev-tools-braille-step-title';
  step2Title.textContent = 'Colar do clipboard';
  const pasteHint = document.createElement('p');
  pasteHint.className = 'dev-tools-braille-hint dev-tools-braille-hint--step';
  pasteHint.textContent =
    'Ctrl+V (ou ⌘+V) em qualquer parte deste painel, ou com foco na pré-visualização abaixo.';
  step2Body.appendChild(step2Title);
  step2Body.appendChild(pasteHint);
  step2.appendChild(step2Num);
  step2.appendChild(step2Body);

  const step3 = document.createElement('div');
  step3.className = 'dev-tools-braille-step';
  const step3Num = document.createElement('span');
  step3Num.className = 'dev-tools-braille-step-num';
  step3Num.textContent = '3';
  step3Num.setAttribute('aria-hidden', 'true');
  const step3Body = document.createElement('div');
  step3Body.className = 'dev-tools-braille-step-body';
  const step3Title = document.createElement('div');
  step3Title.className = 'dev-tools-braille-step-title';
  step3Title.textContent = 'URL remota';
  const urlRow = document.createElement('div');
  urlRow.className = 'dev-tools-braille-step-content';
  const urlSub = document.createElement('p');
  urlSub.className = 'dev-tools-braille-hint dev-tools-braille-hint--step';
  urlSub.textContent = 'Em dev, o proxy contorna CORS; carrega ao editar o campo.';
  const urlInp = document.createElement('input');
  urlInp.type = 'url';
  urlInp.className = 'dev-tools-search dev-tools-braille-url-input';
  urlInp.placeholder = 'https://exemplo.com/imagem.png';
  urlInp.autocomplete = 'off';
  urlInp.name = 'braille-image-url';
  const urlActions = document.createElement('div');
  urlActions.className = 'dev-tools-braille-url-actions';
  urlActions.appendChild(urlInp);
  urlRow.appendChild(urlSub);
  urlRow.appendChild(urlActions);
  step3Body.appendChild(step3Title);
  step3Body.appendChild(urlRow);
  step3.appendChild(step3Num);
  step3.appendChild(step3Body);

  sourceList.appendChild(step1);
  sourceList.appendChild(step2);
  sourceList.appendChild(step3);

  cardImage.appendChild(sourceList);

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
  widthNum.value = '160';
  widthNum.className = 'dev-tools-braille-num';
  widthNum.setAttribute('aria-label', 'Largura numérica');
  const widthRange = document.createElement('input');
  widthRange.type = 'range';
  widthRange.min = '20';
  widthRange.max = '500';
  widthRange.value = '160';
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
  ditherSel.value = 'atkinson';
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
  const copyRow = document.createElement('div');
  copyRow.className = 'dev-tools-braille-copy-row';
  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.className = 'dev-tools-btn dev-tools-btn--primary';
  copyBtn.textContent = 'Copiar texto';
  copyBtn.title = 'Copia o Braille para a área de transferência';
  const copyImgBtn = document.createElement('button');
  copyImgBtn.type = 'button';
  copyImgBtn.className = 'dev-tools-btn dev-tools-btn--secondary';
  copyImgBtn.textContent = 'Copiar imagem';
  copyImgBtn.title = 'Copia a imagem atual (PNG) para a área de transferência';
  copyRow.appendChild(copyBtn);
  copyRow.appendChild(copyImgBtn);
  outHead.appendChild(outTitle);
  outHead.appendChild(meta);
  outHead.appendChild(copyRow);

  const status = document.createElement('div');
  status.className = 'dev-tools-braille-status';
  status.setAttribute('aria-live', 'polite');

  const preWrap = document.createElement('div');
  preWrap.className = 'dev-tools-braille-pre-wrap';
  const emptyHint = document.createElement('div');
  emptyHint.className = 'dev-tools-braille-empty';
  emptyHint.textContent = 'Nenhuma imagem carregada';
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
    const asciiWidth = Math.max(1, Math.min(500, parseInt(widthNum.value, 10) || 160));
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

  let urlLoadTimer: number | null = null;
  const URL_DEBOUNCE_MS = 450;

  function loadFromUrlField(): void {
    const raw = urlInp.value.trim();
    if (!raw) {
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

  function scheduleUrlLoad(): void {
    if (urlLoadTimer !== null) {
      clearTimeout(urlLoadTimer);
    }
    urlLoadTimer = window.setTimeout(() => {
      urlLoadTimer = null;
      loadFromUrlField();
    }, URL_DEBOUNCE_MS);
  }

  urlInp.addEventListener('input', scheduleUrlLoad);
  urlInp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (urlLoadTimer !== null) {
        clearTimeout(urlLoadTimer);
        urlLoadTimer = null;
      }
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
    const n = Math.max(1, Math.min(500, parseInt(widthNum.value, 10) || 160));
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

  async function imageBitmapToPngBlob(bmp: ImageBitmap): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = bmp.width;
    canvas.height = bmp.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D indisponível.');
    ctx.drawImage(bmp, 0, 0);
    return new Promise((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error('Falha ao exportar PNG.'));
      }, 'image/png');
    });
  }

  copyBtn.addEventListener('click', async () => {
    if (!lastAscii) {
      status.textContent = 'Nada para copiar.';
      return;
    }
    try {
      await navigator.clipboard.writeText(lastAscii);
      status.textContent = 'Texto copiado.';
      window.setTimeout(() => {
        if (status.textContent === 'Texto copiado.') status.textContent = '';
      }, 1200);
    } catch {
      status.textContent = 'Clipboard indisponível.';
    }
  });

  copyImgBtn.addEventListener('click', async () => {
    if (!currentSource || !(currentSource instanceof ImageBitmap)) {
      status.textContent = 'Nenhuma imagem para copiar.';
      return;
    }
    try {
      const blob = await imageBitmapToPngBlob(currentSource);
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      status.textContent = 'Imagem copiada.';
      window.setTimeout(() => {
        if (status.textContent === 'Imagem copiada.') status.textContent = '';
      }, 1200);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      status.textContent =
        msg.includes('ClipboardItem') || msg.includes('write')
          ? 'Cópia de imagem não suportada neste browser.'
          : `Erro: ${msg}`;
    }
  });
}

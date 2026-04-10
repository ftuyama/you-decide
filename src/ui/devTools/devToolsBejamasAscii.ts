/** URL do gerador “Heart Shard” (Bejamas AI ASCII Art). */
export const BEJAMAS_HEART_SHARD_ASCII_URL =
  'https://bejamas.com/tools/ai-ascii-art-generator/heart-shard-60555c7f86a4';

export function mountBejamasAsciiPanel(parent: HTMLElement): void {
  const wrap = document.createElement('div');
  wrap.className = 'dev-tools-bejamas';

  const intro = document.createElement('div');
  intro.className = 'dev-tools-bejamas-intro';

  const title = document.createElement('h2');
  title.className = 'dev-tools-bejamas-title';
  title.textContent = 'Gerador Bejamas (IA) · Heart Shard';

  const blurb = document.createElement('p');
  blurb.className = 'dev-tools-bejamas-blurb';
  blurb.textContent =
    'Ferramenta externa: gera arte ASCII com IA. Depois copia o texto para os ficheiros do projeto (p.ex. `ascii/scenes/…`), alinhado ao fluxo de `artKey` e `npm run check:ascii-art`.';

  const actions = document.createElement('div');
  actions.className = 'dev-tools-bejamas-actions';

  const openLink = document.createElement('a');
  openLink.href = BEJAMAS_HEART_SHARD_ASCII_URL;
  openLink.target = '_blank';
  openLink.rel = 'noopener noreferrer';
  openLink.className = 'dev-tools-btn';
  openLink.textContent = 'Abrir em novo separador';

  actions.appendChild(openLink);
  intro.appendChild(title);
  intro.appendChild(blurb);
  intro.appendChild(actions);

  const frameWrap = document.createElement('div');
  frameWrap.className = 'dev-tools-bejamas-frame-wrap';

  const iframe = document.createElement('iframe');
  iframe.className = 'dev-tools-bejamas-frame';
  iframe.title = 'Bejamas AI ASCII Art Generator — Heart Shard';
  iframe.src = BEJAMAS_HEART_SHARD_ASCII_URL;
  iframe.loading = 'lazy';
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';

  frameWrap.appendChild(iframe);

  wrap.appendChild(intro);
  wrap.appendChild(frameWrap);
  parent.appendChild(wrap);
}

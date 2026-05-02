export type FaithMiracleBannerCallbacks = {
  setFaithMiraclePending: (pending: boolean) => void;
  playUiClick: () => void;
  render: () => void;
};

/** Banner após milagre de fé em combate (consome fé, mantém o herói de pé). */
export function appendFaithMiracleBanner(
  inner: HTMLElement,
  callbacks: FaithMiracleBannerCallbacks
): void {
  const miracle = document.createElement('div');
  miracle.className = 'faith-miracle-banner';
  const kicker = document.createElement('div');
  kicker.className = 'faith-miracle-kicker';
  kicker.textContent = 'Intercessão';
  miracle.appendChild(kicker);
  const titleEl = document.createElement('div');
  titleEl.className = 'faith-miracle-title';
  titleEl.textContent = 'A fé recusa-te à morte.';
  miracle.appendChild(titleEl);
  const sub = document.createElement('div');
  sub.className = 'faith-miracle-subtitle';
  sub.textContent =
    'Algo em ti não cede — acordas ferido, mas de pé. Cinco medidas de convicção consumiram-se para te manter no mundo.';
  miracle.appendChild(sub);
  const btnM = document.createElement('button');
  btnM.type = 'button';
  btnM.className = 'faith-miracle-dismiss';
  btnM.dataset.quickNavContinue = '';
  btnM.title = 'Barra de espaço';
  btnM.textContent = '[Espaço] — Continuar';
  btnM.addEventListener('click', () => {
    callbacks.setFaithMiraclePending(false);
    callbacks.playUiClick();
    callbacks.render();
  });
  miracle.appendChild(btnM);
  inner.appendChild(miracle);
}

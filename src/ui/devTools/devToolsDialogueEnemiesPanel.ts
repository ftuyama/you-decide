import {
  mergeDialogueChoiceEffects,
  type DialogueChoice,
  type DialogueEnemyDef,
  type DialogueNode,
} from '../../engine/schema/dialogueCombat.ts';
import { dialogueGraphToMermaid, findOrphanNodeIds } from '../../dev/dialogueEnemiesGraphMermaid.ts';

function formatDialogueEffectsSummary(effects: DialogueChoice['effects']): string | null {
  if (!effects) return null;
  const parts: string[] = [];
  if (effects.enemyHpDelta !== undefined && effects.enemyHpDelta !== 0) {
    parts.push(
      effects.enemyHpDelta < 0
        ? `tensão ${effects.enemyHpDelta}`
        : `tensão +${effects.enemyHpDelta}`,
    );
  }
  if (effects.playerHpLossPercent !== undefined && effects.playerHpLossPercent > 0) {
    parts.push(`líder −${effects.playerHpLossPercent}% HP máx.`);
  }
  return parts.length ? parts.join(' · ') : null;
}

function formatDialogueChoiceMechanicsSummary(ch: DialogueChoice): string | null {
  const res = ch.resolution;
  if (res.kind === 'fixed') {
    return formatDialogueEffectsSummary(ch.effects);
  }
  const okS = formatDialogueEffectsSummary(
    mergeDialogueChoiceEffects(ch.effects, ch.effectsOnSuccess),
  );
  const badS = formatDialogueEffectsSummary(
    mergeDialogueChoiceEffects(ch.effects, ch.effectsOnFailure),
  );
  const parts: string[] = [];
  if (okS) parts.push(`se sucesso: ${okS}`);
  if (badS) parts.push(`se falha: ${badS}`);
  return parts.length ? parts.join(' · ') : null;
}

function attrLabelPt(attr: 'str' | 'agi' | 'mind'): string {
  if (attr === 'str') return 'Força';
  if (attr === 'agi') return 'Agilidade';
  return 'Mente';
}

function resolutionDevHint(res: DialogueChoice['resolution']): string {
  if (res.kind === 'fixed') return `→ ${res.nextNodeId}`;
  if (res.kind === 'skill') {
    return `Teste ${attrLabelPt(res.attr)} TN ${res.tn} · sucesso → ${res.successNodeId} · falha → ${res.failNodeId}`;
  }
  return `Sorte TN ${res.tn}${res.luckPenalty ? ` (−${res.luckPenalty} sorte)` : ''} · sucesso → ${res.successNodeId} · falha → ${res.failNodeId}`;
}

/** Mermaid define `fill` inline nos marcadores; força setas só com traço. */
function stripMermaidFlowchartArrowFills(svgMount: HTMLElement): void {
  const svg = svgMount.querySelector('svg');
  if (!svg) return;

  const firstEdge = svg.querySelector('g.edgePaths path');
  let strokeFromLine =
    firstEdge instanceof SVGPathElement
      ? (firstEdge.getAttribute('stroke')?.trim() ||
          getComputedStyle(firstEdge).stroke ||
          '#a3aebf')
      : '#a3aebf';
  if (!strokeFromLine || strokeFromLine === 'none') strokeFromLine = '#a3aebf';

  for (const node of svg.querySelectorAll('g.edgePaths path')) {
    if (!(node instanceof SVGPathElement)) continue;
    node.removeAttribute('fill');
    node.style.setProperty('fill', 'none', 'important');
  }

  for (const node of svg.querySelectorAll(
    'defs marker path, defs marker polygon, defs marker polyline, marker path, marker polygon, marker polyline',
  )) {
    if (
      !(node instanceof SVGPathElement) &&
      !(node instanceof SVGPolygonElement) &&
      !(node instanceof SVGPolylineElement)
    ) {
      continue;
    }
    node.removeAttribute('fill');
    node.style.setProperty('fill', 'none', 'important');
    const hadStroke =
      Boolean(node.getAttribute('stroke')?.trim()) ||
      Boolean(node.style.stroke && node.style.stroke !== 'none');
    if (!hadStroke) {
      node.setAttribute('stroke', strokeFromLine);
      node.style.setProperty('stroke', strokeFromLine);
    }
    if (!node.getAttribute('stroke-width')?.trim() && !node.style.strokeWidth) {
      node.setAttribute('stroke-width', '1.15');
    }
  }
}

function renderMeta(container: HTMLElement, def: DialogueEnemyDef): void {
  container.replaceChildren();
  const dl = document.createElement('dl');
  dl.className = 'dev-tools-dialogue-enemies-meta';
  const rows: [string, string][] = [
    ['id', def.id],
    ['nome', def.name],
    ['tensão máx.', String(def.tensionMax)],
    ['sprite (linhas)', String(def.sprite.split('\n').length)],
    ['nós', String(Object.keys(def.graph.nodes).length)],
    ['raiz', def.graph.rootNodeId],
  ];
  const orphans = findOrphanNodeIds(def.graph);
  if (orphans.length) rows.push(['órfãos (nunca destino)', orphans.join(', ')]);
  for (const [dt, dd] of rows) {
    const dti = document.createElement('dt');
    dti.textContent = dt;
    const ddi = document.createElement('dd');
    ddi.textContent = dd;
    dl.appendChild(dti);
    dl.appendChild(ddi);
  }
  container.appendChild(dl);
}

export function mountDialogueEnemiesPanel(
  parent: HTMLElement,
  defs: Record<string, DialogueEnemyDef>,
): void {
  parent.replaceChildren();

  const wrap = document.createElement('div');
  wrap.className = 'dev-tools-dialogue-enemies';

  if (Object.keys(defs).length === 0) {
    const p = document.createElement('p');
    p.className = 'dev-tools-missing';
    p.textContent = 'Nenhum interlocutor de diálogo nesta campanha.';
    wrap.appendChild(p);
    parent.appendChild(wrap);
    return;
  }

  const intro = document.createElement('p');
  intro.className = 'dev-tools-dialogue-enemies-intro';
  intro.textContent =
    'Grafo de nós do confronto de diálogo: seta sólida = destino (fixo ou sucesso); tracejada = falha em teste (atributo ou sorte).';
  wrap.appendChild(intro);

  const label = document.createElement('label');
  label.className = 'dev-tools-dialogue-enemies-label';
  label.htmlFor = 'dev-tools-dialogue-enemy-select';
  label.textContent = 'Interlocutor';
  wrap.appendChild(label);

  const select = document.createElement('select');
  select.id = 'dev-tools-dialogue-enemy-select';
  select.className = 'dev-tools-select dev-tools-dialogue-enemies-select';
  const sorted = Object.keys(defs).sort((a, b) => a.localeCompare(b));
  for (const id of sorted) {
    const def = defs[id]!;
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = `${id} — ${def.name}`;
    select.appendChild(opt);
  }
  wrap.appendChild(select);

  const meta = document.createElement('div');
  meta.className = 'dev-tools-dialogue-enemies-meta-wrap';
  wrap.appendChild(meta);

  const simWrap = document.createElement('div');
  simWrap.className = 'dev-tools-dialogue-enemies-sim';
  const simHead = document.createElement('div');
  simHead.className = 'dev-tools-dialogue-enemies-sim-head';
  const simTitle = document.createElement('h3');
  simTitle.className = 'dev-tools-dialogue-enemies-sim-title';
  simTitle.textContent = 'Simulador do confronto';
  const simReset = document.createElement('button');
  simReset.type = 'button';
  simReset.className = 'dev-tools-dialogue-enemies-sim-reset dev-tools-dialogue-enemies-graph-btn';
  simReset.textContent = 'Recomeçar';
  simReset.title = 'Voltar ao nó raiz deste interlocutor';
  simHead.appendChild(simTitle);
  simHead.appendChild(simReset);
  simWrap.appendChild(simHead);
  const simIntro = document.createElement('p');
  simIntro.className = 'dev-tools-dialogue-enemies-sim-intro';
  simIntro.textContent =
    'Percorre o grafo como no jogo. Em testes (atributo ou sorte), escolhe manualmente sucesso ou falha — não há rolagem.';
  simWrap.appendChild(simIntro);
  const simBody = document.createElement('div');
  simBody.className = 'dev-tools-dialogue-enemies-sim-body';
  simWrap.appendChild(simBody);
  wrap.appendChild(simWrap);

  let simNodeId = defs[sorted[0]!]!.graph.rootNodeId;

  function renderSim(): void {
    simBody.replaceChildren();
    const def = defs[select.value];
    if (!def) return;
    const node: DialogueNode | undefined = def.graph.nodes[simNodeId];
    if (!node) {
      const miss = document.createElement('p');
      miss.className = 'dev-tools-missing';
      miss.textContent = `Nó em falta: "${simNodeId}".`;
      simBody.appendChild(miss);
      return;
    }

    const nodeBar = document.createElement('div');
    nodeBar.className = 'dev-tools-dialogue-enemies-sim-nodebar';
    const nodeIdEl = document.createElement('span');
    nodeIdEl.className = 'dev-tools-dialogue-enemies-sim-nodeid';
    nodeIdEl.textContent = simNodeId;
    nodeBar.appendChild(nodeIdEl);
    if (node.terminal === 'victory') {
      const tag = document.createElement('span');
      tag.className = 'dev-tools-dialogue-enemies-sim-tag dev-tools-dialogue-enemies-sim-tag--victory';
      tag.textContent = 'vitória';
      nodeBar.appendChild(tag);
    }
    simBody.appendChild(nodeBar);

    const line = document.createElement('p');
    line.className = 'dev-tools-dialogue-enemies-sim-line';
    line.textContent = node.linePt;
    simBody.appendChild(line);

    if (node.terminal === 'victory') {
      const endNote = document.createElement('p');
      endNote.className = 'dev-tools-dialogue-enemies-sim-endnote';
      endNote.textContent = 'Fim do ramo (vitória no confronto de diálogo). Usa «Recomeçar» para voltar ao início.';
      simBody.appendChild(endNote);
      return;
    }

    const choices = node.choices ?? [];
    if (choices.length === 0) {
      const dead = document.createElement('p');
      dead.className = 'dev-tools-missing';
      dead.textContent = 'Nó sem escolhas e sem terminal:victory — grafo inválido para este simulador.';
      simBody.appendChild(dead);
      return;
    }

    const list = document.createElement('ol');
    list.className = 'dev-tools-dialogue-enemies-sim-choices';
    for (let i = 0; i < choices.length; i++) {
      const ch = choices[i]!;
      const li = document.createElement('li');
      li.className = 'dev-tools-dialogue-enemies-sim-choice';

      const text = document.createElement('p');
      text.className = 'dev-tools-dialogue-enemies-sim-choice-text';
      text.textContent = ch.textPt;
      li.appendChild(text);

      const fx = formatDialogueChoiceMechanicsSummary(ch);
      if (fx) {
        const fxEl = document.createElement('p');
        fxEl.className = 'dev-tools-dialogue-enemies-sim-choice-fx';
        fxEl.textContent = fx;
        li.appendChild(fxEl);
      }

      const hint = document.createElement('p');
      hint.className = 'dev-tools-dialogue-enemies-sim-choice-hint';
      hint.textContent = resolutionDevHint(ch.resolution);
      li.appendChild(hint);

      const actions = document.createElement('div');
      actions.className = 'dev-tools-dialogue-enemies-sim-choice-actions';
      const res = ch.resolution;
      if (res.kind === 'fixed') {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'dev-tools-dialogue-enemies-sim-nav-btn';
        b.textContent = 'Seguir';
        b.addEventListener('click', () => {
          simNodeId = res.nextNodeId;
          renderSim();
        });
        actions.appendChild(b);
      } else {
        const ok = document.createElement('button');
        ok.type = 'button';
        ok.className = 'dev-tools-dialogue-enemies-sim-nav-btn dev-tools-dialogue-enemies-sim-nav-btn--ok';
        ok.textContent = 'Sucesso';
        ok.addEventListener('click', () => {
          simNodeId = res.successNodeId;
          renderSim();
        });
        const bad = document.createElement('button');
        bad.type = 'button';
        bad.className = 'dev-tools-dialogue-enemies-sim-nav-btn dev-tools-dialogue-enemies-sim-nav-btn--fail';
        bad.textContent = 'Falha';
        bad.addEventListener('click', () => {
          simNodeId = res.failNodeId;
          renderSim();
        });
        actions.appendChild(ok);
        actions.appendChild(bad);
      }
      li.appendChild(actions);
      list.appendChild(li);
    }
    simBody.appendChild(list);
  }

  simReset.addEventListener('click', () => {
    const def = defs[select.value];
    if (!def) return;
    simNodeId = def.graph.rootNodeId;
    renderSim();
  });

  const graphWrap = document.createElement('div');
  graphWrap.className = 'dev-tools-dialogue-enemies-graph';

  const graphToolbar = document.createElement('div');
  graphToolbar.className = 'dev-tools-dialogue-enemies-graph-toolbar';
  graphToolbar.setAttribute('role', 'toolbar');
  graphToolbar.setAttribute('aria-label', 'Controlo do diagrama');

  const legend = document.createElement('div');
  legend.className = 'dev-tools-dialogue-enemies-graph-legend';
  const leg1 = document.createElement('span');
  leg1.className = 'dev-tools-dialogue-enemies-graph-legend-item dev-tools-dialogue-enemies-graph-legend-item--solid';
  leg1.textContent = 'Destino';
  const leg2 = document.createElement('span');
  leg2.className = 'dev-tools-dialogue-enemies-graph-legend-item dev-tools-dialogue-enemies-graph-legend-item--dashed';
  leg2.textContent = 'Falha (teste)';
  legend.appendChild(leg1);
  legend.appendChild(leg2);
  graphToolbar.appendChild(legend);

  const zoomCluster = document.createElement('div');
  zoomCluster.className = 'dev-tools-dialogue-enemies-graph-zoom';

  const mkBtn = (label: string, text: string, short?: string) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dev-tools-dialogue-enemies-graph-btn';
    b.textContent = text;
    b.title = label;
    if (short) b.setAttribute('aria-label', short);
    return b;
  };

  const zoomOut = mkBtn('Reduzir diagrama', '−', 'Reduzir');
  const zoomIn = mkBtn('Ampliar diagrama', '+', 'Ampliar');
  const zoomReset = mkBtn('Zoom 100%', '100%');
  const zoomFit = mkBtn('Ajustar à área visível', 'Ajustar');

  const zoomReadout = document.createElement('span');
  zoomReadout.className = 'dev-tools-dialogue-enemies-graph-zoom-readout';
  zoomReadout.textContent = '100%';

  zoomCluster.appendChild(zoomOut);
  zoomCluster.appendChild(zoomReadout);
  zoomCluster.appendChild(zoomIn);
  zoomCluster.appendChild(zoomReset);
  zoomCluster.appendChild(zoomFit);
  graphToolbar.appendChild(zoomCluster);
  graphWrap.appendChild(graphToolbar);

  const graphScroll = document.createElement('div');
  graphScroll.className = 'dev-tools-dialogue-enemies-graph-scroll';
  const graphSizer = document.createElement('div');
  graphSizer.className = 'dev-tools-dialogue-enemies-graph-sizer';
  const graphScaler = document.createElement('div');
  graphScaler.className = 'dev-tools-dialogue-enemies-graph-scaler';
  const svgMount = document.createElement('div');
  svgMount.className = 'dev-tools-dialogue-enemies-graph-svg';
  graphScaler.appendChild(svgMount);
  graphSizer.appendChild(graphScaler);
  graphScroll.appendChild(graphSizer);
  graphWrap.appendChild(graphScroll);
  wrap.appendChild(graphWrap);

  graphScroll.title =
    'Roda do mouse ou trackpad: rolar. Arraste com o botão esquerdo para mover o diagrama. Zoom: botões +/−.';

  let panPointerId: number | null = null;
  let panStartClientX = 0;
  let panStartClientY = 0;
  let panStartScrollLeft = 0;
  let panStartScrollTop = 0;

  function endGraphPan(e: PointerEvent): void {
    if (panPointerId !== e.pointerId) return;
    panPointerId = null;
    graphScroll.classList.remove('dev-tools-dialogue-enemies-graph-scroll--panning');
    try {
      graphScroll.releasePointerCapture(e.pointerId);
    } catch {
      /* not capturing */
    }
  }

  graphScroll.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || busy) return;
    panPointerId = e.pointerId;
    panStartClientX = e.clientX;
    panStartClientY = e.clientY;
    panStartScrollLeft = graphScroll.scrollLeft;
    panStartScrollTop = graphScroll.scrollTop;
    graphScroll.setPointerCapture(e.pointerId);
    graphScroll.classList.add('dev-tools-dialogue-enemies-graph-scroll--panning');
  });

  graphScroll.addEventListener(
    'pointermove',
    (e) => {
      if (panPointerId !== e.pointerId) return;
      e.preventDefault();
      graphScroll.scrollLeft = panStartScrollLeft - (e.clientX - panStartClientX);
      graphScroll.scrollTop = panStartScrollTop - (e.clientY - panStartClientY);
    },
    { passive: false },
  );

  graphScroll.addEventListener('pointerup', endGraphPan);
  graphScroll.addEventListener('pointercancel', endGraphPan);

  const details = document.createElement('details');
  details.className = 'dev-tools-details dev-tools-dialogue-enemies-mermaid-src';
  const sum = document.createElement('summary');
  sum.textContent = 'Definição Mermaid (copiar)';
  details.appendChild(sum);
  const pre = document.createElement('pre');
  pre.className = 'dev-tools-dialogue-enemies-pre';
  details.appendChild(pre);
  wrap.appendChild(details);

  parent.appendChild(wrap);

  let mermaidMod: typeof import('mermaid') | null = null;
  let busy = false;
  let zoom = 1;

  async function ensureMermaid(): Promise<typeof import('mermaid')> {
    if (!mermaidMod) {
      mermaidMod = await import('mermaid');
      mermaidMod.default.initialize({
        startOnLoad: false,
        // Default 50_000; full dialogue graphs exceed that (Mermaid throws).
        maxTextSize: 500_000,
        securityLevel: 'loose',
        theme: 'dark',
        themeVariables: {
          darkMode: true,
          background: 'transparent',
          mainBkg: '#252b38',
          nodeBorder: '#5a6a82',
          clusterBkg: 'transparent',
          titleColor: '#e4e9f2',
          edgeLabelBackground: '#1a1f28',
          lineColor: '#8b9cb8',
          textColor: '#e4e9f2',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          fontSize: '12px',
        },
        flowchart: {
          curve: 'basis',
          padding: 18,
          htmlLabels: true,
          useMaxWidth: false,
          nodeSpacing: 42,
          rankSpacing: 56,
          diagramPadding: 12,
        },
      });
    }
    return mermaidMod;
  }

  function applyZoom(next: number): void {
    zoom = Math.min(2.25, Math.max(0.3, next));
    zoomReadout.textContent = `${Math.round(zoom * 100)}%`;
    const svg = svgMount.querySelector('svg');
    if (!svg) return;
    graphScaler.style.transform = 'none';
    void svg.getBoundingClientRect();
    const w = svg.getBoundingClientRect().width || 320;
    const h = svg.getBoundingClientRect().height || 240;
    graphScaler.style.width = `${w}px`;
    graphScaler.style.height = `${h}px`;
    graphScaler.style.transform = `scale(${zoom})`;
    graphScaler.style.transformOrigin = 'top left';
    graphSizer.style.width = `${w * zoom}px`;
    graphSizer.style.height = `${h * zoom}px`;
  }

  function zoomFitToScroll(): void {
    const svg = svgMount.querySelector('svg');
    if (!svg || graphScroll.clientWidth < 40) return;
    graphScaler.style.transform = 'none';
    void svg.getBoundingClientRect();
    const w = svg.getBoundingClientRect().width || 320;
    const pad = 28;
    const cw = graphScroll.clientWidth - pad;
    const z = Math.min(1.75, Math.max(0.35, cw / w));
    applyZoom(z);
  }

  zoomOut.addEventListener('click', () => applyZoom(zoom / 1.18));
  zoomIn.addEventListener('click', () => applyZoom(zoom * 1.18));
  zoomReset.addEventListener('click', () => applyZoom(1));
  zoomFit.addEventListener('click', () => zoomFitToScroll());

  async function refresh(): Promise<void> {
    const id = select.value;
    const def = defs[id];
    if (!def || busy) return;
    busy = true;
    svgMount.replaceChildren();
    graphSizer.style.width = 'auto';
    graphSizer.style.height = 'auto';
    graphScaler.style.width = 'auto';
    graphScaler.style.height = 'auto';
    graphScaler.style.transform = 'none';
    const pending = document.createElement('p');
    pending.className = 'dev-tools-muted';
    pending.textContent = 'A gerar diagrama…';
    svgMount.appendChild(pending);
    renderMeta(meta, def);
    try {
      const mermaid = (await ensureMermaid()).default;
      const definition = dialogueGraphToMermaid(def.graph);
      pre.textContent = definition;
      const renderId = `dev-dialogue-graph-${def.id}-${Date.now()}`;
      const { svg } = await mermaid.render(renderId, definition);
      svgMount.replaceChildren();
      svgMount.innerHTML = svg;
      stripMermaidFlowchartArrowFills(svgMount);
      requestAnimationFrame(() => {
        zoomFitToScroll();
      });
    } catch (e) {
      svgMount.replaceChildren();
      const err = document.createElement('p');
      err.className = 'dev-tools-missing';
      err.textContent = e instanceof Error ? e.message : String(e);
      svgMount.appendChild(err);
    } finally {
      busy = false;
    }
  }

  select.addEventListener('change', () => {
    const def = defs[select.value];
    if (def) simNodeId = def.graph.rootNodeId;
    renderSim();
    void refresh();
  });
  renderSim();
  void refresh();
}

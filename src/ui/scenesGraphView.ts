import './css/styles.css';
import {
  buildCampaignSceneGraph,
  sceneActId,
  sortedSceneActsFromNodes,
  type SceneGraphEdge,
  type SceneGraphNode,
} from '../engine/world/sceneGraph.ts';
import { getRegisteredCampaignIds } from '../campaigns/registry.ts';
import { buildGameHref, resolveScenesGraphActFromLocation } from './campaignUrl.ts';

type Vec2 = { x: number; y: number };

const LAYER_GAP = 300;
const ROW_GAP = 46;
const PAD_X = 90;

/** BFS em grafo dirigido: camada = distância mínima desde a entrada (ou fontes internas). */
function computeLayers(
  nodeIds: string[],
  edges: SceneGraphEdge[],
  entrySceneId: string | null
): Map<string, number> {
  const idSet = new Set(nodeIds);
  const adj = new Map<string, string[]>();
  for (const id of nodeIds) adj.set(id, []);
  const incomingCount = new Map<string, number>();
  for (const id of nodeIds) incomingCount.set(id, 0);
  for (const e of edges) {
    if (!idSet.has(e.from) || !idSet.has(e.to)) continue;
    adj.get(e.from)!.push(e.to);
    incomingCount.set(e.to, (incomingCount.get(e.to) ?? 0) + 1);
  }
  const layer = new Map<string, number>();
  const q: string[] = [];
  if (entrySceneId && idSet.has(entrySceneId)) {
    layer.set(entrySceneId, 0);
    q.push(entrySceneId);
  } else {
    const sources = nodeIds.filter((id) => (incomingCount.get(id) ?? 0) === 0).sort();
    if (nodeIds.length === 0) {
      return layer;
    }
    if (sources.length === 0) {
      layer.set(nodeIds[0]!, 0);
      q.push(nodeIds[0]!);
    } else {
      for (const s of sources) {
        layer.set(s, 0);
        q.push(s);
      }
    }
  }
  let qi = 0;
  while (qi < q.length) {
    const u = q[qi++]!;
    const L = layer.get(u)!;
    for (const v of adj.get(u) ?? []) {
      if (!idSet.has(v)) continue;
      if (!layer.has(v)) {
        layer.set(v, L + 1);
        q.push(v);
      }
    }
  }
  let maxL = -1;
  for (const id of nodeIds) {
    const lv = layer.get(id);
    if (lv !== undefined) maxL = Math.max(maxL, lv);
  }
  const orphanLayer = maxL + 1;
  for (const id of nodeIds) {
    if (!layer.has(id)) layer.set(id, orphanLayer);
  }
  return layer;
}

function assignLinearPositions(drawNodes: SceneGraphNode[], layer: Map<string, number>): Map<string, Vec2> {
  let maxLayer = 0;
  for (const n of drawNodes) maxLayer = Math.max(maxLayer, layer.get(n.id) ?? 0);
  const byLayer = new Map<number, string[]>();
  for (let L = 0; L <= maxLayer; L++) byLayer.set(L, []);
  for (const n of drawNodes) {
    const L = layer.get(n.id) ?? 0;
    byLayer.get(L)!.push(n.id);
  }
  for (let L = 0; L <= maxLayer; L++) {
    byLayer.get(L)!.sort((a, b) => a.localeCompare(b));
  }
  const pos = new Map<string, Vec2>();
  for (let L = 0; L <= maxLayer; L++) {
    const ids = byLayer.get(L) ?? [];
    const n = ids.length;
    const totalH = Math.max(0, (n - 1) * ROW_GAP);
    const y0 = -totalH / 2;
    ids.forEach((id, i) => {
      pos.set(id, { x: PAD_X + L * LAYER_GAP, y: y0 + i * ROW_GAP });
    });
  }
  return pos;
}

function shortenSegment(from: Vec2, to: Vec2, rFrom: number, rTo: number): [Vec2, Vec2] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  return [
    { x: from.x + ux * rFrom, y: from.y + uy * rFrom },
    { x: to.x - ux * rTo, y: to.y - uy * rTo },
  ];
}

function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  tipX: number,
  tipY: number,
  angle: number,
  size: number
): void {
  ctx.save();
  ctx.translate(tipX, tipY);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, -size * 0.55);
  ctx.lineTo(-size, size * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function chapterHue(chapter: number): string {
  const h = ((chapter * 47) % 360 + 360) % 360;
  return `hsl(${h} 55% 52%)`;
}

function sceneShortId(id: string): string {
  const i = id.lastIndexOf('/');
  return i >= 0 ? id.slice(i + 1) : id;
}

/** Até 2 linhas: título YAML; senão último segmento do id. */
function linesForNodeLabel(n: SceneGraphNode): string[] {
  const raw = (n.title && n.title.trim()) || sceneShortId(n.id);
  if (raw.length <= 34) return [raw];
  const breakAt = raw.slice(0, 34).lastIndexOf(' ');
  if (breakAt > 8) {
    const a = raw.slice(0, breakAt).trimEnd();
    let b = raw.slice(breakAt + 1).trim();
    if (b.length > 36) b = `${b.slice(0, 35)}…`;
    return [a, b];
  }
  return [`${raw.slice(0, 33)}…`];
}

export function mountScenesGraphView(root: HTMLElement, campaignId: string): void {
  root.innerHTML = '';
  root.className = 'scenes-graph-root app--scenes-graph';

  const { nodes, edges, entrySceneId } = buildCampaignSceneGraph(campaignId);
  const acts = sortedSceneActsFromNodes(nodes);
  const actFilter = resolveScenesGraphActFromLocation(acts);

  const nodeById = new Map(nodes.map((n) => [n.id, n] as const));

  let drawNodes: SceneGraphNode[];
  let drawEdges: SceneGraphEdge[];
  let entryForLayers: string | null;

  if (actFilter === 'all') {
    drawNodes = nodes;
    drawEdges = edges;
    entryForLayers = entrySceneId;
  } else {
    const idSet = new Set(nodes.filter((n) => sceneActId(n.id) === actFilter).map((n) => n.id));
    drawNodes = nodes.filter((n) => idSet.has(n.id));
    drawEdges = edges.filter((e) => idSet.has(e.from) && idSet.has(e.to));
    entryForLayers = idSet.has(entrySceneId) ? entrySceneId : null;
  }

  const nodeIds = drawNodes.map((n) => n.id);
  const layerById = computeLayers(nodeIds, drawEdges, entryForLayers);
  const positions = assignLinearPositions(drawNodes, layerById);

  const shell = document.createElement('div');
  shell.className = 'scenes-graph-shell';

  const toolbar = document.createElement('div');
  toolbar.className = 'scenes-graph-toolbar';

  const title = document.createElement('h1');
  title.className = 'scenes-graph-title';
  title.textContent = 'Grafo de cenas';

  const filters = document.createElement('div');
  filters.className = 'scenes-graph-filters';

  const campaignWrap = document.createElement('label');
  campaignWrap.className = 'scenes-graph-campaign';
  campaignWrap.textContent = 'Campanha ';
  const select = document.createElement('select');
  select.className = 'scenes-graph-select';
  for (const id of getRegisteredCampaignIds()) {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = id;
    if (id === campaignId) opt.selected = true;
    select.appendChild(opt);
  }
  select.addEventListener('change', () => {
    const u = new URL(window.location.href);
    u.searchParams.set('campaign', select.value);
    u.searchParams.set('view', 'scenes-graph');
    if (actFilter !== 'all') u.searchParams.set('act', actFilter);
    else u.searchParams.delete('act');
    window.location.href = u.toString();
  });
  campaignWrap.appendChild(select);

  const actWrap = document.createElement('label');
  actWrap.className = 'scenes-graph-act';
  actWrap.textContent = 'Act ';
  const actSelect = document.createElement('select');
  actSelect.className = 'scenes-graph-select';
  const optAll = document.createElement('option');
  optAll.value = 'all';
  optAll.textContent = 'Todos (timeline)';
  if (actFilter === 'all') optAll.selected = true;
  actSelect.appendChild(optAll);
  for (const a of acts) {
    const opt = document.createElement('option');
    opt.value = a;
    opt.textContent = a;
    if (actFilter === a) opt.selected = true;
    actSelect.appendChild(opt);
  }
  actSelect.addEventListener('change', () => {
    const u = new URL(window.location.href);
    u.searchParams.set('view', 'scenes-graph');
    u.searchParams.set('campaign', campaignId);
    if (actSelect.value === 'all') u.searchParams.delete('act');
    else u.searchParams.set('act', actSelect.value);
    window.location.href = u.toString();
  });
  actWrap.appendChild(actSelect);

  filters.appendChild(campaignWrap);
  filters.appendChild(actWrap);

  const back = document.createElement('a');
  back.className = 'scenes-graph-back';
  back.href = buildGameHref(campaignId);
  back.textContent = '← Voltar ao jogo';

  const stats = document.createElement('div');
  stats.className = 'scenes-graph-stats';
  const actLabel = actFilter === 'all' ? 'todos os acts' : actFilter;
  const maxCamada =
    nodeIds.length === 0 ? 0 : Math.max(...nodeIds.map((id) => layerById.get(id) ?? 0));
  stats.textContent = `${drawNodes.length} cenas · ${drawEdges.length} arestas · ${actLabel} · camadas 0–${maxCamada} · entrada: ${entrySceneId}`;

  toolbar.appendChild(title);
  toolbar.appendChild(filters);
  toolbar.appendChild(back);
  toolbar.appendChild(stats);

  const canvasWrap = document.createElement('div');
  canvasWrap.className = 'scenes-graph-canvas-wrap';

  const canvas = document.createElement('canvas');
  canvas.className = 'scenes-graph-canvas';
  const canvasCtx = canvas.getContext('2d');
  if (!canvasCtx) {
    shell.textContent = 'Canvas não disponível.';
    root.appendChild(shell);
    return;
  }
  const ctx = canvasCtx;

  const hintBar = document.createElement('div');
  hintBar.className = 'scenes-graph-hint-bar';
  const legend = document.createElement('div');
  legend.className = 'scenes-graph-legend';
  const legendItem = (cls: string, text: string): HTMLSpanElement => {
    const s = document.createElement('span');
    s.className = `scenes-graph-legend-item ${cls}`;
    s.textContent = text;
    return s;
  };
  legend.appendChild(legendItem('scenes-graph-legend--fwd', 'À frente'));
  legend.appendChild(legendItem('scenes-graph-legend--same', 'Mesma camada'));
  legend.appendChild(legendItem('scenes-graph-legend--back', 'Volta'));
  const hintText = document.createElement('p');
  hintText.className = 'scenes-graph-hint-text';
  hintText.textContent =
    'Linha do tempo: esquerda = entrada, direita = mais longe (BFS). Roda: zoom · arrastar: mover o mapa';
  hintBar.appendChild(legend);
  hintBar.appendChild(hintText);

  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let dragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let panStartOx = 0;
  let panStartOy = 0;

  const layoutW = 2800;
  const layoutH = 2200;
  let bounds = { minX: 0, minY: 0, maxX: layoutW, maxY: layoutH };
  /** Espaço estimado para rótulo abaixo do nó (2 linhas). */
  const LABEL_PAD_X = 120;
  const LABEL_PAD_Y = 58;
  function recomputeBounds(): void {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const id of nodeIds) {
      const p = positions.get(id);
      if (!p) continue;
      minX = Math.min(minX, p.x - LABEL_PAD_X);
      maxX = Math.max(maxX, p.x + LABEL_PAD_X);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y + LABEL_PAD_Y);
    }
    if (!Number.isFinite(minX)) {
      bounds = { minX: 0, minY: 0, maxX: layoutW, maxY: layoutH };
      return;
    }
    const pad = 100;
    bounds = { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad };
  }
  recomputeBounds();

  function clientToWorld(clientX: number, clientY: number): { x: number; y: number } {
    const r = canvas.getBoundingClientRect();
    const bx = clientX - r.left;
    const by = clientY - r.top;
    return { x: (bx - offsetX) / scale, y: (by - offsetY) / scale };
  }

  function fitView(): void {
    const r = canvas.getBoundingClientRect();
    const bw = bounds.maxX - bounds.minX;
    const bh = bounds.maxY - bounds.minY;
    if (bw <= 0 || bh <= 0) return;
    const pad = 24;
    scale = Math.min((r.width - pad * 2) / bw, (r.height - pad * 2) / bh, 2.5);
    offsetX = pad + (r.width - pad * 2 - bw * scale) / 2 - bounds.minX * scale;
    offsetY = pad + (r.height - pad * 2 - bh * scale) / 2 - bounds.minY * scale;
  }

  let hoverId: string | null = null;

  function draw(): void {
    const r = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(r.width * dpr));
    canvas.height = Math.max(1, Math.floor(r.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, r.width, r.height);

    const rootEl = document.documentElement;
    const themeFg = getComputedStyle(rootEl).getPropertyValue('--fg').trim() || '#c9b89a';
    const themeEmphasis =
      getComputedStyle(rootEl).getPropertyValue('--text-emphasis').trim() || '#e0d4b8';

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    const nodeRadius = Math.max(2.2, 3.6 / scale);
    const edgeR = nodeRadius + 3 / scale;
    const headW = 11 / scale;

    const seenDirected = new Set<string>();
    for (const e of drawEdges) {
      const key = `${e.from}->${e.to}`;
      if (seenDirected.has(key)) continue;
      seenDirected.add(key);
      const pa = positions.get(e.from);
      const pb = positions.get(e.to);
      if (!pa || !pb) continue;
      const lf = layerById.get(e.from) ?? 0;
      const lt = layerById.get(e.to) ?? 0;
      let forward: 'fwd' | 'same' | 'back';
      if (lt > lf) forward = 'fwd';
      else if (lt < lf) forward = 'back';
      else forward = 'same';

      const [a, b] = shortenSegment(pa, pb, edgeR, edgeR);
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const ang = Math.atan2(dy, dx);

      if (forward === 'back') {
        ctx.setLineDash([5 / scale, 4 / scale]);
        ctx.strokeStyle = 'rgba(255, 130, 140, 0.55)';
      } else if (forward === 'same') {
        ctx.setLineDash([3 / scale, 4 / scale]);
        ctx.strokeStyle = 'rgba(200, 170, 100, 0.45)';
      } else {
        ctx.setLineDash([]);
        ctx.strokeStyle = 'rgba(130, 150, 185, 0.42)';
      }
      ctx.lineWidth = (forward === 'fwd' ? 1.25 : 1) / scale;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle =
        forward === 'back'
          ? 'rgba(255, 130, 140, 0.75)'
          : forward === 'same'
            ? 'rgba(200, 170, 100, 0.75)'
            : 'rgba(130, 150, 185, 0.8)';
      drawArrowhead(ctx, b.x, b.y, ang, headW);
    }

    for (const n of drawNodes) {
      const p = positions.get(n.id);
      if (!p) continue;
      const hi = hoverId === n.id;
      ctx.beginPath();
      ctx.fillStyle = chapterHue(n.chapter);
      if (n.isEntry) {
        ctx.strokeStyle = themeEmphasis;
        ctx.lineWidth = 2.5 / scale;
        ctx.arc(p.x, p.y, nodeRadius + 2.2 / scale, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (hi) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 2 / scale;
        ctx.beginPath();
        ctx.arc(p.x, p.y, nodeRadius + 4 / scale, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, nodeRadius, 0, Math.PI * 2);
      ctx.fill();

      const fontPx = 10 / scale;
      const lineGap = 12 / scale;
      ctx.font = `${fontPx}px IBM Plex Mono, ui-monospace, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = themeFg;
      let ty = p.y + nodeRadius + 3 / scale;
      for (const line of linesForNodeLabel(n)) {
        ctx.fillText(line, p.x, ty);
        ty += lineGap;
      }
    }

    ctx.restore();

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const axisFg = getComputedStyle(rootEl).getPropertyValue('--text-section').trim() || '#9a9588';
    ctx.fillStyle = axisFg;
    ctx.font = '11px IBM Plex Mono, ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('← início (entrada da campanha)', 10, r.height - 8);
    ctx.textAlign = 'right';
    ctx.fillText('progressão da narrativa →', r.width - 10, r.height - 8);
    ctx.restore();
  }

  const tooltip = document.createElement('div');
  tooltip.className = 'scenes-graph-tooltip';
  tooltip.hidden = true;
  canvasWrap.appendChild(tooltip);

  function pickNode(wx: number, wy: number): string | null {
    const rad = Math.max(4, 5 / scale);
    const maxD2 = rad * rad;
    let best: string | null = null;
    let bestD = Infinity;
    for (const n of drawNodes) {
      const p = positions.get(n.id);
      if (!p) continue;
      const dx = p.x - wx;
      const dy = p.y - wy;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD) {
        bestD = d2;
        best = n.id;
      }
    }
    return bestD <= maxD2 ? best : null;
  }

  canvas.addEventListener('mousemove', (ev) => {
    const w = clientToWorld(ev.clientX, ev.clientY);
    const id = pickNode(w.x, w.y);
    if (id !== hoverId) {
      hoverId = id;
      draw();
    }
    canvas.style.cursor = id ? 'pointer' : 'grab';
    if (id) {
      const n = nodeById.get(id);
      const act = sceneActId(id);
      const cam = layerById.get(id) ?? '?';
      tooltip.hidden = false;
      tooltip.textContent = n
        ? `${n.id}\n${n.title} · cap. ${n.chapter} · ${act}\ncamada ${cam} (BFS desde a entrada)`
        : `${id} · ${act} · camada ${cam}`;
      tooltip.style.left = `${ev.clientX - canvas.getBoundingClientRect().left + 12}px`;
      tooltip.style.top = `${ev.clientY - canvas.getBoundingClientRect().top + 12}px`;
    } else {
      tooltip.hidden = true;
    }
  });

  canvas.addEventListener('mouseleave', () => {
    if (hoverId != null) {
      hoverId = null;
      draw();
    }
    tooltip.hidden = true;
    canvas.style.cursor = 'grab';
  });

  canvas.addEventListener('mousedown', (ev) => {
    dragging = true;
    dragStartX = ev.clientX;
    dragStartY = ev.clientY;
    panStartOx = offsetX;
    panStartOy = offsetY;
    canvas.style.cursor = 'grabbing';
  });
  window.addEventListener('mouseup', () => {
    dragging = false;
    canvas.style.cursor = hoverId ? 'pointer' : 'grab';
  });
  window.addEventListener('mousemove', (ev) => {
    if (!dragging) return;
    offsetX = panStartOx + (ev.clientX - dragStartX);
    offsetY = panStartOy + (ev.clientY - dragStartY);
    draw();
  });

  canvas.addEventListener(
    'wheel',
    (ev) => {
      ev.preventDefault();
      const r = canvas.getBoundingClientRect();
      const cx = ev.clientX - r.left;
      const cy = ev.clientY - r.top;
      const worldBefore = { x: (cx - offsetX) / scale, y: (cy - offsetY) / scale };
      const factor = ev.deltaY > 0 ? 0.92 : 1.09;
      scale = Math.min(4, Math.max(0.08, scale * factor));
      offsetX = cx - worldBefore.x * scale;
      offsetY = cy - worldBefore.y * scale;
      draw();
    },
    { passive: false }
  );

  const ro = new ResizeObserver(() => {
    draw();
  });
  ro.observe(canvasWrap);

  shell.appendChild(toolbar);
  shell.appendChild(hintBar);
  canvasWrap.appendChild(canvas);
  shell.appendChild(canvasWrap);
  root.appendChild(shell);

  fitView();
  draw();
  requestAnimationFrame(() => {
    fitView();
    draw();
  });
}

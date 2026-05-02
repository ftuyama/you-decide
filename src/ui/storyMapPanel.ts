import type { GameState, SceneFrontmatter } from '../engine/schema/index.ts';
import type { ContentRegistry } from '../content/registry.ts';
import { iconWrap, icons } from './icons/index.ts';

function partyOwnsItem(state: GameState, itemId: string): boolean {
  if (state.inventory.includes(itemId)) return true;
  return state.party.some(
    (member) =>
      member.weaponId === itemId || member.armorId === itemId || member.relicId === itemId
  );
}

/** Item necessário para ver traçado completo (@ / X em exploração) por `mapId` do calvario. */
const ASCII_MAP_UNLOCK: Record<string, { itemId: string; lockedHint: string }> = {
  act2_catacomb: {
    itemId: 'rumor_map',
    lockedHint:
      'Sem o mapa rasgado do mercador, só sentes pedra e corrente — não traças posição no papel.',
  },
  act3_depths: {
    itemId: 'depths_chart',
    lockedHint:
      'Tens o mapa da zona, mas falta o croqui que o guardião carregava — sem ele não alinhas corredor a grade.',
  },
  depths6: {
    itemId: 'depths_chart',
    lockedHint:
      'O mini-mapa exige o mesmo croqui das profundezas — runas que só o guardião de pedra sabia ler.',
  },
  act5_frost: {
    itemId: 'frost_pass_map',
    lockedHint:
      'A neve engole marcos; sem o traçado que Tomás (ou o resgate) deixou legível, não sabes onde estás na grelha.',
  },
  act6_fractured_nave: {
    itemId: 'fractured_nave_map',
    lockedHint:
      'A nave fratura o sentido; sem a planta comprada ao mercador, não prendes posição ao desenho.',
  },
};

function asciiMapLocked(state: GameState, mapId: string): { locked: true; hint: string } | { locked: false } {
  const spec = ASCII_MAP_UNLOCK[mapId];
  if (!spec) return { locked: false };
  if (partyOwnsItem(state, spec.itemId)) return { locked: false };
  return { locked: true, hint: spec.lockedHint };
}

function buildAsciiMapElement(lines: string[]): HTMLElement {
  const pre = document.createElement('pre');
  pre.className = 'ascii-map ascii-map--palette';
  lines.forEach((line, lineIdx) => {
    for (const ch of line) {
      const span = document.createElement('span');
      span.textContent = ch;
      if (ch === '#') span.className = 'ascii-map-char ascii-map-char--wall';
      else if (ch === '.') span.className = 'ascii-map-char ascii-map-char--floor';
      else if (ch === '!') span.className = 'ascii-map-char ascii-map-char--mark';
      else if (ch === '@') span.className = 'ascii-map-char ascii-map-char--player';
      else if (ch === 'X') span.className = 'ascii-map-char ascii-map-char--goal';
      else span.className = 'ascii-map-char';
      pre.appendChild(span);
    }
    if (lineIdx < lines.length - 1) pre.appendChild(document.createElement('br'));
  });
  return pre;
}

export function appendStoryMapPanel(
  parent: HTMLElement,
  args: {
    state: GameState;
    frontmatter: SceneFrontmatter;
    registry: ContentRegistry;
  }
): void {
  const { state, frontmatter, registry } = args;
  if (!state.asciiMap) return;

  const mapId = state.asciiMap.mapId;
  const lock = asciiMapLocked(state, mapId);
  const isExplorationScene = frontmatter.type === 'exploration';
  let marker: { x: number; y: number } | undefined;
  let goal: { x: number; y: number } | undefined;
  if (!lock.locked && isExplorationScene && state.exploration && registry.ui.getExplorationGraph) {
    const g = registry.ui.getExplorationGraph(state.exploration.graphId);
    const n = g?.nodes.find((x) => x.id === state.exploration!.nodeId);
    marker = n?.mapCell;
    goal = g?.nodes.find((x) => x.isGoal === true)?.mapCell;
  }

  const rm = registry.ui.renderMap(
    mapId,
    !lock.locked && isExplorationScene ? marker : undefined,
    !lock.locked && isExplorationScene ? goal : undefined
  );
  if (!rm) return;

  const wrap = document.createElement('div');
  wrap.innerHTML = `<div class="map-hint sidebar-line--with-icon">${iconWrap(icons.map)}<span>Mapa</span></div>`;

  if (lock.locked) {
    const noMap = document.createElement('p');
    noMap.className = 'explore-map-hint';
    noMap.textContent = lock.hint;
    wrap.appendChild(noMap);
  } else {
    const panel = document.createElement('div');
    panel.className = 'explore-map-panel';
    const pre = buildAsciiMapElement(rm.lines);
    panel.appendChild(pre);
    if (isExplorationScene) {
      const legend = document.createElement('div');
      legend.className = 'ascii-map-legend';
      legend.innerHTML = [
        '<div class="ascii-map-legend__title">Legenda</div>',
        '<div><code class="ascii-map-char ascii-map-char--player">@</code> tua posição</div>',
        '<div><code class="ascii-map-char ascii-map-char--goal">X</code> destino</div>',
        '<div><code class="ascii-map-char ascii-map-char--floor">.</code> corredor</div>',
        '<div><code class="ascii-map-char ascii-map-char--wall">#</code> parede</div>',
        '<div><code class="ascii-map-char ascii-map-char--mark">!</code> marco / ruína</div>',
      ].join('');
      panel.appendChild(legend);
    }
    wrap.appendChild(panel);
  }

  parent.appendChild(wrap);
}

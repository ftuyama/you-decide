import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { EXPLORATION_GRAPHS } from '../../src/campaigns/calvario/exploration/graphs.ts';
import { MAPS } from '../../src/campaigns/calvario/maps.ts';

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const scenesDir = join(repoRoot, 'src/campaigns/calvario/scenes');

function listMdFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...listMdFiles(p));
    else if (name.endsWith('.md')) out.push(p);
  }
  return out;
}

const SET_EXPLORATION_RE =
  /op:\s*setExploration,\s*graphId:\s*([a-zA-Z0-9_]+),\s*nodeId:\s*([a-zA-Z0-9_]+)/g;

describe('exploration links (calvario)', () => {
  it('cada setExploration aponta para nodeId válido no grafo', () => {
    const files = listMdFiles(scenesDir);
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      let match: RegExpExecArray | null;
      while ((match = SET_EXPLORATION_RE.exec(text)) !== null) {
        const graphId = match[1]!;
        const nodeId = match[2]!;
        const graph = EXPLORATION_GRAPHS[graphId];
        expect(graph, `graphId inexistente em ${file}: ${graphId}`).toBeDefined();
        if (!graph) continue;
        expect(
          graph.nodes.some((n) => n.id === nodeId),
          `nodeId inexistente em ${file}: ${graphId}/${nodeId}`
        ).toBe(true);
      }
    }
  });

  it('patrulha do perímetro inicia no cruzeiro central', () => {
    const hubFile = join(scenesDir, 'act2/hub_catacomb.md');
    const text = readFileSync(hubFile, 'utf8');
    const m = /op:\s*setExploration,\s*graphId:\s*act2_catacomb,\s*nodeId:\s*([a-zA-Z0-9_]+)/.exec(
      text
    );
    expect(m, 'setExploration de act2_catacomb ausente no hub').not.toBeNull();
    const nodeId = m?.[1];
    expect(nodeId).toBe('center_breach');
  });

  it('cada ato de exploração tem ponto de partida explícito e válido no mapa', () => {
    const expectedStartByGraph: Record<string, string> = {
      act2_catacomb: 'center_breach',
      act3_depths: 'depths_drowned_gallery',
      act5_frost: 'frost_broken_watch',
      act6_fractured_nave: 'nave_will_altar',
    };

    for (const [graphId, startNodeId] of Object.entries(expectedStartByGraph)) {
      const graph = EXPLORATION_GRAPHS[graphId];
      expect(graph, `grafo ausente: ${graphId}`).toBeDefined();
      if (!graph) continue;

      expect(graph.startNodeId, `startNodeId divergente em ${graphId}`).toBe(startNodeId);
      const startNode = graph.nodes.find((n) => n.id === graph.startNodeId);
      expect(startNode, `nó de partida ausente em ${graphId}`).toBeDefined();
      expect(startNode?.mapCell, `mapCell ausente no start de ${graphId}`).toBeDefined();

      const rows = MAPS[graph.mapId];
      expect(rows, `mapa ausente para ${graphId}: ${graph.mapId}`).toBeDefined();
      if (!rows || !startNode?.mapCell) continue;
      const ch = rows[startNode.mapCell.y]?.[startNode.mapCell.x];
      expect(ch, `startNode em parede no mapa de ${graphId}`).not.toBe('#');
    }
  });

  it('hubs com exploração iniciam navegação com setExploration válido', () => {
    const expected: Array<{ file: string; graphId: string; nodeId: string }> = [
      { file: 'act2/hub_catacomb.md', graphId: 'act2_catacomb', nodeId: 'center_breach' },
      { file: 'act3/hub_depths.md', graphId: 'act3_depths', nodeId: 'depths_drowned_gallery' },
      { file: 'act5/frost_hub.md', graphId: 'act5_frost', nodeId: 'frost_broken_watch' },
      {
        file: 'act6/hub_fractured_nave.md',
        graphId: 'act6_fractured_nave',
        nodeId: 'nave_will_altar',
      },
    ];

    for (const entry of expected) {
      const text = readFileSync(join(scenesDir, entry.file), 'utf8');
      const re = new RegExp(
        `op:\\s*setExploration,\\s*graphId:\\s*${entry.graphId},\\s*nodeId:\\s*([a-zA-Z0-9_]+)`
      );
      const m = re.exec(text);
      expect(m, `setExploration ausente em ${entry.file}`).not.toBeNull();
      expect(m?.[1], `nodeId inicial divergente em ${entry.file}`).toBe(entry.nodeId);
    }
  });
});

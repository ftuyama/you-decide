import { loadCampaignContent } from '../campaigns/registry';
import { parseSceneMarkdown, type LoadedScene } from './sceneRuntime';
import type { Effect, SceneFrontmatter } from './schema';

export type SceneGraphEdge = { from: string; to: string; kind: string };

export type SceneGraphNode = {
  id: string;
  chapter: number;
  title: string;
  isEntry: boolean;
};

/** Prefixo de pasta do act (`act6/encounters/x` → `act6`). Sem `actN/` → `outros`. */
export function sceneActId(sceneId: string): string {
  const m = sceneId.match(/^(act\d+)(?:\/|$)/);
  return m ? m[1]! : 'outros';
}

export function compareSceneActId(a: string, b: string): number {
  const ma = a.match(/^act(\d+)$/);
  const mb = b.match(/^act(\d+)$/);
  if (ma && mb) return Number(ma[1]) - Number(mb[1]);
  if (a === 'outros') return 1;
  if (b === 'outros') return -1;
  return a.localeCompare(b);
}

export function sortedSceneActsFromNodes(nodes: SceneGraphNode[]): string[] {
  return [...new Set(nodes.map((n) => sceneActId(n.id)))].sort(compareSceneActId);
}

function pathToSceneId(path: string): string {
  return path.replace(/^.*\/scenes\//, '').replace(/\.md$/, '');
}

function pushEffectEdges(effects: Effect[], from: string, prefix: string, out: SceneGraphEdge[]): void {
  for (const e of effects) {
    if (e.op === 'goto') {
      out.push({ from, to: e.sceneId, kind: prefix });
    }
    if (e.op === 'startCombat') {
      if (e.onVictory) out.push({ from, to: e.onVictory, kind: `${prefix}:vitória` });
      if (e.onFlee) out.push({ from, to: e.onFlee, kind: `${prefix}:fuga` });
      if (e.onDefeat) out.push({ from, to: e.onDefeat, kind: `${prefix}:derrota` });
    }
  }
}

/** Static edges implied by frontmatter (choices, checks, combat exits, efeitos goto). */
export function edgesFromFrontmatter(fromId: string, fm: SceneFrontmatter): SceneGraphEdge[] {
  const out: SceneGraphEdge[] = [];
  for (const ch of fm.choices) {
    if (ch.next) {
      out.push({ from: fromId, to: ch.next, kind: ch.id ? `escolha:${ch.id}` : 'escolha' });
    }
    if (ch.fallbackNext) {
      out.push({ from: fromId, to: ch.fallbackNext, kind: ch.id ? `tempo:${ch.id}` : 'tempo' });
    }
    pushEffectEdges(ch.effects, fromId, ch.id ? `fx:${ch.id}` : 'fx:escolha', out);
  }
  pushEffectEdges(fm.onEnter, fromId, 'onEnter', out);
  if (fm.skillCheck) {
    out.push({ from: fromId, to: fm.skillCheck.successNext, kind: 'perícia:ok' });
    out.push({ from: fromId, to: fm.skillCheck.failNext, kind: 'perícia:falha' });
  }
  if (fm.dualAttrSkillCheck) {
    out.push({ from: fromId, to: fm.dualAttrSkillCheck.successNext, kind: 'dupla:ok' });
    out.push({ from: fromId, to: fm.dualAttrSkillCheck.failNext, kind: 'dupla:falha' });
  }
  if (fm.luckCheck) {
    out.push({ from: fromId, to: fm.luckCheck.successNext, kind: 'sorte:ok' });
    out.push({ from: fromId, to: fm.luckCheck.failNext, kind: 'sorte:falha' });
  }
  if (fm.randomBranch) {
    fm.randomBranch.branches.forEach((b, i) => {
      out.push({ from: fromId, to: b.next, kind: `aleatório:${i}` });
    });
  }
  if (fm.chapterGate) {
    out.push({ from: fromId, to: fm.chapterGate.passNext, kind: 'capítulo:passa' });
    out.push({ from: fromId, to: fm.chapterGate.failNext, kind: 'capítulo:falha' });
  }
  if (fm.onVictory) out.push({ from: fromId, to: fm.onVictory, kind: 'combate:vitória' });
  if (fm.onFlee) out.push({ from: fromId, to: fm.onFlee, kind: 'combate:fuga' });
  if (fm.onDefeat) out.push({ from: fromId, to: fm.onDefeat, kind: 'combate:derrota' });
  return out;
}

export function buildCampaignSceneGraph(campaignId: string): {
  nodes: SceneGraphNode[];
  edges: SceneGraphEdge[];
  entrySceneId: string;
} {
  const { data, sceneFiles } = loadCampaignContent(campaignId);
  const scenes = new Map<string, LoadedScene>();
  for (const [path, raw] of Object.entries(sceneFiles)) {
    const id = pathToSceneId(path);
    const scene = parseSceneMarkdown(raw, id);
    scenes.set(scene.id, scene);
  }

  const edges: SceneGraphEdge[] = [];
  for (const scene of scenes.values()) {
    edges.push(...edgesFromFrontmatter(scene.id, scene.frontmatter));
  }

  const nodeIds = new Set<string>(scenes.keys());
  for (const e of edges) {
    nodeIds.add(e.from);
    nodeIds.add(e.to);
  }

  const entrySceneId = data.campaign.entryScene;
  const nodes: SceneGraphNode[] = [...nodeIds].map((id) => {
    const sc = scenes.get(id);
    return {
      id,
      chapter: sc?.frontmatter.chapter ?? 0,
      title: sc?.frontmatter.title?.trim() || id,
      isEntry: id === entrySceneId,
    };
  });
  nodes.sort((a, b) => a.id.localeCompare(b.id));

  return { nodes, edges, entrySceneId };
}

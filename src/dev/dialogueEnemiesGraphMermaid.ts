import {
  mergeDialogueChoiceEffects,
  type DialogueChoice,
  type DialogueChoiceEffects,
  type DialogueGraph,
  type DialogueNode,
} from '../engine/schema/dialogueCombat.ts';

/** Escapa texto para etiquetas de aresta com `htmlLabels` (Mermaid). */
function escapeHtmlForEdgeLabel(s: string, maxLen: number): string {
  const t = s.length > maxLen ? `${s.slice(0, maxLen - 1)}…` : s;
  return t
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\n', ' ')
    .replaceAll('\r', '');
}

/** Resumo dos efeitos da escolha (dev graph); vazio se não houver. */
export function formatChoiceEffectsForDevGraph(effects: DialogueChoiceEffects | undefined): string {
  if (!effects) return '';
  const parts: string[] = [];
  if (effects.playerHpLossPercent != null && effects.playerHpLossPercent > 0) {
    parts.push(`líder −${effects.playerHpLossPercent}%`);
  }
  if (effects.enemyHpDelta != null && effects.enemyHpDelta !== 0) {
    const d = effects.enemyHpDelta;
    parts.push(d > 0 ? `tensão +${d}` : `tensão −${-d}`);
  }
  if (parts.length === 0) return '';
  return parts.join(' · ');
}

function buildChoiceEdgeLabelHtml(
  choice: DialogueChoice,
  resolutionSuffix: string,
  effectsForEdge?: DialogueChoiceEffects,
): string {
  const fxPlain = formatChoiceEffectsForDevGraph(effectsForEdge ?? choice.effects);
  const hasFx = fxPlain.length > 0;
  const hasRes = resolutionSuffix.length > 0;
  const textMax = hasFx || hasRes ? 56 : 64;
  let inner = escapeHtmlForEdgeLabel(choice.textPt, textMax);
  if (hasFx) {
    inner += `<br/><span class='dev-dialogue-edge-fx'>${escapeHtmlForEdgeLabel(fxPlain, 160)}</span>`;
  }
  if (hasRes) {
    const suf = escapeHtmlForEdgeLabel(resolutionSuffix, 96);
    inner += `<br/><span class='dev-dialogue-edge-res'>${suf}</span>`;
  }
  return inner;
}

function buildNodeLabelHtml(nid: string, node: DialogueNode): string {
  const idHtml = escapeHtmlForEdgeLabel(nid, 200);
  const lineHtml = escapeHtmlForEdgeLabel(node.linePt, 160);
  let inner = `<span class='dev-dialogue-node-id'>[${idHtml}]</span>`;
  if (node.terminal === 'victory') {
    inner += `<br/><span class='dev-dialogue-node-badge'>vitória</span>`;
  } else if (node.terminal === 'defeat') {
    inner += `<br/><span class='dev-dialogue-node-badge'>derrota</span>`;
  }
  inner += `<br/><span class='dev-dialogue-node-line'>${lineHtml}</span>`;
  return inner;
}

function choiceEdgeLabels(choice: DialogueChoice): { ok?: string; fail?: string } {
  const res = choice.resolution;
  if (res.kind === 'fixed') return { ok: buildChoiceEdgeLabelHtml(choice, '') };
  if (res.kind === 'skill') {
    const okFx = mergeDialogueChoiceEffects(choice.effects, choice.effectsOnSuccess);
    const failFx = mergeDialogueChoiceEffects(choice.effects, choice.effectsOnFailure);
    return {
      ok: buildChoiceEdgeLabelHtml(choice, `${res.attr.toUpperCase()} TN${res.tn} ✓`, okFx),
      fail: buildChoiceEdgeLabelHtml(choice, `${res.attr.toUpperCase()} TN${res.tn} ✗`, failFx),
    };
  }
  const okFx = mergeDialogueChoiceEffects(choice.effects, choice.effectsOnSuccess);
  const failFx = mergeDialogueChoiceEffects(choice.effects, choice.effectsOnFailure);
  return {
    ok: buildChoiceEdgeLabelHtml(choice, `sorte TN${res.tn} ✓`, okFx),
    fail: buildChoiceEdgeLabelHtml(choice, `sorte TN${res.tn} ✗`, failFx),
  };
}

function targetsFromChoice(choice: DialogueChoice): { ok: string; fail?: string } {
  const res = choice.resolution;
  if (res.kind === 'fixed') return { ok: res.nextNodeId };
  return { ok: res.successNodeId, fail: res.failNodeId };
}

/** Gera definição Mermaid `flowchart` a partir do grafo de diálogo (inclui ciclos). */
export function dialogueGraphToMermaid(graph: DialogueGraph): string {
  const lines: string[] = [
    '%% Gerado pela dev tool dialogue-enemies',
    'flowchart TD',
    '  classDef root fill:#1e3a5f,stroke:#7eb8ff,color:#f0f7ff,stroke-width:2px',
    '  classDef terminal fill:#1a3d2a,stroke:#6ecf8e,color:#e8fef0,stroke-width:2px',
    '  classDef terminalDefeat fill:#3d1a1a,stroke:#cf6e6e,color:#fef0f0,stroke-width:2px',
    '  classDef mid fill:#252b38,stroke:#5a6a82,color:#e4e9f2,stroke-width:1px',
    '  classDef orphan fill:#3d2e18,stroke:#d4a84b,color:#fff6e0,stroke-width:1px',
  ];

  const referenced = new Set<string>();
  const styled = new Set<string>();
  referenced.add(graph.rootNodeId);

  for (const [nid, node] of Object.entries(graph.nodes)) {
    const isRoot = nid === graph.rootNodeId;
    const isTermVictory = node.terminal === 'victory';
    const isTermDefeat = node.terminal === 'defeat';
    const labelHtml = buildNodeLabelHtml(nid, node);
    lines.push(`  ${nid}["${labelHtml}"]`);
    if (isRoot) {
      lines.push(`  class ${nid} root`);
      styled.add(nid);
    }
    if (isTermVictory) {
      lines.push(`  class ${nid} terminal`);
      styled.add(nid);
    }
    if (isTermDefeat) {
      lines.push(`  class ${nid} terminalDefeat`);
      styled.add(nid);
    }

    if (!node.choices) continue;
    for (const ch of node.choices) {
      const { ok, fail } = targetsFromChoice(ch);
      referenced.add(ok);
      if (fail) referenced.add(fail);
      const labels = choiceEdgeLabels(ch);
      lines.push(`  ${nid} -->|"${labels.ok}"| ${ok}`);
      if (fail && labels.fail) {
        lines.push(`  ${nid} -.->|"${labels.fail}"| ${fail}`);
      }
    }
  }

  for (const nid of Object.keys(graph.nodes)) {
    if (!referenced.has(nid) && nid !== graph.rootNodeId) {
      lines.push(`  class ${nid} orphan`);
      styled.add(nid);
    }
  }

  for (const nid of Object.keys(graph.nodes)) {
    if (!styled.has(nid)) lines.push(`  class ${nid} mid`);
  }

  return lines.join('\n');
}

export function findOrphanNodeIds(graph: DialogueGraph): string[] {
  const referenced = new Set<string>();
  referenced.add(graph.rootNodeId);
  for (const node of Object.values(graph.nodes)) {
    if (!node.choices) continue;
    for (const ch of node.choices) {
      const t = targetsFromChoice(ch);
      referenced.add(t.ok);
      if (t.fail) referenced.add(t.fail);
    }
  }
  return Object.keys(graph.nodes).filter((id) => !referenced.has(id));
}

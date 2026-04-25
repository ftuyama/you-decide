import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { journeyMarks } from '../../src/campaigns/calvario/data/journeyMarks.ts';
import { markBadgeIconSvg } from '../../src/ui/gameAppUtils.ts';
import { icons } from '../../src/ui/icons/index.ts';

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

const ADD_MARK_RE = /op:\s*addMark,\s*mark:\s*([a-z0-9_]+)/g;

function extractAddMarkIdsFromScenes(): Set<string> {
  const ids = new Set<string>();
  for (const file of listMdFiles(scenesDir)) {
    const text = readFileSync(file, 'utf8');
    let m: RegExpExecArray | null;
    const re = new RegExp(ADD_MARK_RE.source, 'g');
    while ((m = re.exec(text)) !== null) {
      ids.add(m[1]!);
    }
  }
  return ids;
}

describe('journeyMarks coverage (calvario)', () => {
  it('cada addMark nas cenas tem entrada em journeyMarks', () => {
    const used = extractAddMarkIdsFromScenes();
    for (const id of used) {
      expect(journeyMarks[id], `falta journeyMarks para marca usada nas cenas: ${id}`).toBeDefined();
      expect(journeyMarks[id]!.name.length).toBeGreaterThan(0);
      expect(journeyMarks[id]!.description.length).toBeGreaterThan(0);
    }
  });

  it('cada chave em journeyMarks aparece em addMark nalguma cena', () => {
    const used = extractAddMarkIdsFromScenes();
    for (const key of Object.keys(journeyMarks)) {
      expect(
        used.has(key),
        `chave órfã em journeyMarks (sem addMark nas cenas): ${key}`
      ).toBe(true);
    }
  });

  it('cada marca concedida nas cenas tem ícone de badge no diário (não só tier)', () => {
    const used = extractAddMarkIdsFromScenes();
    for (const id of used) {
      expect(markBadgeIconSvg(id)).not.toEqual(icons.tier);
    }
  });
});

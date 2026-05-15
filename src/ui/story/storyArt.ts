import type { SceneFrontmatter } from '../../engine/schema/index.ts';
import type { ContentRegistry } from '../../content/registry.ts';
import type { LoadedScene } from '../../engine/core/index.ts';

/**
 * Chave em `GameState.sceneArtHighlightShown`: uma vez por `artKey` quando definido no frontmatter;
 * caso contrário mantém-se o comportamento antigo por `scene.id` (arte só inline / sem chave).
 */
export function sceneArtHighlightDedupeKey(
  scene: Pick<LoadedScene, 'id' | 'frontmatter'>
): string {
  const k = scene.frontmatter.artKey?.trim();
  if (k) return `art:${k}`;
  return scene.id;
}

type SceneWithHighlightFm = {
  frontmatter: Pick<SceneFrontmatter, 'highlight' | 'artHighlightFrames' | 'highlightHoldMs'>;
};

/** Primeira chave em `artHighlightFrames` → prefixo antes de `_hlN` (ex.: `dungeon_mouth_hl0` → `dungeon_mouth`). */
function asciiHighlightBaseKeyFromFrames(fm: Pick<SceneFrontmatter, 'artHighlightFrames'>): string | undefined {
  const raw = fm.artHighlightFrames;
  if (!raw || raw.length === 0) return undefined;
  for (const k of raw) {
    const t = typeof k === 'string' ? k.trim() : '';
    if (!t) continue;
    return t.replace(/_hl\d+$/u, '');
  }
  return undefined;
}

/** Arte de cena: YAML `art` inline ou `artKey` na tabela `sceneArt` da campanha. */
export function resolveSceneArtFromFrontmatter(
  fm: Pick<SceneFrontmatter, 'art' | 'artKey'>,
  sceneArt: Record<string, string>
): string | undefined {
  const inline = fm.art?.trim();
  if (inline) return inline;
  const key = fm.artKey;
  if (key && sceneArt[key]) return sceneArt[key];
  return undefined;
}

/**
 * Quadros do overlay `highlight`: só quando há 2+ chaves resolvidas em `sceneArt`.
 * Caso contrário devolve `undefined` e o UI usa `resolveSceneArtFromFrontmatter` só.
 */
export function resolveSceneArtHighlightFrames(
  fm: Pick<SceneFrontmatter, 'art' | 'artKey' | 'artHighlightFrames'>,
  sceneArt: Record<string, string>
): string[] | undefined {
  const raw = fm.artHighlightFrames;
  if (!raw || raw.length === 0) return undefined;
  const frames: string[] = [];
  for (const k of raw) {
    const key = typeof k === 'string' ? k.trim() : '';
    if (!key) continue;
    const art = sceneArt[key];
    if (art) frames.push(art);
  }
  if (frames.length < 2) return undefined;
  return frames;
}

/**
 * Chaves em `sceneArt` listadas em `artHighlightFrames` de cenas com `highlight: true` onde o overlay
 * realmente anima (2+ quadros resolvidos). Útil para filtros em dev tools.
 */
export function collectArtKeysFromAnimatedHighlightScenes(
  scenes: Iterable<SceneWithHighlightFm>,
  sceneArt: Record<string, string>
): Set<string> {
  const out = new Set<string>();
  for (const scene of scenes) {
    const fm = scene.frontmatter;
    if (fm.highlight !== true) continue;
    if (!resolveSceneArtHighlightFrames(fm, sceneArt)) continue;
    for (const k of fm.artHighlightFrames ?? []) {
      const t = typeof k === 'string' ? k.trim() : '';
      if (t) out.add(t);
    }
  }
  return out;
}

/**
 * Para cada base `artKey` implícita nos quadros `_hlN` (primeira entrada de `artHighlightFrames`),
 * o maior `highlightHoldMs` entre cenas com overlay animado (mesmo asset partilhado → prevê o mais longo).
 * `defaultHoldMs` alinha com o runtime quando `highlightHoldMs` está omitido no frontmatter.
 */
export function collectHighlightHoldMsByAnimatedHighlightBase(
  scenes: Iterable<SceneWithHighlightFm>,
  sceneArt: Record<string, string>,
  defaultHoldMs: number
): Map<string, number> {
  const out = new Map<string, number>();
  for (const scene of scenes) {
    const fm = scene.frontmatter;
    if (fm.highlight !== true) continue;
    if (!resolveSceneArtHighlightFrames(fm, sceneArt)) continue;
    const base = asciiHighlightBaseKeyFromFrames(fm);
    if (!base) continue;
    const hold = fm.highlightHoldMs ?? defaultHoldMs;
    out.set(base, Math.max(out.get(base) ?? 0, hold));
  }
  return out;
}

export function resolveSceneArt(registry: ContentRegistry, scene: LoadedScene): string | undefined {
  return resolveSceneArtFromFrontmatter(scene.frontmatter, registry.ui.sceneArt);
}

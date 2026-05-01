import type { SceneFrontmatter } from '../../engine/schema/index.ts';
import type { ContentRegistry } from '../../content/registry.ts';
import type { LoadedScene } from '../../engine/core/sceneRuntime.ts';

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

export function resolveSceneArt(registry: ContentRegistry, scene: LoadedScene): string | undefined {
  return resolveSceneArtFromFrontmatter(scene.frontmatter, registry.ui.sceneArt);
}

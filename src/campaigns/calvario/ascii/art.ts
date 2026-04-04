const sceneArtRaw = import.meta.glob<string>('./scenes/files/**/*.txt', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function buildSceneArt(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [path, content] of Object.entries(sceneArtRaw)) {
    const base = path.split('/').pop()!;
    const key = base.replace(/\.txt$/u, '');
    if (out[key]) {
      throw new Error(`Duplicate scene art key: ${key}`);
    }
    out[key] = content;
  }
  return out;
}

/** Arte ASCII reutilizável — paisagens e cenas (artKey no frontmatter). */
export const SCENE_ART: Record<string, string> = buildSceneArt();

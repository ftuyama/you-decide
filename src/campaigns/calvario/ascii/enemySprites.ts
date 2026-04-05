const enemySpriteRaw = import.meta.glob<string>('./sprites/enemies/**/*.txt', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function buildEnemySprites(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [path, content] of Object.entries(enemySpriteRaw)) {
    const base = path.split('/').pop()!;
    const key = base.replace(/\.txt$/u, '');
    if (out[key]) {
      throw new Error(`Duplicate enemy sprite key: ${key}`);
    }
    out[key] = content;
  }
  return out;
}

/** Sprites ASCII de inimigos — um `.txt` por ficheiro (nome = chave). */
export const ENEMY_SPRITES: Record<string, string> = buildEnemySprites();

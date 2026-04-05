const itemSpriteRaw = import.meta.glob<string>('./sprites/items/**/*.txt', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function buildItemSprites(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [path, content] of Object.entries(itemSpriteRaw)) {
    const base = path.split('/').pop()!;
    const key = base.replace(/\.txt$/u, '');
    if (out[key]) {
      throw new Error(`Duplicate item sprite key: ${key}`);
    }
    out[key] = content;
  }
  return out;
}

/** Sprites ASCII de itens — um `.txt` por ficheiro (nome = chave). */
export const ITEM_SPRITES: Record<string, string> = buildItemSprites();

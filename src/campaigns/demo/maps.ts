/** Minimal ASCII map for the demo stub (same shape as Calvário). */
export const MAPS: Record<string, string[]> = {
  demo5: ['#####', '#...#', '#.#.#', '#..!#', '#####'],
};

export function renderMap(
  mapId: string
): { lines: string[]; width: number; height: number } | null {
  const rows = MAPS[mapId];
  if (!rows) return null;
  const h = rows.length;
  const w = rows[0]?.length ?? 0;
  return { lines: [...rows], width: w, height: h };
}

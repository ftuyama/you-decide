/** Mapas ASCII: # parede, . chão, ! evento */
export const MAPS: Record<string, string[]> = {
  demo5: ['#####', '#...#', '#.#.#', '#..!#', '#####'],
  /** Profundezas 6×6 — mais exploração que o demo 5×5 */
  depths6: [
    '######',
    '#....#',
    '#.##.#',
    '#..!.#',
    '#....#',
    '######',
  ],
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

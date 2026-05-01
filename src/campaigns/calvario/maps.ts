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
  /** Cruzeiro / perímetro — alinhado a `mapCell` em `exploration/graphs.ts` (act2_catacomb). */
  act2_catacomb: [
    '#################',
    '#.......#.......#',
    '#...!...#...!...#',
    '#.###.#####.###.#',
    '#...#...#...#...#',
    '###.#...#...#.###',
    '#...#...!...#...#',
    '#.###.#####.###.#',
    '#...!...#...!...#',
    '#.......#.......#',
    '#################',
  ],
};

export function renderMap(
  mapId: string,
  markerCell?: { x: number; y: number },
  goalCell?: { x: number; y: number }
): { lines: string[]; width: number; height: number } | null {
  const rows = MAPS[mapId];
  if (!rows) return null;
  const h = rows.length;
  const w = rows[0]?.length ?? 0;
  const lines = rows.map((row) => row.split(''));
  if (
    goalCell &&
    goalCell.y >= 0 &&
    goalCell.y < h &&
    goalCell.x >= 0 &&
    goalCell.x < w
  ) {
    const row = lines[goalCell.y];
    if (row) {
      const ch = row[goalCell.x];
      if (ch !== undefined && ch !== '#') {
        row[goalCell.x] = 'X';
      }
    }
  }
  if (
    markerCell &&
    markerCell.y >= 0 &&
    markerCell.y < h &&
    markerCell.x >= 0 &&
    markerCell.x < w
  ) {
    const row = lines[markerCell.y];
    if (row) {
      const ch = row[markerCell.x];
      if (ch !== undefined && ch !== '#') {
        row[markerCell.x] = '@';
      }
    }
  }
  return { lines: lines.map((r) => r.join('')), width: w, height: h };
}

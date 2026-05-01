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
  /** Cruzeiro / perímetro — alinhado a `mapCell` em `exploration/act2.ts` (act2_catacomb). */
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
  /** Profundezas (act3) — alinhado a `exploration/act3.ts` (act3_depths). */
  act3_depths: [
    '##############',
    '#......#.....#',
    '#..!..#..!...#',
    '#.###.#.###..#',
    '#...#...#....#',
    '#...!...#..!.#',
    '#.#####.###..#',
    '#........#...#',
    '##############',
  ],
  /** Desfiladeiro de gelo (act5) — alinhado a `exploration/act5.ts` (act5_frost). */
  act5_frost: [
    '################',
    '#......#....!..#',
    '#.####.#.###...#',
    '#...#..#...#...#',
    '#...#..###.#...#',
    '#.!.#......#...#',
    '#...######.#...#',
    '#...#....!.#...#',
    '#...#..#####...#',
    '#..............#',
    '################',
  ],
  /** Nave fraturada (act6) — alinhado a `exploration/act6.ts` (act6_fractured_nave). */
  act6_fractured_nave: [
    '#################',
    '#.....#......!..#',
    '#.###.#.#####...#',
    '#...#.#.....#...#',
    '#...#.#..!..#...#',
    '#.!.#.#.###.#...#',
    '#...#...#...#...#',
    '#...#####...#...#',
    '#...........#...#',
    '#.#######.###...#',
    '#...!...#.......#',
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

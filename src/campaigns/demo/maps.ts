/** Minimal ASCII map for the demo stub (same shape as a campanha completa). */
export const MAPS: Record<string, string[]> = {
  demo5: ['#####', '#...#', '#.#.#', '#..!#', '#####'],
};

export function renderMap(
  mapId: string,
  markerCell?: { x: number; y: number }
): { lines: string[]; width: number; height: number } | null {
  const rows = MAPS[mapId];
  if (!rows) return null;
  const h = rows.length;
  const w = rows[0]?.length ?? 0;
  const lines = rows.map((row) => row.split(''));
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

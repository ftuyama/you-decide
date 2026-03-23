/** Minimal ASCII map for the demo stub (same shape as Calvário). */
export const MAPS: Record<string, string[]> = {
  demo5: ['#####', '#...#', '#.#.#', '#..!#', '#####'],
};

export function renderMap(
  mapId: string,
  px: number,
  py: number
): { lines: string[]; width: number; height: number } | null {
  const rows = MAPS[mapId];
  if (!rows) return null;
  const h = rows.length;
  const w = rows[0]?.length ?? 0;
  const lines = rows.map((row, y) =>
    row
      .split('')
      .map((ch, x) => (x === px && y === py ? '@' : ch))
      .join('')
  );
  return { lines, width: w, height: h };
}

export function canWalk(
  mapId: string,
  _x: number,
  _y: number,
  nx: number,
  ny: number
): boolean {
  void _x;
  void _y;
  const rows = MAPS[mapId];
  if (!rows) return false;
  const row = rows[ny];
  if (!row || nx < 0 || nx >= row.length) return false;
  const ch = row[nx];
  return ch === '.' || ch === '!';
}

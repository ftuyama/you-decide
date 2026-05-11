/**
 * Rasteriza texto Braille (U+2800–U+28FF) para uma grelha binária 2×4 px por célula,
 * **no mesmo mapeamento de pontos** que `src/dev/brailleAsciiFromImage.ts` usa ao codificar.
 *
 * @typedef {{ width: number, height: number, data: Uint8Array }} BitmapGrey
 *   `data[y * width + x]` em {0,255} — 255 = “tinta” (ponto levantado após inversão visual típica).
 */

/** Ordem dos bits 0–7 → (dr, dc) dentro da célula 4×2 (dr linha 0..3, dc coluna 0..1). */
export const BRAILLE_DOT_TO_CELL = [
  [0, 0],
  [1, 0],
  [2, 0],
  [0, 1],
  [1, 1],
  [2, 1],
  [3, 0],
  [3, 1],
];

const BRAILLE_MIN = 0x2800;
const BRAILLE_MAX = 0x28ff;

/**
 * @param {string} raw utf-8
 * @returns {BitmapGrey}
 */
export function brailleTextToBitmapGrey(raw) {
  const rawLines = raw.split(/\r?\n/);
  const L = Math.max(1, rawLines.length);
  const C = Math.max(1, ...rawLines.map((ln) => [...ln].length));
  const dotW = C * 2;
  const dotH = L * 4;
  const data = new Uint8Array(dotW * dotH);

  for (let br = 0; br < L; br++) {
    const chars = [...(rawLines[br] ?? '')];
    for (let bc = 0; bc < C; bc++) {
      const ch = chars[bc] ?? '\u2800';
      const code = ch.codePointAt(0);
      if (code < BRAILLE_MIN || code > BRAILLE_MAX) continue;
      const bits = code - BRAILLE_MIN;
      for (let b = 0; b < 8; b++) {
        if (bits & (1 << b)) {
          const [dr, dc] = BRAILLE_DOT_TO_CELL[b];
          const y = br * 4 + dr;
          const x = bc * 2 + dc;
          data[y * dotW + x] = 255;
        }
      }
    }
  }

  return { width: dotW, height: dotH, data };
}

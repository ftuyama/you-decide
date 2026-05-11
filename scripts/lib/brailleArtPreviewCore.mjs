/**
 * Núcleo partilhado: Braille .txt → PNG (raster alinhado ao motor).
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { brailleTextToBitmapGrey } from './brailleRaster.mjs';

/**
 * @param {Uint8Array} src
 * @param {number} w
 * @param {number} h
 * @param {number} scale
 * @param {boolean} grid
 */
function upscaleWithOptionalGrid(src, w, h, scale, grid) {
  const ow = w * scale;
  const oh = h * scale;
  const rgba = new Uint8Array(ow * oh * 4);
  for (let y = 0; y < oh; y++) {
    for (let x = 0; x < ow; x++) {
      const sx = Math.min(w - 1, Math.floor(x / scale));
      const sy = Math.min(h - 1, Math.floor(y / scale));
      const on = src[sy * w + sx] > 128;
      let r = on ? 235 : 12;
      let g = on ? 235 : 12;
      let b = on ? 235 : 12;

      if (grid) {
        const brCol = Math.floor(sx / 2);
        const brRow = Math.floor(sy / 4);
        const onV = brCol % 10 === 0 && sx % 2 === 0;
        const onH = brRow % 5 === 0 && sy % 4 === 0;
        if (onV && onH) {
          r = on ? 255 : 0;
          g = on ? 200 : 160;
          b = on ? 0 : 0;
        } else if (onV) {
          r = on ? 200 : 0;
          g = on ? 255 : 120;
          b = on ? 200 : 0;
        } else if (onH) {
          r = on ? 255 : 180;
          g = on ? 180 : 0;
          b = on ? 180 : 0;
        }
      }

      const o = (y * ow + x) * 4;
      rgba[o] = r;
      rgba[o + 1] = g;
      rgba[o + 2] = b;
      rgba[o + 3] = 255;
    }
  }
  return { data: rgba, width: ow, height: oh };
}

/**
 * @param {string} raw utf-8 do .txt
 * @param {string} absOut caminho absoluto do .png
 * @param {{ scale?: number, grid?: boolean }} opts
 */
export async function renderBrailleTextToPng(raw, absOut, opts = {}) {
  const scale = Math.max(1, Math.min(8, opts.scale ?? 2));
  const grid = opts.grid ?? false;
  const { width: w, height: h, data } = brailleTextToBitmapGrey(raw);
  const { data: rgba, width: ow, height: oh } = upscaleWithOptionalGrid(data, w, h, scale, grid);
  await fs.promises.mkdir(path.dirname(absOut), { recursive: true });
  await sharp(rgba, { raw: { width: ow, height: oh, channels: 4 } }).png().toFile(absOut);
}

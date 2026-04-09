import { describe, expect, it } from 'vitest';
import {
  brailleAsciiFromDitheredImage,
  ditherGreyscaleImageData,
} from '../src/dev/brailleAsciiFromImage.ts';

/** Minimal stub so `ditherGreyscaleImageData` tests run in Vitest's Node environment. */
if (typeof globalThis.ImageData === 'undefined') {
  globalThis.ImageData = class ImageDataPoly {
    readonly data: Uint8ClampedArray;
    readonly width: number;
    readonly height: number;
    constructor(sw: number, sh: number);
    constructor(data: Uint8ClampedArray, sw: number, sh?: number);
    constructor(swOrData: number | Uint8ClampedArray, sh?: number, maybeH?: number) {
      if (typeof swOrData === 'number' && typeof sh === 'number') {
        this.width = swOrData;
        this.height = sh;
        this.data = new Uint8ClampedArray(swOrData * sh * 4);
      } else if (swOrData instanceof Uint8ClampedArray && typeof sh === 'number') {
        this.data = new Uint8ClampedArray(swOrData);
        this.width = sh;
        this.height = maybeH ?? swOrData.length / (4 * sh);
      } else {
        throw new TypeError('ImageData polyfill');
      }
    }
  } as unknown as typeof ImageData;
}

function makeGrey(width: number, height: number, grey: number): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const o = i * 4;
    data[o] = grey;
    data[o + 1] = grey;
    data[o + 2] = grey;
    data[o + 3] = 255;
  }
  return new ImageData(data, width, height);
}

describe('brailleAsciiFromDitheredImage', () => {
  it('maps an all-black 2×4 block to the full Braille cell (U+28FF)', () => {
    const d = new Uint8ClampedArray(2 * 4 * 4).fill(0);
    const out = brailleAsciiFromDitheredImage({ data: d, width: 2, height: 4 }, false);
    expect(out).toBe('\u28ff');
  });

  it('maps an all-white 2×4 block to blank Braille (U+2800)', () => {
    const d = new Uint8ClampedArray(2 * 4 * 4).fill(255);
    const out = brailleAsciiFromDitheredImage({ data: d, width: 2, height: 4 }, false);
    expect(out).toBe('\u2800');
  });

  it('inverts dot selection when invert is true', () => {
    const black = new Uint8ClampedArray(2 * 4 * 4).fill(0);
    expect(brailleAsciiFromDitheredImage({ data: black, width: 2, height: 4 }, true)).toBe('\u2800');

    const white = new Uint8ClampedArray(2 * 4 * 4).fill(255);
    expect(brailleAsciiFromDitheredImage({ data: white, width: 2, height: 4 }, true)).toBe('\u28ff');
  });
});

describe('ditherGreyscaleImageData', () => {
  it('threshold dither produces binary output for flat grey', () => {
    const grey = makeGrey(4, 4, 200);
    const out = ditherGreyscaleImageData(grey, 127, 'threshold');
    expect(out.data.length).toBe(grey.data.length);
    const first = out.data[0]!;
    expect(first === 0 || first === 255).toBe(true);
  });
});

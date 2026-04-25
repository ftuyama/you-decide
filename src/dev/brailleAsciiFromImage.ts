/**
 * Braille image → text conversion, adapted from Braille-ASCII-Art (MIT).
 *
 * Copyright (c) 2018 Lachlan Arthur
 * Copyright (c) Silent Dungeon contributors — TypeScript port and integration
 *
 * SPDX-License-Identifier: MIT
 * @see https://github.com/LachlanArthur/Braille-ASCII-Art
 */

const ASCII_X_DOTS = 2;
const ASCII_Y_DOTS = 4;

/** Braille Unicode range starts at U+2800; dot bits per Unicode Braille Patterns. */
const BRAILLE_BASE = 0x2800;

export type BrailleDithererName = 'threshold' | 'floydSteinberg' | 'stucki' | 'atkinson';

export type BrailleAsciiOptions = {
  /** Character columns (Braille cells per row). */
  asciiWidth: number;
  ditherer: BrailleDithererName;
  /** Binarization pivot (0–255). */
  threshold: number;
  /** Swap black/white for Braille dot selection. */
  invert: boolean;
};

function rgbaOffset(x: number, y: number, width: number): number {
  return width * 4 * y + 4 * x;
}

export interface Ditherer {
  dither(input: ImageData, threshold: number): ImageData;
}

export class KernelDitherer implements Ditherer {
  readonly origin: [number, number];
  readonly numerators: number[][];
  readonly denominator: number;

  constructor(origin: [number, number], numerators: number[][], denominator: number = 1) {
    this.origin = origin;
    this.numerators = numerators;
    this.denominator = denominator;
  }

  weights(): [number, number, number][] {
    const weights: [number, number, number][] = [];
    const [originX, originY] = this.origin;
    for (let y = 0; y < this.numerators.length; y++) {
      for (let x = 0; x < this.numerators[y].length; x++) {
        weights.push([x - originX, y - originY, this.numerators[y][x] / this.denominator]);
      }
    }
    return weights;
  }

  dither(input: ImageData, threshold: number): ImageData {
    const output = new ImageData(input.width, input.height);
    const weights = this.weights();

    for (let y = 0; y < input.height; y++) {
      for (let x = 0; x < input.width; x++) {
        const offset = rgbaOffset(x, y, input.width);
        const greyPixel = input.data[offset]!;
        const value = greyPixel > threshold ? 255 : 0;
        output.data.set([value, value, value, 255], offset);

        const error = greyPixel - value;
        for (const [weightX, weightY, weight] of weights) {
          if (weight === 0) continue;
          const o = rgbaOffset(x + weightX, y + weightY, input.width);
          const v = input.data[o];
          if (typeof v === 'number' && o >= 0) {
            input.data[o] = Math.max(0, Math.min(255, v + error * weight));
          }
        }
      }
    }

    return output;
  }
}

const ditherers: Record<BrailleDithererName, KernelDitherer> = {
  threshold: new KernelDitherer([0, 0], [], 1),
  floydSteinberg: new KernelDitherer(
    [1, 0],
    [
      [0, 0, 7],
      [3, 5, 1],
    ],
    16,
  ),
  stucki: new KernelDitherer(
    [2, 0],
    [
      [0, 0, 0, 8, 4],
      [2, 4, 8, 4, 2],
      [1, 2, 4, 2, 1],
    ],
    42,
  ),
  atkinson: new KernelDitherer(
    [1, 0],
    [
      [0, 0, 1, 1],
      [1, 1, 1, 0],
      [0, 1, 0, 0],
    ],
    8,
  ),
};

/** Greyscale + dither pipeline; mutates a copy of the input pixels. */
export function ditherGreyscaleImageData(grey: ImageData, threshold: number, name: BrailleDithererName): ImageData {
  const copy = new ImageData(new Uint8ClampedArray(grey.data), grey.width, grey.height);
  return ditherers[name].dither(copy, threshold);
}

export interface ImageDataLike {
  readonly data: Uint8ClampedArray;
  readonly width: number;
  readonly height: number;
}

/**
 * Pack dithered greyscale (0/255 in R channel) into Braille lines.
 * Canvas size should be an integer multiple of 2×4 pixels per cell.
 */
export function brailleAsciiFromDitheredImage(dithered: ImageDataLike, invert: boolean): string {
  const canvasWidth = dithered.width;
  const canvasHeight = dithered.height;
  const targetValue = invert ? 255 : 0;
  const lines: string[] = [];

  for (let y = 0; y < canvasHeight; y += ASCII_Y_DOTS) {
    const line: number[] = [];
    for (let x = 0; x < canvasWidth; x += ASCII_X_DOTS) {
      const d = dithered.data;
      const w = canvasWidth;
      line.push(
        BRAILLE_BASE +
          (+(d[rgbaOffset(x + 1, y + 3, w)]! === targetValue) << 7) +
          (+(d[rgbaOffset(x + 0, y + 3, w)]! === targetValue) << 6) +
          (+(d[rgbaOffset(x + 1, y + 2, w)]! === targetValue) << 5) +
          (+(d[rgbaOffset(x + 1, y + 1, w)]! === targetValue) << 4) +
          (+(d[rgbaOffset(x + 1, y + 0, w)]! === targetValue) << 3) +
          (+(d[rgbaOffset(x + 0, y + 2, w)]! === targetValue) << 2) +
          (+(d[rgbaOffset(x + 0, y + 1, w)]! === targetValue) << 1) +
          (+(d[rgbaOffset(x + 0, y + 0, w)]! === targetValue) << 0),
      );
    }
    lines.push(String.fromCharCode(...line));
  }

  return lines.join('\n');
}

/**
 * Draw `source` to an internal canvas as greyscale (luminosity), dither, emit Braille text.
 */
export function brailleAsciiFromImageSource(
  source: CanvasImageSource,
  options: BrailleAsciiOptions,
): string {
  const { asciiWidth, ditherer, threshold, invert } = options;
  if (asciiWidth < 1) return '';

  const dim = getCanvasSourceDimensions(source);
  if (!dim || dim.w < 1 || dim.h < 1) return '';
  const imgW = dim.w;
  const imgH = dim.h;

  const asciiHeight = Math.ceil((asciiWidth * ASCII_X_DOTS * (imgH / imgW)) / ASCII_Y_DOTS);
  const canvasW = asciiWidth * ASCII_X_DOTS;
  const canvasH = asciiHeight * ASCII_Y_DOTS;

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvasW, canvasH);
  ctx.globalCompositeOperation = 'luminosity';
  ctx.drawImage(source, 0, 0, canvasW, canvasH);

  const greyPixels = ctx.getImageData(0, 0, canvasW, canvasH);
  const dithered = ditherGreyscaleImageData(greyPixels, threshold, ditherer);
  return brailleAsciiFromDitheredImage(dithered, invert);
}

function getCanvasSourceDimensions(source: CanvasImageSource): { w: number; h: number } | null {
  if (source instanceof HTMLImageElement) {
    return { w: source.naturalWidth, h: source.naturalHeight };
  }
  if (source instanceof HTMLVideoElement) {
    return { w: source.videoWidth, h: source.videoHeight };
  }
  if (source instanceof ImageBitmap) {
    return { w: source.width, h: source.height };
  }
  if (source instanceof HTMLCanvasElement || source instanceof OffscreenCanvas) {
    return { w: source.width, h: source.height };
  }
  return null;
}

/**
 * CLI: imagem → Braille Unicode (mesmo pipeline que `src/dev/brailleAsciiFromImage.ts`).
 * Uso: npx tsx scripts/braille-from-image.ts <ficheiro> [-w 160] [-o out.txt] [--no-invert] [--threshold 127] [--dither atkinson]
 * Defaults alinhados a `devToolsBrailleAscii.ts` (Conversão).
 */
import { readFileSync, writeFileSync } from 'fs';
import sharp from 'sharp';
import {
  brailleAsciiFromDitheredImage,
  ditherGreyscaleImageData,
  type BrailleDithererName,
} from '../src/dev/brailleAsciiFromImage.ts';

const ASCII_X_DOTS = 2;
const ASCII_Y_DOTS = 4;

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

function parseArgs(argv: string[]): {
  input: string;
  asciiWidth: number;
  out: string | null;
  invert: boolean;
  threshold: number;
  dither: BrailleDithererName;
} {
  const rest = [...argv];
  const inputRaw = rest.shift();
  if (!inputRaw) {
    console.error(
      'Uso: npx tsx scripts/braille-from-image.ts <imagem> [-w 160] [-o ficheiro.txt] [--no-invert] [--threshold 127] [--dither atkinson]',
    );
    process.exit(1);
  }
  const input = inputRaw;
  let asciiWidth = 160;
  let out: string | null = null;
  let invert = true;
  let threshold = 127;
  let dither: BrailleDithererName = 'atkinson';
  while (rest.length) {
    const a = rest.shift()!;
    if (a === '-w' && rest[0]) asciiWidth = Math.max(1, parseInt(rest.shift()!, 10) || 160);
    else if (a === '-o' && rest[0]) {
      const pathOut = rest.shift();
      if (pathOut !== undefined) out = pathOut;
    }
    else if (a === '--invert') invert = true;
    else if (a === '--no-invert') invert = false;
    else if (a === '--threshold' && rest[0]) threshold = Math.max(0, Math.min(255, parseInt(rest.shift()!, 10) || 127));
    else if (a === '--dither' && rest[0]) {
      const n = rest.shift()!;
      if (n === 'threshold' || n === 'floydSteinberg' || n === 'stucki' || n === 'atkinson') dither = n;
    }
  }
  return { input, asciiWidth, out, invert, threshold, dither };
}

async function main(): Promise<void> {
  const { input, asciiWidth, out, invert, threshold, dither } = parseArgs(process.argv.slice(2));
  const buf = readFileSync(input);
  const meta = await sharp(buf).metadata();
  const imgW = meta.width ?? 1;
  const imgH = meta.height ?? 1;
  const asciiHeight = Math.ceil((asciiWidth * ASCII_X_DOTS * (imgH / imgW)) / ASCII_Y_DOTS);
  const canvasW = asciiWidth * ASCII_X_DOTS;
  const canvasH = asciiHeight * ASCII_Y_DOTS;

  const { data, info } = await sharp(buf)
    .resize(canvasW, canvasH, { fit: 'fill' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const rgba = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const g = data[i]!;
    const o = i * 4;
    rgba[o] = g;
    rgba[o + 1] = g;
    rgba[o + 2] = g;
    rgba[o + 3] = 255;
  }

  const greyPixels = new ImageData(rgba, w, h);
  const dithered = ditherGreyscaleImageData(greyPixels, threshold, dither);
  const text = brailleAsciiFromDitheredImage(dithered, invert);
  if (out) writeFileSync(out, text, 'utf8');
  else process.stdout.write(text + '\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

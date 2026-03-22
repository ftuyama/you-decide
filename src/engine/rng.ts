/** RNG simples com seed (mulberry32) para reprodutibilidade opcional */
export function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rollD6(rng: () => number): number {
  return Math.floor(rng() * 6) + 1;
}

export function roll2d6(rng: () => number): [number, number] {
  return [rollD6(rng), rollD6(rng)];
}

export function roll3d6DropLowest(rng: () => number): { dice: [number, number, number]; sum: number } {
  const a = rollD6(rng);
  const b = rollD6(rng);
  const c = rollD6(rng);
  const sorted = [a, b, c].sort((x, y) => x - y);
  const sum = sorted[1] + sorted[2];
  return { dice: [a, b, c], sum };
}

export function roll3d6DropHighest(rng: () => number): { dice: [number, number, number]; sum: number } {
  const a = rollD6(rng);
  const b = rollD6(rng);
  const c = rollD6(rng);
  const sorted = [a, b, c].sort((x, y) => x - y);
  const sum = sorted[0] + sorted[1];
  return { dice: [a, b, c], sum };
}

export function parseSeedFromSearch(): number | null {
  if (typeof window === 'undefined') return null;
  const p = new URLSearchParams(window.location.search);
  const s = p.get('seed');
  if (s === null) return null;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

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

/** 2d6 de ataque: 6+6 crítico, 1+1 falha crítica */
export type AttackRollSpecial = 'crit' | 'fumble' | 'normal';

export function attackRollSpecial2d6(d1: number, d2: number): AttackRollSpecial {
  if (d1 === 6 && d2 === 6) return 'crit';
  if (d1 === 1 && d2 === 1) return 'fumble';
  return 'normal';
}

/** 3d6 descarta o menor: dois maiores 6+6 crítico, 1+1 falha crítica */
export function attackRollSpecial3d6dl(dice: [number, number, number]): AttackRollSpecial {
  const sorted = [...dice].sort((a, b) => a - b);
  if (sorted[1] === 6 && sorted[2] === 6) return 'crit';
  if (sorted[1] === 1 && sorted[2] === 1) return 'fumble';
  return 'normal';
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

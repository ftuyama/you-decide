import { describe, expect, it } from 'vitest';
import {
  attackRollSpecial2d6,
  attackRollSpecial3d6dl,
  mulberry32,
  nextRngSeed,
  roll2d6,
  rollD6,
} from '../../src/engine/rng.ts';

describe('mulberry32', () => {
  it('is deterministic for a fixed seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seq = (rng: () => number) => [rng(), rng(), rng(), rng(), rng()];
    expect(seq(a)).toEqual(seq(b));
  });

  it('differs when seed differs', () => {
    const a = mulberry32(1)();
    const b = mulberry32(2)();
    expect(a).not.toBe(b);
  });
});

describe('dice helpers', () => {
  it('rollD6 stays in 1..6', () => {
    const rng = mulberry32(99);
    for (let i = 0; i < 200; i++) {
      const v = rollD6(rng);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
    }
  });

  it('roll2d6 returns two dice', () => {
    const [d1, d2] = roll2d6(mulberry32(7));
    expect(d1).toBeGreaterThanOrEqual(1);
    expect(d2).toBeGreaterThanOrEqual(1);
  });

  it('nextRngSeed advances deterministically via PRNG stream', () => {
    const a = mulberry32(123);
    const b = mulberry32(123);
    expect(nextRngSeed(a)).toBe(nextRngSeed(b));
  });
});

describe('attackRollSpecial2d6', () => {
  it('detects crit and fumble', () => {
    expect(attackRollSpecial2d6(6, 6)).toBe('crit');
    expect(attackRollSpecial2d6(1, 1)).toBe('fumble');
    expect(attackRollSpecial2d6(3, 4)).toBe('normal');
  });
});

describe('attackRollSpecial3d6dl', () => {
  it('uses two highest dice for special', () => {
    expect(attackRollSpecial3d6dl([1, 6, 6])).toBe('crit');
    expect(attackRollSpecial3d6dl([1, 1, 1])).toBe('fumble');
    expect(attackRollSpecial3d6dl([2, 3, 4])).toBe('normal');
  });
});

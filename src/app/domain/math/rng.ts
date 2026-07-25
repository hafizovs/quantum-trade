export interface RandomSource {
  next(): number;
}

/** Mulberry32 seeded PRNG — Uniform(0, 1). */
export function createMulberry32(seed: number): RandomSource {
  let state = seed >>> 0;
  return {
    next(): number {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

export function uniform(rng: RandomSource, min: number, max: number): number {
  return min + (max - min) * rng.next();
}

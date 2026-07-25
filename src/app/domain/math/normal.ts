/**
 * Box-Muller transform: sample Z ~ N(0,1) from Uniform(0,1) source.
 */
export function sampleNormal(next: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) {
    u = next();
  }
  while (v === 0) {
    v = next();
  }
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

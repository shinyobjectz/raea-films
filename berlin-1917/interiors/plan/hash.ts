// The interiors' seeded hash (FNV-1a over thousandths, then a murmur finish), pure so that bun's checks and the kit
// draw the same numbers: interiors/kit/geo.ts re-exports it.
export function hash(...n: number[]): number {
  let h = 2166136261;
  for (const v of n) { h ^= Math.floor(v * 1000) | 0; h = Math.imul(h, 16777619); }
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

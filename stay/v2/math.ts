// The numbers a shot is made of (no engine imports, so checks can run them under bun).
export type V3 = [number, number, number];
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const mix3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** 0..1 as time runs from a to b */
export const ramp = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const ease = (k: number) => k * k * (3 - 2 * k);
export const easeOut = (k: number) => 1 - (1 - k) ** 3;

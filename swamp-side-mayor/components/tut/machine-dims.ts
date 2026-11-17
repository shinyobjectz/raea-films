// The tutorial machine's measures, shared by the machine (machine.tsx) and the ivy grown on it (ivy.ts).
export type V3 = [number, number, number];
/** where the monitor stands (in the pond, where the music video raised it), its case, and its glass: 16:9 */
export const TMON = { c: [0, 3.9, -12.5] as V3, size: [9.6, 6.4, 4.2] as V3, screen: [8.0, 4.5] as [number, number] };
/** the keyboard on the near shore, as the music video's */
export const TKB = { c: [0, 0.34, 0.4] as V3, pitch: 0.5, tilt: 0.1 };
/** the glass's centre, the point the camera frames for a teaching line */
export const GLASS: V3 = [TMON.c[0], TMON.c[1] + 0.25, TMON.c[2] + TMON.size[2] / 2 - 0.39];

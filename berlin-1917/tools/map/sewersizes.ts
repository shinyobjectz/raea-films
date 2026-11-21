// What a sewer is made as, shared by sewers.ts (System III) and sewerplate.ts (the other systems on their plates).
// Sizes by street length drained (m): stoneware pipes, then egg profiles growing in log steps to 2.0 m at the station.
export const PIPES = [[250, 0.3], [500, 0.39], [800, 0.48]] as const; // stoneware in side streets, brick in the main ones (Hobrecht)
// The standard sections a modelled size is taken to (research/sewer-profiles-1884.tsv): Blatt 8's ten stoneware bores
// (0.21-0.48 m, wall 19-36 mm) and Blatt 7's egg profiles, 2:3 from 0.6 x 0.9 to 1.2 x 1.8, then 1.266 x 1.9 and
// 1.333 x 2.0. The drained-length thresholds stay modelled; the sections are Hobrecht's.
export const PIPE_WALL: Record<number, number> = { 0.21: 0.019, 0.24: 0.021, 0.27: 0.023, 0.3: 0.025, 0.33: 0.026, 0.36: 0.028, 0.39: 0.03, 0.42: 0.032, 0.45: 0.034, 0.48: 0.036 };
export const EGGS = [[0.9, 0.6, "K1"], [1.0, 0.666, "K2"], [1.1, 0.733, "K3"], [1.2, 0.8, "K4"], [1.3, 0.866, "K5"], [1.4, 0.933, "K6"], [1.5, 1.0, "K7"],
  [1.6, 1.066, "K8"], [1.7, 1.133, "K9"], [1.8, 1.2, "K10"], [1.9, 1.266, "K11"], [2.0, 1.333, "K12"]] as const;
// Falls: 1:500 for pipes and 1:3000 for brick sewers (flat-ground minimums, assumed; the city is nearly level, 33-36 m),
// flattened together where they don't fit, until no junction lies within COVER m of its street (frost depth, assumed).
export const BASE = { pipe: 1 / 500, egg: 1 / 3000 }, COVER = 1.0;
// Routing: the flow takes a drawn brick sewer over a drawn pipe where both lead on (a pipe's metre counts PIPE_COST,
// assumed); a drawn pipe piece under JOIN m that still carries more than the largest pipe takes is a junction the trace
// read as thin, and is brick.
export const PIPE_COST = 3, JOIN = 15;

export type Size = { kind: "stoneware pipe" | "brick egg profile"; h: number; w: number; wall?: number; profile: string };
/** The section for a sewer draining L m of street in a system draining `total` m. On a plate the kind is as drawn
 * (`e.brick`): a pipe takes the size its length drained gives, at most the largest pipe; brick starts at 0.9 m however
 * little it drains. Off a plate (`e.brick` undefined) the length drained decides both. */
export function sizeFor(L: number, total: number, e?: { brick?: boolean; len: number }): Size {
  const pipe = (d: number): Size => ({ kind: "stoneware pipe", h: d, w: d, wall: PIPE_WALL[d], profile: `Hobrecht 1884 Blatt 8 P${Math.round(d * 1000)}` });
  if (e?.brick === false && !(e.len < JOIN && L >= PIPES[PIPES.length - 1][0])) return pipe((PIPES.find(([upTo]) => L < upTo) ?? PIPES[PIPES.length - 1])[1]);
  if (e?.brick !== true) for (const [upTo, d] of PIPES) if (L < upTo) return pipe(d);
  const t = Math.max(0, Math.min(1, Math.log(Math.max(1, L) / 800) / Math.log(Math.max(801, total) / 800)));
  const want = 0.9 + 1.1 * t, [h, w, id] = EGGS.reduce((b, p) => (Math.abs(p[0] - want) < Math.abs(b[0] - want) ? p : b));
  return { kind: "brick egg profile", h, w, profile: `Hobrecht 1884 Blatt 7 ${id}` };
}

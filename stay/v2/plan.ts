// Graybox v2's plan: the shots are the chain's (board/chain.ts), cut on its times. A shot's frames run from the first
// whole frame at or after its start to the next shot's; the film is the song's length.
import { CHAIN, LENGTH, type Shot } from "../board/chain";
import { POINTS, LINES, type At } from "../board/thirds";

// the frame comes from v3/size.json (v3's projection and cursor still go through here: v2/aim, v2/ui)
import SIZE from "../v3/size.json";
export const FPS = 30, W: number = SIZE.w, H: number = SIZE.h;
export const FRAMES = Math.round(LENGTH * FPS);
export type Cut = Shot & { n: number; id: string; f0: number; f1: number };
export const SHOTS: Cut[] = CHAIN.map((s, i) => {
  const f0 = Math.ceil(s.from * FPS - 1e-6);
  const f1 = i + 1 < CHAIN.length ? Math.ceil(CHAIN[i + 1].from * FPS - 1e-6) : FRAMES;
  const same = CHAIN.slice(0, i).filter((x) => x.scene === s.scene).length;
  return { ...s, n: i + 1, id: `${String(i + 1).padStart(2, "0")}-${s.scene}${same ? `-${same + 1}` : ""}`, f0, f1 };
});
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.f0 && f < s.f1) ?? SHOTS[SHOTS.length - 1];
/** where a thirds place sits on the frame, pixels */
export const px = (at: At): [number, number] => {
  if (at === "FULL") return [W / 2, H / 2];
  if (at in POINTS) { const [x, y] = POINTS[at as keyof typeof POINTS]; return [x * W, y * H]; }
  const l = LINES[at as keyof typeof LINES];
  return l.axis === "H" ? [W / 2, l.at * H] : [l.at * W, H / 2];
};

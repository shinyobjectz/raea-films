// the director, 11-11, on graybox v2's first shot: "this looks good just mind the clipping". raea scene lint says what each
// part rests on (sunk, in the air); this says which parts pass through each other. Every piece of a shot is a box
// (its component's measured size, turned by its yaw) and every pair that overlaps by more than 2 cm on all three axes
// is listed, at each sampled time, so a chair dragged through a desk is caught where it happens.
//   bun v2/clip.ts            (every blocked shot; exits 1 if anything clips)
import { readFileSync } from "node:fs";
import type { Piece } from "./stage";

type Box = { name: string; c: [number, number, number]; h: [number, number, number]; yaw: number };
const sizes = new Map<string, [number, number, number]>();
const sizeOf = (p: Piece) => {
  const k = `${p.place}/${p.file}`;
  if (!sizes.has(k)) sizes.set(k, JSON.parse(readFileSync(`${import.meta.dir}/../media/models/${k}.glb.json`, "utf8")).size_m);
  return sizes.get(k)!;
};
/** where a component's origin is: on the floor under it, at its top (a ceiling fitting, blinds) or at its back centre (a wall item) */
const ORIGIN: Record<string, "top" | "back"> = { tubes: "top", "ceiling-fan": "top", "exit-sign": "top", blinds: "top", whiteboard: "back", "wall-clock": "back", "fire-alarm": "back" };
/** the room's own shell: everything stands on, hangs from or leans on it, so it is not tested */
const SHELL = new Set(["floor", "ceiling", "wall", "window-wall", "door"]);
function box(p: Piece): Box {
  const [w, h, d] = sizeOf(p).map((v) => v * (p.scale ?? 1));
  const o = ORIGIN[p.file], yaw = p.yaw ?? 0;
  const cy = o === "top" ? p.at[1] - h / 2 : o === "back" ? p.at[1] : p.at[1] + h / 2;
  // a wall item's box stands in front of its back (its local +z)
  const f = o === "back" ? d / 2 : 0;
  return { name: p.name, c: [p.at[0] + Math.sin(yaw) * f, cy, p.at[2] + Math.cos(yaw) * f], h: [w / 2, h / 2, d / 2], yaw };
}
/** how far two boxes are into each other on their worst axis (separating axes: y, and each box's two flat axes); 0 or less is clear */
function into(a: Box, b: Box): number {
  let least = (a.h[1] + b.h[1]) - Math.abs(a.c[1] - b.c[1]);
  for (const k of [a, b]) for (const turn of [0, Math.PI / 2]) {
    const ax = [Math.cos(k.yaw + turn), -Math.sin(k.yaw + turn)];
    const r = (q: Box) => Math.abs(ax[0] * Math.cos(q.yaw) + ax[1] * -Math.sin(q.yaw)) * q.h[0] + Math.abs(ax[0] * Math.sin(q.yaw) + ax[1] * Math.cos(q.yaw)) * q.h[2];
    least = Math.min(least, r(a) + r(b) - Math.abs(ax[0] * (a.c[0] - b.c[0]) + ax[1] * (a.c[2] - b.c[2])));
  }
  return least;
}
/** pairs that are meant to touch or nest: a thing and the desk it clamps to or hangs behind */
const meant = (a: string, b: string) => {
  const id = (s: string) => s.split("-").pop(), kind = (s: string) => s.split("-")[0];
  if (id(a) !== id(b)) return false;
  const pair = [kind(a), kind(b)].sort().join("+");
  // a monitor clamps the desk's edge; the cables hang down its back from the monitor (their box is centred, the leads are not)
  return pair === "desk+monitor" || pair === "cables+desk" || pair === "cables+monitor";
};
export function clips(pieces: Piece[], deep = 0.02): { a: string; b: string; by: number }[] {
  const bs = pieces.filter((p) => !SHELL.has(p.file)).map(box), out: { a: string; b: string; by: number }[] = [];
  for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) {
    if (Math.abs(bs[i].c[0] - bs[j].c[0]) > 4 || Math.abs(bs[i].c[2] - bs[j].c[2]) > 4 || meant(bs[i].name, bs[j].name)) continue;
    const by = into(bs[i], bs[j]);
    if (by > deep) out.push({ a: bs[i].name, b: bs[j].name, by });
  }
  return out;
}

if (import.meta.main) {
  const { OFFICE, officeAt } = await import("./office.shots");
  const blocked: [string, number, (t: number) => { pieces: Piece[] }][] = [["the office take (shots 2 to 5)", OFFICE.reduce((a, s) => a + s.seconds, 0), officeAt]];
  let bad = 0;
  for (const [id, seconds, at] of blocked) {
    const seen = new Map<string, { by: number; from: number; to: number }>();
    for (let t = 0; t <= seconds; t += 0.2) for (const c of clips(at(t).pieces)) {
      const k = `${c.a} x ${c.b}`, e = seen.get(k);
      seen.set(k, e ? { by: Math.max(e.by, c.by), from: e.from, to: t } : { by: c.by, from: t, to: t });
    }
    console.log(`${id}: ${seen.size ? `${seen.size} pairs clip` : "nothing clips"}`);
    for (const [k, e] of [...seen].sort((p, q) => q[1].by - p[1].by)) console.log(`  ${k}: ${(e.by * 100).toFixed(1)} cm, ${e.from.toFixed(1)}-${e.to.toFixed(1)} s`);
    bad += seen.size;
  }
  process.exit(bad ? 1 : 0);
}

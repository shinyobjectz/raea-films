// The swamp's watchers for the tutorial (compositions/ruins.tsx's Critters, each on a clock of its own), and the ones
// who review: when Goose's review link goes out (tutorial.script.ts 09.02, 09.04; the director, 11-16: "we have other animals
// like deer/heron/frog to help showcase reviews from external teams or people"), the frog on its stone, the heron in
// the shallows and the deer at the water's edge look up at the glass; then the heron cranes out at it with a "!" (a note
// on the frame), the deer nods with a heart (an approval), and the frog hops off. Each reaction is the music video's
// own (layout.ts critterPose, heronPose), played at the moment of the music video it was made for.
import { staticFile } from "raea";
import { Model, crossSection } from "raea/3d";
import { StandardMaterial } from "raea/pbr";
import { Mesh3d } from "raea/mesh";
import { Quat, Transform } from "raea/transform";
import { CRITTERS, critterPose } from "../../compositions/layout";
import { TutHeron, heronNeck } from "./heron";
import { FROG_PAD, type V3 } from "../../compositions/plan";

export type Reviewer = "frog" | "deer" | "heron";
/** which critter each reviewer is (layout.ts CRITTERS): the frog on the fallen stone, the deer by the drum */
const K: Record<"frog" | "deer", number> = { frog: 2, deer: 3 };
/** each reviewer's moment of the music video: the frog sitting on its stone, then its leap to the lily pad (b 29.2 to
 * 31.2); the deer at the water's edge watching the screen, then its nod (b 109.5 to 111.5); the heron still, then its
 * crane right out at what it looks at (b 111.4 to 113.4) */
// (the deer's own looking falls back to grazing, so it watches from the first frame of its nod: standing, head up)
export const REVIEW_B = { frogSits: 20, frogLeap: 29.0, deerWatches: 109.5, deerNods: 109.5, heronStill: 0, heronCranes: 111.2 };
/** a cast: each reviewer's music-video moment, as a start and a rate (b = start + seconds into the shot x rate) */
export type Cast = Partial<Record<Reviewer, [number, number]>>;

const PAD = crossSection.polygon(Array.from({ length: 34 }, (_, i) => { const a = 0.3 + (i / 33) * (Math.PI * 2 - 0.6); return [Math.cos(a) * 0.52, Math.sin(a) * 0.52] as [number, number]; }).concat([[0, 0]])).extrude(0.025).rotate(-90, 0, 0);

/** the b each critter plays at: a reviewer's from the cast, the rest the film's own (0) */
export function bOf(cast: Cast | undefined, local: number) {
  const at = (r: Reviewer) => (cast?.[r] ? cast[r]![0] + local * cast[r]![1] : null);
  return { frog: at("frog"), deer: at("deer"), heron: at("heron") ?? 0, k: (k: number) => (k === K.frog ? at("frog") : k === K.deer ? at("deer") : null) ?? 0 };
}

/** The watchers, each on its own b; `look` is what they turn to (the glass when they review, Goose otherwise). */
export function TutCritters({ t, look, cast, local, hop = 0.2 }: { t: number; look: V3; cast?: Cast; local: number; hop?: number }) {
  const b = bOf(cast, local);
  return (
    <>
      {CRITTERS.map((c, k) => { const p = critterPose(k, t, b.k(k), look, hop, 0);
        return <Model key={k} name={`critter-${k}`} pass="hero" flat src={staticFile(`glb/critter-${c.src}.glb`)} position={p.at} rotation={[0, p.yaw, 0]} scale={[c.s, c.s * p.sq, c.s]} graph={{ blend: p.clips }} />; })}
      <Mesh3d name="frog-pad" pass="hero" shape={PAD} allowOverlap shadow={false} transform={Transform.fromXyz(...FROG_PAD).withRotation(Quat.fromAxisAngle([0, 1, 0], 2.2))}><StandardMaterial base_color="#4f9e36" unlit /></Mesh3d>
      <TutHeron b={b.heron} look={look} />
    </>
  );
}

/** where a reviewer's head is, for its emote */
export function headOf(who: Reviewer, t: number, cast: Cast | undefined, local: number, look: V3): V3 {
  const b = bOf(cast, local);
  if (who === "heron") { const hd = heronNeck(b.heron, look).head; return [hd[0], hd[1] + 0.08, hd[2]]; }
  return critterPose(K[who], t, b.k(K[who]), look, 0.2, 0).head;
}

/** a point in the scene on the 1920 x 1080 frame, from the camera (eye, at, vertical fov in degrees), and how many
 * pixels a metre is there; null behind the camera */
export function project(p: V3, eye: V3, at: V3, fov: number): { x: number; y: number; ppm: number } | null {
  const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const norm = (a: V3): V3 => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const f = norm(sub(at, eye)), r = norm(cross(f, [0, 1, 0])), u = cross(r, f), d = sub(p, eye), z = dot(d, f);
  if (z < 0.05) return null;
  const th = Math.tan((fov * Math.PI) / 360);
  return { x: 960 + (dot(d, r) / (z * th * (16 / 9))) * 960, y: 540 - (dot(d, u) / (z * th)) * 540, ppm: 540 / (z * th) };
}

/** a reaction over a reviewer's head: the music video's ink "!" or heart, popping in and boiling, `u` from 0 to 1 */
export function Emote({ n, u, x, y, ppm, t }: { n: "bang" | "heart"; u: number; x: number; y: number; ppm: number; t: number }) {
  if (u < 0 || u >= 1) return null;
  const SIZE = { bang: [132, 319], heart: [551, 508] }[n];
  const sm = (v: number) => { const c = Math.min(1, Math.max(0, v)); return c * c * (3 - 2 * c); };
  const h = Math.min(220, Math.max(80, 0.32 * ppm)), w = (h * SIZE[0]) / SIZE[1];
  const pop = sm(u / 0.1) * (1 + 0.2 * Math.sin(Math.min(1, u / 0.18) * Math.PI)) * (1 - sm((u - 0.85) / 0.15));
  const boil = Math.floor(t * 8) % 3;
  return <img src={staticFile(`ink/${n}-${boil}.png`)} style={{ position: "absolute", left: x - w / 2, top: y - h, width: w, height: h, transform: `scale(${pop}) rotate(${-6 + 4 * Math.sin(t * 6)}deg)`, transformOrigin: "50% 100%" }} />;
}

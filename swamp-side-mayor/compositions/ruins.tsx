// The old things in the swamp, drawn as stickers like the goose (pass "hero": cel shade, ink line, white halo):
// a ring of standing stones round the mud floor, a trilithon, columns standing in the shallows, an arch across the
// water, the goose's own statue; the critters who watch from them; the summoning circle and the runes that light
// when it calls the machine; and the pond's drawn water: rings that spread, crown splashes, drifting light.
import { Fragment } from "react";
import { staticFile } from "raea";
import { ImagePlane, Instances, Model, crossSection, sdf } from "raea/3d";
import { StandardMaterial } from "raea/pbr";
import { Capsule3d, Cylinder, Mesh3d, Sphere } from "raea/mesh";
import { Quat, Transform } from "raea/transform";
import { FROG_PAD } from "./plan";
import { waveAt } from "./waves";
import { WATER, hash, pond, type V3 } from "./set";

import { C, CRITTERS, PADS, RUINS, critterPose, heronRig, ruinY } from "./layout";
export { CRITTERS, RUINS, ruinY } from "./layout";
export function Ruins() {
  return <>{RUINS.map((r, i) => (
    <Model key={i} name={`ruin-${i}`} pass="hero" flat src={staticFile(`glb/ruin-${r.src}.glb`)} position={[r.at[0], ruinY(r), r.at[1]]} rotation={[r.tilt?.[0] ?? 0, r.yaw, r.tilt?.[1] ?? 0]} scale={r.s} />
  ))}</>;
}
/** The watchers. `look` is what they turn to (the goose's head); `hop` lifts them on the beat (0 sits still); `jump`
 * lifts them off their seat. Their heads follow it; each has its own business (layout.ts critterPose); the frog's lily
 * pad and the heron are here too. */
export function Critters({ t, b = -99, look, hop = 0, jump = 0, only }: { t: number; b?: number; look: V3; hop?: number; jump?: number; only?: number | "heron" }) {
  // the raccoons are out (the director 11-16: "the raccoon is terrible, do not use that"); their places stay in CRITTERS so
  // every other critter keeps its index
  // `only`: one of them alone (v7: its own shot, in front of a card), the pads and the heron left out unless it's the one
  return <>{CRITTERS.map((c, k) => { if (c.src === "raccoon" || (only !== undefined && only !== k)) return null; const p = critterPose(k, t, b, look, hop, jump);
    return <Model key={k} name={`critter-${k}`} pass="hero" flat src={staticFile(`glb/critter-${c.src}.glb`)} position={p.at} rotation={[0, p.yaw, 0]} scale={[c.s, c.s * p.sq, c.s]} graph={{ blend: p.clips }} />; })}
    {(only === undefined || only === 2) && <Mesh3d name="frog-pad" pass="hero" shape={PAD} allowOverlap shadow={false} transform={padOn(FROG_PAD, t).withRotation(padTurn(FROG_PAD, t, 2.2))}><StandardMaterial base_color="#4f9e36" unlit /></Mesh3d>}
    {/* v7: every frog sits on a pad (the director 11-16: "frog needs to be on a lily pad", "not placed correctly on an object") */}
    {only === undefined && PADS.map((p, i) => <Mesh3d key={`pad-${i}`} name={`frog-pad-${i}`} pass="hero" shape={PAD} allowOverlap shadow={false} transform={padOn(p, t).withRotation(padTurn(p, t, 0.7 + i * 2.1)).withScale([0.7, 1, 0.7])}><StandardMaterial base_color="#4f9e36" unlit /></Mesh3d>)}
    {(only === undefined || only === "heron") && <Heron b={b} look={look} />}
  </>;
}
const PAD = crossSection.polygon(Array.from({ length: 34 }, (_, i) => { const a = 0.3 + (i / 33) * (Math.PI * 2 - 0.6); return [Math.cos(a) * 0.52, Math.sin(a) * 0.52] as [number, number]; }).concat([[0, 0]])).extrude(0.025).rotate(-90, 0, 0);
// the heron, ours: a grey-blue body on long legs, a white neck in two parts that follow the goose, a white head with a
// black crest and a long orange bill. Built facing -z (the way a lens looks), 1.4 m to the crown
const H_BODY = sdf.smoothUnion(0.07, sdf.ellipsoid(0.16, 0.18, 0.34).rotate(18, 0, 0).move(0, 0.76, 0.03), sdf.cone([0, 0.7, 0.3], [0, 0.56, 0.56], 0.1, 0.02), sdf.ellipsoid(0.12, 0.15, 0.12).move(0, 0.84, -0.2)).solid(0.012);
const H_LEGS = sdf.union(sdf.capsule([0.055, 0, 0.02], [0.05, 0.62, 0.02], 0.017), sdf.capsule([-0.055, 0, 0.02], [-0.05, 0.62, 0.02], 0.017), sdf.capsule([0.055, 0.01, 0.02], [0.06, 0.01, -0.13], 0.012), sdf.capsule([-0.055, 0.01, 0.02], [-0.06, 0.01, -0.13], 0.012)).solid(0.008);
const H_HEAD = sdf.smoothUnion(0.03, sdf.ellipsoid(0.055, 0.06, 0.085), sdf.ellipsoid(0.04, 0.035, 0.05).move(0, -0.03, -0.03)).solid(0.006);
const H_BILL = sdf.cone([0, -0.008, -0.06], [0, -0.014, -0.29], 0.024, 0.003).solid(0.004);
const H_CREST = sdf.union(sdf.capsule([0, 0.035, 0.02], [0, 0.0, 0.2], 0.012), sdf.capsule([0, 0.03, 0.03], [0, -0.02, 0.17], 0.009), sdf.sphere(0.013).move(0.046, 0.016, -0.03), sdf.sphere(0.013).move(-0.046, 0.016, -0.03)).solid(0.004);
/** the turn that takes +Y onto a direction */
function alongY(u: V3) { const l = Math.hypot(u[0], u[1], u[2]) || 1, v: V3 = [u[0] / l, u[1] / l, u[2] / l], h = Math.hypot(v[2], v[0]); return h < 1e-5 ? Quat.IDENTITY : Quat.fromAxisAngle([v[2] / h, 0, -v[0] / h], Math.acos(Math.max(-1, Math.min(1, v[1])))); }
const NECK_R = 0.034;
/** one run of the neck: the unit cylinder (radius NECK_R, 1 m along y) stretched from a to c, as Instances take it */
function neckRun(a: V3, c: V3, r: number) {
  const d: V3 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]], len = Math.max(0.01, Math.hypot(...d)), Y: V3 = [d[0] / len, d[1] / len, d[2] / len];
  const side: V3 = Math.abs(Y[1]) < 0.95 ? [0, 1, 0] : [1, 0, 0], cx = (u: V3, v: V3): V3 => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const x0 = cx(Y, side), lx = Math.hypot(...x0), X: V3 = [x0[0] / lx, x0[1] / lx, x0[2] / lx], Z = cx(X, Y);
  const ay = Math.asin(Math.max(-1, Math.min(1, Z[0]))), rot: V3 = Math.hypot(Z[1], Z[2]) < 1e-7 ? [Math.atan2(Y[2], Y[1]), ay, 0] : [Math.atan2(-Z[1], Z[2]), ay, Math.atan2(-Y[0], X[0])];
  return { position: [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2] as V3, rotation: rot, scale: [r / NECK_R, len, r / NECK_R] as V3 };
}
export function Heron({ b, look }: { b: number; look: V3 }) {
  const h = heronRig(b, look), { base, mid, head, aim } = h;
  const bodyQ = Quat.fromAxisAngle([0, 1, 0], h.yw), headT = Transform.fromXyz(...head).lookingAt(aim, [0, 1, 0]);
  return (
    <>
      <Mesh3d name="heron-body" pass="hero" shape={H_BODY} allowOverlap transform={Transform.fromXyz(h.at[0], h.at[1] + h.bob, h.at[2]).withRotation(bodyQ)}><StandardMaterial base_color="#7d93b8" unlit /></Mesh3d>
      <Mesh3d name="heron-legs" pass="hero" shape={H_LEGS} allowOverlap transform={Transform.fromXyz(h.at[0], h.at[1], h.at[2]).withRotation(bodyQ)}><StandardMaterial base_color="#d8a24a" unlit /></Mesh3d>
      {/* the neck: one unit cylinder stretched and turned onto each run, a ball at the shoulders and at the bend. A Mesh3d
          keeps the shape it made on its first frame, so capsules lengthened as it craned stayed short and the head came
          off (found by the tutorial's agent from the director's note, 11-16; its fix, components/tut/heron.tsx) */}
      <Instances name="heron-neck" pass="hero" allowOverlap shadow={false} at={[neckRun(base, mid, NECK_R), neckRun(mid, head, 0.031)]}><Cylinder radius={NECK_R} half_height={0.5} /><StandardMaterial base_color="#dfe5f0" unlit /></Instances>
      <Instances name="heron-neck-joints" pass="hero" allowOverlap shadow={false} at={[{ position: base }, { position: mid, scale: 0.032 / NECK_R }]}><Sphere radius={NECK_R} /><StandardMaterial base_color="#dfe5f0" unlit /></Instances>
      <Mesh3d name="heron-head" pass="hero" shape={H_HEAD} allowOverlap transform={headT}><StandardMaterial base_color="#f4f6fb" unlit /></Mesh3d>
      <Mesh3d name="heron-bill" pass="hero" shape={H_BILL} allowOverlap transform={headT}><StandardMaterial base_color="#f2b33d" unlit /></Mesh3d>
      <Mesh3d name="heron-crest" pass="hero" shape={H_CREST} allowOverlap transform={headT}><StandardMaterial base_color="#26304a" unlit /></Mesh3d>
    </>
  );
}
/** The summoning circle on the mud floor and the runes on the stones' faces: `on` 0..1 draws them in (the circle
 * grows from the middle as it turns, each stone's runes after it), `pulse` 0..1 swells them on the beat. */
export function Magic({ on, spin, pulse = 0 }: { on: number; spin: number; pulse?: number }) {
  if (on <= 0.001) return null;
  const g = Math.min(1, on * 1.4), R = 5.6 * g * (1 + 0.03 * pulse);
  return (
    <>
      <ImagePlane name="sigil" src={staticFile("fx/sigil.png")} width={1} height={1} position={[C[0], 0.03, C[1]]} rotation={[-Math.PI / 2, 0, spin]} scale={[Math.max(0.001, R), Math.max(0.001, R), 1]} shadow={false} />
      {RUINS.filter((r) => r.runes !== undefined).map((r, i) => {
        const u = Math.min(1, Math.max(0, (on - 0.15 - i * 0.1) / 0.3)), d: [number, number] = [C[0] - r.at[0], C[1] - r.at[1]], l = Math.hypot(...d), off = r.src === "trilithon" ? 0.45 : r.src.startsWith("column") ? 0.5 : 0.36;
        const h = (r.src === "stone-1" ? 1.0 : r.src === "trilithon" ? 2.6 : 2.0) * r.s;
        return <ImagePlane key={i} name={`runes-${i}`} src={staticFile(`fx/rune-${r.runes}.png`)} width={0.42 * r.s} height={1.26 * r.s} position={[r.at[0] + (d[0] / l) * off * r.s, ruinY(r) + 0.25 + h * 0.5 * Math.max(0.001, u), r.at[1] + (d[1] / l) * off * r.s]}
          rotation={[0, Math.atan2(d[0], d[1]), 0]} scale={[1 + 0.1 * pulse, Math.max(0.001, u) * (h / (1.26 * r.s)), 1]} shadow={false} />;
      })}
    </>
  );
}
/** v9: a frog's pad on the pond's waves (waves.ts): carried, lifted a little on the crests, rocked by the slope */
const padRide = (p: V3, t: number) => waveAt(p[0], p[2], t);
function padOn(p: V3, t: number) { const w = padRide(p, t); return Transform.fromXyz(p[0] + w.ox, p[1] + Math.max(0, 0.25 * w.h), p[2] + w.oz); }
function padTurn(p: V3, t: number, yaw: number) { const w = padRide(p, t); return Quat.mul(Quat.fromEuler("XYZ", -Math.atan(w.gz), 0, Math.atan(w.gx)), Quat.fromAxisAngle([0, 1, 0], yaw)); }
/** Rings on the water: each spreads from where it was struck over `dur` seconds (the sheet's 16 frames). */
export type Ring = { x: number; z: number; age: number; size: number; dur?: number };
export function Ripples({ rings }: { rings: Ring[] }) {
  return <>{rings.map((r, i) => { const u = r.age / (r.dur ?? 1.6); if (u < 0 || u >= 1) return null;
    return <ImagePlane key={i} name={`ring-${i}`} src={staticFile("fx/ripple.png")} grid={[4, 4]} frame={Math.min(15, Math.floor(u * 16))} width={1} height={1} position={[r.x, WATER + 0.012 + 0.0005 * (i % 7), r.z]} rotation={[-Math.PI / 2, 0, (i * 1.3) % 6.28]} scale={[r.size, r.size, 1]} shadow={false} />; })}</>;
}
/** A crown splash standing up from the water, turned to the lens. */
export function Splash({ at, age, size, eye, dur = 0.8, name = "splash" }: { at: V3; age: number; size: number; eye: V3; dur?: number; name?: string }) {
  const u = age / dur; if (u < 0 || u >= 1) return null;
  return <ImagePlane name={name} src={staticFile("fx/splash.png")} grid={[4, 4]} frame={Math.min(15, Math.floor(u * 16))} width={1} height={1} position={[at[0], at[1] + size * 0.32, at[2]]} rotation={[0, Math.atan2(eye[0] - at[0], eye[2] - at[2]), 0]} scale={[size, size, 1]} shadow={false} />;
}
/** The pond's own life: rings round the columns' feet and the reeds, now and then a drop, all on a slow loop. */
export function pondRings(t: number): Ring[] {
  const out: Ring[] = [];
  RUINS.filter((r) => pond(r.at[0], r.at[1]) < -0.02).forEach((r, i) => { for (let k = 0; k < 2; k++) out.push({ x: r.at[0], z: r.at[1], age: (t + i * 0.7 + k * 1.4) % 2.8, size: 3.2 * r.s, dur: 2.8 }); });
  for (let i = 0; i < 14; i++) { const per = 3 + 3 * hash(i, 4), k = Math.floor((t + i * 1.7) / per), x = -12 + 24 * hash(i, k + 1), z = -22 + 14 * hash(k, i + 3);
    if (pond(x, z) < -0.08) out.push({ x, z, age: (t + i * 1.7) % per, size: 1.2 + 1.4 * hash(i, k), dur: 1.8 }); }
  return out;
}
/** a twinkle: three thin spikes crossed, so it reads as a star from any side (v6: not a ball; the director 11-16) */
export const STAR = sdf.union(sdf.ellipsoid(0.055, 0.007, 0.007), sdf.ellipsoid(0.007, 0.055, 0.007), sdf.ellipsoid(0.007, 0.007, 0.055), sdf.ellipsoid(0.03, 0.03, 0.006).rotate(0, 0, 45).scale(0.6)).solid(0.004);
/** Pollen and seed fluff drifting in the light round the stage; summoned, they glow and twinkle as stars. */
export function Motes({ t, n = 260, glow = 0 }: { t: number; n?: number; glow?: number }) {
  return (
    <Instances name="motes" shape={STAR} shadow={false} at={Array.from({ length: n }, (_, i) => { const a = hash(i, 1) * 6.283, r = 1.5 + 13 * Math.sqrt(hash(i, 2)), sp = 0.15 + 0.2 * hash(i, 5);
      const x = C[0] + Math.cos(a) * r + Math.sin(t * sp + i) * 0.6 + t * 0.12, z = C[1] + Math.sin(a) * r + Math.cos(t * sp * 0.8 + i * 2) * 0.5, y = 0.3 + 3.5 * hash(i, 3) + 0.3 * Math.sin(t * 0.5 + i);
      const tw = Math.sin(t * 2 + i * 3) ** 2, s = (0.35 + 0.5 * hash(i, 6)) * (1 + glow * 1.2) * (0.35 + 0.65 * tw); return { position: [x, y, z] as V3, rotation: [hash(i, 7) * 3, t * (0.6 + hash(i, 8)) + i, hash(i, 9) * 3] as V3, scale: s }; })}>
      <StandardMaterial base_color={glow > 0.5 ? "#ffe27a" : "#fff8dc"} unlit />
    </Instances>
  );
}
void Fragment;

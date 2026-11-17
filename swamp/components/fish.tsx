// v4, 13-water: a fish leaps from the waking water. A real model (Microsoft's barramundi from the Khronos glTF
// samples, CC0: assets/models/barramundi/LICENSE.md) on a ballistic arc: it breaks the surface at T.fishOut, nose up,
// turns over at the top and goes back in nose first at T.fishIn. The model is one rigid mesh, so its body's flex is a
// quick side-to-side beat of the whole fish about its own dorsal axis, strongest leaving the water. Drops come off it
// as it leaves, trail it, and splash up in a crown where it goes back in; the rings are RINGS' (timeline.ts).
import type { ReactNode } from "react";
import { staticFile } from "raea";
import { Model, eulerOf } from "raea/3d";
import { Mesh3d, Sphere } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Transform } from "raea/transform";
import { qa, qm, qv } from "./quat";
import { T, type V3, rnd } from "./timeline";

const SRC = staticFile("models/barramundi/barramundi.glb");
/** the water's surface */
const WATER = -0.02;
/** where the fish's middle crosses the surface going out and coming back (x, z): open water right of the rock */
export const FISH_OUT: [number, number] = [-1.42, 5.06];
export const FISH_IN: [number, number] = [-0.86, 5.0];
const SCALE = 0.72; // 0.46 m long
const H = 0.44, Y0 = -0.18; // the arc's rise and its ends under the water: the top is 0.26 m, its centre's
const U_OUT = 0.5 - Math.sqrt(0.25 - (WATER - Y0) / (4 * H)); // where on the arc it crosses the surface
const SPAN = (T.fishIn - T.fishOut) / (1 - 2 * U_OUT); // frames for the whole arc
const START = T.fishOut - U_OUT * SPAN;
const DX = (FISH_IN[0] - FISH_OUT[0]) / (1 - 2 * U_OUT), DZ = (FISH_IN[1] - FISH_OUT[1]) / (1 - 2 * U_OUT);
const SX = FISH_OUT[0] - U_OUT * DX, SZ = FISH_OUT[1] - U_OUT * DZ;
/** the model's head is along its local +z (checked on a still) */
const YAW = Math.atan2(DX, DZ);
const G = 9.81 / 900; // m per frame²

export const fishAt = (f: number) => {
  const u = (f - START) / SPAN;
  const c: V3 = [SX + DX * u, Y0 + 4 * H * u * (1 - u), SZ + DZ * u];
  const vy = 4 * H * (1 - 2 * u), vh = Math.hypot(DX, DZ);
  const pitch = -Math.atan2(vy, vh); // about +x a turn dips +z, the head: nose up leaving, down going in
  const beat = Math.sin((f - START) * 1.9) * (0.2 - 0.12 * Math.min(1, Math.max(0, u)));
  return { u, c, pitch, beat };
};

const DROP_MAT = <StandardMaterial base_color="#a9bcb8" perceptual_roughness={0.03} reflectance={0.45} />;

function Drops({ f }: { f: number }) {
  const out: ReactNode[] = [];
  // leaving: drops shed off the body with its speed and a scatter, falling back
  const vx = DX / SPAN, vz = DZ / SPAN;
  for (let i = 0; i < 26; i++) {
    const born = T.fishOut + rnd(i * 3.1) * 9 - 1;
    const t = f - born;
    if (t <= 0) continue;
    const p = fishAt(born).c;
    const k = 0.35 + 0.5 * rnd(i * 5.7);
    const v: V3 = [vx * k + (rnd(i * 7.3) - 0.5) * 0.04, (4 * H * (1 - 2 * fishAt(born).u)) / SPAN * k + rnd(i * 2.9) * 0.015, vz * k + (rnd(i * 1.7) - 0.5) * 0.04];
    const y = p[1] - 0.04 + (rnd(i * 4.4) - 0.5) * 0.12 + v[1] * t - 0.5 * G * t * t;
    if (y < WATER) continue;
    const r = 0.0025 + 0.004 * rnd(i * 9.1);
    out.push(
      <Mesh3d key={`o${i}`} name={`fish-drop-o${i}`} allowOverlap shadow={false} transform={Transform.fromXyz(p[0] + v[0] * t, y, p[2] + v[2] * t)}>
        <Sphere radius={r} />
        {DROP_MAT}
      </Mesh3d>,
    );
  }
  // going in: a crown thrown up and out round where it enters
  for (let i = 0; i < 40; i++) {
    const born = T.fishIn + rnd(i * 4.3) * 2;
    const t = f - born;
    if (t <= 0) continue;
    const a = (i / 40) * Math.PI * 2 + rnd(i * 6.1) * 0.4;
    const s = 0.008 + 0.012 * rnd(i * 8.7), up = 0.03 + 0.045 * rnd(i * 2.3);
    const y = WATER + up * t - 0.5 * G * t * t;
    if (y < WATER) continue;
    const rr = 0.06 + s * t;
    const r = 0.003 + 0.005 * rnd(i * 3.9);
    out.push(
      <Mesh3d key={`i${i}`} name={`fish-drop-i${i}`} allowOverlap shadow={false} transform={Transform.fromXyz(FISH_IN[0] + Math.cos(a) * rr, y, FISH_IN[1] + Math.sin(a) * rr)}>
        <Sphere radius={r} />
        {DROP_MAT}
      </Mesh3d>,
    );
  }
  return <>{out}</>;
}

/** mount for the whole of 13-water (so the model is loaded before it's needed); it waits deep under the water */
export function Fish({ f }: { f: number }) {
  const { u, c, pitch, beat } = fishAt(f);
  const live = u > -0.05 && u < 1.05;
  // heading, then the nose up or down about the fish's own side axis, then the body's beat about its dorsal axis
  const q = qm(qm(qa([0, 1, 0], YAW), qa([1, 0, 0], pitch)), qa([0, 1, 0], beat));
  const mid = qv(q, [0, 0.145 * SCALE, 0]);
  const pos: V3 = live ? [c[0] - mid[0], c[1] - mid[1], c[2] - mid[2]] : [SX, -3, SZ];
  return (
    <>
      <Model name="fish" src={SRC} position={pos} rotation={eulerOf(q)} scale={SCALE} />
      <Drops f={f} />
    </>
  );
}

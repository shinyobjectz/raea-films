// v9: the waves the rising computer sends across the pond, drawn as a pass over the frame (waves.ts WAVE_PASS). It
// goes before the sticker pass, so the outlines draw over the water it shades.
import { FramePass } from "raea/3d";
import { WATER, type V3 } from "./set";
import { WAVE_PASS } from "./waves";

export function WavePass({ t, eye, at, up, fov, aspect = 2 }: { t: number; eye: V3; at: V3; up: V3; fov: number; aspect?: number }) {
  const sub = (a: V3, c: V3): V3 => [a[0] - c[0], a[1] - c[1], a[2] - c[2]], cross = (a: V3, c: V3): V3 => [a[1] * c[2] - a[2] * c[1], a[2] * c[0] - a[0] * c[2], a[0] * c[1] - a[1] * c[0]];
  const norm = (a: V3): V3 => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const f = norm(sub(at, eye)), r = norm(cross(f, up)), u = cross(r, f);
  return <FramePass wesl={WAVE_PASS} prepass={{ depth: true, normal: true }}
    uniforms={{ eye: [...eye, Math.tan((fov * Math.PI) / 360)], fwd: [...f, aspect], right: [...r, 0], up: [...u, 0], wat: [WATER + 0.005, t, 0, 0] }} />;
}

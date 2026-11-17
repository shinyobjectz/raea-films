// The lens: an anamorphic flare, as the film's space is shot (a blue streak across the frame from a light in it, short
// at rest and full width only for a moment as a light hits the lens hard,
// oval ghosts strung through the frame's middle, a veil of glare round the light), and the sun's disc it comes from.
//
// The flare is a pass over the HDR frame before tone mapping (FramePass). Each light it flares from is given by where it
// falls in the frame; the pass measures how much of that light is still in the frame by sampling its disc there, so the
// flare dims and dies as the ship's hull or the Earth's limb crosses it, and an off-frame light flares nothing. Only the
// lights named here flare: the rest of the frame is left as drawn.
import { FramePass } from "raea/post_process";
import { Mesh3d, Sphere } from "raea/mesh";
import { ExtendedMaterial, ShaderExtension, StandardMaterial } from "raea/pbr";
import { Transform } from "raea/transform";
import type { Lens } from "./shot";
import type { V3 } from "./timeline";

/** Bevy's default exposure (EV100 9.7) and raea's stops over it: a light's nits as the HDR frame holds them */
export const exposed = (nits: number, stops: number) => (nits * 2 ** stops) / (2 ** 9.7 * 1.2);

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => {
  const l = Math.hypot(...a);
  return [a[0] / l, a[1] / l, a[2] / l];
};

/** where a direction from the camera falls in its frame: uv from the top left, and whether it's in front */
export function onFrame(cam: Lens, d: V3, aspect: number): { uv: [number, number]; front: boolean } {
  const f = norm(sub(cam.look, cam.pos));
  const r = norm(cross(f, cam.up ?? [0, 1, 0]));
  const u = cross(r, f);
  const z = dot(d, f);
  if (z <= 1e-6) return { uv: [-9, -9], front: false };
  const t = Math.tan(cam.fov / 2);
  return { uv: [0.5 + dot(d, r) / z / t / aspect / 2, 0.5 - dot(d, u) / z / t / 2], front: true };
}

export type FlareLight = {
  /** where it is: a point in the world, or a direction (toward it) for the sun */
  at?: V3;
  dir?: V3;
  /** its disc's radius in the frame, as a share of the frame's height */
  r: number;
  /** what in the HDR frame counts as the light (exposed units): above everything else that could be there */
  above: number;
  /** how strong its flare is, exposed units at the streak's core */
  k: number;
  /** how far its streak runs: 0 a short glint (a light at rest), 1 across the frame (only while it hits the lens hard:
   * a beam striking, a sun breaking out; a bar always on screen reads as a fault) */
  reach?: number;
};

const SRC = /* wgsl */ `
fn lum(c: vec3<f32>) -> f32 { return dot(c, vec3<f32>(0.2126, 0.7152, 0.0722)); }
// how much of a light's disc (at s, radius r of the frame's height) is still the light
fn seen(s: vec2<f32>, r: f32, above: f32, asp: f32) -> f32 {
  if (s.x < -0.2 || s.x > 1.2 || s.y < -0.2 || s.y > 1.2) { return 0.0; }
  var v = 0.0;
  for (var i = 0; i < 12; i++) {
    let a = f32(i) * 2.399963;
    let rr = sqrt((f32(i) + 0.5) / 12.0) * r * 0.9;
    let p = s + vec2<f32>(cos(a) * rr / asp, sin(a) * rr);
    if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) { continue; }
    v += smoothstep(above * 0.3, above, lum(frame(p).rgb));
  }
  return v / 12.0;
}
// a ghost: a soft oval with a brighter rim, its colour, at g with radius r (frame heights)
fn ghost(d: vec2<f32>, r: f32, rim: f32) -> f32 {
  let q = length(vec2<f32>(d.x * 1.25, d.y)) / r;
  let disc = 1.0 - smoothstep(0.75, 1.0, q);
  let ring = exp(-pow((q - 0.93) / 0.06, 2.0));
  return disc * (1.0 - rim) * 0.35 + ring * rim;
}
fn flare(uv: vec2<f32>, s: vec2<f32>, k: f32, reach: f32, asp: f32) -> vec3<f32> {
  let d = vec2<f32>((uv.x - s.x) * asp, uv.y - s.y);
  let ax = abs(d.x);
  let ay = abs(d.y);
  // the streak: a hard thin line and a soft band, both blue, out to its reach (0: a glint either side of the light,
  // a tenth of the frame's height; 1: across the whole frame), dimmer the shorter it is
  let len = mix(0.05, 1.1, reach);
  let thin = exp(-ay / 0.0018) * exp(-ax / len) / (1.0 + ax / (0.05 + 0.25 * reach));
  let band = exp(-ay / 0.008) * exp(-ax / (len * 0.7)) * 0.10 * reach;
  var c = vec3<f32>(0.32, 0.62, 1.0) * (thin + band) * mix(0.35, 1.0, reach);
  // the light's own glare: a tight hot core and a wide warm veil
  let rr = length(d);
  c += vec3<f32>(1.0, 0.92, 0.80) * (exp(-rr / 0.010) * 1.0 + exp(-rr / 0.06) * 0.05 + exp(-rr / 0.22) * 0.0008);
  // ghosts strung along the line from the light through the frame's middle
  let m = vec2<f32>(0.5 * asp, 0.5);
  let sl = vec2<f32>(s.x * asp, s.y);
  let gp = array<f32, 6>(-0.55, -0.22, 0.32, 0.58, 0.86, 1.35);
  let gr = array<f32, 6>(0.020, 0.055, 0.030, 0.090, 0.016, 0.140);
  let gi = array<f32, 6>(0.012, 0.007, 0.010, 0.004, 0.018, 0.0025);
  let gc = array<vec3<f32>, 6>(vec3<f32>(0.35, 0.8, 1.0), vec3<f32>(1.0, 0.65, 0.35), vec3<f32>(0.55, 1.0, 0.75), vec3<f32>(0.6, 0.55, 1.0), vec3<f32>(1.0, 0.85, 0.6), vec3<f32>(0.4, 0.7, 1.0));
  for (var i = 0; i < 6; i++) {
    let g = m + (sl - m) * gp[i];
    let q = vec2<f32>(uv.x * asp, uv.y) - g;
    c += gc[i] * ghost(q, gr[i], select(0.2, 0.75, i % 2 == 1)) * gi[i];
  }
  return c * k;
}
fn shade(in: FullscreenVertexOutput) -> vec4<f32> {
  let uv = in.uv;
  let base = frame(uv);
  let asp = u_aspect();
  var add = vec3<f32>(0.0);
  let a = u_a();
  let ak = u_ak();
  if (ak.x > 0.0) { add += flare(uv, a.xy, ak.x * seen(a.xy, a.z, a.w, asp), ak.y, asp); }
  let b = u_b();
  let bk = u_bk();
  if (bk.x > 0.0) { add += flare(uv, b.xy, bk.x * seen(b.xy, b.z, b.w, asp), bk.y, asp); }
  return vec4<f32>(base.rgb + add, base.a);
}`;

/** the flare from up to two lights, over the frame as the camera `cam` sees it */
export function Flare({ cam, aspect, lights }: { cam: Lens; aspect: number; lights: FlareLight[] }) {
  const slot = (l?: FlareLight) => {
    if (!l) return { p: [-9, -9, 0, 1], k: [0, 0, 0, 0] };
    const d = l.dir ?? sub(l.at ?? [0, 0, 0], cam.pos);
    const o = onFrame(cam, norm(d), aspect);
    return { p: [o.uv[0], o.uv[1], l.r, l.above], k: [o.front ? l.k : 0, l.reach ?? 0, 0, 0] };
  };
  const a = slot(lights[0]), b = slot(lights[1]);
  return <FramePass at="before-tonemap" wesl={SRC} uniforms={{ aspect, a: a.p, ak: a.k, b: b.p, bk: b.k }} />;
}

/** the sun's disc, far off along `dir` (toward it), at its real size (0.27 degrees across in radius), not traced by
 * Solari (the DirectionalLight is its light) */
export const SUN_R = 0.004654;
export function SunDisc({ dir, nits, dist = 9e7 }: { dir: V3; nits: number; dist?: number }) {
  const d = norm(dir);
  return (
    <Mesh3d name="sun" castShadow={false} transform={Transform.fromXyz(d[0] * dist, d[1] * dist, d[2] * dist)}>
      <Sphere radius={dist * SUN_R} ico={8} />
      <ExtendedMaterial
        base={<StandardMaterial base_color="#000000" opaque_render_method="Forward" reflectance={0} />}
        extension={<ShaderExtension wesl={SUN_SRC} uniforms={{ nits }} />}
      />
    </Mesh3d>
  );
}
const SUN_SRC = /* wgsl */ `
fn lit(in: VertexOutput, pbr: PbrInput, color: vec4<f32>) -> vec4<f32> {
  return vec4<f32>(vec3<f32>(1.0, 0.97, 0.92) * u_nits() * view.exposure, 1.0);
}`;

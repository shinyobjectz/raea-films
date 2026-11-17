// v4: the beam's light in the air, as a volume. A pass over the HDR frame (FramePass, before tone mapping) that, for
// every pixel, follows the camera's ray through the column of glowing air round the beam's axis and adds up the light
// it passes, from the lens to the first surface the ray meets (the depth prepass): a branch or a block in front of the
// beam hides it, and what's behind it doesn't, from any angle, with the camera right beside it or looking up its length,
// against the sky as much as the trees.
//
// The air glows in three soft tubes round the axis (a tight hot sheath, a halo, a faint wider bloom of air), worked out
// along the ray exactly (a Gaussian tube's integral is an erf), and a head of light where it has reached. Inside the
// sheath it carries energy, marched along the ray: pulses running up it, and three filaments twisting round the core,
// breaking and crackling. Motion blur is the pass's own: each pixel is the mean of seven moments across a 180-degree
// shutter, the beam's height and the camera both moving through it (raea's <MotionBlur> blurs the scene drawn before
// this pass, not the pass).
//
// Units: metres along the beam, scaled by `scale` (1 in the swamp; the orbit's beam is the same thing larger); the
// brightness in nits, put into the frame's exposed units by the shot's exposure (flare.tsx's `exposed`).
import { FramePass } from "raea/post_process";
import { exposed } from "./flare";
import type { Lens } from "./shot";
import type { V3 } from "./timeline";

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => {
  const l = Math.hypot(...a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
/** the camera's position, forward and up (as Bevy's lookingAt builds them), and its vertical half-angle's tangent */
function basis(cam: Lens) {
  const f = norm(sub(cam.look, cam.pos));
  const r = norm(cross(f, cam.up ?? [0, 1, 0]));
  const u = cross(r, f);
  return { c: [...cam.pos, Math.tan(cam.fov / 2)], f, u };
}

/** how bright each part of the air is, nits at its middle seen across it (a ray through the axis) */
export type BeamLook = { sheath: number; halo: number; air: number; energy: number; head: number };
// (the swamp at dusk holds 1.0 at about 460 nits: the sheath clips to a thin white-hot line round the core, the halo
// sits just under white so its blue shows, the filaments and pulses read over it)
export const BEAM_LOOK: BeamLook = { sheath: 1900, halo: 420, air: 55, energy: 2400, head: 3500 };
/** the tubes' widths, metres (Gaussian): the sheath, the halo, the air */
const W = [0.05, 0.25, 0.9];

const SRC = /* wgsl */ `
const SQRT_PI: f32 = 1.7724539;
fn erf1(x: f32) -> f32 {
  let a = abs(x);
  let t = 1.0 / (1.0 + 0.3275911 * a);
  let y = 1.0 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * exp(-a * a);
  return select(-y, y, x >= 0.0);
}
fn h21(p: vec2<f32>) -> f32 { return fract(sin(dot(p, vec2<f32>(127.1, 311.7))) * 43758.5453); }
fn vn(p: vec2<f32>) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2<f32>(1.0, 0.0)), u.x), mix(h21(i + vec2<f32>(0.0, 1.0)), h21(i + vec2<f32>(1.0, 1.0)), u.x), u.y);
}

// a ray's pass by the axis: where along it (t) it comes nearest (tc), how near (d2, squared), how sharply it crosses
// (s, the sine of its angle to the axis), and the stretch [lo, hi] of it beside the beam (between its foot and its
// head, short of the first surface)
struct BeamPass { lo: f32, hi: f32, tc: f32, d2: f32, s: f32, s2: f32, a0: f32, c: f32, p0: vec3<f32>, pv: vec3<f32> }
fn pass_by(C: vec3<f32>, v: vec3<f32>, T: f32, F: vec3<f32>, A: vec3<f32>, h: f32) -> BeamPass {
  var g: BeamPass;
  let w0 = C - F;
  g.a0 = dot(w0, A);
  g.c = dot(v, A);
  g.p0 = w0 - A * g.a0;
  g.pv = v - A * g.c;
  g.s2 = dot(g.pv, g.pv);
  g.s = sqrt(g.s2);
  g.tc = 0.0;
  g.d2 = dot(g.p0, g.p0);
  if (g.s2 > 1e-8) {
    let k = dot(g.p0, g.pv);
    g.tc = -k / g.s2;
    g.d2 = max(0.0, dot(g.p0, g.p0) - k * k / g.s2);
  }
  g.lo = 0.0;
  g.hi = T;
  if (abs(g.c) > 1e-6) {
    let t1 = -g.a0 / g.c;
    let t2 = (h - g.a0) / g.c;
    g.lo = max(g.lo, min(t1, t2));
    g.hi = min(g.hi, max(t1, t2));
  } else if (g.a0 < 0.0 || g.a0 > h) {
    g.hi = g.lo;
  }
  return g;
}
// a Gaussian tube of width w round the axis: its light along the ray's stretch beside the beam
fn tube(g: BeamPass, w: f32) -> f32 {
  if (g.hi <= g.lo) { return 0.0; }
  let e = exp(-g.d2 / (w * w));
  // (looking along it, a ray stays in the tube for w / s: held to a few times its width, or the whole frame veils)
  let cap = min(1.0, g.s / 0.3);
  if (g.s < 1e-4) { return e * min(g.hi - g.lo, 3.3 * w) ; }
  return cap * e * (w * SQRT_PI / (2.0 * g.s)) * (erf1(g.s * (g.hi - g.tc) / w) - erf1(g.s * (g.lo - g.tc) / w));
}
// a tube held no narrower than least (its light at its middle kept)
fn tube_least(g: BeamPass, w: f32, least: f32) -> f32 {
  let we = max(w, least);
  return tube(g, we) * (w / we);
}
// a Gaussian blob of width w at H: its light along the ray from the lens to T
fn blob(C: vec3<f32>, v: vec3<f32>, T: f32, H: vec3<f32>, w: f32) -> f32 {
  let th = dot(H - C, v);
  let dh2 = max(0.0, dot(H - C, H - C) - th * th);
  return exp(-dh2 / (w * w)) * (w * SQRT_PI * 0.5) * (erf1((T - th) / w) - erf1(-th / w));
}
// the energy in the sheath at a point: a (metres up the beam), (x, y) across it, t seconds; all in the beam's own
// units (metres / scale)
fn energy(a: f32, x: f32, y: f32, t: f32) -> f32 {
  let r2 = x * x + y * y;
  // pulses running up it, a few metres apart
  let pulse = pow(0.5 + 0.5 * sin(6.2831853 * (a / 2.6 - t * 6.5)), 8.0) * exp(-r2 / 0.03);
  // three filaments twisting round the core, each its own way, breaking into lengths that run up it and flickering
  var fil = 0.0;
  for (var k = 0; k < 3; k++) {
    let kf = f32(k);
    let turn = select(-1.5, 1.15, k != 1);
    let spin = select(5.5, -7.0, k == 2);
    let th = kf * 2.0944 + a * turn + t * spin;
    let rad = 0.12 + 0.045 * sin(a * 0.9 + t * 4.0 + kf * 1.7) + 0.07 * (vn(vec2<f32>(a * 1.4 - t * 9.0, kf * 13.1)) - 0.5);
    let dx = x - rad * cos(th);
    let dy = y - rad * sin(th);
    let on = smoothstep(0.38, 0.72, vn(vec2<f32>(a * 0.5 - t * 12.0, kf * 7.7 + 3.0)));
    let flick = 0.5 + 0.5 * vn(vec2<f32>(t * 26.0, kf * 5.3 + a * 0.25));
    fil += exp(-(dx * dx + dy * dy) / 0.0003) * on * flick;
  }
  // (a pulse fills the sheath, ten times a filament's width: weighed to read as a band, not a flash)
  return pulse * 0.05 + fil;
}

fn shade(in: FullscreenVertexOutput) -> vec4<f32> {
  let uv = in.uv;
  let base = frame(uv);
  let F = u_foot().xyz;
  let A = u_ax().xyz;
  let sc = u_ax().w;
  let hh = u_hh();
  let kk = u_kk();
  let kh = u_kh();
  let asp = u_f1().w;
  let ndc = vec2<f32>(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0);
  // the first surface along this pixel's ray, from the current camera (depth: metres along its view axis)
  let f1 = u_f1().xyz;
  let up1 = u_u1().xyz;
  let r1 = cross(f1, up1);
  let v1 = normalize(f1 + r1 * ndc.x * u_c1().w * asp + up1 * ndc.y * u_c1().w);
  let T = min(depth(uv) / max(dot(v1, f1), 1e-3), 1e7);
  // a frame across the axis, for the energy's angles
  let e1 = normalize(cross(A, select(vec3<f32>(1.0, 0.0, 0.0), vec3<f32>(0.0, 1.0, 0.0), abs(A.y) < 0.9)));
  let e2 = cross(A, e1);
  let RE = 0.5 * sc;
  var glow = vec3<f32>(0.0);
  let N = 7;
  for (var i = 0; i < N; i++) {
    // a moment across the shutter: the camera and the beam's height in between their ends
    let m = (f32(i) + 0.5) / f32(N);
    let C = mix(u_c0().xyz, u_c1().xyz, m);
    let fw = normalize(mix(u_f0().xyz, f1, m));
    let upv = normalize(mix(u_u0().xyz, up1, m));
    let rt = normalize(cross(fw, upv));
    let up = cross(rt, fw);
    let v = normalize(fw + rt * ndc.x * u_c1().w * asp + up * ndc.y * u_c1().w);
    let h = mix(hh.x, hh.y, m);
    let t = hh.z + (m - 0.5) * hh.w;
    if (h <= 0.0) { continue; }
    let g = pass_by(C, v, T, F, A, h);
    // the steady air: sheath, halo, the wider bloom. Far off, each is never narrower than an angle from the eye (ang
    // radians, the halo four times it, the air twelve), its light the same at its middle: a beam kilometres away stays a
    // line of light, not a thread under a pixel
    let wd = u_wd();
    let far = max(g.tc, 0.0) * wd.w;
    var c = vec3<f32>(0.86, 0.95, 1.0) * kk.x * tube_least(g, wd.x * sc, far)
          + vec3<f32>(0.36, 0.70, 1.0) * kk.y * tube_least(g, wd.y * sc, far * 4.0)
          + vec3<f32>(0.28, 0.52, 1.0) * kk.z * tube_least(g, wd.z * sc, far * 12.0);
    // the head where it has reached (the blur of its climb draws it out along the axis)
    if (kh.y > 0.0) {
      let H = F + A * h;
      let wh = kh.y * sc;
      let we = max(wh, length(H - C) * wd.w * 2.0);
      c += vec3<f32>(0.95, 0.98, 1.0) * kh.x * blob(C, v, T, H, we) * (wh / we);
    }
    // the energy, marched through the sheath (the stretch of the ray within RE of the axis, its nearest 40 m)
    if (g.d2 < RE * RE && g.hi > g.lo) {
      var lo = g.lo;
      var hi = g.hi;
      if (g.s2 > 1e-8) {
        let half = sqrt((RE * RE - g.d2) / g.s2);
        lo = max(lo, g.tc - half);
        hi = min(hi, g.tc + half);
      }
      hi = min(hi, lo + 40.0 * sc);
      // (the filaments fade as they shrink under a pixel)
      let fade = 1.0 - smoothstep(0.6, 2.0, far / (0.12 * sc));
      if (hi > lo && fade > 0.0) {
        let S = 28;
        let dt = (hi - lo) / f32(S);
        var e = 0.0;
        for (var j = 0; j < S; j++) {
          let tt = lo + (f32(j) + 0.5) * dt;
          let q = g.p0 + g.pv * tt;
          let a = g.a0 + g.c * tt;
          e += energy(a / sc, dot(q, e1) / sc, dot(q, e2) / sc, t);
        }
        c += vec3<f32>(0.9, 0.96, 1.0) * kk.w * e * dt * fade;
      }
    }
    glow += c;
  }
  return vec4<f32>(base.rgb + glow / f32(N), base.a);
}`;

/** The beam's air over the frame. `cam` the camera now and `cam0` half a frame before (the shutter's open), `foot` and
 *  `axis` where it stands and which way, `h` and `h0` how high it has reached now and half a frame before, `t` seconds
 *  (the energy's clock), `exposure` the shot's, `scale` its size over the swamp's, `look` its brightness. */
export function BeamVolume({ cam, cam0, foot, axis, h, h0, t, exposure, aspect, scale = 1, look = BEAM_LOOK, head = 0.22, ang = 0 }: { cam: Lens; cam0: Lens; foot: V3; axis: V3; h: number; h0: number; t: number; exposure: number; aspect: number; scale?: number; look?: BeamLook; /** the head's width (0: none) */ head?: number; /** the sheath's least width as an angle from the eye, radians (0: none) */ ang?: number }) {
  const b1 = basis(cam), b0 = basis(cam0);
  // nits seen across the middle of each tube (its integral there is w√π) to the exposed units a metre of it adds
  const k = (nits: number, w: number) => exposed(nits, exposure) / (w * Math.sqrt(Math.PI) * scale);
  const ax = norm(axis);
  return (
    <FramePass
      at="before-tonemap"
      prepass={{ depth: true }}
      wesl={SRC}
      uniforms={{
        c1: b1.c, f1: [...b1.f, aspect], u1: [...b1.u, 0],
        c0: b0.c, f0: [...b0.f, 0], u0: [...b0.u, 0],
        foot: [...foot, 0], ax: [...ax, scale],
        hh: [h0, h, t, 1 / 60],
        wd: [...W, ang],
        kk: [k(look.sheath, W[0]), k(look.halo, W[1]), k(look.air, W[2]), exposed(look.energy, exposure) / (0.017 * Math.sqrt(Math.PI) * scale)],
        kh: [head > 0 ? k(look.head, head) : 0, head, 0, 0],
      }}
    />
  );
}

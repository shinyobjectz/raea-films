// v5: 01-water comes up out of the water, and the water is on the lens. A pass over the HDR frame (FramePass, before
// tone mapping), drawn as the lens's front glass breaks the surface (take.ts RISE):
//
// - under the waterline the frame is the peat water: tea-dark murk lit from the surface just over it, the surface's
//   underside a ragged bright mirror, motes hanging out of focus in it;
// - the waterline sweeps down the frame as the glass rises through the surface (the top of the frame clears first: its
//   rays leave by the glass's upper part), its meniscus pulling the picture in a band over it;
// - where it has passed, a sheet of water drains down the glass: the picture swims and blurs under it, thinning in a
//   fraction of a second at the top and slower lower down, where the water gathers;
// - the sheet breaks into runs that race down, and drops: the big ones slide off (each leaving a wet trail), the small
//   ones stay, soft (the glass is far out of focus), each showing the scene small and upside down, dark at its rim and
//   bright where the light gathers at its foot.
//
// It draws only the water: what's above the surface is the render as it is.
import { FramePass } from "raea/post_process";

const SRC = /* wgsl */ `
fn h1(n: f32) -> f32 { return fract(sin(n * 12.9898 + 4.1) * 43758.5453); }
fn h2(p: vec2<f32>) -> f32 { return fract(sin(dot(p, vec2<f32>(127.1, 311.7))) * 43758.5453); }
fn vn(p: vec2<f32>) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h2(i), h2(i + vec2<f32>(1.0, 0.0)), u.x), mix(h2(i + vec2<f32>(0.0, 1.0)), h2(i + vec2<f32>(1.0, 1.0)), u.x), u.y);
}
// the frame at p (frame heights from the top left)
fn at(p: vec2<f32>, asp: f32) -> vec3<f32> {
  return frame(clamp(vec2<f32>(p.x / asp, p.y), vec2<f32>(0.001), vec2<f32>(0.999))).rgb;
}
// and out of focus, over a disc of radius r
fn soft(p: vec2<f32>, r: f32, asp: f32) -> vec3<f32> {
  var c = at(p, asp);
  for (var i = 0; i < 6; i++) {
    let a = f32(i) * 1.0472 + 0.4;
    c += at(p + vec2<f32>(cos(a), sin(a)) * r, asp);
  }
  return c / 7.0;
}
// the waterline's height in the frame at x: above the top until the glass reaches the surface (cr.x), below the
// bottom once it's clear (cr.y), ragged as the surface laps
fn line(x: f32, t: f32, cr: vec4<f32>) -> f32 {
  let k = clamp((t - cr.x) / (cr.y - cr.x), -0.5, 1.5);
  return -0.12 + 1.24 * k + 0.022 * sin(x * 4.3 + t * 0.31) + 0.011 * sin(x * 11.7 - t * 0.53);
}
// the frame the waterline passed height y
fn passed(y: f32, cr: vec4<f32>) -> f32 { return cr.x + (y + 0.12) / 1.24 * (cr.y - cr.x); }

// drop i (0..N): (x0, y0, r, the frame it forms), in frame heights; the first RUNS are runs, racing down the glass
const N: i32 = 40;
const RUNS: i32 = 8;
fn props(i: i32, cr: vec4<f32>, asp: f32) -> vec4<f32> {
  let s = f32(i) * 7.31;
  let x0 = h1(s) * asp;
  if (i < RUNS) {
    let y0 = mix(-0.04, 0.55, h1(s + 1.0));
    return vec4<f32>(x0, y0, 0.012 + 0.01 * h1(s + 2.0), passed(y0, cr) + 1.0 + 6.0 * h1(s + 3.0));
  }
  let y0 = mix(-0.04, 0.98, h1(s + 1.0));
  return vec4<f32>(x0, y0, 0.01 + 0.045 * pow(h1(s + 2.0), 2.2), passed(y0, cr) + 2.0 + 5.0 * h1(s + 3.0));
}
// how fast it slides once it goes (frame heights a frame; 0 stuck), and the frame it goes
fn speed(i: i32, r: f32) -> f32 {
  if (i < RUNS) { return 0.025 + 0.03 * h1(f32(i) * 7.31 + 4.0); }
  return max(r - 0.026, 0.0) * 1.2;
}
fn goes(i: i32, born: f32) -> f32 {
  if (i < RUNS) { return born + 1.0; }
  return born + 6.0 + 30.0 * h1(f32(i) * 7.31 + 5.0);
}
// how far it has slid by frame t (it gathers speed over its first frames)
fn slid(i: i32, t: f32, pr: vec4<f32>) -> f32 {
  let v = speed(i, pr.z);
  if (v <= 0.0) { return 0.0; }
  let tt = max(t - goes(i, pr.w), 0.0);
  return v * (tt - 3.0 * (1.0 - exp(-tt / 3.0)));
}
// its path's sideways wander at height y
fn wander(i: i32, y: f32) -> f32 {
  let s = f32(i) * 7.31;
  return 0.006 * sin(y * 23.0 + s) + 0.004 * sin(y * 61.0 + 2.0 * s);
}

fn shade(in: FullscreenVertexOutput) -> vec4<f32> {
  let asp = u_aspect();
  let t = u_t();
  let cr = u_cross();
  let uv = in.uv;
  let p = vec2<f32>(uv.x * asp, uv.y);
  // the scene's mean light, for the murk and the film's veil
  var M = vec3<f32>(0.0);
  for (var j = 0; j < 16; j++) {
    M += frame(vec2<f32>((f32(j % 4) + 0.5) / 4.0, (f32(j / 4) + 0.5) / 4.0)).rgb;
  }
  M = M / 16.0;

  let below = p.y - line(p.x, t, cr);
  if (below > 0.0) {
    // under the surface: peat water, a dim brown fog lit from the surface, darker the deeper the look goes
    let dk = clamp(below / 0.8, 0.0, 1.0);
    var m = M * vec3<f32>(0.66, 0.58, 0.44) * mix(1.15, 0.3, sqrt(dk));
    m *= 1.0 + 0.25 * (1.0 - dk) * (vn(vec2<f32>(p.x * 5.0 + t * 0.04, below * 3.0 - t * 0.06)) - 0.5);
    // just under the line, the surface's underside: a rippling mirror (the light is past the critical angle there)
    let rip = vn(vec2<f32>(p.x * 14.0 + t * 0.12, below * 40.0 - t * 0.3)) * vn(vec2<f32>(p.x * 31.0 - t * 0.2, below * 70.0));
    m += M * (0.45 * rip * exp(-below / 0.07) + 0.7 * exp(-below / 0.006));
    // motes hanging in it, out of focus, sparse and of all sizes
    for (var l = 0; l < 3; l++) {
      let sc = 5.0 + 6.0 * f32(l);
      let g = vec2<f32>(p.x * sc + t * 0.008 * f32(l + 1), p.y * sc - t * 0.012 * f32(l + 1)) + vec2<f32>(f32(l) * 3.7);
      let id = floor(g);
      let c = id + vec2<f32>(0.1 + 0.8 * h2(id), 0.1 + 0.8 * h2(id + 3.1));
      let rr = 0.04 + 0.14 * h2(id + 5.3);
      let d = length(g - c);
      let b = step(0.82, h2(id + 7.7)) * (0.3 + 0.7 * h2(id + 9.1));
      m += M * 0.16 * b * (1.0 - 0.8 * dk) * smoothstep(rr, rr * 0.35, d);
    }
    return vec4<f32>(m, 1.0);
  }

  // over it: where the picture is read from, bent by the water on the glass
  var q = p;
  let above = -below;
  // the meniscus just over the line: the water climbing the glass pulls the picture down and catches the light
  q.y += 0.08 * exp(-above / 0.03);
  // the sheet, draining: it thins in a fraction of a second at the top, slower lower down where the water gathers, and
  // runs in streaks as it goes
  let age = t - passed(p.y, cr);
  var film = 0.0;
  if (age > 0.0) { film = exp(-age / (5.0 + 10.0 * p.y)); }
  let fl = vec2<f32>(p.x * 2.4, p.y * 1.3 - max(age, 0.0) * 0.04);
  let st = vec2<f32>(p.x * 11.0, p.y * 0.9 - max(age, 0.0) * 0.06);
  let n0 = vn(fl);
  let s0 = vn(st);
  q += vec2<f32>(n0 - vn(fl + vec2<f32>(0.37, 0.0)), n0 - vn(fl + vec2<f32>(0.0, 0.37))) * 0.14 * film;
  q.x += (s0 - vn(st + vec2<f32>(0.25, 0.0))) * 0.05 * film;
  // the wet trails behind the runs and the sliding drops
  var wet = 0.0;
  for (var i = 0; i < N; i++) {
    let pr = props(i, cr, asp);
    let dy = slid(i, t, pr);
    let y = pr.y + dy;
    if (dy <= 0.0 || p.y < pr.y || p.y > y) { continue; }
    let w = pr.z * select(0.42, 0.6, i < RUNS);
    let dx = p.x - (pr.x + wander(i, p.y));
    let g = exp(-(dx / w) * (dx / w));
    let since = (y - p.y) / max(speed(i, pr.z), 0.002);
    let k = g * exp(-since / select(10.0, 16.0, i < RUNS));
    q.x -= dx * 1.5 * k;
    wet = max(wet, k);
  }
  var c = soft(q, 0.002 + 0.014 * film + 0.004 * wet, asp);
  c = mix(c, M, 0.2 * film);
  c *= 1.0 - 0.15 * wet;
  c += M * 0.5 * exp(-above / 0.005);

  // the drops
  for (var i = 0; i < N; i++) {
    let pr = props(i, cr, asp);
    if (t < pr.w) { continue; }
    let dy = slid(i, t, pr);
    let cen = vec2<f32>(pr.x + wander(i, pr.y + dy), pr.y + dy);
    let r = pr.z;
    if (cen.y - r > 1.05) { continue; }
    let moving = clamp(dy * 20.0, 0.0, 1.0);
    let e = (p - cen) / vec2<f32>(r, r * (1.0 + 0.4 * moving));
    let dd = length(e);
    if (dd >= 1.0) { continue; }
    let a = smoothstep(pr.w, pr.w + 4.0, t) * smoothstep(1.0, 0.75, dd);
    // the scene small and upside down through it, soft; dark at its rim, bright where the light gathers at its foot,
    // and the sky's glint on its top
    var dc = soft(cen - e * r * 2.6, r * 0.22, asp);
    dc *= mix(1.0, 0.4, smoothstep(0.5, 0.97, dd));
    dc += M * 0.55 * smoothstep(0.25, 0.85, e.y) * smoothstep(1.0, 0.78, dd);
    let gl = e - vec2<f32>(-0.32, -0.42);
    dc += M * 0.9 * exp(-dot(gl, gl) / 0.03);
    c = mix(c, dc, a);
  }
  return vec4<f32>(c, 1.0);
}`;

/** the water on the lens at frame t of 01-water: the glass at the surface from frame under, clear of it from out */
export function LensWater({ t, under, out, aspect }: { t: number; under: number; out: number; aspect: number }) {
  return <FramePass at="before-tonemap" wesl={SRC} uniforms={{ t, aspect, cross: [under, out, 0, 0] }} />;
}

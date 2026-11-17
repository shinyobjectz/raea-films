// The road's puddles and the rain landing on it (the director, 11-11, on assembly 22 at 1:02: "can we see some puddles and rain
// impact effects"). A pass over the finished frame (the shot's `post`), in the world: each pixel of the road is put back
// where it lies, and where the asphalt holds water it is a mirror: what stands over it is found along the reflected ray
// in the frame itself (a screen-space march against the depth) and laid in by the water's Fresnel, darker than the
// thing itself, as a puddle on dark asphalt is. Each drop that lands rings out across a puddle (the rings bend what the
// puddle shows) and throws up a small crown of light where it hits. Only where the road is real: it spreads from the
// click with the rest of the place.
import { FramePass } from "raea/3d";
import type { V3 } from "../v2/math";
import type { Cam } from "./cam";
import { lensOf } from "./painting";

const WET_WGSL = /* wgsl */ `
fn rayOf(uv: vec2<f32>) -> vec3<f32> {
  let tn = u_eye().w; let asp = u_fwd().w;
  return normalize(u_fwd().xyz + u_right().xyz * (uv.x * 2.0 - 1.0) * tn * asp - u_up().xyz * (uv.y * 2.0 - 1.0) * tn);
}
/** a world point on the screen: its uv, and its depth along the lens's axis */
fn onScreen(p: vec3<f32>) -> vec3<f32> {
  let d = p - u_eye().xyz; let z = dot(d, u_fwd().xyz);
  let x = dot(d, u_right().xyz) / (max(z, 1e-4) * u_eye().w * u_fwd().w); let y = dot(d, u_up().xyz) / (max(z, 1e-4) * u_eye().w);
  return vec3<f32>((x + 1.0) * 0.5, (1.0 - y) * 0.5, z);
}
fn h21(p: vec2<f32>) -> f32 { return fract(sin(dot(p, vec2<f32>(127.1, 311.7))) * 43758.5453); }
fn h22(p: vec2<f32>) -> vec2<f32> { return vec2<f32>(h21(p), h21(p + vec2<f32>(17.3, 41.9))); }
fn vn(p: vec2<f32>) -> f32 {
  let i = floor(p); let f = fract(p); let u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2<f32>(1.0, 0.0)), u.x), mix(h21(i + vec2<f32>(0.0, 1.0)), h21(i + vec2<f32>(1.0, 1.0)), u.x), u.y);
}
fn fbm(p: vec2<f32>) -> f32 { return 0.55 * vn(p) + 0.3 * vn(p * 2.03 + vec2<f32>(5.2, 1.3)) + 0.15 * vn(p * 4.1 + vec2<f32>(2.7, 8.1)); }
/** how much water lies at a point of the road: puddles strung along the wheel ruts and the crown's low sides */
fn water(q: vec2<f32>) -> f32 {
  let n = fbm(q * vec2<f32>(0.55, 0.24) + vec2<f32>(3.1, 7.7));
  let ruts = exp(-pow((abs(q.x + 1.6) - 0.75) / 0.35, 2.0)) + exp(-pow((abs(q.x - 1.6) - 0.75) / 0.35, 2.0));
  let side = smoothstep(2.6, 3.3, abs(q.x));
  return smoothstep(0.6, 0.66, n + 0.1 * ruts + 0.12 * side);
}
fn shade(in: FullscreenVertexOutput) -> vec4<f32> {
  let uv = in.uv; let c0 = frame(uv);
  let W = u_wet(); let t = W.x;
  if (W.y <= 0.001) { return c0; }
  let z = depth(uv);
  if (z <= 0.0) { return c0; }
  let rd = rayOf(uv); let along = dot(rd, u_fwd().xyz);
  let P = u_eye().xyz + rd * (z / max(along, 0.05));
  // the road only: its flat top, between the verges, out to where the drops are too small to see
  if (abs(P.y - W.z) > 0.08 || abs(P.x) > 3.45) { return c0; }
  let dist = z / max(along, 0.05);
  // where the place is real yet (the reveal's sphere, w its radius; w 0: all of it)
  let R = u_rev();
  let real = select(1.0 - smoothstep(R.w - 1.5, R.w, distance(P, R.xyz)), 1.0, R.w <= 0.0) * W.y;
  if (real <= 0.001) { return c0; }
  let q = P.xz;
  let wet = water(q);
  let near = 1.0 - smoothstep(14.0, 30.0, dist);
  // the drops: one in each 30 cm cell of the road at a time, each landing every 0.8 s at its own phase and its own spot;
  // in water a ring runs out from it, on the asphalt it throws up a crown that is gone in a few hundredths of a second
  var bend = vec2<f32>(0.0); var crown = 0.0; var ring = 0.0;
  let cs = 0.3; let cell = floor(q / cs);
  for (var j = -1; j <= 1; j++) {
    for (var i = -1; i <= 1; i++) {
      let c = cell + vec2<f32>(f32(i), f32(j));
      let hh = h22(c);
      let period = 0.8; let age = fract(t / period + hh.x) * period;
      let at = (c + 0.15 + 0.7 * h22(c + vec2<f32>(floor(t / period + hh.x), 3.0))) * cs;
      let d = length(q - at);
      let r = 0.05 + age * 0.34;
      let fade = (1.0 - age / period); let f2 = fade * fade;
      let x = (d - r) / 0.022;
      let wave = sin(x * 2.2) * exp(-x * x) * f2;
      bend += (q - at) / max(d, 1e-4) * wave;
      ring = max(ring, max(wave, 0.0));
      crown = max(crown, (1.0 - smoothstep(0.018, 0.04, d)) * (1.0 - smoothstep(0.0, 0.09, age)));
    }
  }
  bend *= near * 0.06;
  // the water's mirror: the reflected ray, bent by the rings, marched through the frame until it passes behind what is drawn
  let n = normalize(vec3<f32>(-bend.x, 1.0, -bend.y));
  let r = reflect(rd, n);
  var hit = vec2<f32>(-1.0); var sky = vec2<f32>(-1.0); var s = 0.12;
  for (var k = 0; k < 30; k++) {
    let Q = P + r * s;
    let sp = onScreen(Q);
    if (sp.z <= 0.05 || sp.x < 0.0 || sp.x > 1.0 || sp.y < 0.0 || sp.y > 1.0) { break; }
    let dz = depth(sp.xy);
    if (dz <= 0.0) { sky = sp.xy; }
    else if (dz < sp.z - 0.04) {
      if (dz > sp.z - 0.6 - 0.25 * s) { hit = sp.xy; break; }
    } else { sky = sp.xy; }
    s *= 1.21;
  }
  var refl = frame(vec2<f32>(uv.x, 0.02)).rgb;                // (nothing found on the screen: the sky over the road)
  if (hit.x >= 0.0) { refl = frame(hit).rgb; } else if (sky.x >= 0.0) { refl = frame(sky).rgb; }
  let cosv = clamp(-rd.y, 0.0, 1.0);
  let fres = 0.03 + 0.97 * pow(1.0 - cosv, 5.0);
  // standing water: the asphalt under it darker, the mirror over it (dimmer than the world it shows), its edge damp
  let damp = smoothstep(0.0, 1.0, wet) ;
  var e = c0.rgb * mix(1.0, 0.62, damp);
  e = mix(e, refl * 0.82, wet * clamp(fres * 1.15, 0.0, 0.92));
  // (and the dull sky over the whole road in it, so a puddle reads as water even where it mirrors only dark trees)
  e += vec3<f32>(0.045, 0.05, 0.058) * wet * (0.4 + fres);
  // the rings catch the sky's light on their crests; the crowns more, near the lens
  e += vec3<f32>(0.55, 0.6, 0.66) * (ring * 0.16 * wet * near + length(bend) * 1.5 * wet + crown * 0.5 * near);
  return vec4<f32>(mix(c0.rgb, e, real), c0.a);
}`;

/** the road's water, seen by `cam`, `t` seconds into the shot: `amount` 0..1, the road's top at `y`, real inside the
 *  sphere `reveal` (centre and radius; none: real everywhere) */
export function Wet({ cam, t, amount = 1, y = 0.02, reveal }: { cam: Cam; t: number; amount?: number; y?: number; reveal?: [V3, number] }) {
  return <FramePass wgsl={WET_WGSL} prepass uniforms={{ ...lensOf(cam), wet: [t, amount, y, 0], rev: reveal ? [...reveal[0], reveal[1]] : [0, 0, 0, 0] }} />;
}

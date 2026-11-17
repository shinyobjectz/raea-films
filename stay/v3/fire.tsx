// Fire and water for the opening's worlds (the director, 11-11, on assembly 22: "open in wireframe world here with a ancient
// door here and a torch on the side the cursor lights itself and then it spawns an orb around it"; "somehow the waves
// here splash up ... and that "eextinguishes" the lit cursor"). Each is drawn by a shader on a mesh in the place, so
// it stands in the world, is hidden by what is nearer, and lights nothing by itself (a light goes with each flame).
//   Flame  a burning tongue on a card that always faces the lens: rising turbulence, a hot core, a cooler red edge
//   Smoke  the curl of steam and smoke a flame leaves when it is put out
//   Spray  a sea's burst against a rock: a volume marched through, thrown up and falling back, lit by the sun
import { NoShadowMesh as ShaderMesh } from "./noshadow";
import { PointLight } from "raea/light";
import { Transform } from "raea/transform";
import type { V3 } from "../v2/math";
import type { Cam } from "./cam";

const NOISE = /* wgsl */ `
fn fh(p: vec2<f32>) -> f32 { var q = fract(vec3<f32>(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
fn fn2(p: vec2<f32>) -> f32 { let i = floor(p); let f = fract(p); let u = f * f * (3.0 - 2.0 * f);
  return mix(mix(fh(i), fh(i + vec2<f32>(1.0, 0.0)), u.x), mix(fh(i + vec2<f32>(0.0, 1.0)), fh(i + vec2<f32>(1.0, 1.0)), u.x), u.y); }
fn fbm2(p0: vec2<f32>) -> f32 { var p = p0; var a = 0.5; var s = 0.0; for (var i = 0; i < 5; i++) { s += a * fn2(p); p = p * 2.03 + vec2<f32>(1.7, 9.2); a *= 0.5; } return s; }
`;

// a flame on a card: the card's uv runs 0..1 across and 0 (top) to 1 (foot); u_time its seconds, u_gain its brightness
// (0 out), u_seed its own noise, u_gutter 0..1 as it is put out (it shrinks, goes red and tears apart)
const FLAME = NOISE + /* wgsl */ `
fn shade(in: VertexOutput) -> vec4<f32> {
  let t = u_time() + u_seed() * 13.0; let g = u_gutter();
  let p = vec2<f32>(in.uv.x * 2.0 - 1.0, (1.0 - in.uv.y) * (1.0 + 0.6 * g));       // across -1..1; up from the foot
  let n1 = fbm2(vec2<f32>(p.x * 2.6 + u_seed(), p.y * 3.4 - t * 3.6));
  let n2 = fbm2(vec2<f32>(p.x * 5.5 - 2.0, p.y * 7.0 - t * 6.3));
  let sway = (sin(t * 2.7) * 0.05 + sin(t * 6.1 + 1.0) * 0.025) * p.y * p.y + (n1 - 0.5) * 0.42 * p.y;
  let x = p.x - sway;
  // a teardrop: widest a fifth of the way up, drawn to a point; the tongues torn off its top by the noise
  let w = 0.5 * smoothstep(-0.05, 0.22, p.y) * (1.0 - smoothstep(0.15, 1.0, p.y)) + 0.05;
  let body = 1.0 - smoothstep(w * 0.45, w, abs(x));
  let torn = smoothstep(0.32, 0.62, n2 * 0.9 + (1.0 - p.y) * 0.75 - 0.15 - g * 0.5);
  let d = body * torn * (1.0 - smoothstep(0.62, 1.0, p.y + (n1 - 0.5) * 0.35));
  let core = (1.0 - smoothstep(0.0, w * 0.42, abs(x))) * (1.0 - smoothstep(0.05, 0.42, p.y)) * smoothstep(-0.02, 0.06, p.y);
  let blue = (1.0 - smoothstep(0.0, 0.09, p.y)) * (1.0 - smoothstep(0.0, w * 0.8, abs(x))) * 0.6;
  var c = mix(vec3<f32>(0.9, 0.16, 0.02), vec3<f32>(1.0, 0.5, 0.12), smoothstep(0.1, 0.7, d));
  c = mix(c, vec3<f32>(1.0, 0.86, 0.6), core * (1.0 - g));
  c = c + vec3<f32>(0.15, 0.3, 1.0) * blue * (1.0 - g);
  c = mix(c, vec3<f32>(0.7, 0.08, 0.01), g);
  return vec4<f32>(c * max(d, core * 0.9) * u_gain(), 0.0);   // (alpha 0: Bevy's Add is premultiplied blending, and a shader of its own must say so itself)
}`;

// a flame's halo: the glow a lens sees round a small bright light in the dark, a warm falloff about the flame's middle on
// a card larger than it; u_gain its brightness (it breathes with the flame's flicker)
const HALO = /* wgsl */ `
fn shade(in: VertexOutput) -> vec4<f32> {
  let p = vec2<f32>(in.uv.x * 2.0 - 1.0, (in.uv.y * 2.0 - 1.0) * 1.15);
  let r = length(p);
  let k = exp(-r * r * 14.0) * 0.6 + exp(-r * 5.5) * 0.1 * (1.0 - smoothstep(0.6, 1.0, r));
  return vec4<f32>(vec3<f32>(1.0, 0.55, 0.22) * k * u_gain(), 0.0);
}`;

/** a flame standing on `at` (its foot), `h` metres tall, turned to face the lens; `halo` the brightness of the glow
 *  round it (0 none) */
export function Flame({ name, at, h, cam, t, gain = 1, gutter = 0, seed = 0, light = 0, lightColor = "#ff9a48", shadows = false, halo = 0 }: { name: string; at: V3; h: number; cam: Cam; t: number; gain?: number; gutter?: number; seed?: number; /** its light, lumens (0 none) */ light?: number; lightColor?: string; shadows?: boolean; halo?: number }) {
  const to = [cam.eye[0] - at[0], cam.eye[2] - at[2]], yaw = Math.atan2(to[0], to[1]);
  const w = h * 0.62, mid: V3 = [at[0], at[1] + h * 0.45, at[2]];
  // (the light flickers with the flame: two slow beats and a quick one)
  const flick = 1 + 0.12 * Math.sin(t * 9.1 + seed) + 0.07 * Math.sin(t * 23.7 + 2 * seed) + 0.05 * Math.sin(t * 3.3);
  // (the halo hangs a little toward the lens, so the candle's own wax doesn't cut it)
  const hd = Math.hypot(to[0], to[1]) || 1, hs = h * 2.4;
  const hat: V3 = [mid[0] + (to[0] / hd) * 0.06, mid[1], mid[2] + (to[1] / hd) * 0.06];
  return (
    <>
      <ShaderMesh name={name} shape={{ primitive: "Rectangle", half_size: [w / 2, h / 2] }} position={mid} rotation={[0, yaw, 0]} alpha="add" doubleSided
        wgsl={FLAME} uniforms={{ time: t, gain: gain * 9, seed, gutter }} />
      {halo > 0 && <ShaderMesh name={`${name}-halo`} shape={{ primitive: "Rectangle", half_size: [hs, hs] }} position={hat} rotation={[0, yaw, 0]} alpha="add" doubleSided
        wgsl={HALO} uniforms={{ gain: halo * gain * (0.94 + 0.06 * flick) * (1 - gutter * 0.6) }} />}
      <PointLight name={`${name}-light`} transform={Transform.fromXyz(at[0], at[1] + h * 0.35, at[2])} intensity={Math.max(0, light * flick * (1 - gutter))} range={14} radius={0.04} color={lightColor} shadow_maps_enabled={shadows} />
    </>
  );
}

// smoke: a soft column that rises, curls and thins; u_age 0..1 over its life
const SMOKE = NOISE + /* wgsl */ `
fn shade(in: VertexOutput) -> vec4<f32> {
  let a = u_age(); let t = u_time();
  if (a <= 0.0 || a >= 1.0) { return vec4<f32>(0.0); }
  let p = vec2<f32>(in.uv.x * 2.0 - 1.0, 1.0 - in.uv.y);
  let curl = (fbm2(vec2<f32>(p.y * 2.0 - t * 0.8, 3.0)) - 0.5) * 0.9 * p.y;
  let x = p.x - curl;
  let w = 0.12 + 0.5 * p.y;
  let n = fbm2(vec2<f32>(x * 3.0, p.y * 3.0 - t * 1.6));
  let d = (1.0 - smoothstep(w * 0.3, w, abs(x))) * smoothstep(0.3, 0.7, n) * (1.0 - smoothstep(a * 1.3, a * 1.3 + 0.3, p.y)) * (1.0 - a) * smoothstep(0.0, 0.1, p.y);
  return vec4<f32>(vec3<f32>(0.62, 0.62, 0.64) * u_light(), d * 0.55);
}`;
export function Smoke({ name, at, h, cam, t, age }: { name: string; at: V3; h: number; cam: Cam; t: number; age: number }) {
  const to = [cam.eye[0] - at[0], cam.eye[2] - at[2]], yaw = Math.atan2(to[0], to[1]);
  return <ShaderMesh name={name} shape={{ primitive: "Rectangle", half_size: [h * 0.35, h / 2] }} position={[at[0], at[1] + h / 2, at[2]]} rotation={[0, yaw, 0]} alpha="blend" doubleSided
    wgsl={SMOKE} uniforms={{ time: t, age: Math.min(1, Math.max(-1, age)), light: 1 }} />;
}

// The burst: the sea thrown up where it hits the rock. It is a volume, drawn as a stack of thin cards across the line
// of sight, from just in front of the lens out past the rock: each card shows the spray where it cuts through it, so
// the rock hides what is behind it and the lens can be inside the spray (as it is when it reaches the cursor). The
// water is thrown up from u_base at u_speed metres a second, slowed by gravity and spreading as it rises, its top
// falling back when it has spent its speed; within that envelope the drops are noise, streaked upward while it rises
// and thinning to nothing as it goes. It is lit by the sun (most when we look toward it through the drops: they
// scatter forward) and by the sky, and darkened where thick spray lies between a drop and the sun.
const SPRAY = NOISE + /* wgsl */ `
fn h3(p: vec3<f32>) -> f32 { var q = fract(p * 0.1031); q += dot(q, q.zyx + 31.32); return fract((q.x + q.y) * q.z); }
fn n3(p: vec3<f32>) -> f32 { let i = floor(p); let f = fract(p); let u = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3<f32>(1.0, 0.0, 0.0)), u.x), mix(h3(i + vec3<f32>(0.0, 1.0, 0.0)), h3(i + vec3<f32>(1.0, 1.0, 0.0)), u.x), u.y),
             mix(mix(h3(i + vec3<f32>(0.0, 0.0, 1.0)), h3(i + vec3<f32>(1.0, 0.0, 1.0)), u.x), mix(h3(i + vec3<f32>(0.0, 1.0, 1.0)), h3(i + vec3<f32>(1.0, 1.0, 1.0)), u.x), u.y), u.z); }
fn fbm3(p0: vec3<f32>) -> f32 { var p = p0; var a = 0.5; var s = 0.0; for (var i = 0; i < 4; i++) { s += a * n3(p); p = p * 2.07 + vec3<f32>(3.1, 7.7, 1.3); a *= 0.5; } return s; }
fn spray(p: vec3<f32>) -> f32 {
  let tau = u_tau(); let base = u_base().xyz; let v0 = u_speed();
  if (tau <= 0.0) { return 0.0; }
  let top = max(0.0, v0 * tau - 4.9 * tau * tau);           // the head of the throw
  let fall = smoothstep(v0 / 9.8 * 0.8, v0 / 9.8 + 1.0, tau);     // past its top it falls back and is spent
  let q = p - base;
  let y = q.y;
  if (y < -0.4 || y > top + 1.2) { return 0.0; }
  let hk = clamp(y / max(top, 0.3), 0.0, 1.4);
  // its width: narrow at the foot, fanning out as it rises and as it ages; leaning toward the lens as it goes up
  let off = vec2<f32>(q.x, q.z) - u_lean() * y;
  let r = (0.3 + 1.0 * hk + 0.7 * tau) * u_size();
  let rad = length(off * vec2<f32>(1.0, 1.4)) / r;
  let env = (1.0 - smoothstep(0.5, 1.0, rad)) * (1.0 - smoothstep(0.8, 1.2, hk)) * smoothstep(-0.4, 0.15, y);
  if (env <= 0.001) { return 0.0; }
  // (sheets torn into ropes and the ropes into drops: big lumps of white low down, fine streaked droplets higher and at the edge)
  let n = fbm3(vec3<f32>(p.x * 3.4, p.y * 1.3 - tau * v0 * 0.5, p.z * 3.4) + vec3<f32>(0.0, 0.0, u_seed()));
  // (froth 1, white water breaking on rock: lumps, not streaks; seen close, the streaked drops were white sticks)
  let fr = u_froth();
  let fine = n3(vec3<f32>(p.x * mix(21.0, 11.0, fr), p.y * mix(6.5, 10.0, fr) - tau * 13.0, p.z * mix(21.0, 11.0, fr)));
  let tear = mix(0.35, 0.75, clamp(hk + rad * 0.6, 0.0, 1.0)) * mix(1.0, 0.55, fr);
  let drops = smoothstep(0.42 + 0.2 * hk + 0.25 * fall - 0.08 * fr, 0.74, n * (1.0 - tear * 0.5) + fine * tear * 0.6);
  return env * drops * (1.0 - fall) * 3.2;
}
fn shade(in: VertexOutput) -> vec4<f32> {
  let p = in.world_position.xyz;
  let d = spray(p);
  if (d < 0.002) { return vec4<f32>(0.0); }
  let sun = normalize(u_sun().xyz);
  let rd = normalize(p - view.world_position.xyz);
  let phase = 0.4 + 1.5 * pow(max(dot(rd, sun), 0.0), 5.0);
  let sh = exp(-(spray(p + sun * 0.3) + spray(p + sun * 0.75)) * 0.16);
  let lit = u_sunc().xyz * sh * phase + u_skyc().xyz * (0.6 + 0.4 * clamp((p.y - u_base().y) / 3.0, 0.0, 1.0));
  let k = 1.0 - exp(-d * u_step());
  return vec4<f32>(lit * k, k);
}`;
const SLICES = 30;
/** the burst: `tau` seconds since the sea hit (0 or less: none); drawn in slices across the lens's line of sight */
export function Spray({ name, base, tau, cam, speed = 9, size = 1, lean = [0, 0.4], sun, sunColor, skyColor, seed = 0, near = 0.3, far = 16, froth = 0 }: { name: string; base: V3; tau: number; cam: Cam; speed?: number; size?: number; lean?: [number, number]; sun: V3; sunColor: V3; skyColor: V3; seed?: number; near?: number; far?: number; /** 0 a burst's streaked drops .. 1 white water breaking on rock, in lumps */ froth?: number }) {
  const f = norm3([cam.look[0] - cam.eye[0], cam.look[1] - cam.eye[1], cam.look[2] - cam.eye[2]]);
  const yaw = Math.atan2(-f[0], -f[2]), pitch = Math.asin(Math.max(-1, Math.min(1, f[1])));
  const th = Math.tan((cam.fov * Math.PI) / 360) * 1.2;
  const slices: JSX.Element[] = [];
  for (let i = 0; i < SLICES; i++) {
    // (closer together near the lens, where a card's spacing would show)
    const d0 = near * (far / near) ** (i / SLICES), d1 = near * (far / near) ** ((i + 1) / SLICES), d = (d0 + d1) / 2;
    const at: V3 = [cam.eye[0] + f[0] * d, cam.eye[1] + f[1] * d, cam.eye[2] + f[2] * d];
    const hh = d * th, hw = hh * 1.35;
    slices.push(<ShaderMesh key={i} name={`${name}-${i}`} shape={{ primitive: "Rectangle", half_size: [hw, hh] }} position={at} rotation={[pitch, yaw, 0]} alpha="premultiplied" doubleSided
      wgsl={SPRAY} uniforms={{ tau: tau > 0 ? tau : -1, base: [...base, 0], speed, size, lean, seed, step: d1 - d0, sun: [...sun, 0], sunc: [...sunColor, 0], skyc: [...skyColor, 0], froth }} />);
  }
  return <>{slices}</>;
}
const norm3 = (a: V3): V3 => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

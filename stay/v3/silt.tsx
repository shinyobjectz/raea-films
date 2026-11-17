// Silt: the cloud sand puts up under water where something disturbs it, billowing out low, rising slowly, thinning as it
// goes. Up to eight puffs, each where and when the sand was struck (v3/kelp.tsx: along the foot of the wreck's door as
// it ploughs the bank). Drawn as v3/fire.tsx's Spray is, in slices across the lens's view, and casting no shadow.
import type { V3 } from "../v2/math";
import type { Cam } from "./cam";
import { NoShadowMesh } from "./noshadow";

export type Puff = { at: V3; /** seconds since it was put up (below 0: not yet) */ age: number; /** the way the sand was going */ push: [number, number] };
const SILT = /* wgsl */ `
fn h3(p: vec3<f32>) -> f32 { var q = fract(p * 0.1031); q += dot(q, q.zyx + 31.32); return fract((q.x + q.y) * q.z); }
fn n3(p: vec3<f32>) -> f32 { let i = floor(p); let f = fract(p); let u = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3<f32>(1.0, 0.0, 0.0)), u.x), mix(h3(i + vec3<f32>(0.0, 1.0, 0.0)), h3(i + vec3<f32>(1.0, 1.0, 0.0)), u.x), u.y),
             mix(mix(h3(i + vec3<f32>(0.0, 0.0, 1.0)), h3(i + vec3<f32>(1.0, 0.0, 1.0)), u.x), mix(h3(i + vec3<f32>(0.0, 1.0, 1.0)), h3(i + vec3<f32>(1.0, 1.0, 1.0)), u.x), u.y), u.z); }
fn fbm3(p0: vec3<f32>) -> f32 { var p = p0; var a = 0.5; var s = 0.0; for (var i = 0; i < 4; i++) { s += a * n3(p); p = p * 2.03 + vec3<f32>(3.1, 7.7, 1.3); a *= 0.5; } return s; }
fn puff(p: vec3<f32>, q: vec4<f32>, push: vec2<f32>) -> f32 {
  let age = q.w;
  if (age <= 0.0) { return 0.0; }
  let c = q.xyz + vec3<f32>(push.x * 0.35 * sqrt(age), 0.16 * age, push.y * 0.35 * sqrt(age));
  let r = 0.1 + 0.5 * pow(age, 0.6);
  let d = p - c;
  let fall = exp(-dot(d * vec3<f32>(1.0, 1.7, 1.0), d * vec3<f32>(1.0, 1.7, 1.0)) / (r * r));
  return fall * exp(-age * 0.75) * smoothstep(0.0, 0.08, age);
}
fn silt(p: vec3<f32>) -> f32 {
  var s = 0.0;
  s += puff(p, u_p0(), u_push01().xy); s += puff(p, u_p1(), u_push01().zw);
  s += puff(p, u_p2(), u_push23().xy); s += puff(p, u_p3(), u_push23().zw);
  s += puff(p, u_p4(), u_push45().xy); s += puff(p, u_p5(), u_push45().zw);
  s += puff(p, u_p6(), u_push67().xy); s += puff(p, u_p7(), u_push67().zw);
  if (s < 0.003) { return 0.0; }
  let n = fbm3(p * 4.2 + vec3<f32>(0.0, -u_sun().w * 0.35, 0.0));
  return s * smoothstep(0.3, 0.8, n * 0.9 + s * 0.2) * 5.0 * u_skyc().w;
}
fn shade(in: VertexOutput) -> vec4<f32> {
  let p = in.world_position.xyz;
  let d = silt(p);
  if (d < 0.002) { return vec4<f32>(0.0); }
  let sun = normalize(u_sun().xyz);
  let sh = exp(-(silt(p + sun * 0.12) + silt(p + sun * 0.3)) * 0.1);
  let lit = u_sunc().xyz * sh * (0.5 + 0.5 * sun.y) + u_skyc().xyz;
  let k = 1.0 - exp(-d * u_step());
  return vec4<f32>(lit * k, k);
}`;
const SLICES = 26;
const norm3 = (a: V3): V3 => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
export function Silt({ name, puffs, cam, t, sun, sunColor, skyColor, near = 0.4, far = 14, thick = 1 }: { name: string; puffs: Puff[]; cam: Cam; t: number; sun: V3; sunColor: V3; skyColor: V3; near?: number; far?: number; /** how dense (1: silt under water) */ thick?: number }) {
  const P = Array.from({ length: 8 }, (_, i) => puffs[i] ?? { at: [0, -50, 0] as V3, age: -1, push: [0, 0] as [number, number] });
  const live = P.some((q) => q.age > 0 && q.age < 8);
  const f = norm3([cam.look[0] - cam.eye[0], cam.look[1] - cam.eye[1], cam.look[2] - cam.eye[2]]);
  const yaw = Math.atan2(-f[0], -f[2]), pitch = Math.asin(Math.max(-1, Math.min(1, f[1])));
  const th = Math.tan((cam.fov * Math.PI) / 360) * 1.2;
  const u: Record<string, number[] | number> = { sun: [...sun, t], sunc: [...sunColor, 0], skyc: [...skyColor, thick] };   // (how thick in the sky colour's fourth: a material has at most 16 uniforms)
  P.forEach((q, i) => { u[`p${i}`] = [...q.at, q.age]; });
  for (let i = 0; i < 8; i += 2) u[`push${i}${i + 1}`] = [...P[i].push, ...P[i + 1].push];
  const away: V3 = [cam.eye[0] - f[0] * 50, cam.eye[1] - 300, cam.eye[2] - f[2] * 50];
  return (
    <>
      {Array.from({ length: SLICES }, (_, i) => {
        const d0 = near * (far / near) ** (i / SLICES), d1 = near * (far / near) ** ((i + 1) / SLICES), d = (d0 + d1) / 2;
        const at: V3 = live ? [cam.eye[0] + f[0] * d, cam.eye[1] + f[1] * d, cam.eye[2] + f[2] * d] : away;
        const hh = d * th, hw = hh * 1.35;
        return <NoShadowMesh key={i} name={`${name}-${i}`} shape={{ primitive: "Rectangle", half_size: [hw, hh] }} position={at} rotation={[pitch, yaw, 0]} alpha="premultiplied" doubleSided wgsl={SILT} uniforms={{ ...u, step: d1 - d0 }} />;
      })}
    </>
  );
}

// v9 (the director 11-16, on the computer coming up out of the pond: "any way to use more realistic water physics as it comes
// up and its reaction to the things in the pond"): the water the rising case pushes out, as deep-water waves. The case
// (MON's footprint, a rounded box) sends out a packet every 0.3 s while it rises, each as strong as the case is fast
// then, the first (it breaking the surface) strongest; after it is up, the water pouring off it keeps sending small
// ones. Each packet is two wave trains (2 m and 0.7 m long) whose crests run at the phase speed sqrt(g/k) through an
// envelope moving at half that (the group speed), spreading as 1/sqrt(r) and dying slowly, measured out from the
// case's edge so the fronts run parallel to its sides and round at its corners. One model, two readers: waveAt (the
// pads, the frogs and the reeds ride it: height, tilt, the to-and-fro of the orbits and a push out from the case) and
// WAVES, the shader that paints it on the water (crests lit, troughs shaded, white lines on the crests, foam where the
// water pours off).
import { CUE, G, MON } from "./plan";

const HX = MON.size[0] / 2, HZ = MON.size[2] / 2, RR = 0.6, CX = MON.c[0], CZ = MON.c[2];
const T0 = G(CUE.boil), T1 = G(CUE.boil + CUE.up);
/** seconds when the pond moves at all (the waves die out by the end) */
export const WAVE_SPAN: [number, number] = [T0 - 0.2, T1 + 9];
const TRAINS = [{ k: (2 * Math.PI) / 2.0, a: 1 }, { k: (2 * Math.PI) / 0.7, a: 0.35 }].map((w) => ({ ...w, cp: Math.sqrt(9.8 / w.k), cg: Math.sqrt(9.8 / w.k) / 2 }));
const EM: [number, number][] = [];
for (let te = T0 - 0.1; te < T1 + 3; te += 0.3) {
  const u = Math.min(1, Math.max(0, (te - T0) / (T1 - T0))), v = 6 * u * (1 - u);
  EM.push([te, te < T1 ? 0.045 + 0.06 * v + (te < T0 + 0.25 ? 0.07 : 0) : 0.035 * Math.exp(-(te - T1) / 1.1)]);
}
const SIGMA = 0.9, DAMP = 0.18;
/** how far outside the case's footprint (negative inside it) */
function sd(x: number, z: number) {
  const qx = Math.abs(x - CX) - (HX - RR), qz = Math.abs(z - CZ) - (HZ - RR);
  return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - RR;
}
function field(x: number, z: number, t: number) {
  const d = sd(x, z); let h = 0, o = 0;
  if (d < 0) return { h, o, d };
  for (const [te, a] of EM) {
    const s = t - te; if (s <= 0) continue;
    for (const w of TRAINS) {
      const env = Math.exp(-(((d - w.cg * s - 0.3) / SIGMA) ** 2)) * Math.exp(-DAMP * s) / Math.sqrt(1 + d / 1.5), ph = w.k * (d - w.cp * s);
      h += a * w.a * env * Math.cos(ph); o += a * w.a * env * Math.sin(ph);
    }
  }
  return { h, o, d };
}
/** the water at (x, z) at t: its height over still water, its slope, and how far what floats there is carried (the
 * orbit's to-and-fro along the way out from the case, and a push away from it as it rises) */
export function waveAt(x: number, z: number, t: number) {
  if (t < WAVE_SPAN[0]) return { h: 0, gx: 0, gz: 0, ox: 0, oz: 0 };
  if (t > WAVE_SPAN[1]) {   // the water still: what it pushed out stays out
    const e = 0.05, d = sd(x, z), nx = (sd(x + e, z) - d) / e, nz = (sd(x, z + e) - d) / e, push = 0.35 * Math.exp(-Math.max(0, d) / 3.5);
    return { h: 0, gx: 0, gz: 0, ox: nx * push, oz: nz * push };
  }
  const e = 0.05, f0 = field(x, z, t), fx = field(x + e, z, t), fz = field(x, z + e, t);
  const nx = (sd(x + e, z) - f0.d) / e, nz = (sd(x, z + e) - f0.d) / e;
  const push = 0.35 * Math.min(1, Math.max(0, (t - T0) / (T1 - T0))) * Math.exp(-Math.max(0, f0.d) / 3.5), along = push + 1.2 * f0.o;
  return { h: f0.h, gx: (fx.h - f0.h) / e, gz: (fz.h - f0.h) / e, ox: nx * along, oz: nz * along };
}
const f = (n: number) => n.toFixed(4);
/** the water's wave layer as a pass over the frame (wavepass.tsx): v9's first try, a sheet over the pond with its own
 * surface shader, switched off the film's sticker pass (outlines and shading) for the rest of the render call. Each
 * pixel's ray is met with the water's top; where the frame's depth says that is what the pixel shows, and the pixel is
 * the water's own blue (not a pad, a flower, a frog or the goose), the wave field shades it: slopes facing the sun
 * lighter, away darker, white lines on the crests, foam where the water pours off the case. */
export const WAVE_PASS = /* wgsl */ `
fn sdcase(p: vec2<f32>) -> f32 {
  let q = abs(p - vec2<f32>(${f(CX)}, ${f(CZ)})) - vec2<f32>(${f(HX - RR)}, ${f(HZ - RR)});
  return length(max(q, vec2<f32>(0.0))) + min(max(q.x, q.y), 0.0) - ${f(RR)};
}
fn field(p: vec2<f32>, t: f32) -> vec2<f32> {   // (height, the envelopes' sum)
  let d = sdcase(p); if (d < 0.0) { return vec2<f32>(0.0); }
  var em = array<vec2<f32>, ${EM.length}>(${EM.map(([te, a]) => `vec2<f32>(${f(te)}, ${f(a)})`).join(", ")});
  var h = 0.0; var en = 0.0; let sp = 1.0 / sqrt(1.0 + d / 1.5);
  for (var i = 0; i < ${EM.length}; i++) {
    let s = t - em[i].x; if (s <= 0.0) { continue; }
${TRAINS.map((w) => `    { let q = (d - ${f(w.cg)} * s - 0.3) / ${f(SIGMA)}; let env = exp(-q * q) * exp(-${f(DAMP)} * s) * sp * em[i].y * ${f(w.a)};
      h += env * cos(${f(w.k)} * (d - ${f(w.cp)} * s)); en += env; }`).join("\n")}
  }
  return vec2<f32>(h, en);
}
fn shade(in: FullscreenVertexOutput) -> vec4<f32> {
  let uv = in.uv; let base = frame(uv);
  let E = u_eye(); let F = u_fwd(); let W = u_wat();
  let ndc = vec2<f32>(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0);
  let dir = normalize(F.xyz + u_right().xyz * (ndc.x * E.w * F.w) + u_up().xyz * (ndc.y * E.w));
  if (dir.y > -1e-4 || E.y <= W.x) { return base; }
  let tS = (W.x - E.y) / dir.y;
  let dist = depth(uv) / max(dot(dir, F.xyz), 1e-4);
  if (abs(dist - tS) > 0.04 + 0.01 * tS) { return base; }   // something stands in front of the water here
  let c0 = base.rgb;
  let blue = smoothstep(0.02, 0.1, c0.b - max(c0.r, c0.g * 0.85));   // only the water's own blues
  if (blue <= 0.0) { return base; }
  let p = (E.xyz + dir * tS).xz; let t = W.y; let d = sdcase(p);
  if (d < 0.0) { return base; }
  let e = 0.04; let h0 = field(p, t); let hx = field(p + vec2<f32>(e, 0.0), t).x; let hz = field(p + vec2<f32>(0.0, e), t).x;
  let n = normalize(vec3<f32>(-(hx - h0.x) / e, 1.0, -(hz - h0.x) / e)); let L = normalize(vec3<f32>(0.35, 0.85, 0.4));
  let lit = (dot(n, L) - L.y) * 5.0;   // brighter facing the sun, darker away, against still water
  let crest = smoothstep(0.62, 0.86, h0.x / max(h0.y, 0.002)) * smoothstep(0.006, 0.025, h0.y);
  // foam where the water pours off the case: a churned band at its foot while it rises and a little after
  let pour = smoothstep(${f(T0)}, ${f(T0 + 0.6)}, t) * (1.0 - smoothstep(${f(T1 + 0.5)}, ${f(T1 + 3.5)}, t));
  let churn = 0.5 + 0.5 * sin(p.x * 7.3 + t * 3.1 + sin(p.y * 5.1 - t * 2.3) * 2.0) * sin(p.y * 6.7 - t * 2.7);
  let foam = (1.0 - smoothstep(0.05, 0.9, d)) * pour * smoothstep(0.35, 0.75, churn);
  // shaded from the pixel's own colour, so it holds whatever scale the frame's light is in at this point: slopes
  // facing the sun lighter, away darker; crests and foam toward a white as bright as the water's brightest channel
  let lum = max(c0.r, max(c0.g, c0.b));
  var c = c0 * (1.0 + 0.55 * clamp(lit, -1.0, 1.0));
  c = mix(c, vec3<f32>(lum * 1.3), crest * 0.85);
  c = mix(c, vec3<f32>(lum * 1.35), foam * 0.9);
  let a = blue * (1.0 - smoothstep(14.0, 26.0, tS));   // thinned far off, where the crests would shimmer
  return vec4<f32>(mix(c0, c, a), base.a);
}`;

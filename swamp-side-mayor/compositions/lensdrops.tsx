// Water on the lens (the director 11-16: "when relevant we have water on the lens when we're above the surface, and going
// under the surface we not have water on the lens"). A pass over the finished frame: each drop is a little lens of its
// own, showing the frame through it upside down and squeezed, a dark rim on its upper side, light gathered in a
// crescent along its lower edge and a highlight up top. Big drops slide down after a moment, leaving a faint wet
// streak; all of them shrink away as they dry. When and how many is plan.ts lensDrops(); under the water there are
// none (the film mounts no drops while the lens is under, and a lens that goes under is washed clean).
import { FramePass } from "raea/3d";

const DROPS = /* wgsl */ `
// the sky is the page's own colour behind a clear canvas (film.tsx, #3896d4): a drop over it, or looking through to
// it, shows that blue, and the pass keeps the frame's clear pixels clear so the page still shows round the drops
const SKY = vec3<f32>(0.040, 0.305, 0.658);
fn see(uv: vec2<f32>) -> vec3<f32> { let c = frame(clamp(uv, vec2<f32>(0.001), vec2<f32>(0.999))); return c.rgb + SKY * (1.0 - c.a); }
fn h21(p: vec2<f32>, s: f32) -> f32 { return fract(sin(dot(p, vec2<f32>(127.1, 311.7)) + s * 17.137) * 43758.5453); }
struct Hit { col: vec3<f32>, a: f32 }
fn drop(q: vec2<f32>, uvA: f32, base: vec3<f32>, cell: vec2<f32>, cs: f32, r0: f32, r1: f32, dens: f32, life0: f32, slides: f32, L: f32) -> Hit {
  let A = u_a(); let B = u_b(); var out = Hit(vec3<f32>(0.0), 0.0);
  let h1 = h21(cell, L + A.w); let h2 = h21(cell + 7.3, L + A.w); let h3 = h21(cell + 13.1, L + A.w);
  let h4 = h21(cell + 21.7, L + A.w); let h5 = h21(cell + 31.3, L + A.w); let h6 = h21(cell + 41.9, L + A.w);
  var r = mix(r0, r1, h3 * h3);
  let start = (cell + vec2<f32>(0.5)) * cs + vec2<f32>((h4 - 0.5) * (cs - 2.2 * r), (h5 - 0.5) * (cs - 2.2 * r));
  var keep = dens * A.x;
  if (B.z > 0.0) { let c = vec2<f32>(B.x * uvA, B.y); let d = length(start - c) / B.z; keep = keep * 2.6 * (1.0 - smoothstep(0.35, 1.0, d)); }
  if (h1 >= keep) { return out; }
  let age = A.y - h2 * A.z;
  if (age < 0.0) { return out; }
  let D = u_c().x;   // v8: how much it drips (the orbit's hold: the director 11-16, "have the water drip down")
  let life = life0 * (0.6 + 0.8 * h6) * (1.0 + 0.8 * D);
  r = r * (0.55 + 0.45 * smoothstep(0.0, 0.07, age)) * (1.0 - smoothstep(0.65 * life, life, age));
  if (r < 0.0015) { return out; }
  // big drops let go after a moment and run down, faster as they go, stretching as they run
  let go = select(0.0, max(0.0, age - mix(0.25 + 0.9 * h6, 0.1 + 0.5 * h6, D)), h4 > 1.0 - mix(slides, 0.85, D));
  let fall = (0.16 + 0.22 * D) * go * go * (1.0 + h3);
  let c = start + vec2<f32>(0.0, fall);
  let ry = r * (1.0 + min(0.7, 1.6 * go));
  var dv = (q - c) / vec2<f32>(r, ry);
  let l = length(dv);
  if (l < 1.0) {
    let z = sqrt(max(0.0, 1.0 - l * l));
    let qq = c - dv * vec2<f32>(r, ry) * 2.4;                         // the view through it, upside down and wider
    let seen = see(vec2<f32>(qq.x / uvA, qq.y));
    var col = seen * (0.82 + 0.28 * z);
    col = col * (1.0 - 0.5 * smoothstep(0.62, 1.0, l) * smoothstep(0.3, -0.6, dv.y));   // the rim darkens on its upper side
    col = col + vec3<f32>(0.42, 0.46, 0.48) * smoothstep(0.6, 0.97, l) * smoothstep(0.05, 0.75, dv.y);   // light gathered below
    let s = 1.0 - smoothstep(0.0, 0.3, length(dv - vec2<f32>(-0.34, -0.44)));
    col = col + vec3<f32>(1.0, 0.99, 0.95) * (s * s * 1.1);
    let aa = 2.5 / (1080.0 * r);
    out = Hit(col, smoothstep(1.0, 1.0 - aa, l));
    return out;
  }
  // the streak a running drop leaves: a thin wet line above it, fading
  if (fall > r && abs(q.x - c.x) < 0.3 * r && q.y < c.y && q.y > start.y) {
    let k = 1.0 - (c.y - q.y) / max(fall, 1e-4);
    let w = 1.0 - abs(q.x - c.x) / (0.3 * r);
    let seen = see(vec2<f32>((q.x + 0.004) / uvA, q.y));
    out = Hit(seen * 1.08 + vec3<f32>(0.05), 0.35 * w * (0.3 + 0.7 * k) * (1.0 - smoothstep(0.65 * life, life, age)));
  }
  return out;
}
fn shade(in: FullscreenVertexOutput) -> vec4<f32> {
  let uv = in.uv; let b4 = frame(uv); let A = u_a(); let B = u_b();
  if (A.x <= 0.0) { return b4; }
  let base = see(uv); var cover = 0.0;
  let uvA = B.w; let q = vec2<f32>(uv.x * uvA, uv.y);
  var col = base;
  // three sizes: a few big drops (some run), more middling ones, a mist of small ones; a big one covers the rest
  var CS = array<f32, 3>(0.14, 0.08, 0.045);
  var R0 = array<f32, 3>(0.022, 0.010, 0.0035);
  var R1 = array<f32, 3>(0.044, 0.020, 0.0075);
  var DN = array<f32, 3>(0.24, 0.2, 0.14);
  var LF = array<f32, 3>(3.4, 2.6, 1.7);
  var SL = array<f32, 3>(0.45, 0.25, 0.0);
  var UP = array<i32, 3>(3, 2, 0);
  for (var L = 2; L >= 0; L = L - 1) {
    let cs = CS[L]; let cx = floor(q.x / cs); let cy = floor(q.y / cs);
    for (var k = 0; k <= UP[L]; k = k + 1) {
      let hit = drop(q, uvA, base, vec2<f32>(cx, cy - f32(k)), cs, R0[L], R1[L], DN[L], LF[L], SL[L], f32(L) * 3.7);
      if (hit.a > 0.0) { col = mix(col, hit.col, hit.a); cover = max(cover, hit.a); }
    }
  }
  if (cover <= 0.0) { return b4; }
  return vec4<f32>(mix(b4.rgb, col, cover), cover + b4.a * (1.0 - cover));
}`;

/** the drops on the lens: `amount` 0 draws none; `age` seconds since they landed; `spread` seconds over which they
 * land (0 all at once); `seed`; `at` (uv, y down) and `reach` (screen heights) gather them round one spot, 0 none */
export function LensDrops({ amount, age, spread, seed, at = [0.5, 0.5], reach = 0, aspect = 2, drip = 0 }: { amount: number; age: number; spread: number; seed: number; at?: [number, number]; reach?: number; aspect?: number; drip?: number }) {
  return <FramePass wesl={DROPS} uniforms={{ a: [amount, age, spread, seed], b: [at[0], at[1], reach, aspect], c: [drip, 0, 0, 0] }} />;
}

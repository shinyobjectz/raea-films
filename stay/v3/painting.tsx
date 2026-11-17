// The garden becomes a painting (the director, 11-11: "for the garden sequence since i think it lands on stay could we have it
// come in a feww beats ealier on a pull out no cursor and then as we pull out stay in painted letters appears liek this
// [a gilt-framed landscape with HOME SWEET HOME brushed over it in white, running] and we zoom out to see it is a
// painting on a wall").
// The garden at dusk, pulled out of; it turns to oil paint as we go (OilLook: the frame laid in strokes that follow its
// edges, on a canvas's weave), and S, T, A, Y are brushed over it in white house paint, a letter a beat, the paint
// running (Letters). Then it is the picture in a carved gilt frame on the kid's bedroom wall (blender/painting-frame.py),
// and the pull-out goes on into his room. The picture on the canvas is the garden's own last frame (tools/painting.sh
// renders it: v3s-garden), drawn over the room's finished frame as the doorways' pictures are (CanvasPicture), so at
// the join the frame is the garden's, pixel for pixel.
// Two shots, "garden" and "painting" (v3/plan.ts), cut on that join: a render keeps every entity it ever spawns, so as
// one shot the bedroom stood in the garden from its first frame (a dark mass over the table), and the room's sun kept the
// garden's dusk strength in the traced light.
import { staticFile } from "raea";
import { FramePass } from "raea/3d";
import type { Part } from "../parts/library";
import { RZ, WALL } from "../sets/rooms";
import type { V3 } from "../v2/math";
import type { Cam } from "./cam";
import { H, LETTER_FIT, TALL, W } from "./plan";

/** the canvas's middle, on its face (the frame's back is 1.6 cm behind it, against the far wall) */
export const PAINTING_AT: V3 = [-0.1, 1.78, -RZ + WALL + 0.021];
/** the canvas's half width and height: the film's own shape */
export const PAINTING_HALF: [number, number] = [0.5, 0.4];
export const PAINTING: Part = { place: "kidsroom", file: "painting-frame", at: PAINTING_AT, yaw: 0, name: "painting" } as Part;
/** the frame's box, for the drawing (real inside it): the frame is 1.54 m by 1.35 m, 18 cm deep. It is a quiet box (Look
 *  quiet), a few centimetres clear of the frame all round and 30 cm out from the wall, but its back stops half a
 *  centimetre in front of the canvas's face so the wall behind stays drawn (the wall is 2.1 cm behind the canvas) */
export const PAINTING_BOX: [V3, V3] = [[PAINTING_AT[0] - 0.8, PAINTING_AT[1] - 0.7, PAINTING_AT[2] - 0.005], [PAINTING_AT[0] + 0.8, PAINTING_AT[1] + 0.7, PAINTING_AT[2] + 0.3]];
/** how much of the canvas the frame's lip leaves open, as a part of it: the lip covers up to 8 mm of each edge, so the
 *  lens at the join frames only the open 1/OPEN of the canvas, and the still is made that much wider (gardenStill) */
export const OPEN = 1.03;
/** the lens that sees the canvas's open part fill the frame exactly, with a lens of `fov` */
export const fillCam = (fov: number): Cam => {
  const d = PAINTING_HALF[1] / OPEN / Math.tan((fov * Math.PI) / 360);
  return { eye: [PAINTING_AT[0], PAINTING_AT[1], PAINTING_AT[2] + d], look: [PAINTING_AT[0], PAINTING_AT[1], PAINTING_AT[2]], fov };
};

/** a lens as a pass's uniforms: eye (w the half-height's tangent), forward (w the frame's aspect), right, up */
export const lensOf = (cam: Cam) => {
  const fl = [cam.look[0] - cam.eye[0], cam.look[1] - cam.eye[1], cam.look[2] - cam.eye[2]], l = Math.hypot(...fl), fw: V3 = [fl[0] / l, fl[1] / l, fl[2] / l];
  const rl = Math.hypot(fw[2], fw[0]) || 1, r: V3 = [-fw[2] / rl, 0, fw[0] / rl], u: V3 = [r[1] * fw[2] - r[2] * fw[1], r[2] * fw[0] - r[0] * fw[2], r[0] * fw[1] - r[1] * fw[0]];
  return { eye: [...cam.eye, Math.tan((cam.fov * Math.PI) / 360)], fwd: [...fw, W / H], right: [...r, 0], up: [...u, 0] };
};

// ---- the oil: an anisotropic Kuwahara filter (Kyprianidis, Kang and Döllner 2009, with the polynomial sector weights
// of their 2010 paper) in one pass: each pixel takes the calmest of eight sectors of an ellipse laid along the edge it is
// on, so flat areas go to dabs and edges to long strokes; then the strokes' bristles along that same line, the weave of
// the canvas under them, and a varnish's warmth.
const OIL_WGSL = /* wgsl */ `
fn lum(c: vec3<f32>) -> f32 { return dot(c, vec3<f32>(0.299, 0.587, 0.114)); }
fn ld(p: vec2<i32>, dim: vec2<i32>) -> vec3<f32> { return textureLoad(raea_frame, clamp(p, vec2<i32>(0), dim - vec2<i32>(1)), 0).rgb; }
fn h21(p: vec2<f32>) -> f32 { return fract(sin(dot(p, vec2<f32>(127.1, 311.7))) * 43758.5453); }
fn vn(p: vec2<f32>) -> f32 {
  let i = floor(p); let f = fract(p); let u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2<f32>(1.0, 0.0)), u.x), mix(h21(i + vec2<f32>(0.0, 1.0)), h21(i + vec2<f32>(1.0, 1.0)), u.x), u.y);
}
fn shade(in: FullscreenVertexOutput) -> vec4<f32> {
  let c0 = frame(in.uv);
  let P = u_oil();
  if (P.x <= 0.001) { return c0; }
  let dimu = textureDimensions(raea_frame); let dim = vec2<i32>(dimu);
  let s = f32(min(dimu.x, dimu.y)) / 1080.0;
  let p = vec2<i32>(in.uv * vec2<f32>(dimu));
  // the structure tensor: Sobel gradients, averaged over 3x3
  var E = 0.0; var F = 0.0; var G = 0.0;
  let st = max(1, i32(round(s)));
  for (var j = -1; j <= 1; j++) {
    for (var i = -1; i <= 1; i++) {
      let q = p + vec2<i32>(i, j) * st;
      let a = lum(ld(q + vec2<i32>(-st, -st), dim)); let b = lum(ld(q + vec2<i32>(0, -st), dim)); let c = lum(ld(q + vec2<i32>(st, -st), dim));
      let d = lum(ld(q + vec2<i32>(-st, 0), dim)); let f = lum(ld(q + vec2<i32>(st, 0), dim));
      let g = lum(ld(q + vec2<i32>(-st, st), dim)); let h = lum(ld(q + vec2<i32>(0, st), dim)); let k = lum(ld(q + vec2<i32>(st, st), dim));
      let gx = (c + 2.0 * f + k) - (a + 2.0 * d + g); let gy = (g + 2.0 * h + k) - (a + 2.0 * b + c);
      E += gx * gx; F += gx * gy; G += gy * gy;
    }
  }
  E /= 9.0; F /= 9.0; G /= 9.0;
  let disc = sqrt(max(0.0, (E - G) * (E - G) + 4.0 * F * F));
  let l1 = 0.5 * (E + G + disc); let l2 = 0.5 * (E + G - disc);
  var tv = vec2<f32>(l1 - E, -F);
  if (length(tv) < 1e-6) { tv = vec2<f32>(0.0, 1.0); } else { tv = normalize(tv); }
  let phi = -atan2(tv.y, tv.x);
  let A = select(0.0, (l1 - l2) / (l1 + l2), l1 + l2 > 1e-8);
  let R = P.y * s;
  let ea = R * clamp(1.0 + A, 0.1, 1.7); let eb = R * clamp(1.0 / (1.0 + A), 0.1, 1.7);
  let cph = cos(phi); let sph = sin(phi);
  let mx = i32(ceil(sqrt(ea * ea * cph * cph + eb * eb * sph * sph)));
  let my = i32(ceil(sqrt(ea * ea * sph * sph + eb * eb * cph * cph)));
  let zeta = 2.0 / max(P.y, 1.0);
  let zc = 0.58; let sz = sin(zc);
  let eta = (zeta + cos(zc)) / (sz * sz);
  var m: array<vec4<f32>, 8>;
  var sq: array<vec3<f32>, 8>;
  var w: array<f32, 8>;
  for (var y = -my; y <= my; y++) {
    for (var x = -mx; x <= mx; x++) {
      let fx = f32(x); let fy = f32(y);
      var v = vec2<f32>((cph * fx - sph * fy) * 0.5 / ea, (sph * fx + cph * fy) * 0.5 / eb);
      let vv = dot(v, v);
      if (vv > 0.25) { continue; }
      let c = clamp(ld(p + vec2<i32>(x, y), dim), vec3<f32>(0.0), vec3<f32>(1.0));
      var sum = 0.0;
      var vxx = zeta - eta * v.x * v.x; var vyy = zeta - eta * v.y * v.y;
      var z = max(0.0, v.y + vxx); w[0] = z * z; sum += w[0];
      z = max(0.0, -v.x + vyy); w[2] = z * z; sum += w[2];
      z = max(0.0, -v.y + vxx); w[4] = z * z; sum += w[4];
      z = max(0.0, v.x + vyy); w[6] = z * z; sum += w[6];
      v = 0.70710678 * vec2<f32>(v.x - v.y, v.x + v.y);
      vxx = zeta - eta * v.x * v.x; vyy = zeta - eta * v.y * v.y;
      z = max(0.0, v.y + vxx); w[1] = z * z; sum += w[1];
      z = max(0.0, -v.x + vyy); w[3] = z * z; sum += w[3];
      z = max(0.0, -v.y + vxx); w[5] = z * z; sum += w[5];
      z = max(0.0, v.x + vyy); w[7] = z * z; sum += w[7];
      let g = exp(-3.125 * vv) / max(sum, 1e-6);
      for (var k = 0; k < 8; k++) { let wk = w[k] * g; m[k] += vec4<f32>(c * wk, wk); sq[k] += c * c * wk; }
    }
  }
  var acc = vec4<f32>(0.0);
  for (var k = 0; k < 8; k++) {
    if (m[k].w <= 1e-6) { continue; }
    let mu = m[k].rgb / m[k].w;
    let vr = abs(sq[k] / m[k].w - mu * mu);
    let wk = 1.0 / (1.0 + pow(8.0 * 1000.0 * (vr.r + vr.g + vr.b), 4.0));
    acc += vec4<f32>(mu * wk, wk);
  }
  var col = select(c0.rgb, acc.rgb / acc.w, acc.w > 1e-6);
  // the bristles: fine streaks along the stroke (the edge's line), stronger where the edge is strong
  let pp = in.uv * vec2<f32>(dimu) / s;
  let along = dot(pp, tv); let across = dot(pp, vec2<f32>(-tv.y, tv.x));
  let br = vn(vec2<f32>(across * 0.9, along * 0.07)) - 0.5;
  col *= 1.0 + br * (0.05 + 0.07 * A);
  // the canvas's weave under the paint, and a little varnish: warm in the lights, the blacks lifted, a touch more colour
  let wv = sin(pp.x * 1.85) * sin(pp.y * 1.85);
  col *= 1.0 + 0.022 * wv;
  let l = lum(col);
  col = mix(vec3<f32>(l), col, 1.12);
  col = col * vec3<f32>(1.03, 1.0, 0.93) + vec3<f32>(0.012, 0.010, 0.006);
  return vec4<f32>(mix(c0.rgb, clamp(col, vec3<f32>(0.0), vec3<f32>(1.0)), P.x), c0.a);
}`;
/** the frame turned to oil paint, `k` (0..1) of the way */
export function OilLook({ k, radius = 6 }: { k: number; radius?: number }) {
  return <FramePass wgsl={OIL_WGSL} uniforms={{ oil: [k, radius, 0, 0] }} />;
}

// ---- the letters ---------------------------------------------------------------------------------------------------
// STAY, brushed in white house paint with a wide brush, a letter a beat: each a stroke or three, laid at a brush's pace
// (quick in the middle, slow at the ends), the bristles streaking along it and dry at its edges and its end; runs of
// paint start down from its lower edges a moment after and slow as they go, each with a bead at its foot; and a few
// flecks thrown off it. The frame's own measure: x across 0 to W/H, y down 0 to 1.
type Pt = [number, number];
const LETTERS: Record<string, Pt[][]> = {
  S: [[[0.93, 0.13], [0.62, 0.0], [0.24, 0.04], [0.06, 0.24], [0.26, 0.45], [0.74, 0.55], [0.95, 0.76], [0.78, 0.96], [0.4, 1.0], [0.04, 0.87]]],
  T: [[[0.0, 0.05], [0.5, 0.0], [1.0, 0.04]], [[0.5, 0.03], [0.48, 0.52], [0.51, 1.0]]],
  A: [[[0.03, 1.0], [0.27, 0.48], [0.5, 0.0]], [[0.5, 0.0], [0.75, 0.5], [0.97, 1.0]], [[0.2, 0.66], [0.8, 0.64]]],
  Y: [[[0.03, 0.0], [0.27, 0.28], [0.5, 0.52]], [[0.97, 0.0], [0.73, 0.28], [0.5, 0.52], [0.5, 0.77], [0.49, 1.0]]],
};
/** the runs: where on the letter (its own box), how long (of the letter's height), how long after it is begun */
const DRIPS: Record<string, [number, number, number, number][]> = {
  S: [[0.14, 0.92, 0.32, 0.55], [0.56, 0.99, 0.46, 0.62], [0.86, 0.66, 0.2, 0.5]],
  T: [[0.13, 0.07, 0.28, 0.3], [0.83, 0.06, 0.52, 0.34], [0.5, 1.0, 0.36, 0.55]],
  A: [[0.33, 0.69, 0.42, 0.45], [0.63, 0.68, 0.22, 0.5], [0.96, 1.0, 0.26, 0.62]],
  Y: [[0.5, 1.0, 0.58, 0.5], [0.31, 0.34, 0.2, 0.3]],
};
const WORD = "STAY", BOX_W = 0.19, BOX_H = 0.36, GAP = 0.045, TOP = 0.26, R = 0.031, LETTER_S = 0.44;
/** the word drawn smaller when its window is narrower than it (the tall frame: 0.54 of its 5:4 size), around the same
 *  middle: everything it lays down (strokes, brush, runs, flecks) scales by K */
const WORD_W = WORD.length * BOX_W + (WORD.length - 1) * GAP, K = Math.min(1, ((LETTER_FIT < 1 ? 0.72 : 0.86) * LETTER_FIT) / WORD_W), YC = TOP + BOX_H / 2;
const hash = (i: number) => { const x = Math.sin(i * 91.345 + 47.853) * 43758.5453; return x - Math.floor(x); };
/** the inverse of smoothstep: when (0..1 of the time) a stroke at that pace has reached a point (0..1 of the way) */
const unease = (u: number) => 0.5 - Math.sin(Math.asin(1 - 2 * Math.min(1, Math.max(0, u))) / 3);
const catmull = (pts: Pt[], n = 4): Pt[] => {
  if (pts.length < 3) return Array.from({ length: n + 1 }, (_, i) => [pts[0][0] + (pts[1][0] - pts[0][0]) * (i / n), pts[0][1] + (pts[1][1] - pts[0][1]) * (i / n)] as Pt);
  const out: Pt[] = [];
  for (let k = 0; k < pts.length - 1; k++) {
    const p0 = pts[Math.max(0, k - 1)], p1 = pts[k], p2 = pts[k + 1], p3 = pts[Math.min(pts.length - 1, k + 2)];
    for (let i = 0; i < n; i++) {
      const t = i / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)) as Pt);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
};
const f = (x: number) => x.toFixed(5);
/** the letters' strokes, runs and flecks as the shader's constants, each letter begun at its time in `at` */
function lettering(at: number[]) {
  const aspect = W / H, x0 = -WORD_W / 2;
  const seg: string[] = [], sk: string[] = [], tim: string[] = [], drip: string[] = [], dw: string[] = [], fleck: string[] = [];
  let id = 0;
  [...WORD].forEach((ch, li) => {
    const bx = x0 + li * (BOX_W + GAP), place = ([u, v]: Pt): Pt => [aspect / 2 + K * (bx + u * BOX_W), YC + K * (TOP + v * BOX_H - YC)];
    const strokes = LETTERS[ch].map((st, si) => catmull(st.map(([u, v], k) => [u + 0.03 * (hash(li * 50 + si * 9 + k) - 0.5), v + 0.025 * (hash(li * 50 + si * 9 + k + 31) - 0.5)] as Pt)).map(place));
    const lens = strokes.map((st) => st.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - st[i][0], p[1] - st[i][1]), 0));
    const total = lens.reduce((a, b) => a + b, 0), pause = 0.05, span = LETTER_S - pause * (strokes.length - 1);
    let t = at[li];
    strokes.forEach((st, si) => {
      const d = span * (lens[si] / total);
      let run = 0;
      for (let i = 0; i < st.length - 1; i++) {
        const a = st[i], b = st[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const u0 = run / lens[si], u1 = (run + l) / lens[si];
        seg.push(`vec4<f32>(${f(a[0])}, ${f(a[1])}, ${f(b[0])}, ${f(b[1])})`);
        tim.push(`vec4<f32>(${f(t + d * unease(u0))}, ${f(t + d * unease(u1))}, ${f(u0)}, ${f(u1)})`);
        sk.push(`vec2<f32>(${id}.0, ${f(lens[si])})`);
        run += l;
      }
      t += d + pause; id++;
    });
    for (const [u, v, len, after] of DRIPS[ch]) {
      const [x, y] = place([u, v]);
      drip.push(`vec4<f32>(${f(x)}, ${f(y)}, ${f(K * len * BOX_H * (0.8 + 0.4 * hash(id * 7 + u * 13)))}, ${f(at[li] + after)})`);
      dw.push(`vec4<f32>(${f(K * R * (0.36 + 0.14 * hash(id * 3 + v * 17)))}, ${f(0.55 + 0.4 * hash(id + u * 29))}, 0.0, 0.0)`);
      id++;
    }
    for (let k = 0; k < 3; k++) {
      const [x, y] = place([-0.15 + 1.3 * hash(li * 17 + k), -0.1 + 1.25 * hash(li * 23 + k + 5)]);
      fleck.push(`vec4<f32>(${f(x)}, ${f(y)}, ${f(K * (0.0016 + 0.0042 * hash(li * 29 + k)))}, ${f(at[li] + 0.15 + 0.3 * hash(li * 31 + k))})`);
    }
  });
  return { seg, sk, tim, drip, dw, fleck };
}
const lettersWgsl = (at: number[]) => {
  const L = lettering(at);
  return /* wgsl */ `
const NS: i32 = ${L.seg.length};
var<private> SG = array<vec4<f32>, ${L.seg.length}>(${L.seg.join(", ")});
var<private> ST = array<vec4<f32>, ${L.tim.length}>(${L.tim.join(", ")});
var<private> SK = array<vec2<f32>, ${L.sk.length}>(${L.sk.join(", ")});
const ND: i32 = ${L.drip.length};
var<private> DR = array<vec4<f32>, ${L.drip.length}>(${L.drip.join(", ")});
var<private> DW = array<vec4<f32>, ${L.dw.length}>(${L.dw.join(", ")});
const NF: i32 = ${L.fleck.length};
var<private> FL = array<vec4<f32>, ${L.fleck.length}>(${L.fleck.join(", ")});
const RAD: f32 = ${f(K * R)};
fn h21(p: vec2<f32>) -> f32 { return fract(sin(dot(p, vec2<f32>(127.1, 311.7))) * 43758.5453); }
fn vn(p: vec2<f32>) -> f32 {
  let i = floor(p); let f = fract(p); let u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2<f32>(1.0, 0.0)), u.x), mix(h21(i + vec2<f32>(0.0, 1.0)), h21(i + vec2<f32>(1.0, 1.0)), u.x), u.y);
}
fn shade(in: FullscreenVertexOutput) -> vec4<f32> {
  let c0 = frame(in.uv);
  let I = u_ink(); let t = I.x;
  if (I.z <= 0.0 || t < ST[0].x) { return c0; }
  let dimu = textureDimensions(raea_frame);
  // (I.w: the zoom out of the film's frame, for the still made wider than it: gardenStill)
  let Z = select(1.0, I.w, I.w > 0.0);
  let px = Z / f32(dimu.y);
  let uz = 0.5 + (in.uv - 0.5) * Z;
  let q = vec2<f32>(uz.x * I.y, uz.y);
  var cover = 0.0; var bright = 1.0;
  for (var i = 0; i < NS; i++) {
    let tm = ST[i];
    if (t < tm.x) { continue; }
    let s = SG[i]; let a = s.xy; let ab = s.zw - s.xy; let L2 = max(dot(ab, ab), 1e-9); let L = sqrt(L2);
    if (abs(q.x - 0.5 * (a.x + s.z)) > 0.5 * abs(ab.x) + 0.05 || abs(q.y - 0.5 * (a.y + s.w)) > 0.5 * abs(ab.y) + 0.05) { continue; }
    let h = clamp(dot(q - a, ab) / L2, 0.0, 1.0);
    let reveal = clamp((t - tm.x) / max(tm.y - tm.x, 1e-4), 0.0, 1.0);
    let d = length(q - (a + ab * min(h, reveal)));
    let u = mix(tm.z, tm.w, min(h, reveal));
    // the brush loaded at the start of its stroke, thinning and drying toward its end
    let id = SK[i].x; let along = u * SK[i].y;
    let r = RAD * (1.06 - 0.22 * u * u) * (0.92 + 0.16 * vn(vec2<f32>(along / RAD * 0.9, id * 5.0)));
    let e = 1.0 - smoothstep(r - 1.2 * px, r + 0.6 * px, d);
    if (e <= 0.0) { continue; }
    // the bristles: long streaks along the stroke (measured along the whole stroke, so they run on through its bends)
    let across = dot(q - a, vec2<f32>(-ab.y, ab.x) / L) / r;
    let bristle = vn(vec2<f32>(across * 5.5 + id * 3.1, along / RAD * 0.07));
    let dry = smoothstep(0.66, 1.0, d / r) * 0.7 + smoothstep(0.75, 1.0, u) * 0.45;
    let k = e * (1.0 - step(bristle, dry * 0.7));
    if (k > cover) { cover = k; bright = 0.9 + 0.1 * bristle + 0.03 * (1.0 - d / r); }
  }
  for (var i = 0; i < ND; i++) {
    let D = DR[i]; let Wd = DW[i];
    if (t < D.w) { continue; }
    let len = D.z * (1.0 - exp(-(t - D.w) / Wd.y));
    let w = Wd.x;
    // (a run leaves the letter from inside its edge, wide where it leaves and narrowing, its foot a drop a little fuller)
    let y0 = D.y - 1.6 * w; let y1 = D.y + len;
    let cy = clamp(q.y, y0, y1);
    let fall = (cy - y0) / max(y1 - y0, 1e-4);
    let wy = w * (0.82 + 0.6 * (1.0 - fall) * (1.0 - fall));
    let cx = D.x + ${f(0.0018 * K)} * sin(cy * ${f(37 / K)} + f32(i) * 1.7);
    var dd = 1e9;
    if (q.y >= y0 && q.y <= y1) { dd = abs(q.x - cx) - wy; }
    dd = min(dd, length(vec2<f32>(q.x - cx, (q.y - y1) / 1.35)) - w * 1.08);
    let e = 1.0 - smoothstep(-1.0 * px, 0.8 * px, dd);
    if (e > cover) { cover = e; bright = 0.93 + 0.07 * clamp(-dd / w, 0.0, 1.0); }
  }
  for (var i = 0; i < NF; i++) {
    let F = FL[i];
    if (t < F.w) { continue; }
    let e = 1.0 - smoothstep(-0.8 * px, 0.8 * px, length(q - F.xy) - F.z * min(1.0, (t - F.w) / 0.05));
    if (e > cover) { cover = e; bright = 0.95; }
  }
  if (cover <= 0.0) { return c0; }
  // a hair of shade where the paint stands thick, as house paint over oil does
  let paint = vec3<f32>(0.955, 0.945, 0.905) * bright;
  return vec4<f32>(mix(c0.rgb, paint, cover * I.z), c0.a);
}`;
};
const LETTER_CACHE = new Map<string, string>();
/** S, T, A, Y brushed on, each letter begun at its second in `at` (the shot's own seconds), seen at `t`; `zoom` above 1
 *  for a frame that sees that much wider than the film's (the still), so the letters stay where they are in the world */
export function Letters({ t, at, alpha = 1, zoom = 1 }: { t: number; at: number[]; alpha?: number; zoom?: number }) {
  const key = at.join(",");
  if (!LETTER_CACHE.has(key)) LETTER_CACHE.set(key, lettersWgsl(at));
  return <FramePass wgsl={LETTER_CACHE.get(key)!} uniforms={{ ink: [t, W / H, alpha, zoom] }} />;
}

// ---- the picture on the canvas ---------------------------------------------------------------------------------------
const CANVAS_WGSL = /* wgsl */ `
fn rayOf(uv: vec2<f32>) -> vec3<f32> {
  let tn = u_eye().w; let asp = u_fwd().w;
  return normalize(u_fwd().xyz + u_right().xyz * (uv.x * 2.0 - 1.0) * tn * asp - u_up().xyz * (uv.y * 2.0 - 1.0) * tn);
}
fn onCanvas(uv: vec2<f32>) -> vec3<f32> {
  let rd = rayOf(uv); let eye = u_eye().xyz;
  let tp = (u_cv().z - eye.z) / select(rd.z, -1e-6, abs(rd.z) < 1e-6);
  let hit = eye + rd * tp;
  return vec3<f32>(0.5 + (hit.x - u_cv().x) / (2.0 * u_cvh().x), 0.5 - (hit.y - u_cv().y) / (2.0 * u_cvh().y), tp);
}
fn shade(in: FullscreenVertexOutput) -> vec4<f32> {
  let uv = in.uv; let c0 = frame(uv);
  if (u_cvh().z < 0.5) { return c0; }
  let c = onCanvas(uv);
  if (c.z <= 0.0 || c.x < 0.0 || c.x > 1.0 || c.y < 0.0 || c.y > 1.0) { return c0; }
  // what stands in front of the canvas stays (the frame's lip, the room's things)
  let rd = rayOf(uv); let z = depth(uv); let along = dot(rd, u_fwd().xyz);
  if (z > 0.0 && z <= c.z * along - 0.01) { return c0; }
  // how much of the picture one pixel covers, and as many samples across it (the picture has no smaller copies)
  let dimu = textureDimensions(raea_frame); let pd = vec2<f32>(textureDimensions(tex_pic));
  let ex = onCanvas(uv + vec2<f32>(1.0 / f32(dimu.x), 0.0)).xy - c.xy; let ey = onCanvas(uv + vec2<f32>(0.0, 1.0 / f32(dimu.y))).xy - c.xy;
  let fp = max(length(ex * pd), length(ey * pd));
  let n = clamp(i32(ceil(fp - 0.01)), 1, 6);
  var acc = vec3<f32>(0.0);
  for (var j = 0; j < n; j++) {
    for (var i = 0; i < n; i++) {
      let o = (vec2<f32>(f32(i), f32(j)) + 0.5) / f32(n) - 0.5;
      acc += textureSampleLevel(tex_pic, samp_pic, c.xy + ex * o.x + ey * o.y, 0.0).rgb;
    }
  }
  return vec4<f32>(acc / f32(n * n), c0.a);
}`;
/** the garden's painting on the canvas, seen by `cam`: put it after the room's look (FilmLook finish={false}) */
export function CanvasPicture({ cam, on = true }: { cam: Cam; on?: boolean }) {
  return <FramePass wgsl={CANVAS_WGSL} prepass uniforms={{ ...lensOf(cam), cv: [...PAINTING_AT, 0], cvh: [...PAINTING_HALF, on ? 1 : 0, 0] }} textures={{ pic: staticFile(TALL ? "painting/garden-tall.png" : "painting/garden.png") }} />;
}
/** the garden's passes: the oil, then the letters over it */
export function GardenPaint({ t, oil, ink, zoom = 1 }: { t: number; oil: number; ink: number[]; zoom?: number }) {
  return <><OilLook k={oil} /><Letters t={t} at={ink} zoom={zoom} /></>;
}

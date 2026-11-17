// The film's look: one pass over every 3D frame (a <FramePass>, beside the camera). A print, not a tape: gate weave,
// halation round the lights, a split tone, fine grain that sits in the mid-tones, dust and the odd scratch, the lens's
// colour fringing toward its edges, a vignette. Two stocks: `cold` for the office the generator gave (drained, green
// in its shadows, more weave and dust, an old reel) and warm for everything made in raea.
// `wire` (0..1) turns the picture into its own construction drawing: the edges of every form (from the frame's depth
// and normals) as pale lines on a dark sheet. It is the film's "wireframe": a few frames of it when a note is sent,
// before the change arrives. (Bevy's own wireframe isn't in this host: WireframeConfig draws nothing, tried 11-11.)
import { useCurrentFrame } from "raea";
import { FramePass } from "raea/3d";
import { H, W } from "./plan";

const WGSL = /* wgsl */ `
const LUMA = vec3<f32>(0.2126, 0.7152, 0.0722);
fn h12(p: vec2<f32>) -> f32 { var q = fract(vec3<f32>(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
fn n1(x: f32) -> f32 { let i = floor(x); let f = fract(x); let u = f * f * (3.0 - 2.0 * f); return mix(h12(vec2<f32>(i, 7.1)), h12(vec2<f32>(i + 1.0, 7.1)), u); }
fn n2(p: vec2<f32>) -> f32 {
  let i = floor(p); let f = fract(p); let u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h12(i), h12(i + vec2<f32>(1.0, 0.0)), u.x), mix(h12(i + vec2<f32>(0.0, 1.0)), h12(i + vec2<f32>(1.0, 1.0)), u.x), u.y);
}
fn px_of() -> vec2<f32> { return 1.0 / vec2<f32>(u_w(), u_h()); }
fn lit(uv: vec2<f32>) -> vec3<f32> { return max(frame(uv).rgb - vec3<f32>(0.72), vec3<f32>(0.0)); }
// the glow a print gives its lights: a wide, red-leaning blur of what is bright
fn halo(uv: vec2<f32>) -> vec3<f32> {
  let px = px_of(); var s = vec3<f32>(0.0);
  for (var i = 0; i < 12; i++) {
    let a = f32(i) * 2.39996; let r = (0.35 + 0.65 * sqrt(f32(i) / 12.0)) * 26.0;
    s += lit(uv + vec2<f32>(cos(a), sin(a)) * r * px);
  }
  return s / 12.0 * vec3<f32>(1.0, 0.42, 0.22);
}
/*EDGE*/
fn shade(in: FullscreenVertexOutput) -> vec4<f32> {
  let f = u_frame(); let dims = vec2<f32>(u_w(), u_h()); let px = 1.0 / dims;
  // gate weave: the whole picture rides a pixel or so, slowly, with a little jitter
  let wv = vec2<f32>(n1(f * 0.21) - 0.5, n1(f * 0.17 + 40.0) - 0.5) * 2.4 + vec2<f32>(h12(vec2<f32>(f, 1.0)) - 0.5, h12(vec2<f32>(f, 2.0)) - 0.5) * 0.5;
  let uv = in.uv + wv * px * u_weave();
  // the lens: colour fringes toward the edges
  let c = uv - 0.5; let r2 = dot(c, c);
  let fr = u_fringe() * r2 * 0.012;
  var e = vec3<f32>(frame(uv + c * fr).r, frame(uv).g, frame(uv - c * fr).b);
  e += halo(uv) * u_halation();
  // the stock: saturation, then shadows toward one colour and lights toward another
  let y = dot(e, LUMA);
  e = mix(vec3<f32>(y), e, u_sat());
  let warm = u_warm();
  let sh = mix(vec3<f32>(0.0, 0.035, 0.025), vec3<f32>(-0.012, 0.012, 0.03), warm);
  let hi = mix(vec3<f32>(-0.02, 0.01, 0.0), vec3<f32>(0.05, 0.018, -0.045), warm);
  e += sh * (1.0 - smoothstep(0.0, 0.5, y)) + hi * smoothstep(0.35, 1.0, y);
  // a print's curve: a soft toe that never quite reaches black, a shoulder
  e = e * e * (3.0 - 2.0 * e) * u_contrast() + e * (1.0 - u_contrast());
  e = max(e, vec3<f32>(0.0)) * 0.985 + vec3<f32>(0.012, 0.012, 0.014);
/*WIRE*/
  // grain: coarse and fine, strongest in the mid-tones, a fresh field each frame
  let gp = in.uv * dims;
  let g = (h12(gp + vec2<f32>(f * 37.0, f * 11.0)) - 0.5) * 0.7 + (n2(gp * 0.45 + vec2<f32>(f * 19.0, -f * 23.0)) - 0.5) * 0.9;
  let yy = dot(e, LUMA);
  e += g * u_grain() * (0.35 + 1.3 * yy * (1.0 - yy) * 2.0);
  // dust: a few dark specks a frame, and now and then a fine scratch running down the reel
  let cell = floor(gp / 90.0); let seed = h12(cell + vec2<f32>(floor(f), floor(f) * 1.7));
  if (seed > 1.0 - 0.012 * u_dust()) {
    let ctr = (cell + vec2<f32>(h12(cell + f), h12(cell - f))) * 90.0;
    let d = length(gp - ctr) / (1.2 + 3.0 * h12(cell * 3.1 + f));
    e *= 1.0 - 0.75 * (1.0 - smoothstep(0.6, 1.0, d));
  }
  let sx = h12(vec2<f32>(floor(f / 3.0), 91.0));
  let on = step(1.0 - 0.1 * u_dust(), h12(vec2<f32>(floor(f / 3.0), 17.0)));
  e += on * 0.09 * (1.0 - smoothstep(0.0, 1.3, abs(gp.x - sx * dims.x + sin(in.uv.y * 9.0 + f) * 2.0)));
  // the vignette, and the lamp's flicker
  e *= 1.0 - u_vignette() * smoothstep(0.18, 0.75, r2 * 1.55);
  e *= 1.0 + (n1(f * 0.9) - 0.5) * 0.03 * u_weave();
  return vec4<f32>(clamp(e, vec3<f32>(0.0), vec3<f32>(1.0)), 1.0);
}`;

const EDGE = /* wgsl */ `// the edges of the forms in the picture: where depth or the surface's facing changes between neighbours
fn edge1(uv: vec2<f32>, off: vec2<f32>, d: f32, n: vec3<f32>) -> f32 {
  let d2 = depth(uv + off); let m = normal(uv + off);
  return max(smoothstep(0.012, 0.05, abs(d2 - d) / max(min(d, d2), 0.05)), smoothstep(0.12, 0.5, 1.0 - dot(n, m)));
}
fn edge(uv: vec2<f32>) -> f32 {
  let px = px_of() * 1.2; let d = depth(uv); let n = normal(uv);
  return max(max(edge1(uv, vec2<f32>(px.x, 0.0), d, n), edge1(uv, vec2<f32>(-px.x, 0.0), d, n)), max(edge1(uv, vec2<f32>(0.0, px.y), d, n), edge1(uv, vec2<f32>(0.0, -px.y), d, n)));
}
`;
const WIRE = /* wgsl */ `  // the construction drawing
  let w = u_wire();
  if (w > 0.001) {
    let ln = edge(uv);
    let grid = max(step(0.985, fract(in.uv.x * dims.x / 54.0)), step(0.985, fract(in.uv.y * dims.y / 54.0))) * 0.06;
    let sheet = vec3<f32>(0.02, 0.035, 0.06) + grid;
    let drawn = mix(sheet, vec3<f32>(0.78, 0.9, 1.0), ln) + y * 0.05;
    e = mix(e, drawn, w);
  }
`;
const source = (wire: boolean) => WGSL.replace("/*EDGE*/", wire ? EDGE : "").replace("/*WIRE*/", wire ? WIRE : "");

export type Look = { warm: number; wire?: number; halation?: number; grain?: number; dust?: number; weave?: number; sat?: number; contrast?: number; vignette?: number };
/** the two stocks, and anything between: warm 0 is the generator's office, 1 is raea's world */
export function lookOf(warm: number, more: Partial<Look> = {}): Look {
  const m = (a: number, b: number) => a + (b - a) * warm;
  return { warm, wire: 0, halation: m(0.5, 0.75), grain: m(0.075, 0.05), dust: m(1.4, 0.7), weave: m(1.3, 0.8), sat: m(0.62, 1.08), contrast: m(0.35, 0.45), vignette: m(0.5, 0.38), ...more };
}
export function FilmLook({ look, wire, seed = 0 }: { look: Look; wire?: boolean; seed?: number }) {
  const frame = useCurrentFrame() + seed, w = W, h = H;
  const L = lookOf(look.warm, look);
  // the drawing needs the frame's depth and normals; a shot that never draws it does without them
  return <FramePass wgsl={source(!!wire)} {...(wire ? { prepass: true } : {})} uniforms={{ frame: frame % 997, w, h, warm: L.warm, wire: wire ? L.wire ?? 0 : 0, halation: L.halation!, grain: L.grain!, dust: L.dust!, weave: L.weave!, sat: L.sat!, contrast: L.contrast!, vignette: L.vignette!, fringe: 1 }} />;
}

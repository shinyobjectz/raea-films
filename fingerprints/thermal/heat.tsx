// Heat: the film's look (the director's references, 11-13: type glowing white-hot through orange to a blue fringe on grainy
// black, and a rainbow heat map under a white HUD). A frame pass that turns whatever the camera sees into heat:
//   1. heat from the picture, by a per-shot recipe: brightness, a skin-tone key (people run warm), or brightness
//      inverted (a silhouette against light is the warm thing);
//   2. the glow: the heat spread over two radii and smeared upward a little (heat rises), so hot things bleed past
//      their edges into a blue fringe;
//   3. a palette: "flare" (black, blue, red, orange, yellow, white: the type reference), "jet" (blue, cyan, green,
//      yellow, red: the heat-map reference), and three for variety where a line asks for it (the director, 11-13: "mix in
//      some other color combos like black and white"): "mono" (a contrasty black-and-white print), "ice" (navy, teal,
//      cyan, white: cold, for listening) and "ember" (deep red, orange, pale gold: warm, for approval);
//   4. film: grain that moves every frame and a few white specks of dust.
// Run before the tone mapper with <ToneMapping mode="none" />.
import { useVideoConfig } from "raea";
import { FramePass } from "raea/3d";

export type Recipe = { lum?: number; skin?: number; inv?: number; gamma?: number; lift?: number };
export type HeatPalette = "flare" | "jet" | "mono" | "ice" | "ember";
const PALETTES: HeatPalette[] = ["flare", "jet", "mono", "ice", "ember"];

const BASE = /* wgsl */ `
fn luma(c: vec3<f32>) -> f32 { return dot(c, vec3<f32>(0.2126, 0.7152, 0.0722)); }

// how much a colour looks like skin (a box in YCbCr, softened), from the display-encoded colour
fn skinness(c: vec3<f32>) -> f32 {
  let s = pow(clamp(c, vec3<f32>(0.0), vec3<f32>(1.0)), vec3<f32>(1.0 / 2.2));
  let y = 0.299 * s.r + 0.587 * s.g + 0.114 * s.b;
  let cb = 0.5 - 0.168736 * s.r - 0.331264 * s.g + 0.5 * s.b;
  let cr = 0.5 + 0.5 * s.r - 0.418688 * s.g - 0.081312 * s.b;
  let a = smoothstep(0.03, 0.08, cr - 0.5) * (1.0 - smoothstep(0.17, 0.22, cr - 0.5));
  let b = smoothstep(-0.16, -0.12, cb - 0.5) * (1.0 - smoothstep(0.0, 0.03, cb - 0.5));
  return a * b * smoothstep(0.08, 0.2, y);
}

fn heat_at(uv: vec2<f32>) -> f32 {
  let r = u_recipe();
  let c = frame(uv).rgb;
  let l = pow(clamp(luma(c), 0.0, 1.0), 1.0 / 2.2);
  let h = r.x * l + r.y * skinness(c) + r.z * (1.0 - l);
  let g = u_more();
  let base = clamp(pow(clamp(h, 0.0, 1.0), g.x) + g.y, 0.0, 1.0);
  // a heat front sweeping across (type that lights as it passes): cold ahead of it, flaring at it, cooled behind
  let rv = u_rv();
  let ahead = smoothstep(rv.x - rv.y, rv.x + rv.y, uv.x);
  let at = exp(-pow((uv.x - rv.x) / 0.1, 2.0));
  return base * ((1.0 - ahead) * rv.w * (1.0 + u_ex().x) + at * rv.z);
}

fn hash(p: vec3<f32>) -> f32 {
  let q = fract(p * vec3<f32>(0.1031, 0.1030, 0.0973));
  let r = q + dot(q, q.yzx + 33.33);
  return fract((r.x + r.y) * r.z);
}

// the heat spread over a disc of radius rad (in screen heights), smeared upward
fn spread(uv: vec2<f32>, rad: f32, aspect: f32) -> f32 {
  var s = 0.0;
  var w = 0.0;
  let spin = hash(vec3<f32>(uv * 1931.0, u_p().y)) * 6.2831853;
  for (var i = 0; i < 20; i++) {
    let k = f32(i) + 0.5;
    let a = k * 2.39996 + spin;
    let d = sqrt(k / 20.0) * rad;
    var o = vec2<f32>(cos(a) * d / aspect, sin(a) * d);
    o.y = o.y + d * 0.35;
    let wt = 1.0 - 0.5 * sqrt(k / 20.0);
    s += heat_at(uv + o) * wt;
    w += wt;
  }
  return s / w;
}

fn flare(u: f32) -> vec3<f32> {
  let x = clamp(u, 0.0, 1.0);
  var k = array<vec3<f32>, 8>(
    vec3<f32>(0.012, 0.012, 0.016),
    vec3<f32>(0.03, 0.05, 0.20),
    vec3<f32>(0.12, 0.30, 0.86),
    vec3<f32>(0.72, 0.20, 0.42),
    vec3<f32>(0.95, 0.42, 0.12),
    vec3<f32>(1.0, 0.72, 0.20),
    vec3<f32>(1.0, 0.93, 0.74),
    vec3<f32>(1.0, 1.0, 1.0),
  );
  var at = array<f32, 8>(0.0, 0.16, 0.32, 0.44, 0.56, 0.72, 0.86, 1.0);
  var c = k[0];
  for (var i = 0; i < 7; i++) {
    if x >= at[i] && x <= at[i + 1] { c = mix(k[i], k[i + 1], (x - at[i]) / (at[i + 1] - at[i])); }
  }
  return c;
}

fn jet(u: f32) -> vec3<f32> {
  let x = clamp(u, 0.0, 1.0);
  var k = array<vec3<f32>, 7>(
    vec3<f32>(0.0, 0.02, 0.10),
    vec3<f32>(0.0, 0.25, 0.85),
    vec3<f32>(0.0, 0.85, 0.95),
    vec3<f32>(0.20, 0.90, 0.30),
    vec3<f32>(0.98, 0.90, 0.10),
    vec3<f32>(1.0, 0.45, 0.05),
    vec3<f32>(0.90, 0.10, 0.25),
  );
  let p = x * 6.0;
  let i = min(i32(floor(p)), 5);
  return mix(k[i], k[i + 1], p - f32(i));
}

fn ramp5(x0: f32, a: vec3<f32>, b: vec3<f32>, c: vec3<f32>, d: vec3<f32>, e: vec3<f32>) -> vec3<f32> {
  let x = clamp(x0, 0.0, 1.0) * 4.0;
  if x < 1.0 { return mix(a, b, x); }
  if x < 2.0 { return mix(b, c, x - 1.0); }
  if x < 3.0 { return mix(c, d, x - 2.0); }
  return mix(d, e, x - 3.0);
}

fn mono(u: f32) -> vec3<f32> {
  let x = smoothstep(0.0, 1.0, clamp(u, 0.0, 1.0));
  return vec3<f32>(pow(x, 1.15)) * vec3<f32>(1.0, 0.99, 0.97);
}

fn ice(u: f32) -> vec3<f32> {
  return ramp5(u, vec3<f32>(0.008, 0.012, 0.024), vec3<f32>(0.03, 0.08, 0.30), vec3<f32>(0.02, 0.42, 0.60), vec3<f32>(0.35, 0.86, 0.95), vec3<f32>(0.96, 1.0, 1.0));
}

fn ember(u: f32) -> vec3<f32> {
  return ramp5(u, vec3<f32>(0.016, 0.008, 0.008), vec3<f32>(0.34, 0.03, 0.04), vec3<f32>(0.86, 0.24, 0.06), vec3<f32>(1.0, 0.62, 0.22), vec3<f32>(1.0, 0.93, 0.78));
}

fn pal(u: f32) -> vec3<f32> {
  let i = u_more().z;
  if i > 3.5 { return ember(u); }
  if i > 2.5 { return ice(u); }
  if i > 1.5 { return mono(u); }
  if i > 0.5 { return jet(u); }
  return flare(u);
}

fn lin(c: vec3<f32>) -> vec3<f32> {
  return select(pow((c + 0.055) / 1.055, vec3<f32>(2.4)), c / 12.92, c <= vec3<f32>(0.04045));
}

fn shade(in: FullscreenVertexOutput) -> vec4<f32> {
  let p = u_p();
  let aspect = p.x;
  // heat haze: the glow wavers, rising; the letters themselves hold still
  let hz = u_recipe().w;
  let wuv = in.uv + vec2<f32>(sin(in.uv.y * 48.0 + p.y * 0.21) * 0.0016, sin(in.uv.x * 31.0 + p.y * 0.17) * 0.0012) * hz;
  let t = heat_at(in.uv);
  // the glow's reach (u_ex().z, 0 for the usual 1): smaller where type is drawn larger against the frame's height
  let gl = select(1.0, u_ex().z, u_ex().z > 0.0);
  let near = spread(wuv, 0.012 * gl, aspect);
  let far = spread(wuv, 0.075 * gl, aspect);
  // the core keeps its shape; the glow spreads past it
  var h = max(t, 0.5 * near + 0.75 * far);
  h = h * 0.85 + 0.35 * t * near;
  // type: the glow tops out at orange, so only the letters themselves are white
  if u_ex().y > 0.5 { h = max(t, min(0.74, 0.4 * near + 0.8 * far)); }
  h = clamp((h - p.z) / max(1.0 - p.z, 1e-3) * p.w, 0.0, 1.0);
  var col = pal(h);
  // the heat-map look: the picture as a grid of dots, each as big as it is hot
  let dsz = u_more().w;
  if dsz > 0.5 {
    let px0 = in.uv * u_sz().xy;
    let cell = floor(px0 / dsz);
    let cuv = (cell + 0.5) * dsz / u_sz().xy;
    var hc = max(heat_at(cuv), 0.5 * spread(cuv, 0.012 * gl, aspect) + 0.75 * spread(cuv, 0.075 * gl, aspect));
    hc = clamp((hc - p.z) / max(1.0 - p.z, 1e-3) * p.w, 0.0, 1.0);
    let r = dsz * 0.5 * (0.25 + 0.7 * hc);
    let m = 1.0 - smoothstep(r - 0.8, r + 0.8, length(px0 - (cell + 0.5) * dsz));
    col = pal(hc) * m * step(0.04, hc);
  }
  // the hottest things stay crisp white (type reads; the glow is around it, not over it)
  col = mix(col, vec3<f32>(1.0), smoothstep(0.82, 0.97, t) * step(u_more().w, 0.5));
  // the scene traced from its depth (a stock shot with a depth texture; a no-op otherwise)
  col = trace(in.uv, col, aspect);
  // film: grain, and a few specks of dust that hold for four frames
  let px = in.uv * u_sz().xy;
  let g = (hash(vec3<f32>(px, p.y)) - 0.5) * 0.06;
  let speck = step(0.99985, hash(vec3<f32>(floor(px / 3.0), floor(p.y / 4.0))));
  col = col + vec3<f32>(g) + vec3<f32>(speck * 0.5);
  let v = in.uv - 0.5;
  col *= 1.0 - 0.45 * dot(v, v) * 2.0;
  return vec4<f32>(lin(clamp(col, vec3<f32>(0.0), vec3<f32>(1.0))), 1.0);
}
`;

// No depth: the trace leaves the colour alone.
const NO_TRACE = /* wgsl */ `
fn trace(uv: vec2<f32>, col: vec3<f32>, aspect: f32) -> vec3<f32> { return col; }
`;

// With a stock shot's depth (tools/depth.py: DA3-BASE, one 640x360 layer a frame, inverse depth, near = white), the
// pass rebuilds each pixel's place in the room and draws on the real surfaces, in white ink over the heat:
//   scan: a plane sweeping through the room's depth; where a surface crosses it, a bright line wraps that surface;
//   contours: lines of equal distance, drawn on everything the scan has passed, like a survey of the room;
//   outline: where depth jumps (an object's edge against what's behind it), traced;
//   ripple: a ring spreading out from a touched point across the surfaces in 3D, so it climbs a hand, a keyboard,
//           a face as they are, not as a flat circle.
// The depth is the whole clip's, so it is read at the clip's own uv: the frame's uv through the crop the camera shows
// (u_win(): its left, top, width and height in the clip; all of it on the 16:9 film, a 9:16 window on the tall one),
// and the room is rebuilt with the clip's aspect (u_sz().z), not the frame's.
const TRACE = /* wgsl */ `
fn dep(uv: vec2<f32>) -> f32 {
  return textureSampleLevel(tex_depth, samp_depth, clamp(uv, vec2<f32>(0.001), vec2<f32>(0.999)), i32(u_tr().x), 0.0).r;
}
fn src(uv: vec2<f32>) -> vec2<f32> { let w = u_win(); return w.xy + uv * w.zw; }
// a pixel's place in view space: a 50 degree vertical field of view, distance from the inverse depth
fn place(uv: vec2<f32>, aspect: f32) -> vec3<f32> {
  let nf = u_nf();
  let z = 1.0 / max(mix(nf.x, nf.y, dep(uv)), 1e-4);
  let t = 0.4663;
  return vec3<f32>((uv.x - 0.5) * 2.0 * t * aspect * z, (0.5 - uv.y) * 2.0 * t * z, z);
}
fn trace(fuv: vec2<f32>, col: vec3<f32>, faspect: f32) -> vec3<f32> {
  let uv = src(fuv);
  let aspect = u_sz().z;
  let tr = u_tr();
  let rp = u_rp();
  let nf = u_nf();
  let ink = u_ink().rgb;
  let g = dep(uv);
  // the depth itself, shown (u_ink().w: 0 the heat, 1 the model's grey depth map, near white)
  let base = mix(col, vec3<f32>(pow(g, 1.6)), u_ink().w);
  let P = place(uv, aspect);
  let e = vec2<f32>(1.0 / 640.0, 1.0 / 360.0);
  // scan: tr.y is the plane's place in the shot's depth (1 = nearest, 0 = farthest); behind it, revealed
  let s = tr.y;
  let live = step(0.0, s) * step(s, 1.05);
  let core = exp(-pow((g - s) / 0.004, 2.0)) * live;
  let glow = 0.3 * exp(-pow((g - s) / 0.03, 2.0)) * live;
  let shown = smoothstep(s - 0.01, s + 0.01, g);
  // contours of equal depth over the shot's own depth range (so a near, nearly flat hand still gets several),
  // crisp at any slope, faded where a surface is too steep to draw them cleanly
  let q = g * nf.z;
  let fw = max(fwidth(q), 1e-4);
  let iso = (1.0 - clamp(abs(fract(q - 0.5) - 0.5) / fw - 0.4, 0.0, 1.0)) * (1.0 - smoothstep(0.3, 0.7, fw)) * smoothstep(0.08, 0.2, g);
  // the outline: where depth jumps
  let gx = dep(uv + vec2<f32>(e.x, 0.0)) - dep(uv - vec2<f32>(e.x, 0.0));
  let gy = dep(uv + vec2<f32>(0.0, e.y)) - dep(uv - vec2<f32>(0.0, e.y));
  let edge = smoothstep(0.04, 0.09, length(vec2<f32>(gx, gy)));
  // the ripple: a ring at distance rp.z (in the room, over the touched point's distance) from the touched point
  let A = place(rp.xy, aspect);
  let d3 = length(P - A) / max(A.z, 1e-3);
  var ring = (exp(-pow((d3 - rp.z) / 0.006, 2.0)) + 0.4 * exp(-pow((d3 - rp.z) / 0.03, 2.0)) + 0.6 * exp(-pow((d3 - rp.z * 0.6) / 0.005, 2.0))) * rp.w;
  // waves (nf.w, their spacing): rings repeating inside the front, fainter toward it, like sound leaving a speaker
  if nf.w > 0.0 {
    let dr = (fract((d3 - rp.z) / nf.w + 0.5) - 0.5) * nf.w;
    let inside = step(d3, rp.z) * (1.0 - 0.75 * d3 / max(rp.z, 1e-3));
    ring = (exp(-pow(dr / 0.006, 2.0)) + 0.35 * exp(-pow(dr / 0.025, 2.0))) * inside * rp.w;
  }
  let lines = clamp(core + shown * (iso * tr.z + edge * tr.w) + ring, 0.0, 1.0);
  // the ink reads on anything: light over the cold, dark over the hot (an engraving on the white-hot hand)
  let lum = dot(base, vec3<f32>(0.2126, 0.7152, 0.0722));
  let light = base + ink * (lines + glow);
  let dark = base * (1.0 - 0.8 * lines) + vec3<f32>(0.02, 0.05, 0.12) * lines;
  return mix(light, dark, smoothstep(0.5, 0.8, lum));
}
`;

/** a stock shot's depth for the trace: tools/depth.py's layers (staticFile URLs, one a frame) and its inverse-depth
 * range; `scan` is the sweeping plane (1 nearest .. 0 farthest; < 0 or > 1.05 hides it), `contours` and `outline`
 * the strength of each once the scan has passed, `ripple` a ring from a touched point [u, v, radius, strength] */
export type Trace = { layers: string[]; frame: number; inv: [number, number]; scan?: number; contours?: number; outline?: number; density?: number; ripple?: [number, number, number, number]; waves?: number; ink?: [number, number, number]; depth?: number };

/** the pass: `recipe` turns the picture into heat; `floor` is the heat that maps to black, `gain` stretches the rest.
 * The frame's size and aspect are the composition's. On a crop of a clip (the tall film's 9:16 windows on 16:9
 * footage), `win` is the window's [left, top, width, height] in the clip and `srcAspect` the clip's, so the trace reads
 * the clip's depth where the frame shows it; `glow` scales the glow's reach (1 as it was). */
export function Heat({ frame, recipe, palette = "flare", floor = 0.08, gain = 1.1, aspect, dots = 0, haze = 0, front = 2, soft = 0.04, flare = 0, cool = 1, linger = 0, type = false, trace, win = [0, 0, 1, 1], srcAspect = 16 / 9, glow = 0 }: { trace?: Trace; linger?: number; type?: boolean; frame: number; dots?: number; haze?: number; front?: number; soft?: number; flare?: number; cool?: number; recipe: Recipe; palette?: HeatPalette; floor?: number; gain?: number; aspect?: number; win?: [number, number, number, number]; srcAspect?: number; glow?: number }) {
  const { width, height } = useVideoConfig();
  const r = { lum: 0, skin: 0, inv: 0, gamma: 1, lift: 0, ...recipe };
  const tr = trace;
  return (
    <FramePass
      wesl={BASE + (tr ? TRACE : NO_TRACE)}
      at="before-tonemap"
      uniforms={{
        recipe: [r.lum, r.skin, r.inv, haze], rv: [front, soft, flare, cool], ex: [linger, type ? 1 : 0, glow, 0], more: [r.gamma, r.lift, PALETTES.indexOf(palette), dots], p: [aspect ?? width / height, frame % 9973, floor, gain],
        sz: [width, height, srcAspect, 0], win,
        ...(tr ? { tr: [Math.min(tr.layers.length - 1, Math.max(0, tr.frame)), tr.scan ?? 2, tr.contours ?? 0.35, tr.outline ?? 0.6], rp: tr.ripple ?? [0.5, 0.5, 0, 0], nf: [tr.inv[0], tr.inv[1], tr.density ?? 6, tr.waves ?? 0], ink: [...(tr.ink ?? [0.92, 0.97, 1]), tr.depth ?? 0] } : {}),
      }}
      {...(tr ? { textures: { depth: { layers: tr.layers, sampler: { filter: "linear", mipmap: "none", wrap: "clamp" } } } } : {})}
    />
  );
}

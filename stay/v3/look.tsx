// v3's picture, in two passes over every 3D frame.
//
// Why two: the engine only follows a frame pass's values frame by frame when the pass is a shader FILE, and a file
// pass can't read the frame's depth and normals (found 11-11: an inline pass keeps its first frame's uniforms for the
// whole clip, which is why assembly 8's drawing flashes showed in stills and never in the film). So:
//  1. LINES, inline with the prepass, told nothing: it leaves the picture alone and writes the place's construction
//     lines (edges where depth or the surface's facing changes) into the frame's alpha.
//  2. media/shaders/stay.wgsl, a file, told everything each frame: where the drawing gives way to the real place, and
//     the print.
// The print. the director, 11-11: "the vintage look so far looks terrible. its so blown out ... cinematic vintage not home
// camera vitnage": no weave, dust, scratches, flicker or fringing. A gentle curve, a little halation round real
// lights, fine grain, a light vignette, colour natural with a slight warmth or coolness.
// The drawing. `base` is what the frame is where no mask reaches (1 the drawing, 0 the real place); each mask flips it:
//   ring [x, y, radius]: inside a circle (stage pixels)     split: left of this x     wipe: 0..1 up a diagonal
//   box [x0, y0, x1, y1]: inside a rectangle (the pick box round a thing)
// A mask's edge is drawn as a fine bright line.
import { staticFile, useCurrentFrame } from "raea";
import { FramePass } from "raea/3d";
import { H, W } from "./plan";

const LINES = /* wgsl */ `
fn edge1(uv: vec2<f32>, off: vec2<f32>, d: f32, n: vec3<f32>) -> f32 {
  let d2 = depth(uv + off); let m = normal(uv + off);
  return max(smoothstep(0.012, 0.05, abs(d2 - d) / max(min(d, d2), 0.05)), smoothstep(0.12, 0.5, 1.0 - dot(n, m)));
}
fn edgeAt(uv: vec2<f32>, px: vec2<f32>) -> f32 {
  let d = depth(uv); let n = normal(uv);
  return max(edge1(uv, vec2<f32>(px.x, 0.0), d, n), edge1(uv, vec2<f32>(0.0, px.y), d, n));
}
fn hh(p: vec2<f32>) -> f32 { var q = fract(vec3<f32>(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
fn vnoise(p: vec2<f32>) -> f32 { let i = floor(p); let f = fract(p); let u = f * f * (3.0 - 2.0 * f); return mix(mix(hh(i), hh(i + vec2<f32>(1.0, 0.0)), u.x), mix(hh(i + vec2<f32>(0.0, 1.0)), hh(i + vec2<f32>(1.0, 1.0)), u.x), u.y); }
// a step in depth alone, looked for a little wider: the outline of a whole mass (a tree against the sky, a bank of grass
// against the wood behind it), not of its leaves
fn mass1(uv: vec2<f32>, off: vec2<f32>, d: f32) -> f32 { let d2 = depth(uv + off); return smoothstep(0.1, 0.3, abs(d2 - d) / max(min(d, d2), 0.05)); }
fn shade(in: FullscreenVertexOutput) -> vec4<f32> {
  let px = 1.15 / vec2<f32>(${W}.0, ${H}.0); let uv = in.uv;
  let d = depth(uv); let n = normal(uv);
  var ln = max(max(edge1(uv, vec2<f32>(px.x, 0.0), d, n), edge1(uv, vec2<f32>(-px.x, 0.0), d, n)), max(edge1(uv, vec2<f32>(0.0, px.y), d, n), edge1(uv, vec2<f32>(0.0, -px.y), d, n)));
  // Grass, needles, leaves, a net: where everything round a point is an edge, inking every one gives a white sheet up
  // close and moire far off (the director, 11-11: "we do want avoid miore ... in the case of grass ... more interpretive with
  // some postes of grass clumps that give it some textre"). So a crowded neighbourhood is drawn as a draughtsman would:
  // the outline of the whole mass, and inside it a few clumps of its texture here and there, the rest left as sheet.
  // Past a distance the clumps go too and only the outline is kept.
  var crowd = 0.0;
  for (var i = 0; i < 8; i++) { let a = f32(i) * 0.7854; crowd += edgeAt(uv + vec2<f32>(cos(a), sin(a)) * px * 7.0, px); }
  for (var i = 0; i < 4; i++) { let a = f32(i) * 1.5708 + 0.39; crowd += edgeAt(uv + vec2<f32>(cos(a), sin(a)) * px * 15.0, px); }
  let crowded = smoothstep(0.28, 0.6, crowd / 12.0);
  let clump = smoothstep(0.6, 0.74, vnoise(uv * vec2<f32>(${W}.0, ${H}.0) / 64.0)) * (1.0 - smoothstep(9.0, 26.0, d));
  let o = px * 2.2;
  let mass = max(max(mass1(uv, vec2<f32>(o.x, 0.0), d), mass1(uv, vec2<f32>(-o.x, 0.0), d)), max(mass1(uv, vec2<f32>(0.0, o.y), d), mass1(uv, vec2<f32>(0.0, -o.y), d)));
  ln = mix(ln, max(ln * 0.85 * clump, mass * 0.8), crowded);
  // far lines are drawn fainter, as a draughtsman's are
  // The frame's alpha carries what the film's pass (media/shaders/stay.wgsl) can't read for itself: the depth, in
  // metres along the ray (so it can put every pixel back in the world), with the line in its sign. The far fade of the
  // lines is applied there, from the same depth.
  return vec4<f32>(frame(uv).rgb, min(d, 9000.0) * (1.0 - 2.0 * step(0.42, ln)));
}`;

export type V3 = [number, number, number];
export type Look = {
  /** -1 cool .. 1 warm */ warm?: number; sat?: number; /** 0..1 of the S curve (0.55) */ contrast?: number; halation?: number; vignette?: number; grain?: number;
  /** 1: the frame is the drawing where no mask reaches; 0: the real place */ base?: 0 | 1;
  // Masks in the WORLD (the director, 11-11: "the drawing effect needs to eb on the mesh not an overlay"): each is a shape in
  // the place, and whatever stands inside it is the other state. Their edges cross the geometry as a line of light.
  /** a sphere: centre and radius, metres (the reveal a click sends out through the place; the small one the cursor carries) */ sphere?: [V3, number];
  /** up to two boxes: least and greatest corner (the thing in the cursor's pick box; the space beyond a doorway) */ boxes?: [V3, V3][];
  /** the boxes are quiet: what is in them is simply real, without the line of light and the glow a reveal's edge has
   *  (a real thing hung in the drawing: the garden's painting) */ quiet?: boolean;
  /** a half-space: everything where n.p + d > 0 (a wall of change crossing the room) */ plane?: [number, number, number, number];
  /** paint on the place's own surfaces: the mural (media/paint/mural.png) laid in the world from `at` (its lower near
   *  corner) along the heading `yaw` (radians: 0 is +x, a quarter turn +z), `size` metres long and half that tall; `p1`
   *  and `p2` are how far the stroke has gone on the wall to the left and to the right of that line (0..1, then on to 2
   *  as the drips run). It takes the place of the second box. */
  paint?: { at: V3; yaw: number; size: number; p1: number; p2: number };
  /** the cursor's orb (the director, 11-11, assembly 22: "the cursor shinea a orb based light/glow that renders around it full
   *  res but then outside the orb it fades to wireframe. this makes it feel liek the cursor is using a tool"): the real
   *  place within `r` metres of `at`, fading over its last `soft` metres into the drawing, with no line at its edge; the
   *  drawing just outside it is warmed by its light. It takes the place of the first box. */
  orb?: { at: V3; r: number; soft?: number };
  /** a door in the void: everything behind the wall's face (z) is black but what is seen through the doorway (x0..x1, up
   *  to y1); what stands in front of the face fades out over `fade` metres before it (2.4) */ void?: { z: number; x0: number; x1: number; y1: number; fade?: number };
  /** rain on a pane of glass standing in the place: its middle, its heading (radians: the way along it, 0 is +x), its
   *  width and height in metres, and the time in seconds. The pane is fogged and the drops on it are lenses. It takes
   *  the place of the second box (and of paint). */
  rain?: { at: V3; yaw: number; w: number; h: number; t: number };
  /** a rainstorm: its slant across the frame, how hard it rains (0..1), the time in seconds, and how much a flash of
   *  lightning lights it. Rain in the air at four depths, hidden behind what stands nearer, and rings where it strikes
   *  whatever faces up. It takes the place of the second box. */
  storm?: { slant: number; amount: number; t: number; flash: number; /** the sky is this pass's own marched cloud, drawn wherever the frame is empty: how much of it (0 scattered under a clear dawn .. 1 a black overcast), and the way to the sun */ cover: number; sun: V3 };
  /** a shell of light a click sends out over the surfaces near it: where, how far it has gone (metres), how strong (0..1) */ pulse?: { at: V3; r: number; k: number };
  // Masks on the FRAME, for the two things that are the frame's own: the montage's circle and a line drawn across the picture.
  ring?: [number, number, number]; split?: number; wipe?: number;
  /** the drawing's own brightness (1) */ gain?: number;
  /** the sea's level, metres: its drawing is the swell's contours, as an engraver draws water (the edges of a smooth sea
   *  give no lines of their own, and a drawn sea was an empty sheet) */ sea?: number;
  /** what the drawing is drawn in: 0 pale line on a dark sheet (the film's usual), 1 pencil on paper, 2 charcoal on
   *  paper, 3 a photocopy of the place itself (its light pushed to toner; `gain` lifts it first) */ style?: 0 | 1 | 2 | 3;
  /** the whole picture's level, 0 black to 1 */ fade?: number;
  /** how much of the print's toe and split tone (1); 0 leaves a screen's own colours alone */ print?: number;
};
type CamLike = { eye: V3; look: V3; fov: number };
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm = (a: V3): V3 => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
// The film's one print (the director, 11-11: "before we do the full render lets make sure that we also align the whole video
// with a solid finishing look pass for vignettes, colro grading, etc. how do we make it feel cohesive in style"). Every
// shot had its own curve, halation, vignette and grain, from a vignette of 0.2 to 0.3 and grain from none to 0.09, and
// its own white balance from -0.5 to 1, so the film read as a reel of different stocks, and each door was a change of
// print as well as of place. Now it is printed on one stock:
//   - the curve, the halation and the print's toe and split tone are the same in every shot (FINISH);
//   - vignette and grain are one last pass at the very end of every shot (Finish), after everything else, the doorways'
//     pictures of the next world among it, so the two sides of a door carry the same vignette and grain at every pixel;
//   - each world keeps only its own light: its exposure, and a white balance and saturation that are pulled in toward the
//     film's own (a world can lean warm or cool, a little, never to another stock).
// Screens drawn as screens (print 0: the app's own pictures) keep their flat curve, and get the same vignette and grain.
export const FINISH = { contrast: 0.62, halation: 0.5, vignette: 0.24, grain: 0.045 };
const printed = (look: Look): Look => (look.print === 0 ? look : { ...look, contrast: FINISH.contrast, halation: FINISH.halation, warm: 0.45 * Math.tanh((look.warm ?? 0) / 0.45), sat: 0.92 + 0.5 * ((look.sat ?? 0.9) - 0.92) });
const FINISH_WGSL = /* wgsl */ `
const LUMA = vec3<f32>(0.2126, 0.7152, 0.0722);
fn h12(p: vec2<f32>) -> f32 { var q = fract(vec3<f32>(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
fn shade(in: FullscreenVertexOutput) -> vec4<f32> {
  let uv = in.uv; let c0 = frame(uv); var e = c0.rgb;
  let f = u_finish().x; let p = uv * vec2<f32>(${W}.0, ${H}.0);
  // fine grain (it dithers the darks too), a light vignette, the fade (as media/shaders/stay.wgsl had them)
  let g = h12(p + vec2<f32>(f * 37.0, f * 11.0)) + h12(p * 0.5 + vec2<f32>(-f * 23.0, f * 7.0)) - 1.0;
  let yy = dot(e, LUMA);
  e += g * u_finish().y * (0.55 + 0.9 * yy * (1.0 - yy) * 2.0);
  let c = uv - 0.5;
  e *= 1.0 - u_finish().z * smoothstep(0.2, 0.8, dot(c, c) * 1.5);
  e *= u_finish().w;
  return vec4<f32>(clamp(e, vec3<f32>(0.0), vec3<f32>(1.0)), c0.a);
}`;
/** the last pass of every shot: the film's one grain and vignette, and the shot's fade. A world that draws a doorway's
 *  picture of the next world draws it before this (FilmLook finish={false}, the doorway, then this); a portal's render
 *  (the next world's frames for that doorway) leaves it out, as the world it is shown in adds it */
export function Finish({ look, seed = 0 }: { look: Pick<Look, "fade" | "grain">; seed?: number }) {
  const frame = (useCurrentFrame() + seed) % 997;
  return <FramePass wgsl={FINISH_WGSL} uniforms={{ finish: [frame, look.grain === 0 ? 0 : FINISH.grain, FINISH.vignette, look.fade ?? 1] }} />;
}
export function FilmLook({ look: asked, seed = 0, lines = true, cam, finish = true }: { look: Look; seed?: number; lines?: boolean; /** the shot's camera: with it the pass can put each pixel back in the world */ cam?: CamLike; /** end with the film's grain and vignette (Finish); false when the world draws a doorway after this and then Finish itself */ finish?: boolean }) {
  const look = printed(asked);
  const frame = (useCurrentFrame() + seed) % 997;
  const ring = look.ring ?? [0, 0, 0];
  const geo = lines && cam ? 1 : 0;
  const f = cam ? norm(sub(cam.look, cam.eye)) : ([0, 0, -1] as V3), r = norm(cross(f, [0, 1, 0])), u = cross(r, f);
  const bx = (i: number, hi: boolean) => { const x = look.boxes?.[i]; return x ? [...x[hi ? 1 : 0], hi && look.quiet ? 2 : 1] : [0, 0, 0, 0]; };
  const raea_pass = {
    a: [frame, W, H, look.base ?? 0], b: [ring[0], ring[1], ring[2], look.gain ?? 1],
    // (grain, vignette and the fade are Finish's: none here)
    d: [look.split ?? 0, look.wipe ?? 0, 0, 0], e: [look.warm ?? 0, look.sat ?? 0.9, look.halation ?? 0.4, 1], f: [look.contrast ?? 0.6, look.print ?? 1, look.style ?? 0, geo],
    eye: [...(cam?.eye ?? [0, 0, 0]), Math.tan(((cam?.fov ?? 50) * Math.PI) / 360)], fwd: [...f, W / H], right: [...r, look.pulse?.k ?? 0], up: [...u, look.plane ? 1 : 0],
    s0: look.sphere ? [...look.sphere[0], Math.max(0, look.sphere[1])] : [0, 0, 0, 0], pulse: look.pulse ? [...look.pulse.at, look.pulse.r] : [0, 0, 0, 0], plane: look.storm ? [...look.storm.sun, look.sea !== undefined ? 1000 + look.sea : 0] : (look.plane ?? (look.sea !== undefined ? [0, 1, 0, 1000 + look.sea] : [0, 0, 0, 0])),
    b0lo: look.orb ? [...look.orb.at, 2] : bx(0, false), b0hi: look.orb ? [Math.max(0, look.orb.r), look.orb.soft ?? look.orb.r * 0.45, 0, 0] : bx(0, true),
    b1lo: look.void ? [look.void.x0, 0, look.void.z, -1] : look.storm ? [look.storm.slant, look.storm.amount, look.storm.cover, 4] : look.rain ? [...look.rain.at, 3] : look.paint ? [...look.paint.at, 2] : bx(1, false), b1hi: look.void ? [look.void.x1, look.void.y1, look.void.fade ?? 2.4, 0] : look.storm ? [look.storm.t, look.storm.flash, 0, 0] : look.rain ? [look.rain.yaw, look.rain.w, look.rain.h, look.rain.t] : look.paint ? [look.paint.yaw, look.paint.size, look.paint.p1, look.paint.p2] : bx(1, true),
  };
  return (
    <>
      {lines && <FramePass wgsl={LINES} prepass />}
      <FramePass file={staticFile("shaders/stay.wgsl")} frame="raea_frame" samplers={{ raea_frame_sampler: { filter: "nearest", wrap: "clamp" }, mural_sampler: { filter: "linear", wrap: "clamp" }, cloud_atlas_sampler: { filter: "linear", wrap: "repeat" }, cloud_worley_sampler: { filter: "linear", wrap: "clamp" } }} textures={{ mural: staticFile("paint/mural.png"), cloud_atlas: staticFile("sky/cloud-atlas.png"), cloud_worley: staticFile("sky/cloud-worley.png") }} uniforms={{ raea_pass }} />
      {finish && <Finish look={asked} seed={seed} />}
    </>
  );
}

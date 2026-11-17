// The pixel world (the shot "greenhouse", 3.33 s), the fifth door's world. the director, 11-11: "maybe one could be a pixel art
// gaussian splat world".
// Through the clouds' blue door we come out into a meadow at sunset, painted in big pixels from a palette of 32: a dirt
// path running ahead to a door standing on its own in the grass, a wood of pines on the left, a lake on the right holding
// the sky, its sun's glitter running across it to a sun going down between the mountains, fireflies coming out. The low
// sun stands behind the door, and its shadow lies ten metres back down the meadow toward us. The cursor reaches out and
// taps the water: it splashes, and rings run out across the lake through the glitter; the fireflies lift. Then it takes
// the door's ring and pulls, and as the leaf swings out the sun comes through the doorway and down the length of its
// shadow, and through it is the next world (the garden, seen as it is: no pixels in the doorway).
// The world is Gaussian splats (tools/pixel-world.ts writes them from v3/pixel-layout.ts, each splat a palette colour,
// as a pixel artist paints); a painted card for the sky; the door (blender/components/pixel/door.py). PIXEL draws the
// frame in 270 x 216 cells, each cell the average of what's in it, ordered-dithered and snapped to the palette, with
// the lake's rings and the splash drawn in cells too; the cursor and the doorway are left as they are.
import { AbsoluteFill, staticFile } from "raea";
import { AntiAliasing, Canvas3D, FramePass, Model, Shadows, Splat, ToneMapping } from "raea/3d";
import { Camera3d } from "raea/camera";
import { AmbientLight, DirectionalLight, SolariLighting } from "raea/light";
import { Mesh3d, Plane3d } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Transform } from "raea/transform";
import DOOR from "../media/models/pixel/door.glb.json";
import { clamp01, ramp } from "../v2/math";
import type { Cam } from "./cam";
import { Hand3D, at, front, type Key } from "./hand3d";
import { PORTAL_CHUNK, PORTAL_DIR, PORTAL_FRAMES, goOut, portalFrame, viewOf, type View, shotOf } from "./kit";
import { TAKE_KEYS } from "./takekeys";
import { Finish } from "./look";
import WIDE_PORTALS from "./portals.json";
import TALL_PORTALS from "./portals-tall.json";
import { CARD, CLICK, LAKE, PALETTE, RINGS, RZ, SUN, hex, type V3 } from "./pixel-layout";
import { H, TALL, W, type Shot } from "./plan";
import { DOOR_HOLD, ROOM_T } from "./times";

const jerk = (k: number) => { const q = clamp01(k); return q * q * q * (10 - 15 * q + 6 * q * q); };
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scl = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const nrm = (a: V3): V3 => scl(a, 1 / (Math.hypot(...a) || 1));
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

// ---- where things stand ----------------------------------------------------------------------------------------
const NEXT = "gardendoor";
const BACK = 5;                                                       // where we come in, through the clouds' door
/** the door's frame (Blender's, origin the step's middle at the opening's foot) into the world's: its face toward us at z -RZ */
const D = (p: number[]): V3 => [p[0], p[2], -RZ - p[1]];
const NOTE = JSON.parse((DOOR as { notes: string }).notes) as { hinge: number[]; knob: number[]; opening: { half_width: number; sill: number; top: number } };
const HINGE = D(NOTE.hinge), KNOB = D(NOTE.knob), OPENING = NOTE.opening, OPEN_DEG = 100;
const rotY = (v: V3, a: number): V3 => [v[0] * Math.cos(a) + v[2] * Math.sin(a), v[1], -v[0] * Math.sin(a) + v[2] * Math.cos(a)];
const leafYaw = (open: number) => (-OPEN_DEG * Math.PI) / 180 * open;
const knobAt = (open: number): V3 => add(HINGE, rotY(sub(KNOB, HINGE), leafYaw(open)));
const openAt = (T: { door: number }, t: number) => jerk(ramp(t, T.door + 0.03, T.door + 0.8));

/** the ripple: how fast its rings run out (m/s), crest to crest (m), how high at the click (m) */
const RIP = { c: 1.8, len: 0.5, amp: 0.035 };
/** how far the cursor turns to poke the water tip first (radians, in its own plane) */
const POKE = Math.PI * 0.5;
/** ring k's lift at dt seconds after the click: it rises as the front reaches it and dies away, less the further out */
function ringAmp(k: number, dt: number) {
  const r = Math.min(8, (RINGS[k] + RINGS[k + 1]) / 2), x = dt - r / RIP.c;
  if (x <= 0) return 0;
  return RIP.amp * (1 - Math.exp(-x * 10)) * Math.exp(-x * 1.1) * Math.exp(-r / 3.5);
}

// ---- the keys -----------------------------------------------------------------------------------------------------
function pixelKeys(s: Shot, t: number) {
  const T = ROOM_T.greenhouse as { click: number; door: number };
  const L = s.seconds;
  const open = openAt(T, t);
  const knob = () => knobAt(open);
  const keys: Key[] = [
    // (a touch over the water, so the ripple it starts doesn't close over it)
    { t: T.click, p: at([CLICK[0], CLICK[1] + 0.04, CLICK[2]]), click: true, seen: "tap the lake, and its rings run out", margin: 0.08 },
    { t: T.door, p: front(knob, 0.02), press: true, seen: "take the door's ring and pull it open" },
    { t: T.door + DOOR_HOLD, p: front(knob, 0.02) },
    ...goOut(L),
  ];
  return { T, L, open, keys };
}
TAKE_KEYS.greenhouse = (t: number) => pixelKeys(shotOf("greenhouse"), t).keys;
export const pixelView = (s: Shot, t: number): View => viewOf(s, t);

// ---- the pixels ---------------------------------------------------------------------------------------------------
// the palette, as the pass compares (Oklab, from linear) and draws it (linear)
const lin = (u: number) => { const c = u / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const PAL_LIN = PALETTE.map((h) => hex(h).map(lin) as V3);
const oklab = ([r, g, b]: V3): V3 => {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
};
const v3s = (a: V3[]) => a.map((c) => `vec3<f32>(${c.map((x) => x.toFixed(5)).join(", ")})`).join(",\n  ");
const PIXEL = /* wgsl */ `
const CELLS = vec2<f32>(270.0, 216.0);
const NPAL = ${PALETTE.length};
const PAL_LAB = array<vec3<f32>, ${PALETTE.length}>(
  ${v3s(PAL_LIN.map(oklab))});
const PAL_LIN = array<vec3<f32>, ${PALETTE.length}>(
  ${v3s(PAL_LIN)});
const BAYER = array<f32, 16>(0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
fn oklab(c: vec3<f32>) -> vec3<f32> {
  let l = pow(max(0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b, 0.0), 1.0 / 3.0);
  let m = pow(max(0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b, 0.0), 1.0 / 3.0);
  let s = pow(max(0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b, 0.0), 1.0 / 3.0);
  return vec3<f32>(0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s);
}
fn l2s(c: vec3<f32>) -> vec3<f32> { return select(1.055 * pow(c, vec3<f32>(1.0 / 2.4)) - 0.055, c * 12.92, c <= vec3<f32>(0.0031308)); }
fn s2l(c: vec3<f32>) -> vec3<f32> { return select(pow((c + 0.055) / 1.055, vec3<f32>(2.4)), c / 12.92, c <= vec3<f32>(0.04045)); }
fn h1(n: f32) -> f32 { return fract(sin(n * 127.1) * 43758.5453); }
fn rayOf(uv: vec2<f32>) -> vec3<f32> {
  let tn = u_eye().w; let asp = u_fwd().w;
  return normalize(u_fwd().xyz + u_right().xyz * (uv.x * 2.0 - 1.0) * tn * asp - u_up().xyz * (uv.y * 2.0 - 1.0) * tn);
}
fn toUv(p: vec3<f32>) -> vec3<f32> {
  let q = p - u_eye().xyz; let z = dot(q, u_fwd().xyz);
  let tn = u_eye().w; let asp = u_fwd().w;
  return vec3<f32>(0.5 + 0.5 * dot(q, u_right().xyz) / (z * tn * asp), 0.5 - 0.5 * dot(q, u_up().xyz) / (z * tn), z);
}
// the cursor: white or near black, inside a disc round its tip, at its depth
fn isCursor(uv: vec2<f32>, c: vec3<f32>) -> bool {
  if (u_cur().w <= 0.0) { return false; }
  let k = toUv(u_cur().xyz);
  let asp = u_fwd().w;
  let d = (uv - k.xy) * vec2<f32>(asp, 1.0);
  if (length(d) > u_curs().x || k.z <= 0.0) { return false; }
  let z = depth(uv);
  if (z <= 0.0 || abs(z - k.z) > u_curs().y) { return false; }
  return min(c.r, min(c.g, c.b)) > 0.85 || max(c.r, max(c.g, c.b)) < 0.012;
}
// the doorway: the ray crosses the door's plane inside its opening, and nothing nearer stands in front
fn inDoorway(uv: vec2<f32>) -> bool {
  if (u_doorh().z <= 0.001) { return false; }
  let rd = rayOf(uv); let eye = u_eye().xyz;
  let tp = (u_door().z - eye.z) / rd.z;
  let pp = eye + rd * tp;
  if (tp <= 0.0 || abs(pp.x - u_door().x) > u_door().w || abs(pp.y - u_doorh().x) > u_doorh().y) { return false; }
  let z = depth(uv);
  return z <= 0.0 || z > tp * dot(rd, u_fwd().xyz) - 0.02;
}
fn lakeE(p: vec2<f32>) -> f32 { let q = (p - u_lake().xy) / u_lake().zw; return dot(q, q); }
// a pixel artist's outline round what the scene draws as meshes (the door, its stones, its leaf): a cell is outline
// where it is the nearer side of a step in depth, or where the surface turns, from the cell beside or below it. The
// splats write no depth, so their own colours are their drawing.
fn outline(cuv: vec2<f32>) -> f32 {
  let d = depth(cuv);
  if (d <= 0.0 || d > 60.0) { return 0.0; }
  let n = normal(cuv);
  var e = 0.0;
  for (var k = 0; k < 4; k++) {
    let o = select(select(vec2<f32>(0.0, -1.0), vec2<f32>(0.0, 1.0), k == 2), select(vec2<f32>(-1.0, 0.0), vec2<f32>(1.0, 0.0), k == 0), k < 2) / CELLS;
    let d2 = depth(cuv + o);
    if (d2 <= 0.0 || d2 - d > 0.05 * d) { e = 1.0; }
    else if (k % 2 == 0 && abs(d2 - d) < 0.05 * d && dot(n, normal(cuv + o)) < 0.6) { e = max(e, 0.7); }
  }
  return e;
}
fn shade(in: FullscreenVertexOutput) -> vec4<f32> {
  let uv = in.uv;
  let c0 = frame(uv);
  if (isCursor(uv, c0.rgb)) { return c0; }
  // the doorway: DOORWAY has drawn the next world there already; it is seen as it is
  if (inDoorway(uv)) { return c0; }
  let cell = floor(uv * CELLS);
  // the cell: the average of what's in it, leaving out the cursor and the doorway
  var acc = vec3<f32>(0.0); var n = 0.0;
  for (var j = 0; j < 4; j++) { for (var i = 0; i < 4; i++) {
    let q = (cell + (vec2<f32>(f32(i), f32(j)) + 0.5) / 4.0) / CELLS;
    let c = frame(q).rgb;
    if (inDoorway(q) || isCursor(q, c)) { continue; }
    acc += min(c, vec3<f32>(1.0)); n += 1.0;
  } }
  acc = acc / max(n, 1.0);
  let cuv = (cell + 0.5) / CELLS;
  if (!inDoorway(cuv)) { acc = acc * (1.0 - 0.62 * outline(cuv)); }
  let rd = rayOf(cuv); let eye = u_eye().xyz;
  // the lake's rings, where this cell sees open water: crests lit, a trough behind each
  let dt = u_rip().w;
  if (dt > 0.0 && rd.y < 0.0) {
    let t = (u_lakey().x - eye.y) / rd.y;
    let p = eye + rd * t;
    let z = depth(cuv);
    let green = acc.g > acc.r * 1.15 && acc.g > acc.b * 1.05;
    if (lakeE(p.xz) < 0.95 && (z <= 0.0 || z > t * dot(rd, u_fwd().xyz) - 0.05) && !green) {
      let r = length(p.xz - u_rip().xy);
      var crest = 0.0; var trough = 0.0;
      for (var k = 0; k < 4; k++) {
        let rk = u_lakey().y * dt - f32(k) * u_lakey().z;
        if (rk <= 0.0) { continue; }
        let a = exp(-f32(k) * 0.45) * exp(-dt * 0.4) * exp(-rk / 5.0);
        crest += a * exp(-pow((r - rk) / 0.1, 2.0));
        trough += a * exp(-pow((r - rk + u_lakey().z * 0.45) / 0.11, 2.0));
      }
      acc = acc * (1.0 - 0.22 * clamp(trough, 0.0, 1.0));
      acc = mix(acc, max(acc * 2.4, vec3<f32>(0.38, 0.77, 0.81) * 0.85), clamp(crest * 0.85, 0.0, 1.0));
    }
  }
  // the splash: drops thrown up from the tap, falling back, each a cell
  if (dt > 0.0 && dt < 0.9) {
    for (var k = 0; k < 14; k++) {
      let fk = f32(k);
      let a = h1(fk + 1.0) * 6.2831; let up = 1.1 + 1.3 * h1(fk + 7.0); let out = 0.25 + 0.6 * h1(fk + 13.0);
      let p = vec3<f32>(u_rip().x + cos(a) * out * dt, u_lakey().x + up * dt - 4.9 * dt * dt, u_rip().y + sin(a) * out * dt);
      if (p.y < u_lakey().x) { continue; }
      let k2 = toUv(p);
      if (k2.z > 0.0 && all(floor(k2.xy * CELLS) == cell)) { acc = select(vec3<f32>(0.38, 0.77, 0.81), vec3<f32>(0.95, 0.92, 0.82), h1(fk + 3.0) > 0.4); }
    }
  }
  // ordered dither, then the nearest colour of the palette
  let ci = vec2<u32>(cell) % vec2<u32>(4u);
  let b = BAYER[ci.y * 4u + ci.x] / 16.0 - 0.47;
  let dz = depth(cuv);
  let s = clamp(l2s(acc) + b * u_k().x * select(1.0, 0.3, dz > 0.0 && dz < 60.0), vec3<f32>(0.0), vec3<f32>(1.0));
  let lab = oklab(s2l(s));
  var best = 0; var bd = 1e9;
  for (var k = 0; k < NPAL; k++) { let d = lab - PAL_LAB[k]; let dd = dot(d, d * vec3<f32>(1.0, 1.4, 1.4)); if (dd < bd) { bd = dd; best = k; } }
  return vec4<f32>(PAL_LIN[best], c0.a);
}`;

// The doorway's picture of the next world (as kit.tsx Portal shows it, but here and not on a card in the scene: the
// splats behind the door write no depth and draw over a card). u_portal: which picture this pass has, the layer to
// read, the picture showing (-1 none: the opening is dark), and whether the next world's pictures are rendered.
const DOORWAY = /* wgsl */ `
fn rayOf(uv: vec2<f32>) -> vec3<f32> {
  let tn = u_eye().w; let asp = u_fwd().w;
  return normalize(u_fwd().xyz + u_right().xyz * (uv.x * 2.0 - 1.0) * tn * asp - u_up().xyz * (uv.y * 2.0 - 1.0) * tn);
}
fn shade(in: FullscreenVertexOutput) -> vec4<f32> {
  let uv = in.uv; let c0 = frame(uv);
  if (u_doorh().z <= 0.001) { return c0; }
  let rd = rayOf(uv); let eye = u_eye().xyz;
  let tp = (u_door().z - eye.z) / rd.z;
  let pp = eye + rd * tp;
  if (tp <= 0.0 || abs(pp.x - u_door().x) > u_door().w || abs(pp.y - u_doorh().x) > u_doorh().y) { return c0; }
  let z = depth(uv);
  if (z > 0.0 && z <= tp * dot(rd, u_fwd().xyz) - 0.02) { return c0; }
  if (u_portal().z < -0.5 || u_portal().w < 0.5) { return vec4<f32>(0.0015, 0.0015, 0.002, c0.a); }
  if (abs(u_portal().z - u_portal().x) > 0.5) { return c0; }
  let p = textureSample(tex_pic, samp_pic, uv, i32(u_portal().y));
  return vec4<f32>(p.rgb, c0.a);
}`;

function Pixels({ cam, hand, click, door, abs }: { cam: Cam; hand: { pos: V3; size?: number } | null; click: { at: V3; dt: number }; door: { center: V3; half: [number, number]; open: number }; abs: number }) {
  // which of the next world's doorway pictures, and which layer of it (kit.tsx Portal's choice)
  // (the frame's own pictures and list: the tall frame's are media/portal-tall, 9 pictures of 5 frames; 11-14 they were
  // the 5:4 frame's here, and the tall film's pixel door opened onto more meadow, then cut to the house)
  const has = ((TALL ? TALL_PORTALS : WIDE_PORTALS) as string[]).includes(NEXT);
  const pf = portalFrame(NEXT, abs);
  const showing = has && pf >= 0 && pf < PORTAL_FRAMES ? Math.floor(pf / PORTAL_CHUNK) : -1;
  const pic = (k: number) => (has ? { src: staticFile(`${PORTAL_DIR}/${NEXT}-${k}.png`), layers: PORTAL_CHUNK } : { src: staticFile("sky/pixel-sky.png"), layers: 1 });
  const f = nrm(sub(cam.look, cam.eye)), r = nrm([-f[2], 0, f[0]]);
  const u: V3 = cross(r, f);
  const d = hand ? Math.hypot(...sub(hand.pos, cam.eye)) : 1;
  const s = 0.105 * Math.sqrt(Math.max(0.3, d)) * (hand?.size ?? 1);
  const tn = Math.tan((cam.fov * Math.PI) / 360);
  const lens = { eye: [...cam.eye, tn], fwd: [...f, W / H], right: [...r, 0], up: [...u, 0] };
  const opening = { door: [door.center[0], 0, door.center[2], door.half[0]], doorh: [door.center[1], door.half[1], door.open, 0] };
  return (
    <>
      {/* the doorway, one pass for each picture of the next world (a pass takes one texture array), each drawing it
          while its picture is the one showing */}
      {Array.from({ length: PORTAL_FRAMES / PORTAL_CHUNK }, (_, k) => k).map((k) => (
        <FramePass key={`doorway-${k}`} wgsl={DOORWAY} prepass uniforms={{ ...lens, ...opening, portal: [k, showing >= 0 ? pf % PORTAL_CHUNK : 0, showing, has ? 1 : 0] }} textures={{ pic: pic(k) }} />
      ))}
      <FramePass wgsl={PIXEL} prepass uniforms={{
        ...lens, ...opening,
        cur: [...(hand?.pos ?? [0, 0, 0]), hand ? 1 : 0], curs: [(1.25 * s) / d / (2 * tn), s + 0.12, 0, 0],
        lake: [LAKE.cx, LAKE.cz, LAKE.rx, LAKE.rz], lakey: [LAKE.y, RIP.c, RIP.len, 0], rip: [click.at[0], click.at[2], 0, click.dt],
        k: [0.04, 0, 0, 0],
      }} />
    </>
  );
}

export function PixelWorld({ s, t, v }: { s: Shot; t: number; v: View }) {
  const { T, open } = pixelKeys(s, t);
  const { cam: c } = v;
  // (the cursor kept its size out over the water: as it reaches seven metres off to tap the lake it would be a speck)
  // and it pokes the water tip first: it turns to point down at it as it comes in, and back as it leaves (pressed as it
  // is onto a wall, its body would hang below its tip, under the water)
  const { T: TK } = pixelKeys(s, t);
  const poke = t < TK.click ? jerk(ramp(t, TK.click - 0.32, TK.click - 0.04)) : 1 - jerk(ramp(v.hand?.pos[1] ?? 9, LAKE.y + 0.3, LAKE.y + 0.8));
  const hand = v.hand && { ...v.hand, lean: (v.hand.lean ?? 0) + POKE * poke, size: Math.min(1.45, Math.max(1, Math.sqrt(Math.hypot(...sub(v.hand.pos, c.eye)) / 2.5))) };
  const abs = s.from + t;
  const dt = t - T.click;
  const center: V3 = [0, (OPENING.sill + OPENING.top) / 2, -RZ - 0.03];
  const half: [number, number] = [OPENING.half_width, (OPENING.top - OPENING.sill) / 2];
  const phase = dt > 0 ? (2 * Math.PI * RIP.c * dt) / RIP.len : 0;
  const lift = jerk(ramp(dt, 0.35, 2.4));
  const SUN_LUX = 5200, FILL_LUX = 2100;
  return (
    <AbsoluteFill style={{ background: "#2b1e4f" }}>
      <Canvas3D>
        <Camera3d transform={Transform.fromXyz(...c.eye).lookingAt(c.look)} projection={{ Perspective: { fov: (c.fov * Math.PI) / 180, near: 0.03, far: 1000 } }}>{/* (ray traced, as every world is: the director, 11-12, "solari is kind of the ideal") */}<SolariLighting bounces={2} /></Camera3d>
        <AntiAliasing mode="none" />
        <ToneMapping mode="none" />
        <Shadows mapSize={2048} distance={12} firstCascade={5} cascades={2} />
        <AmbientLight color="#8f7fb3" brightness={260} />
        {/* the sun, low behind the door: it lights the frame's edges and what stands round it, never the face we see */}
        <DirectionalLight illuminance={SUN_LUX} color="#ffb36b" shadow_maps_enabled transform={Transform.fromXyz(SUN[0] * 40, SUN[1] * 40, SUN[2] * 40 - RZ).lookingAt([0, 0, -RZ])} />
        {/* the east behind us, gone violet: the door's face */}
        <DirectionalLight illuminance={FILL_LUX} color="#c9a3d6" transform={Transform.fromXyz(-4, 6, 12).lookingAt([0, 1, -RZ])} />
        <Mesh3d name="pixel-sky" transform={Transform.fromXyz(0, (CARD.y0 + CARD.y1) / 2, CARD.z)} {...({ allowOverlap: true } as object)}>
          <Plane3d normal={[0, 0, 1]} half_size={[CARD.w / 2, (CARD.y1 - CARD.y0) / 2]} />
          <StandardMaterial unlit base_color="#ffffff" base_color_texture={{ path: staticFile("sky/pixel-sky.png"), sampler: { filter: "nearest", wrap: "clamp" } }} />
        </Mesh3d>
        <Splat name="pixel-land" src={staticFile("splat/pixel-land.splat")} />
        <Splat name="pixel-door-shade" src={staticFile("splat/pixel-door-shade.splat")} />
        <Splat name="pixel-door-lit" src={staticFile("splat/pixel-door-lit.splat")} reveal={0.4 + 0.24 * open} revealAxis={[-0.94, 0, -0.33]} revealSoft={0.03} revealGlow={0.5} glowColor="#fff6e0" />
        <Splat name="pixel-lake-bed" src={staticFile("splat/pixel-lake-bed.splat")} />
        {RINGS.slice(0, -1).map((_, k) => (
          <Splat key={k} name={`pixel-lake-${k}`} src={staticFile(`splat/pixel-lake-${k}.splat`)} wave={{ amplitude: ringAmp(k, dt), wavelength: RIP.len, phase }} />
        ))}
        <Splat name="pixel-flies" src={staticFile("splat/pixel-flies.splat")} position={[0, 0.35 * lift, 0]} pulse={Math.min(1, 0.35 + 0.25 * Math.sin(abs * 4.1) + 0.5 * lift * (0.7 + 0.3 * Math.sin(abs * 9)))} pulseScale={0.3} pulseGlow={0.5} />
        <Model name="door" src={staticFile("models/pixel/door.glb")} position={[0, 0, -RZ]} animation="open" time={clamp01(open) * 0.999} loop={false} {...({ allowOverlap: true } as object)} />
        <Hand3D hand={hand} cam={c} />
        <Pixels cam={c} hand={hand} click={{ at: CLICK, dt }} door={{ center, half, open }} abs={abs} />
        {!v.portal && <Finish look={{}} seed={s.f0} />}
      </Canvas3D>
    </AbsoluteFill>
  );
}

// What the opening's worlds share. the director, 11-11: "i really do want every time that door opens its a whole new world".
// Every world stands on the take's one line (v3/walk.tsx takeCam), entered through the last world's door at its own
// `back` and left by a door at z -RZ, and each is its own render. So that a door opens on the next world itself, the
// next world's last-second frames, seen from this world's lens, are rendered ahead (tools/portals.sh, compositions
// v3p-ID) and shown in the doorway as it opens: a screen-space picture on the opening, which is exactly what that
// world looks like from here.
import { staticFile } from "raea";
import { FramePass } from "raea/3d";
import { Cuboid, Mesh3d } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Transform } from "raea/transform";
import { NoShadowMesh } from "./noshadow";
import type { V3 } from "../v2/math";
import type { Cam } from "./cam";
import { JOIN, handAt, type Key } from "./hand3d";
import { H, SHOTS, TALL, W, type Shot } from "./plan";
import WIDE_PORTALS from "./portals.json";
import TALL_PORTALS from "./portals-tall.json";
import { shiftOf, takeView } from "./walk";

export type Hand = ReturnType<typeof handAt>;
/** what a world is seen by: the lens, and the cursor. In a portal's render (`portal`: the next world's frames for the
 *  last world's doorway) the cursor is drawn where the take has it (once it is past the door's plane it is the next
 *  world's, as it is a frame later), and the shot leaves out its grain and vignette (look.tsx Finish: the last world
 *  adds them over its doorway too) */
export type View = { cam: Cam; hand: Hand; portal?: boolean };
export const shotOf = (id: string): Shot => { const s = SHOTS.find((x) => x.id === id); if (!s) throw new Error(`no shot ${id}`); return s; };

/** the take's lens in its world at t, leaned toward the cursor, and the cursor: from the whole take's keys (each world
 *  puts its own in v3/takekeys.ts), so the cursor's path and the lens run on unbroken through the doors */
export const viewOf = (s: Shot, t: number): View => takeView(s, t);
/** the cursor goes through this world's door with us, riding the lens (hand3d.tsx JOIN), and on into the next world's
 *  keys: the take's one path passes through this point as the lens crosses the door */
export const goOut = (len: number): Key[] => [{ t: len, p: JOIN }];

/** a view of world `to` from world `from`'s lens: the lens moved by the distance between the two worlds on the line */
export function moved(v: View, from: string, to: string): View {
  const d = shiftOf(from, to);
  const m = (p: V3): V3 => [p[0], p[1], p[2] - d];
  return { cam: { ...v.cam, eye: m(v.cam.eye), look: m(v.cam.look) }, hand: v.hand && { ...v.hand, pos: m(v.hand.pos) }, portal: true };
}

// ---- the doorway's picture of the next world ---------------------------------------------------------------------
/** how many frames of the next world a doorway shows (its last second and a half), and how many go in one picture (a texture
 *  array is one picture of its layers stacked: 15 frames of 1080 is 16200 px, under the GPU's 16384) */
// (tall: 5 frames of 1920 a picture, 9600 px; 15 would be 28800)
export const PORTAL_FRAMES = 45, PORTAL_CHUNK = TALL ? 5 : 15;
/** where the doorways' pictures are (media/): the tall frame's are its own */
export const PORTAL_DIR = TALL ? "portal-tall" : "portal";
/** the worlds whose doorway pictures are made for this frame (tools/portals.sh lists them) */
const PORTALS: string[] = TALL ? TALL_PORTALS : WIDE_PORTALS;
const CHUNKS = PORTAL_FRAMES / PORTAL_CHUNK;
/** which frame of the next world's run-up this second of the film is (0..PORTAL_FRAMES-1; outside it, none). A door
 *  opened a little before the run-up holds its first frame (up to half a second: the painting's opens 1.7 s before its
 *  join, and its opening was dark for its first frames; the director, 11-11, on the painting's clip) */
export const portalFrame = (next: string, abs: number) => {
  const f = Math.round(abs * 30) - (shotOf(next).f0 - PORTAL_FRAMES);
  return f < 0 && f >= -PORTAL_CHUNK ? 0 : f;
};
// (blended, not opaque: an opaque material of our own is drawn again in the depth prepass the film's look turns on, and
// its fragment shader doesn't fit that pipeline; and it casts no shadow, so a doorway's own light comes through it)
const PORTAL_WGSL = /* wgsl */ `
fn shade(in: VertexOutput) -> vec4<f32> {
  let uv = in.position.xy / view.viewport.zw;
  let c = textureSample(tex_next, samp_next, uv, i32(u_layer()));
  return vec4<f32>(c.rgb, 1.0);
}`;
/** In a door's opening (its middle, its half width and height, turned `yaw`), the next world as this lens sees it there;
 *  until its frames are rendered, a dark opening. Every part is there from the first frame (a render keeps the entities
 *  it starts with) and is parked far behind the lens when it is not the one showing. */
export function Portal({ next, abs, center, half, yaw = 0, cam }: { next: string; abs: number; center: V3; half: [number, number]; yaw?: number; cam: Cam }) {
  const has = (PORTALS as string[]).includes(next);
  const f = portalFrame(next, abs);
  const showing = has && f >= 0 && f < PORTAL_FRAMES ? Math.floor(f / PORTAL_CHUNK) : -1;
  const away: V3 = [cam.eye[0] + (cam.eye[0] - cam.look[0]) * 50, cam.eye[1] - 400, cam.eye[2] + (cam.eye[2] - cam.look[2]) * 50];
  return (
    <>
      {has && Array.from({ length: CHUNKS }, (_, k) => (
        <NoShadowMesh key={`portal-${next}-${k}`} name={`portal-${k}`} shape={{ primitive: "Rectangle", half_size: half }} position={showing === k ? center : away} rotation={[0, yaw, 0]} alpha="blend" doubleSided
          wgsl={PORTAL_WGSL} uniforms={{ layer: showing === k ? f % PORTAL_CHUNK : 0 }} textures={{ next: { src: staticFile(`${PORTAL_DIR}/${next}-${k}.png`), layers: PORTAL_CHUNK } }} />
      ))}
      <Mesh3d name="portal-dark" transform={Transform.fromXyz(...(showing < 0 ? center : away))} {...({ allowOverlap: true } as object)}><Cuboid half_size={yaw === 0 ? [half[0], half[1], 0.002] : [0.002, half[1], half[0]]} /><StandardMaterial base_color="#040405" perceptual_roughness={1} /></Mesh3d>
    </>
  );
}

/** The same picture on the inside of an open box behind a door that swings away from us (its opening's middle at the
 *  door's plane, its half width and height, how deep): the leaf swings in front of the box's faces and stays seen,
 *  and the box hides whatever of this world stands behind the door. */
export function PortalBox({ next, abs, door, half, depth, cam }: { next: string; abs: number; door: V3; half: [number, number]; depth: number; cam: Cam }) {
  const [x, y, z] = door, [w, h] = half, zc = z - depth / 2;
  const faces: { c: V3; half: [number, number]; rot: V3; box: V3 }[] = [
    { c: [x, y, z - depth], half: [w, h], rot: [0, 0, 0], box: [w, h, 0.002] },
    { c: [x, y - h, zc], half: [w, depth / 2], rot: [-Math.PI / 2, 0, 0], box: [w, 0.002, depth / 2] },
    { c: [x, y + h, zc], half: [w, depth / 2], rot: [Math.PI / 2, 0, 0], box: [w, 0.002, depth / 2] },
    { c: [x - w, y, zc], half: [depth / 2, h], rot: [0, Math.PI / 2, 0], box: [0.002, h, depth / 2] },
    { c: [x + w, y, zc], half: [depth / 2, h], rot: [0, -Math.PI / 2, 0], box: [0.002, h, depth / 2] },
  ];
  return <>{faces.map((f, i) => <PortalFace key={i} i={i} next={next} abs={abs} center={f.c} half={f.half} rot={f.rot} box={f.box} cam={cam} />)}</>;
}
function PortalFace({ i, next, abs, center, half, rot, box, cam }: { i: number; next: string; abs: number; center: V3; half: [number, number]; rot: V3; box: V3; cam: Cam }) {
  const has = (PORTALS as string[]).includes(next);
  const f = portalFrame(next, abs);
  const showing = has && f >= 0 && f < PORTAL_FRAMES ? Math.floor(f / PORTAL_CHUNK) : -1;
  const away: V3 = [cam.eye[0] + (cam.eye[0] - cam.look[0]) * 50, cam.eye[1] - 400, cam.eye[2] + (cam.eye[2] - cam.look[2]) * 50];
  return (
    <>
      {has && Array.from({ length: CHUNKS }, (_, k) => (
        <NoShadowMesh key={`pf-${next}-${i}-${k}`} name={`portal-${i}-${k}`} shape={{ primitive: "Rectangle", half_size: half }} position={showing === k ? center : away} rotation={rot} alpha="blend" doubleSided
          wgsl={PORTAL_WGSL} uniforms={{ layer: showing === k ? f % PORTAL_CHUNK : 0 }} textures={{ next: { src: staticFile(`${PORTAL_DIR}/${next}-${k}.png`), layers: PORTAL_CHUNK } }} />
      ))}
      <Mesh3d key={`pd-${i}`} name={`portal-dark-${i}`} transform={Transform.fromXyz(...(showing < 0 ? center : away))} {...({ allowOverlap: true } as object)}><Cuboid half_size={box} /><StandardMaterial base_color="#040405" perceptual_roughness={1} /></Mesh3d>
    </>
  );
}

// ---- the doorway, drawn last ---------------------------------------------------------------------------------------
// the director, 11-11: "for each transition ebtween doors it shoudl be seemless i notice cuts or clear edits". The Portal card
// above stands in the scene, so its picture of the next world went through this world's tone mapping and this world's
// look a second time (the next world's frames are already toned and printed): through the doorway the next world was
// darker, flatter and twice vignetted, and at the join it jumped to itself. So the picture is drawn again as a pass
// after this world's look (FilmLook finish={false}), exactly as the next world rendered it, over every pixel that is
// seen through the opening and beyond it; then the film's grain and vignette over the whole frame (look.tsx Finish).
// At the join the lens stands in the doorway and the frame is the next world's own frame, pixel for pixel.
// (The card stays: it hides this world behind the opening and lights the edges with the next world's colours.)
const DOORWAY_WGSL = /* wgsl */ `
fn rayOf(uv: vec2<f32>) -> vec3<f32> {
  let tn = u_eye().w; let asp = u_fwd().w;
  return normalize(u_fwd().xyz + u_right().xyz * (uv.x * 2.0 - 1.0) * tn * asp - u_up().xyz * (uv.y * 2.0 - 1.0) * tn);
}
fn shade(in: FullscreenVertexOutput) -> vec4<f32> {
  let uv = in.uv; let c0 = frame(uv);
  if (u_doorh().w <= 0.001) { return c0; }
  let rd = rayOf(uv); let eye = u_eye().xyz;
  // where the line of sight crosses the door's plane, and whether that is inside the opening (round-topped if asked)
  let den = dot(rd, u_dn().xyz);
  if (abs(den) < 1e-5) { return c0; }
  let tp = dot(u_door().xyz - eye, u_dn().xyz) / den;
  let pp = eye + rd * tp - u_door().xyz;
  let ax = dot(pp, u_da().xyz); let ay = pp.y;
  if (tp <= 0.0 || abs(ax) > u_doorh().x || abs(ay) > u_doorh().y) { return c0; }
  if (u_doorh().z > 1.5) {
    // a pointed arch (equilateral): two arcs, each of the span's radius, centred on the springing line at the other jamb
    let hw = u_doorh().x; let top = u_doorh().y - hw * 1.7320508;
    if (ay > top && (length(vec2<f32>(ax + hw, ay - top)) > 2.0 * hw || length(vec2<f32>(ax - hw, ay - top)) > 2.0 * hw)) { return c0; }
  } else if (u_doorh().z > 0.5) { let top = u_doorh().y - u_doorh().x; if (ay > top && length(vec2<f32>(ax, ay - top)) > u_doorh().x) { return c0; } }
  // this world's own things in front of the opening stay (the cursor, a leaf swung toward us), and so do upright ones
  // within u_door().w behind it (the leaves of a door pushed open, away from us)
  let z = depth(uv); let along = dot(rd, u_fwd().xyz);
  if (z > 0.0 && z <= tp * along - 0.02) { return c0; }
  if (u_door().w > 0.0 && z > 0.0 && z <= (tp + u_door().w / abs(den)) * along && abs(normal(uv).y) < 0.6) { return c0; }
  if (u_portal().z < -0.5 || u_portal().w < 0.5) { return vec4<f32>(0.0015, 0.0015, 0.002, c0.a); }
  if (abs(u_portal().z - u_portal().x) > 0.5) { return c0; }
  let p = textureSample(tex_pic, samp_pic, uv, i32(u_portal().y));
  return vec4<f32>(p.rgb, c0.a);
}`;
/** The next world in a door's opening, as it rendered itself from this lens (tools/portals.sh), drawn over this world's
 *  finished frame: put it after FilmLook finish={false} and before Finish. `center` and `half`: the opening's middle and
 *  half width and height, turned `yaw` (as Portal); `arch`: its top is round; `behind`: how far past the opening this
 *  world's upright things are kept (a door pushed open swings its leaves in there); `open` 0 leaves the opening alone. */
export function Doorway({ next, abs, cam, center, half, yaw = 0, arch = false, behind = 0, open = 1 }: { next: string; abs: number; cam: Cam; center: V3; half: [number, number]; yaw?: number; arch?: boolean | "pointed"; behind?: number; open?: number }) {
  const has = (PORTALS as string[]).includes(next);
  const f = portalFrame(next, abs);
  const showing = has && f >= 0 && f < PORTAL_FRAMES ? Math.floor(f / PORTAL_CHUNK) : -1;
  // (until the next world's frames are rendered the opening is dark, and the picture a stand-in it never reads: an array
  // texture wants two layers or more)
  const pic = (k: number) => (has ? { src: staticFile(`${PORTAL_DIR}/${next}-${k}.png`), layers: PORTAL_CHUNK } : { src: staticFile("sky/pixel-sky.png"), layers: 2 });
  const fl = [cam.look[0] - cam.eye[0], cam.look[1] - cam.eye[1], cam.look[2] - cam.eye[2]], l = Math.hypot(...fl), fw: V3 = [fl[0] / l, fl[1] / l, fl[2] / l];
  const rl = Math.hypot(fw[2], fw[0]) || 1, r: V3 = [-fw[2] / rl, 0, fw[0] / rl], u: V3 = [r[1] * fw[2] - r[2] * fw[1], r[2] * fw[0] - r[0] * fw[2], r[0] * fw[1] - r[1] * fw[0]];
  const lens = { eye: [...cam.eye, Math.tan((cam.fov * Math.PI) / 360)], fwd: [...fw, W / H], right: [...r, 0], up: [...u, 0] };
  const plane = { door: [...center, behind], dn: [Math.sin(yaw), 0, Math.cos(yaw), 0], da: [Math.cos(yaw), 0, -Math.sin(yaw), 0], doorh: [half[0], half[1], arch === "pointed" ? 2 : arch ? 1 : 0, open] };
  return (
    <>
      {Array.from({ length: CHUNKS }, (_, k) => k).map((k) => (
        <FramePass key={`doorway-${next}-${k}`} wgsl={DOORWAY_WGSL} prepass uniforms={{ ...lens, ...plane, portal: [k, showing >= 0 ? f % PORTAL_CHUNK : 0, showing, has ? 1 : 0] }} textures={{ pic: pic(k) }} />
      ))}
    </>
  );
}

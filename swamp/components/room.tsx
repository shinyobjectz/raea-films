// The review room aboard the ship: the film the robot sent playing on the aliens' screen, the aliens themselves only
// as dark heads against it, out of focus, and then their hands writing the note.
//
//   29-arrive v4: out of the port's white into the dark room, what they see: their screen idle, the review link arriving
//             on it, and the aliens walking in past the lens and sitting down; the link opens into the film
//   29-room   the film plays on the screen (a cut of our own v2 render),
//             the heads lean in, and at its turn (the swamp coming alive) the room jolts and clamors
//   30-hands  close on alien hands at an alien keyboard, typing the note
//   31-note   over the heads to the screen, the film paused, the note pinned on it in their script; the subtitle
//
// The screen is the room's light: behind the picture, a grid of glowing tiles each the colour of its part of the picture,
// which Solari traces, so the room takes the film's colour frame by frame (a grey dead swamp, then green, then dusk). Nothing else is lit but the keys' faint
// legends. Metres, y up, the screen on the far wall facing +z; the aliens face it (-z).
import type { ReactNode } from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useVideoConfig } from "raea";
import { Screen, manifold, type Solid } from "raea/3d";
import { Affine2 } from "raea/math";
import { Camera3d } from "raea/camera";
import { LinearRgba, Srgba } from "raea/color";
import { GlobalAmbientLight, SolariLighting } from "raea/light";
import { Cuboid, Mesh3d, Plane3d } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { DepthOfField, Grade, ToneMapping } from "raea/post_process";
import { Quat, Transform } from "raea/transform";
import { exposed } from "./flare";
import { LIGHT, LIGHT_GRID } from "./room-light";
import { GLYPH, PLAY, SCREEN, THUMB, TYPE } from "./room-media";
import { CUBE, cubed, grooves, skinField, skinned, smoothstep } from "./hand-skin";
import { CHATTER, HMM, MUTTER, SEND, TYPING, WOW } from "./room-voice";
import type { Lens } from "./shot";
import type { Shot2 } from "./take";
import { SIT, STEP, STEPS, T, type V3, WALK, clamp, lerp, lerp3 } from "./timeline";

type Q = [number, number, number, number];
const glow = (c: string, k: number) => LinearRgba.from(Srgba.hex(c)).mul(k);
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mulv = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const qm = (a: Q, b: Q): Q => Quat.mul(a, b) as Q;
const qv = (q: Q, v: V3): V3 => Quat.mulVec3(q, v) as V3;
const rx = (a: number) => Quat.fromRotationX(a) as Q;
const ry = (a: number) => Quat.fromRotationY(a) as Q;
const rz = (a: number) => Quat.fromRotationZ(a) as Q;
const place = (p: V3, q: Q) => Transform.fromXyz(...p).withRotation(q);
const smooth = (t: number) => t * t * (3 - 2 * t);
/** a 0..1 that rises over [a, b] and falls over [c, d] */
const env = (f: number, a: number, b: number, c: number, d: number) => interpolate(f, [a, b, c, d], [0, 1, 1, 0], clamp);

// ---- what they say, as loudness a frame (room-voice.ts, from scripts/alien_voice_v3.py) ----
/** a voice's loudness at a film frame (0 outside it), between its frames */
const said = (env: number[], from: number, f: number) => {
  const x = f - from;
  if (x < 0 || x >= env.length - 1) return 0;
  const i = Math.floor(x);
  return lerp(env[i], env[i + 1], x - i);
};
/** its loudness held soft over `k` frames either side: the body's slower answer to the voice */
const heard = (env: number[], from: number, f: number, k = 4) => {
  let a = 0, w = 0;
  for (let d = -k; d <= k; d++) {
    const g = 1 - Math.abs(d) / (k + 1);
    a += said(env, from, f + d) * g;
    w += g;
  }
  return a / w;
};
/** how sharply it's rising: a syllable's start */
const onsetOf = (env: number[], from: number, f: number) => Math.max(0, said(env, from, f) - said(env, from, f - 2));

// ---- signed distances for the organic parts (negative inside) ----
type SDF = (x: number, y: number, z: number) => number;
const smin = (a: number, b: number, k: number) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};
const ell = (x: number, y: number, z: number, c: V3, r: V3) => {
  const px = (x - c[0]) / r[0], py = (y - c[1]) / r[1], pz = (z - c[2]) / r[2];
  return (Math.sqrt(px * px + py * py + pz * pz) - 1) * Math.min(r[0], r[1], r[2]);
};
/** a cone with rounded ends: radius r1 at a, r2 at b (Inigo Quilez's round cone) */
function roundCone(p: V3, a: V3, b: V3, r1: number, r2: number) {
  const ba = sub(b, a), l2 = dot(ba, ba), rr = r1 - r2, a2 = l2 - rr * rr, il2 = 1 / l2;
  const pa = sub(p, a), y = dot(pa, ba), z = y - l2;
  const xv = sub(mulv(pa, l2), mulv(ba, y)), x2 = dot(xv, xv);
  const y2 = y * y * l2, z2 = z * z * l2, k = Math.sign(rr) * rr * rr * x2;
  if (Math.sign(z) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - r2;
  if (Math.sign(y) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - r1;
  return (Math.sqrt(x2 * a2 * il2) + y * rr) * il2 - r1;
}
const level = (sdf: SDF, min: V3, max: V3, n: number) => manifold.levelSet(sdf, { min, max, resolution: n });

// =====================================================================================================================
// the room
// =====================================================================================================================
const SCR_W = 7.2, SCR_H = SCR_W * (9 / 16);
const SCR: V3 = [0, 2.55, -8.5];
/** the room's exposure, stops over Bevy's default; the picture's white sits at about 1 in the HDR frame */
const EXPOSURE = 3.2;
const SCR_NITS = (1.0 * 2 ** 9.7 * 1.2) / 2 ** EXPOSURE;
/** the light the screen throws on the room, over what its picture shows (a cheat, as a set's screen is lit for the lens) */
const SPILL = 2.5;
/** the close shot of the hands opened up, as a lens is for a close-up in a dark room */
const HANDS_OPEN = 3.3;
void exposed;
/** v4, 29-arrive: the review link's card opens into the film over OPEN_LEN frames from OPEN, as the last of them sits */
const OPEN = 1980, OPEN_LEN = 14;
/** the picture on the screen at a frame, by its file's name in assets/room/screen */
export function screenAt(f: number): string {
  if (f < T.linkIn) return "standby";
  if (f < OPEN + OPEN_LEN / 2) return "link";
  if (f < T.roomPlay) return "paused-a";
  if (f < T.hands) return `play-${String(Math.min(PLAY.length - 1, Math.max(0, f - T.roomPlay))).padStart(3, "0")}`;
  // v4: the note written as it's typed, each press's words drawn on over five frames (30b-glyphs is close on it), then
  // sent, then posted
  if (f < T.notePost) {
    if (f < TYPING[0][0]) return "paused-b";
    if (f >= SEND) return "type-sent";
    let i = 0;
    while (i + 1 < TYPING.length && TYPING[i + 1][0] <= f) i++;
    return `type-${i}-${Math.min(5, Math.floor(f - TYPING[i][0]) + 1)}`;
  }
  return "note-posted";
}
/** a picture's file */
const srcOf = (name: string) =>
  name.startsWith("play-") ? PLAY[Number(name.slice(5))] : name.startsWith("type-") ? TYPE[name] : { "paused-a": SCREEN.pausedA, "paused-b": SCREEN.pausedB, "note-draft": SCREEN.draft, "note-posted": SCREEN.posted, standby: SCREEN.standby }[name]!;
const FULL = { position: "absolute", left: 0, top: 0, width: 1920, height: 1080 } as const;
/** how far the link card has come up (0..1), and how far it has opened into the film */
const cardIn = (f: number) => interpolate(f, [T.linkIn, T.linkIn + 10], [0, 1], { ...clamp, easing: smooth });
const cardOpen = (f: number) => interpolate(f, [OPEN, OPEN + OPEN_LEN], [0, 1], { ...clamp, easing: smooth });
/** the screen's page: one picture, but for the arrival, where the link card comes up on the idle screen and then grows
 *  from its picture until that fills the screen, the paused film fading up under it (sized and placed, not CSS
 *  transformed: the card scaled about its picture's middle) */
function ScreenPage({ f, name, z = 1 }: { f: number; name: string; z?: number }) {
  if (f >= OPEN + OPEN_LEN || f < T.linkIn) return <Img src={srcOf(name)} style={{ ...FULL, width: 1920 * z, height: 1080 * z }} />;
  const cin = cardIn(f), open = cardOpen(f);
  const ox = (THUMB[0] + THUMB[2]) / 2, oy = (THUMB[1] + THUMB[3]) / 2;
  const k = (0.95 + 0.05 * cin) * (1 + (1920 / (THUMB[2] - THUMB[0]) - 1) * open);
  const dy = (1 - cin) * 24 + open * (540 - oy);
  return (
    <>
      <Img src={SCREEN.standby} style={FULL} />
      <Img src={SCREEN.card} style={{ position: "absolute", left: ox - k * ox, top: oy - k * oy + dy, width: 1920 * k, height: 1080 * k, opacity: cin }} />
      {open > 0 && <Img src={SCREEN.pausedA} style={{ ...FULL, opacity: interpolate(open, [0.35, 1], [0, 1], clamp) }} />}
    </>
  );
}
/** the screen's light: its picture's, blended as the card comes up and as it opens */
function lightAt(f: number, name: string): number[] {
  const mix = (a: number[], b: number[], t: number) => a.map((v, i) => lerp(v, b[i], t));
  if (f >= T.linkIn && f < T.linkIn + 10) return mix(LIGHT.standby, LIGHT.link, cardIn(f));
  if (f >= OPEN && f < OPEN + OPEN_LEN) return mix(LIGHT.link, LIGHT["paused-a"], cardOpen(f));
  // the note's typing frames light the room as the written note does (a few words' difference)
  return LIGHT[name] ?? LIGHT["note-draft"];
}
/** the screen page's brightness (raea's Screen): the picture's white about 1 in the HDR frame */
const SCR_BRIGHT = 1.1;

const WALL = "#24282c", RIB = "#2e3338";
const RIBS_X = [-5.4, -4.2, -3.0, -1.8, -0.6, 0.6, 1.8, 3.0, 4.2, 5.4];
function Room({ f, z = 1 }: { f: number; z?: number }) {
  const name = screenAt(f);
  const L = lightAt(f, name);
  const k = SCR_NITS * SPILL;
  return (
    <>
      {/* the screen: a page holding the picture, drawn in its own pass (not traced, so crisp); a page's <Img> waits for
          its picture every frame, in a video too, where a material's texture first used partway through never shows */}
      <Screen name="screen" pass="ui" position={[SCR[0], SCR[1], SCR[2] + 0.003]} size={[SCR_W, SCR_H]} resolution={[1920 * z, 1080 * z]} crt={false} brightness={SCR_BRIGHT} background="#000000">
        <ScreenPage f={f} name={name} z={z} />
      </Screen>
      {/* just behind it, the picture's light as a grid of glowing tiles, each the mean of its part of the picture: traced,
          it is what lights the room */}
      {Array.from({ length: LIGHT_GRID.x * LIGHT_GRID.y }, (_, i) => {
          const tx = i % LIGHT_GRID.x, ty = Math.floor(i / LIGHT_GRID.x);
          const tw = SCR_W / LIGHT_GRID.x, th = SCR_H / LIGHT_GRID.y;
          return (
            <Mesh3d key={`screen-light-${i}`} name={`screen-light-${i}`} castShadow={false} transform={Transform.fromXyz(SCR[0] - SCR_W / 2 + (tx + 0.5) * tw, SCR[1] + SCR_H / 2 - (ty + 0.5) * th, SCR[2])}>
              <Plane3d normal={[0, 0, 1]} half_size={[tw / 2, th / 2]} />
              <StandardMaterial base_color="#000000" emissive={new LinearRgba(L[i * 3] * k, L[i * 3 + 1] * k, L[i * 3 + 2] * k, 1)} perceptual_roughness={0.9} reflectance={0.02} />
            </Mesh3d>
          );
        })}
      {/* its frame, a dark bezel set into the far wall */}
      <Mesh3d name="screen-bezel" transform={Transform.fromXyz(SCR[0], SCR[1], SCR[2] - 0.06)}>
        <Cuboid half_size={[SCR_W / 2 + 0.18, SCR_H / 2 + 0.18, 0.05]} />
        <StandardMaterial base_color="#08090a" perceptual_roughness={0.35} />
      </Mesh3d>
      <Mesh3d name="far-wall" transform={Transform.fromXyz(0, 2.5, -8.75)}>
        <Cuboid half_size={[5, 2.7, 0.1]} />
        <StandardMaterial base_color={WALL} perceptual_roughness={0.7} />
      </Mesh3d>
      {/* the floor: dark, with a sheen that takes the screen */}
      <Mesh3d name="floor" transform={Transform.fromXyz(0, -0.05, -3)}>
        <Cuboid half_size={[5, 0.05, 7]} />
        <StandardMaterial base_color="#0b0c0d" perceptual_roughness={0.16} reflectance={0.5} />
      </Mesh3d>
      <Mesh3d name="ceiling" transform={Transform.fromXyz(0, 5.2, -3)}>
        <Cuboid half_size={[5, 0.1, 7]} />
        <StandardMaterial base_color={WALL} perceptual_roughness={0.8} />
      </Mesh3d>
      {[-1, 1].map((s) => (
        <Mesh3d key={`side${s}`} name={`side-wall-${s}`} transform={Transform.fromXyz(s * 4.7, 2.6, -3)}>
          <Cuboid half_size={[0.1, 2.7, 7]} />
          <StandardMaterial base_color={WALL} perceptual_roughness={0.7} />
        </Mesh3d>
      ))}
      {/* ribs down the side walls and across the ceiling: the hull's frames, catching the screen's light */}
      {[-1, 1].flatMap((s) =>
        [-7.4, -6.0, -4.6, -3.2, -1.8, -0.4, 1.0, 2.4].map((z, i) => (
          <Mesh3d key={`rib${s}${i}`} name={`rib-${s}-${i}`} transform={Transform.fromXyz(s * 4.5, 2.6, z)}>
            <Cuboid half_size={[0.12, 2.6, 0.09]} />
            <StandardMaterial base_color={RIB} perceptual_roughness={0.32} metallic={0.7} />
          </Mesh3d>
        )),
      )}
      {[-7.4, -6.0, -4.6, -3.2, -1.8, -0.4, 1.0, 2.4].map((z, i) => (
        <Mesh3d key={`crib${i}`} name={`ceiling-rib-${i}`} transform={Transform.fromXyz(0, 4.98, z)}>
          <Cuboid half_size={[4.6, 0.14, 0.09]} />
          <StandardMaterial base_color={RIB} perceptual_roughness={0.32} metallic={0.7} />
        </Mesh3d>
      ))}
      {/* the aisles' lights: small, dim, cool, low along each side wall between the ribs */}
      {[-1, 1].flatMap((s) =>
        [-6.7, -5.3, -3.9, -2.5, -1.1, 0.3, 1.7].map((z, i) => (
          <Mesh3d key={`aisle${s}${i}`} name={`aisle-${s}-${i}`} castShadow={false} transform={Transform.fromXyz(s * 4.56, 0.12, z)}>
            <Cuboid half_size={[0.01, 0.012, 0.09]} />
            <StandardMaterial base_color="#0d0f10" emissive={glow("#8fd8ff", 900)} />
          </Mesh3d>
        )),
      )}
      {RIBS_X.map((x, i) => (
        <Mesh3d key={`frib${i}`} name={`floor-step-${i}`} transform={Transform.fromXyz(x, 0.02, -6.4)}>
          <Cuboid half_size={[0.5, 0.03, 0.03]} />
          <StandardMaterial base_color="#16191b" perceptual_roughness={0.5} />
        </Mesh3d>
      ))}
      {/* the console the note is written at */}
      <Mesh3d name="desk" transform={Transform.fromXyz(KB_AT[0], KB_AT[1] + BASE_TOP - 0.026 - 0.035, KB_AT[2] - 0.05)}>
        <Cuboid half_size={[0.62, 0.035, 0.3]} />
        <StandardMaterial base_color="#1d2023" perceptual_roughness={0.5} metallic={0.15} />
      </Mesh3d>
    </>
  );
}

// =====================================================================================================================
// the heads: long skulls swept back and up, a low crest, the neck and the shoulders under a dark robe
// =====================================================================================================================
const SKULL = (tall: number, cleft: number): SDF => (x, y, z) => {
  // the cranium, tall, its crown leaning back (+z is the back of the head: they face -z)
  const c = Math.cos(0.32), sn = Math.sin(0.32);
  const yy = y - 0.06, zz = z - 0.03;
  const ry2 = yy * c - zz * sn, rz2 = yy * sn + zz * c;
  let d = ell(x, ry2, rz2, [0, 0.03, 0], [0.098, 0.16 * tall, 0.118]);
  // the crown in two lobes, a shallow cleft between them down the back
  for (const s of [-1, 1]) d = smin(d, ell(x, ry2, rz2, [s * 0.03, 0.09 * tall, 0.012], [0.07, 0.085 * tall, 0.09]), 0.04);
  d = Math.max(d, -(ell(x, ry2, rz2, [0, 0.19 * tall, 0.03], [0.007, 0.05 * tall, 0.1]) + 0.003 * (1 - cleft)));
  d = smin(d, ell(x, y, z, [0, -0.03, -0.05], [0.068, 0.085, 0.08]), 0.04); // the face and jaw, unseen
  d = smin(d, roundCone([x, y, z], [0, -0.06, 0.01], [0, -0.26, 0.03], 0.052, 0.062), 0.04); // the neck
  return d;
};
const HEAD_SHAPES: Solid[] = [
  level(SKULL(1.1, 1), [-0.14, -0.3, -0.16], [0.14, 0.42, 0.22], 96),
  level(SKULL(0.92, 0.5), [-0.14, -0.3, -0.16], [0.14, 0.42, 0.22], 96),
];
const SHOULDERS = level((x, y, z) => {
  const p: V3 = [x, y, z];
  let d = ell(x, y, z, [0, -0.33, 0.04], [0.23, 0.085, 0.13]);
  for (const s of [-1, 1]) d = smin(d, roundCone(p, [s * 0.04, -0.22, 0.03], [s * 0.19, -0.32, 0.04], 0.045, 0.06), 0.06);
  return smin(d, roundCone(p, [0, -0.36, 0.05], [0, -0.85, 0.08], 0.17, 0.21), 0.08);
}, [-0.3, -0.92, -0.16], [0.3, -0.16, 0.3], 72);
/** each head: where it sits (its skull's middle), how it turns at rest, its shape */
const HEADS: { at: V3; yaw: number; pitch: number; shape: number; s: number }[] = [
  { at: [-0.42, 1.4, 0.15], yaw: 0.12, pitch: 0.02, shape: 0, s: 1.12 },
  { at: [0.8, 1.45, -0.75], yaw: -0.08, pitch: -0.02, shape: 1, s: 1.15 },
  { at: [-0.1, 1.44, -2.3], yaw: 0.04, pitch: 0.04, shape: 1, s: 1.1 },
  { at: [1.55, 1.38, -3.4], yaw: -0.1, pitch: 0.0, shape: 0, s: 1.1 },
];
// ---- v5: their life in the seats (note: "the aliens move more"): they land in their seats with weight, look round at
// each other and back to the screen, glance at each other again while it plays, shift their weight and breathe. All of
// it moves the head's and the shoulders' transforms (shapes and uniforms freeze in a video render; transforms don't)
/** the yaw that turns head i's face to head j (yaw 0 faces the screen, -z; a positive yaw turns it toward -x), from
 *  its rest, as far as a neck goes (over the shoulder: the shoulders turn a little with it, Heads) */
const yawTo = (i: number, j: number) => {
  const a = HEADS[i].at, b = HEADS[j].at;
  return Math.max(-1.1, Math.min(1.1, Math.atan2(-(b[0] - a[0]), -(b[2] - a[2])) - HEADS[i].yaw));
};
/** each look: whose, at whom (-1: round the room, up and to the side), from, held until, how far of the way */
const LOOKS: { head: number; to: number; from: number; to2: number; k: number }[] = [
  // settled, the front pair turn to each other (0 to its right, 1 back over its left shoulder), and the back pair
  { head: 0, to: 1, from: 1984, to2: 2000, k: 0.8 },
  { head: 2, to: 1, from: 1990, to2: 2004, k: 0.6 },
  { head: 1, to: 0, from: 1997, to2: 2012, k: 0.75 },
  { head: 3, to: 2, from: 2005, to2: 2020, k: 0.6 },
  { head: 2, to: 3, from: 2014, to2: 2024, k: 0.45 },
  // while it plays: the one in the middle looks back over its shoulder at the front pair; the front pair share a look;
  // one at the back looks round the room, then back as the wow comes
  { head: 2, to: 1, from: 2038, to2: 2050, k: 0.6 },
  { head: 0, to: 1, from: 2050, to2: 2060, k: 0.55 },
  { head: 1, to: 0, from: 2052, to2: 2062, k: 0.5 },
  { head: 3, to: -1, from: 2054, to2: 2066, k: 1 },
  // reading the note: the back pair glance at each other
  { head: 3, to: 2, from: 2262, to2: 2280, k: 0.5 },
  { head: 2, to: 3, from: 2268, to2: 2284, k: 0.4 },
];
/** a head's looks at a frame: [yaw, pitch, dx, roll], each turned to in 7 frames and back in 9, eased. From behind (where
 *  the camera mostly is) a turn alone barely changes a head's outline, so it leans toward the one it looks at, and its
 *  head tips that way a little */
function lookAt(i: number, f: number): [number, number, number, number] {
  let yaw = 0, pitch = 0, dx = 0, roll = 0;
  for (const l of LOOKS) {
    if (l.head !== i) continue;
    const u = smooth(env(f, l.from, l.from + 7, l.to2, l.to2 + 9));
    if (u <= 0) continue;
    const side = l.to < 0 ? (i % 2 ? -1 : 1) : Math.sign(HEADS[l.to].at[0] - HEADS[i].at[0]);
    yaw += u * l.k * (l.to < 0 ? -0.55 * side : yawTo(i, l.to));
    pitch += u * (l.to < 0 ? 0.12 : -0.03);
    dx += u * l.k * 0.04 * side;
    roll -= u * l.k * 0.08 * side;
  }
  return [yaw, pitch, dx, roll];
}
/** landing in the seat with weight: a sink that bounces once (0 at the landing, deepest 3 frames on, a little back up
 *  past rest at 10), k frames after it */
const sinkAt = (k: number) => (k <= 0 ? 0 : Math.exp(-k / 7) * Math.sin(0.45 * k));
/** each shift of weight in the seat: whose, when, its new lean to the side (m) and roll; each holds till the next */
const SHIFTS: { head: number; at: number; dx: number; roll: number }[] = [
  { head: 2, at: 2008, dx: 0.02, roll: -0.04 },
  { head: 0, at: 2016, dx: -0.025, roll: 0.05 },
  { head: 1, at: 2024, dx: 0.02, roll: -0.035 },
  { head: 3, at: 2028, dx: -0.02, roll: 0.04 },
  { head: 0, at: 2112, dx: 0.01, roll: -0.02 },
  { head: 2, at: 2250, dx: -0.015, roll: 0.03 },
  { head: 3, at: 2290, dx: 0.015, roll: -0.03 },
];
/** a body's lean at a frame: [dx, roll], each shift eased over 12 frames with a little give at its end */
function shiftAt(i: number, f: number): [number, number] {
  let dx = 0, roll = 0;
  for (const s of SHIFTS) {
    if (s.head !== i) continue;
    const u = interpolate(f, [s.at, s.at + 12], [0, 1], clamp);
    const k = smooth(u) + 0.12 * sinkAt(f - s.at - 12);
    dx = lerp(dx, s.dx, k);
    roll = lerp(roll, s.roll, k);
  }
  return [dx, roll];
}
/** a slow breath, seated and watching (about 2.8 s), each its own */
const breathOf = (i: number, f: number) => Math.sin(f * 0.075 + i * 1.9);
/** how far under the neck the shoulders lean about (in the figure's units), about where it sits */
const SEAT_L = 0.85;

/** how each head moves at a frame: [dx, dy, dz, yaw, pitch, roll] over its rest */
function headMove(i: number, f: number): number[] {
  const w = (a: number, b: number) => Math.sin(f * a + b + i * 1.7);
  // breathing and settling: it rides the shoulders' breath, and drifts
  let dz = 0.006 * w(0.05, 0), dy = 0.003 * w(0.07, 1) + 0.006 * breathOf(i, f - 2), yaw = 0.035 * w(0.019, 2), pitch = 0.02 * w(0.031, 3), roll = 0.014 * w(0.023, 4);
  // v5: landing in the seat, it drops a frame or two after the shoulders and nods forward under its own weight
  const land = landOf(i);
  dy -= 0.05 * sinkAt(f - land - 1.5);
  pitch -= 0.08 * sinkAt(f - land - 2.5);
  // its looks round, and its lean with the shoulders' shifts (riding them, its roll partly taken back to stay level)
  const [ly, lp, lx, lr] = lookAt(i, f);
  yaw += ly;
  pitch += lp;
  roll += lr;
  // (the shoulders lean about the seat, SEAT_L under the neck, so the neck moves -SEAT_L * roll with them)
  const [sdx, sroll] = shiftAt(i, f);
  roll += 0.4 * sroll;
  const dx = sdx - SEAT_L * HEADS[i].s * sroll + lx;
  // as it plays: a lean in
  const lean = interpolate(f, [T.roomPlay - 4, T.roomPlay + 26], [0, 1], { ...clamp, easing: smooth });
  dz -= 0.04 * lean;
  pitch -= 0.05 * lean;
  // the wow, as they say it (WOW's loudness, each a frame or two apart and a little more or less moved): a breath in
  // before it, lifting the head; a jolt back on its attack; the head up and back while it's held, shaking a little with
  // the voice's flutter; then forward, wanting more
  const lag = [0, 2, 1, 3][i], amt = [1.15, 0.9, 1.0, 0.8][i];
  const inhale = env(f, T.wow - 12 - lag, T.wow - 5 - lag, T.wow - 4 - lag, T.wow - 1 - lag);
  dy += 0.012 * inhale;
  pitch += 0.035 * inhale;
  const w0 = said(WOW.env, WOW.from, f - lag), held = heard(WOW.env, WOW.from, f - lag, 5);
  const attack = Math.min(1, onsetOf(WOW.env, WOW.from, f - lag) * 2.5);
  dz += (0.05 * attack + 0.035 * held) * amt;
  dy += 0.022 * held * amt;
  pitch += (0.1 * attack + 0.11 * held + 0.12 * (w0 - held)) * amt;
  roll += 0.03 * (w0 - held) * (i % 2 ? 1 : -1);
  const fwd = env(f, T.wow + 18, T.wow + 32, T.hands + 30, T.hands + 60);
  dz -= 0.05 * fwd;
  pitch -= 0.06 * fwd;
  // then talking over each other (CHATTER, one voice a head): each nods on its own syllables, leans in while it talks,
  // and turns to the one it's talking to; the others turn a little toward whoever's speaking
  const to = [0.5, 0.42, -0.5, -0.38][i];
  const mine = CHATTER.heads[i];
  const talk = heard(mine, CHATTER.from, f, 6);
  pitch -= 0.09 * onsetOf(mine, CHATTER.from, f) + 0.02 * talk;
  dz -= 0.025 * talk;
  yaw += to * Math.min(1, talk * 1.6);
  CHATTER.heads.forEach((other, j) => {
    if (j !== i) yaw += 0.12 * Math.sign(HEADS[j].at[0] - HEADS[i].at[0]) * heard(other, CHATTER.from, f, 8);
  });
  // reading the note: one tilts, slowly, as if not sure, its chin dropping with its "hmm"
  if (i === 1) roll += 0.12 * interpolate(f, [T.captionFrom - 10, T.captionFrom + 30], [0, 1], { ...clamp, easing: smooth });
  if (i === HMM.head) {
    const hm = heard(HMM.env, HMM.from, f, 3);
    pitch -= 0.05 * hm;
    roll += 0.04 * hm;
  }
  if (i === 0) yaw -= 0.18 * interpolate(f, [T.captionFrom + 10, T.captionFrom + 50], [0, 1], { ...clamp, easing: smooth });
  return [dx, dy, dz, yaw, pitch, roll];
}
/** the shoulders: a slow breath always; a deep one before the wow, held up through it; a lift as each talks. v5: the
 *  breath slower and deeper, the sink as it lands in its seat, and its shifts of weight (dx, roll) */
function bodyMove(i: number, f: number): { dy: number; sy: number; dx: number; roll: number } {
  const lag = [0, 2, 1, 3][i];
  const breath = breathOf(i, f);
  const inhale = env(f, T.wow - 12 - lag, T.wow - 4 - lag, T.wow + 4 - lag, T.wow + 30 - lag);
  const talk = heard(CHATTER.heads[i], CHATTER.from, f, 6);
  const [dx, roll] = shiftAt(i, f);
  return { dy: 0.007 * breath + 0.014 * inhale + 0.006 * talk - 0.045 * sinkAt(f - landOf(i)), sy: 1 + 0.016 * breath + 0.025 * inhale, dx, roll };
}
// ---- v4, 29-arrive: walking in to their seats (timeline WALK: each head's first step, a step every STEP frames, STEPS
// of them, settled in the seat SIT frames after the last; the sound's footsteps and chair creaks are on the same frames)
/** how much higher a head is standing than sitting, m */
const STAND = 0.62;
/** where each walks from and to (x, z), before it steps into its seat as it sits: each is against the screen nearly all
 *  the way (the frame is narrow near the lens: a path a metre to its side is never in it). The two in front come in past
 *  the lens, half a metre either side of it, and walk away beside their seats; the two at the back come from the room's
 *  front corners, beside the screen, toward the lens, and turn round to sit (the sound pans heads 0 and 2 left) */
const PATH: { from: [number, number]; to: [number, number] }[] = [
  { from: [-0.35, 2.3], to: [0.22, -0.3] },
  { from: [0.95, 2.4], to: [0.2, -0.95] },
  { from: [-2.6, -5.6], to: [-0.1, -2.85] },
  { from: [3.1, -6.2], to: [1.55, -3.95] },
];
/** the frame it lands in its seat (the chair's creak) */
const landOf = (i: number) => WALK.find((w) => w.head === i)!.from + (STEPS - 1) * STEP + SIT;
/** a head's walk at a frame, over its seated pose: its offset, its turn, tilt and sway, and how much it faces the
 *  screen yet (its own rest turn comes in with that); null once it's settled */
function walkAt(i: number, f: number): { dx: number; dy: number; dz: number; yaw: number; pitch: number; roll: number; facing: number } | null {
  const w = WALK.find((v) => v.head === i)!;
  const t = f - w.from, land = landOf(i) - w.from;
  if (t >= land + 14) return null;
  const h = HEADS[i], { from, to } = PATH[i];
  // along its path, a steady pace with a surge each step, easing into the first and out of the last, there as the last
  // step lands; then it turns to the screen and sits back into its seat, landing on the creak, settling a little
  const dur = (STEPS - 1) * STEP + 2;
  const u = Math.max(0, Math.min(1, t / dur));
  const s = Math.min(1, 0.55 * u + 0.45 * smooth(u) + 0.012 * Math.sin((2 * Math.PI * t) / STEP) * (u > 0 && u < 1 ? 1 : 0));
  const walking = t > 0 && t < dur ? 1 : 0;
  const turn = smooth(Math.max(0, Math.min(1, (t - (dur - 10)) / 18)));
  // (v5: it drops the last of the way into the seat, still moving as it lands, and the seat takes its weight: sinkAt)
  const su = Math.max(0, Math.min(1, (t - (land - 14)) / 14));
  const sit = 0.5 * smooth(su) + 0.5 * su * su;
  const bob = 0.022 * (0.5 - 0.5 * Math.cos((2 * Math.PI * t) / STEP)) * walking;
  const x = lerp(lerp(from[0], to[0], s), h.at[0], sit), z = lerp(lerp(from[1], to[1], s), h.at[2], sit);
  // facing the way it walks (yaw 0 faces the screen, -z), then round to the screen
  const along = Math.atan2(-(to[0] - from[0]), -(to[1] - from[1]));
  return {
    dx: x - h.at[0],
    dy: STAND * (1 - sit) + bob,
    dz: z - h.at[2],
    yaw: along * (1 - turn),
    pitch: -0.06 * walking - 0.12 * env(t, land - 14, land - 6, land - 2, land + 6),
    roll: 0.035 * Math.sin((Math.PI * t) / STEP) * walking,
    facing: turn,
  };
}
/** a robe from the shoulders to the floor, a metre long (scaled to the gap): standing, it's the figure's length. v5: it
 *  starts up inside the torso (Heads), a touch narrower than it, so the two are one body (v4 left a 5 cm gap between the
 *  torso's foot and the robe's top that the screen's light came through) */
const SKIRT = level((x, y, z) => {
  const r = lerp(0.2, 0.3, Math.max(0, Math.min(1, -y)));
  return Math.max(Math.hypot(x, (z - 0.03) / 0.85) - r, y, -1 - y);
}, [-0.35, -1.04, -0.32], [0.35, 0.04, 0.36], 48);
/** their seats: a pan, a pedestal and a low back behind each, turned as they sit */
const SEAT_MAT = <StandardMaterial base_color="#141618" perceptual_roughness={0.55} metallic={0.1} />;
function Seats() {
  return (
    <>
      {HEADS.map((h, i) => {
        const q = ry(h.yaw);
        const at = (p: V3) => add([h.at[0], 0, h.at[2]], qv(q, p));
        return [
          <Mesh3d key={`pan${i}`} name={`seat-pan-${i}`} transform={place(at([0, 0.44, 0.05]), q)}>
            <Cuboid half_size={[0.27, 0.035, 0.25]} />
            {SEAT_MAT}
          </Mesh3d>,
          <Mesh3d key={`foot${i}`} name={`seat-foot-${i}`} transform={place(at([0, 0.2, 0.05]), q)}>
            <Cuboid half_size={[0.05, 0.2, 0.05]} />
            {SEAT_MAT}
          </Mesh3d>,
          <Mesh3d key={`back${i}`} name={`seat-back-${i}`} transform={place(at([0, 0.76, 0.32]), qm(q, rx(-0.12)))}>
            <Cuboid half_size={[0.29, 0.29, 0.03]} />
            {SEAT_MAT}
          </Mesh3d>,
        ];
      })}
    </>
  );
}
function Heads({ f }: { f: number }) {
  return (
    <>
      <Seats />
      {HEADS.map((h, i) => {
        let [dx, dy, dz, yaw, pitch, roll] = headMove(i, f);
        const wk = walkAt(i, f);
        // walking in, it faces along the row, and its own rest turn and tilt come in as it turns to the screen
        const facing = wk ? wk.facing : 1;
        if (wk) {
          dx += wk.dx;
          dy += wk.dy;
          dz += wk.dz;
          yaw += wk.yaw;
          pitch += wk.pitch;
          roll += wk.roll;
        }
        const q = qm(ry(h.yaw * facing + yaw), qm(rx(h.pitch * facing + pitch), rz(roll)));
        // turned about the neck's root, not the skull's middle
        const pivot: V3 = [0, -0.26, 0.03];
        const at = add(add(h.at, [dx, dy, dz]), sub(pivot, qv(q, pivot)));
        const b = bodyMove(i, f);
        const wx = wk ? wk.dx : 0, wy = wk ? wk.dy : 0, wz = wk ? wk.dz : 0;
        // (the head's own dx is the shoulders' lean: they take it whole, leaning about the seat)
        const lean = b.dx - SEAT_L * h.s * Math.sin(b.roll);
        // (and half the head's lean toward one it looks at: what's left of its dx)
        const body = add(h.at, [wx + lean + 0.5 * (dx - wx - lean), wy + (dy - wy) * 0.3 + b.dy, wz + (dz - wz) * 0.4]);
        const bq = qm(ry(h.yaw * facing + (wk ? wk.yaw : 0) + (yaw - (wk ? wk.yaw : 0)) * 0.3), rz(b.roll));
        // the robe below: from up inside the torso (its foot is 0.9 down; it breathes with b.sy), on the torso's leaning
        // axis, to the floor, swinging a little with the steps
        const robe = add(body, qv(bq, [0, -0.78 * h.s * b.sy, 0]));
        const top = robe[1];
        return (
          <>
            <Mesh3d key={`head${i}`} name={`head-${i}`} shape={HEAD_SHAPES[h.shape]} transform={place(at, q).withScale([h.s, h.s, h.s])}>
              <StandardMaterial base_color="#3a443c" perceptual_roughness={0.48} reflectance={0.4} />
            </Mesh3d>
            <Mesh3d key={`body${i}`} name={`shoulders-${i}`} shape={SHOULDERS} transform={place(body, bq).withScale([h.s, h.s * b.sy, h.s])}>
              <StandardMaterial base_color="#101113" perceptual_roughness={0.92} />
            </Mesh3d>
            <Mesh3d key={`skirt${i}`} name={`robe-${i}`} shape={SKIRT} transform={place(robe, qm(bq, rz((wk ? wk.roll : 0) * 1.4))).withScale([h.s, Math.max(0.02, top), h.s])}>
              <StandardMaterial base_color="#101113" perceptual_roughness={0.92} />
            </Mesh3d>
          </>
        );
      })}
    </>
  );
}

// =====================================================================================================================
// the hands: a long palm, three long fingers of four joints and a thumb of three, a dark claw at each tip
// =====================================================================================================================
type Finger = { base: V3; yaw: number; pitch: number; len: number[]; r: number[]; rest: number[]; press: number[] };
// a right hand, palm down, its wrist at the origin, fingers along -z, the thumb on -x
const FINGERS: Finger[] = [
  { base: [-0.021, 0.002, -0.088], yaw: 0.1, pitch: 0, len: [0.046, 0.036, 0.029, 0.023], r: [0.0088, 0.0079, 0.0071, 0.0064, 0.0056], rest: [0.28, 0.36, 0.3, 0.22], press: [0.22, 0.08, 0.02, -0.06] },
  { base: [0.002, 0.003, -0.094], yaw: 0.0, pitch: 0, len: [0.05, 0.04, 0.031, 0.024], r: [0.0092, 0.0082, 0.0073, 0.0065, 0.0057], rest: [0.3, 0.36, 0.3, 0.22], press: [0.22, 0.08, 0.02, -0.06] },
  { base: [0.024, 0.001, -0.085], yaw: -0.12, pitch: 0, len: [0.043, 0.034, 0.027, 0.021], r: [0.0085, 0.0076, 0.0068, 0.0061, 0.0054], rest: [0.3, 0.38, 0.3, 0.22], press: [0.22, 0.08, 0.02, -0.06] },
  // the thumb: out from the palm's side, down and in
  { base: [-0.033, -0.008, -0.032], yaw: 0.72, pitch: -0.32, len: [0.04, 0.032, 0.025], r: [0.0105, 0.0092, 0.008, 0.0068], rest: [0.18, 0.25, 0.2], press: [0.2, 0.08, -0.04] },
];
const PALM_SDF: SDF = (x, y, z) => {
  const p: V3 = [x, y, z];
  let d = ell(x, y, z, [0.0, 0.0, -0.05], [0.036, 0.016, 0.052]);
  // the knuckles, a bump at each finger's root
  for (const fi of FINGERS.slice(0, 3)) d = smin(d, ell(x, y, z, fi.base, [0.0145, 0.0135, 0.014]), 0.012);
  // the thumb's mound
  d = smin(d, ell(x, y, z, [-0.028, -0.006, -0.036], [0.016, 0.012, 0.026]), 0.014);
  // the wrist and the forearm, into the sleeve
  d = smin(d, roundCone(p, [0, 0, -0.012], [0, 0.004, 0.16], 0.019, 0.026), 0.022);
  // tendons on the back, faint
  for (const fi of FINGERS.slice(0, 3)) d = smin(d, roundCone(p, [fi.base[0] * 0.4, 0.008, -0.01], [fi.base[0], 0.0095, fi.base[2] + 0.012], 0.0032, 0.0035), 0.006);
  return d;
};
/** a finger's bone from its joint along -z, the pad flatter; past the first, a knuckle at its root that stands a
 *  little proud of the bone before it, so the wrinkled skin over the joint is its own */
const PHALANX = (len: number, r0: number, r1: number, first: boolean): SDF => (x, y, z) => {
  let d = roundCone([x, y * (y < 0 ? 1.12 : 1), z], [0, 0, 0], [0, 0, -len], r0, r1);
  if (!first) d = smin(d, ell(x, y, z, [0, 0.0012, -0.0025], [r0 * 1.05, r0 * 1.05, r0 * 0.92]), r0 * 0.8);
  return d;
};
/** how much fuller the fingers are than their bones' radii: flesh, not bone */
const FLESH = 1.5;
/** each bone's fleshed radii, root and tip */
const radii = (fi: Finger, j: number): [number, number] => [fi.r[j] * FLESH, fi.r[j + 1] * FLESH * 1.02];
const boneBox = (fi: Finger, j: number): [V3, V3] => [[-fi.r[j] * 2, -fi.r[j] * 2, -fi.len[j] - fi.r[j + 1] * 2], [fi.r[j] * 2, fi.r[j] * 2.1, fi.r[j] * 2]];
/** the nail on the last joint: a plate of horn a millimetre over the skin on the top of its last half, over the tip's
 *  crown, running on past it into a short claw that curves down (it stays over the pad, clear of the key) */
const NAIL = (len: number, r0: number, r1: number): SDF => (x, y, z) => {
  const p: V3 = [x, y, z];
  const f = roundCone(p, [0, 0, 0], [0, 0, -len], r0, r1);
  let d = Math.abs(f - 0.00075) - 0.00042;
  d = Math.max(d, z + len * 0.45, Math.abs(x) - r1 * 0.64, -(y - r1 * 0.1));
  const claw = roundCone([x * 1.6, y, z], [0, r1 * 0.62, -len - r1 * 0.4], [0, r1 * 0.02, -len - r1 * 1.25], r1 * 0.3, r1 * 0.06);
  return smin(d, claw, 0.0007);
};
const nailBox = (fi: Finger): [V3, V3] => {
  const n = fi.len.length, l = fi.len[n - 1], r1 = fi.r[n] * FLESH * 1.02;
  return [[-r1 * 1.1, -r1 * 0.7, -l - r1 * 1.7], [r1 * 1.1, r1 * 1.4 + 0.002, -l * 0.38]];
};

// ---- the skin over them (hand-skin.ts): furrows and bumps everywhere, and the wrinkles over the joints ----
/** the skin's furrowed plateaus, metres across, and the furrows' depth */
const CELL = 0.0013, FURROW = 0.00009;
/** over a finger's knuckle (a bone past the first): curved lines across the back of the joint, densest on its top */
const knuckleWrinkles = (r0: number, seed: number) => (x: number, y: number, z: number) => {
  const up = smoothstep(0.15, 0.7, y / (Math.hypot(x, y) || 1));
  if (up <= 0) return 0;
  const u = z + 0.0025 + 0.12 * r0;
  const env = Math.exp(-(u * u) / (0.5 * r0 * r0));
  if (env < 0.01) return 0;
  return up * env * grooves(u + (0.45 * x * x) / r0, x, 0.2 * r0, 0.0005, 0.0005, 0.7 * r0, seed);
};
/** the fold of skin at the nail's root */
const cuticle = (len: number, r1: number) => (x: number, y: number, z: number) => {
  const up = smoothstep(0.2, 0.6, y / (Math.hypot(x, y) || 1));
  const u = z + len * 0.43 - (0.25 * x * x) / r1;
  return 0.00028 * up * Math.exp(-(u * u) / (0.0006 * 0.0006)) * Math.exp(-Math.pow(x / (r1 * 0.8), 4));
};
/** the back of the hand: over each big knuckle, wrinkles running back from it, and fainter ones across the wrist */
const palmWrinkles = (x: number, y: number, z: number) => {
  let h = 0;
  FINGERS.slice(0, 3).forEach((fi, k) => {
    const up = smoothstep(fi.base[1] + 0.003, fi.base[1] + 0.011, y);
    if (up <= 0) return;
    const u = z - fi.base[2] - 0.004, lx = x - fi.base[0];
    const env = Math.exp(-(u * u) / (0.0075 * 0.0075));
    if (env > 0.01) h += up * env * grooves(u - (0.3 * lx * lx) / 0.012, lx, 0.0027, 0.00045, 0.00045, 0.0085, 40 + k);
  });
  const up = smoothstep(0.004, 0.014, y);
  const u = z - 0.03;
  const env = Math.exp(-(u * u) / (0.016 * 0.016));
  if (up > 0 && env > 0.01) h += up * env * grooves(z + (0.5 * x * x) / 0.02, x, 0.0034, 0.00045, 0.00026, 0.017, 50);
  return h;
};

/** the hands' parts, built the first time the hands are drawn (only 30-hands): skinning them is a few seconds' work
 *  no other shot should pay for. The left hand's are the right's mirrored in x as solids (a negative scale would turn
 *  their faces inside out) */
type HandParts = { palm: Solid; sleeve: Solid; bones: Solid[][]; nails: Solid[] };
let PARTS: [HandParts, HandParts] | null = null;
function handParts(): [HandParts, HandParts] {
  if (PARTS) return PARTS;
  const EDGE = 0.00042;
  const skin = skinField(CELL, FURROW, 7);
  // the forearm past the sleeve's mouth is never seen: cut off before the skin goes on
  const palm = cubed(skinned(level(PALM_SDF, [-0.06, -0.035, -0.115], [0.06, 0.035, 0.17], 150).trim(0, 0, -1, -0.1), PALM_SDF, (x, y, z) => skin(x, y, z) + palmWrinkles(x, y, z), EDGE));
  const bones = FINGERS.map((fi, fj) =>
    fi.len.map((l, j) => {
      const [r0, r1] = radii(fi, j);
      const sdf = PHALANX(l, r0, r1, j === 0);
      const [lo, hi] = boneBox(fi, j);
      const last = j === fi.len.length - 1;
      const wr = j > 0 ? knuckleWrinkles(r0, fj * 10 + j) : null;
      const cu = last ? cuticle(l, r1) : null;
      const sk = skinField(CELL * 0.85, FURROW, 13 + fj * 7 + j);
      return cubed(skinned(level(sdf, lo, hi, 72), sdf, (x, y, z) => sk(x, y, z) + (wr ? wr(x, y, z) : 0) + (cu ? cu(x, y, z) : 0), EDGE));
    }),
  );
  const nails = FINGERS.map((fi) => {
    const n = fi.len.length;
    const [r0, r1] = radii(fi, n - 1);
    const [lo, hi] = nailBox(fi);
    return level(NAIL(fi.len[n - 1], r0, r1), lo, hi, 110);
  });
  const right: HandParts = { palm, sleeve: SLEEVE, bones, nails };
  const left: HandParts = { palm: palm.mirror(1, 0, 0), sleeve: SLEEVE.mirror(1, 0, 0), bones: bones.map((f) => f.map((b) => b.mirror(1, 0, 0))), nails: nails.map((c) => c.mirror(1, 0, 0)) };
  PARTS = [right, left];
  return PARTS;
}
const SLEEVE: Solid = level((x, y, z) => {
  const p: V3 = [x, y, z];
  const outer = roundCone(p, [0, 0.004, 0.075], [0, 0.03, 0.42], 0.034, 0.05);
  return Math.max(outer, -roundCone(p, [0, 0.004, 0.06], [0, 0.03, 0.42], 0.028, 0.044));
}, [-0.07, -0.05, 0.03], [0.07, 0.1, 0.44], 72);

/** where each joint is and how each bone turns, in the hand's own frame, at a press amount per finger */
/** how far each joint opens as a finger lifts to strike: mostly at the knuckle */
const LIFT = [0.38, 0.12, 0.05, 0.02];
/** a joint's bend at a press `pr`, a lift `lift` and the tip's load `load` (the last joint gives, bending back), with
 *  `idle` added at the knuckle and half of it at the next */
function fingerBones(fi: Finger, pr: number, lift = 0, load = 0, idle = 0): { at: V3; q: Q }[] {
  const out: { at: V3; q: Q }[] = [];
  let q: Q = qm(ry(fi.yaw), rx(fi.pitch));
  let at = fi.base;
  const n = fi.len.length;
  for (let j = 0; j < n; j++) {
    const give = j === n - 1 ? 0.2 * load : j === n - 2 ? -0.05 * load : 0;
    const drift = j === 0 ? idle : j === 1 ? idle * 0.5 : 0;
    q = qm(q, rx(-(fi.rest[j] + fi.press[j] * pr - LIFT[j] * lift - give + drift)));
    out.push({ at, q });
    at = add(at, qv(q, [0, 0, -fi.len[j]]));
  }
  out.push({ at, q });
  return out;
}
/** the pad of a finger's tip, where it meets a key */
function padOf(fi: Finger, pr: number): V3 {
  const b = fingerBones(fi, pr);
  const last = b[b.length - 1];
  const r = fi.r[fi.r.length - 1];
  return add(last.at, qv(last.q, [0, -r * 0.85 * FLESH, r * 0.5]));
}

// the keyboard: its own frame, the keys' tops about y = 0, the alien's side +z
const TRAVEL = 0.0035;
/** a hand over the keys: which side, the wrist's place, and its turn as a right hand (the left is its mirror in x) */
type HandRig = { side: 1 | -1; at: V3; qr: Q };
const mirrorQ = (q: Q, side: number): Q => (side > 0 ? q : [q[0], -q[1], -q[2], q[3]]);
/** a point in the hand's frame to the keyboard's */
const handToKb = (h: HandRig, p: V3): V3 => {
  const v = qv(h.qr, p);
  return add(h.at, [v[0] * h.side, v[1], v[2]]);
};
const HANDS: HandRig[] = ([1, -1] as const).map((side) => {
  const qr = qm(ry(0.2), rx(-0.12));
  // the middle finger's resting pad 9 mm over the keys' tops
  const pad = qv(qr, padOf(FINGERS[1], 0));
  return { side, at: [side * 0.125, 0.009 - pad[1], 0.12], qr };
});
/** each finger's key: its top (9 mm under the resting pad) and the press that takes the pad through its travel */
const REACH: { top: number; full: number }[][] = HANDS.map((h) =>
  FINGERS.map((fi) => {
    const top = handToKb(h, padOf(fi, 0))[1] - 0.009;
    let lo = 0, hi = 4;
    for (let i = 0; i < 40; i++) {
      const m = (lo + hi) / 2;
      if (handToKb(h, padOf(fi, m))[1] > top - TRAVEL) lo = m; else hi = m;
    }
    return { top, full: (lo + hi) / 2 };
  }),
);
/** the keys: one under each finger's press, one before and one past it along the finger, the thumbs' bars, a row of
 *  small round keys beyond, and a cluster between the hands */
type Key = { at: V3; kind: "hex" | "bar" | "dot"; yaw: number; glyph: number; finger?: [number, number] };
const KEYS: Key[] = (() => {
  const keys: Key[] = [];
  let g = 0;
  HANDS.forEach((h, hi) => {
    FINGERS.forEach((fi, fj) => {
      const top = REACH[hi][fj].top;
      const p = handToKb(h, padOf(fi, REACH[hi][fj].full));
      const k = handToKb(h, fi.base);
      const d = [p[0] - k[0], p[2] - k[2]], l = Math.hypot(d[0], d[1]);
      const along: V3 = [d[0] / l, 0, d[1] / l];
      const yaw = Math.atan2(-along[0], -along[2]);
      if (fj === 3) {
        keys.push({ at: [p[0] - h.side * 0.012, top, p[2]], kind: "bar", yaw: yaw + h.side * 0.9, glyph: g++ % 30, finger: [hi, fj] });
        return;
      }
      keys.push({ at: [p[0], top, p[2]], kind: "hex", yaw, glyph: g++ % 30, finger: [hi, fj] });
      for (const s of [-1, 1]) keys.push({ at: [p[0] + along[0] * 0.027 * s, top + 0.0015 * s, p[2] + along[2] * 0.027 * s], kind: "hex", yaw, glyph: (g++ * 7) % 30 });
    });
  });
  const mid = REACH[0][1].top;
  for (let i = 0; i < 9; i++) keys.push({ at: [(i - 4) * 0.026, mid + 0.002, -0.15 - Math.abs(i - 4) * 0.004], kind: "dot", yaw: 0, glyph: (i * 11 + 3) % 30 });
  for (const [x, z] of [[0, -0.075], [-0.021, -0.05], [0.021, -0.05], [0, -0.025]] as [number, number][]) keys.push({ at: [x, mid, z], kind: "hex", yaw: 0, glyph: (g++ * 13) % 30 });
  return keys;
})();
const HEX_OUTLINE: [number, number][] = Array.from({ length: 6 }, (_, i) => [0.0108 * Math.cos((i * Math.PI) / 3 + Math.PI / 6), 0.0108 * Math.sin((i * Math.PI) / 3 + Math.PI / 6)]);
const HEX = manifold.extrude([HEX_OUTLINE], 0.009, { scaleTop: [0.88, 0.88] }).rotate(-90, 0, 0).move(0, -0.009, 0);
const BAR = manifold.roundedBox(0.05, 0.009, 0.016, 0.004).move(0, -0.0045, 0);
const DOT = manifold.cylinder(0.0068, 0.008).rotate(-90, 0, 0).move(0, -0.008, 0);
const SHAPE = { hex: HEX, bar: BAR, dot: DOT };
const BASE_TOP = Math.min(...KEYS.map((k) => k.at[1])) - 0.0095;
const BASE = manifold.hull(KEYS.flatMap((k) => [[k.at[0], BASE_TOP, k.at[2]], [k.at[0], BASE_TOP - 0.014, k.at[2]]] as V3[])).minkowski(manifold.sphere(0.012)).trim(0, -1, 0, -BASE_TOP);

// when each finger presses: TYPING [frame, hand, finger], on the typist's own syllables as it mutters the note
// (room-voice.ts), and SEND, the right thumb's slower, harder press on its bar
const ease = (t: number) => t * t * (3 - 2 * t);
/** a press's moves at frame f for one struck at `at`: the lift before it, the strike, the tip's load while it's held,
 *  the release past rest and back; `slow` stretches it (the send) */
function strike(f: number, at: number, slow = 1) {
  const s = (k: number) => at + k * slow;
  const lift = ease(env(f, s(-9), s(-5), s(-4), s(-1)));
  const down = interpolate(f, [s(-2), at, s(2), s(6), s(8), s(11)], [0, 1, 1, 0, -0.12, 0], clamp);
  const load = env(f, at - 0.5, at + 0.5, s(2), s(4));
  return { lift, down, load };
}
/** a finger's moves at a frame: its own presses, and its neighbours' carrying it a little with them */
function fingerAt(f: number, h: number, fi: number) {
  let lift = 0, down = 0, load = 0, near = 0, nearLift = 0;
  const one = (at: number, hh: number, ff: number, slow: number) => {
    const m = strike(f, at, slow);
    if (hh !== h) return;
    if (ff === fi) {
      lift = Math.max(lift, m.lift);
      down = Math.abs(m.down) > Math.abs(down) ? m.down : down;
      load = Math.max(load, m.load);
    } else if (fi < 3 && ff < 3 && Math.abs(ff - fi) === 1) {
      near = Math.max(near, Math.max(0, m.down));
      nearLift = Math.max(nearLift, m.lift);
    }
  };
  for (const [at, hh, ff] of TYPING) one(at, hh, ff, 1);
  one(SEND, 0, 3, 1.6);
  return { lift: Math.max(lift, 0.3 * nearLift), down: down + 0.22 * near * (1 - Math.max(0, down)), load };
}
/** how far a finger is pressed, 0..1 of its key's travel (what its key and legend follow) */
const pressOf = (f: number, h: number, fi: number) => Math.max(0, fingerAt(f, h, fi).down);
/** a key's travel: down with its finger, and on release a small spring back past rest */
function keyTravel(f: number, h: number, fi: number) {
  let d = 0;
  const one = (at: number, slow: number) => {
    const s = (k: number) => at + k * slow;
    const v = interpolate(f, [s(-1), at, s(3), s(6), s(7.5), s(9.5), s(12)], [0, 1, 1, 0, -0.1, 0.03, 0], clamp);
    if (Math.abs(v) > Math.abs(d)) d = v;
  };
  for (const [at, hh, ff] of TYPING) if (hh === h && ff === fi) one(at, 1);
  if (h === 0 && fi === 3) one(SEND, 1.6);
  return d;
}

/** the one at the keys, behind its hands: a dark robe over its chest and lap, cut off above by the frame */
const ROBE = level((x, y, z) => {
  const p: V3 = [x, y, z];
  const chest = roundCone(p, [0, 0.0, 0.05], [0, 0.7, 0.0], 0.2, 0.24);
  const lap = roundCone(p, [-0.14, -0.08, -0.12], [0.14, -0.08, -0.12], 0.13, 0.13);
  return smin(chest, lap, 0.12);
}, [-0.34, -0.25, -0.3], [0.34, 0.95, 0.32], 64);
/** the skin's colour under its mottle (the texture takes it down to about 0.85 on average: v3's #56704f) */
const SKIN = "#65845d";
const MOTTLE = staticFile("textures/skin/skin-mottle.png");
const ROUGH = staticFile("textures/skin/skin-rough.png");
/** the micro-relief: pores, the criss-cross of fine furrows, fine creases, raised blemishes */
const RELIEF = staticFile("textures/skin/skin-normal.png");
/** the skin tile is 80 mm across in 4096 px (scripts/make_skin.py); every skin part's texture spans hand-skin's cube */
const SKIN_UV = Affine2.fromScale([(2 * CUBE) / 0.08, (2 * CUBE) / 0.08]);
const SkinMaterial = () => <StandardMaterial base_color={SKIN} base_color_texture={MOTTLE} normal_map_texture={RELIEF} metallic_roughness_texture={ROUGH} perceptual_roughness={1} reflectance={0.42} uv_transform={SKIN_UV} />;
const KB_AT: V3 = [1.25, 0.94, -1.55];
function HandsAndKeys({ f }: { f: number }) {
  const kb = (p: V3): V3 => add(KB_AT, p);
  const out: ReactNode[] = [];
  const parts = handParts();
  HANDS.forEach((h0, hi) => {
    const P = parts[h0.side > 0 ? 0 : 1];
    // the hand at work: it leans toward the finger striking (a slide over and a small roll onto that side, more for the
    // thumb's send), and between strikes it drifts and settles, a little bob with the typist's breath
    const moves = FINGERS.map((_, fj) => fingerAt(f, hi, fj));
    let lean = 0, weight = 0;
    moves.forEach((m, fj) => {
      const a = Math.max(0, m.down) + 0.6 * m.lift;
      lean += a * FINGERS[fj].base[0];
      weight += a;
    });
    const sideways = weight > 0 ? (lean / Math.max(1, weight)) * 0.28 : 0;
    const breath = heard(MUTTER.env, MUTTER.from, f, 6);
    const drift: V3 = [0.0015 * Math.sin(f * 0.13 + hi) + sideways * h0.side, 0.001 * Math.sin(f * 0.21 + hi * 2) + 0.0008 * breath, 0.0015 * Math.sin(f * 0.11 + hi)];
    const roll = -sideways * 1.1;
    const h: HandRig = { side: h0.side, at: h0.at, qr: qm(h0.qr, rz(roll)) };
    const world = (p: V3) => kb(add(handToKb(h, p), drift));
    const wq = (q: Q) => mirrorQ(qm(h.qr, q), h.side);
    const qh = mirrorQ(h.qr, h.side);
    // the palm and the sleeve
    out.push(
      <Mesh3d key={`palm${hi}`} name={`palm-${hi}`} allowOverlap shape={P.palm} transform={place(world([0, 0, 0]), qh)}>
        <SkinMaterial />
      </Mesh3d>,
      <Mesh3d key={`sleeve${hi}`} name={`sleeve-${hi}`} allowOverlap shape={P.sleeve} transform={place(world([0, 0, 0]), qh)}>
        <StandardMaterial base_color="#121316" perceptual_roughness={0.9} />
      </Mesh3d>,
    );
    FINGERS.forEach((fi, fj) => {
      const m = moves[fj];
      // idle: each finger's own slow curl and settle, never all at once
      const idle = 0.035 * Math.sin(f * 0.09 + fj * 1.3 + hi * 2.1) + 0.015 * Math.sin(f * 0.23 + fj * 2.7 + hi);
      const bones = fingerBones(fi, m.down * REACH[hi][fj].full, m.lift, m.load, idle * (1 - Math.max(0, m.down)));
      fi.len.forEach((_, j) => {
        out.push(
          <Mesh3d key={`b${hi}${fj}${j}`} name={`bone-${hi}-${fj}-${j}`} allowOverlap shape={P.bones[fj][j]} transform={place(world(bones[j].at), wq(bones[j].q))}>
            <SkinMaterial />
          </Mesh3d>,
        );
      });
      const last = bones[fi.len.length - 1];
      out.push(
        <Mesh3d key={`c${hi}${fj}`} name={`nail-${hi}-${fj}`} allowOverlap shape={P.nails[fj]} transform={place(world(last.at), wq(last.q))}>
          <StandardMaterial base_color="#3b342b" perceptual_roughness={0.24} reflectance={0.55} />
        </Mesh3d>,
      );
    });
  });
  // the keys, each down under its finger's press, its legend brighter as it's struck
  KEYS.forEach((k, i) => {
    const tr = k.finger ? keyTravel(f, k.finger[0], k.finger[1]) : 0;
    const down = Math.max(0, tr);
    const y = k.at[1] - TRAVEL * (tr >= 0 ? smooth(Math.min(1, tr)) : tr);
    const q = ry(k.yaw);
    out.push(
      <Mesh3d key={`k${i}`} name={`key-${i}`} shape={SHAPE[k.kind]} transform={place(kb([k.at[0], y, k.at[2]]), q)}>
        <StandardMaterial base_color="#353b40" perceptual_roughness={0.42} />
      </Mesh3d>,
      <Mesh3d key={`l${i}`} name={`legend-${i}`} castShadow={false} transform={place(kb([k.at[0], y + 0.0004, k.at[2]]), q)}>
        <Plane3d normal={[0, 1, 0]} half_size={k.kind === "dot" ? [0.0055, 0.0055] : [0.0085, 0.0085]} />
        <StandardMaterial base_color="#353b40" perceptual_roughness={0.42} emissive={glow("#9be8dc", 14 * (1 + 3 * down))} emissive_texture={GLYPH[k.glyph]} />
      </Mesh3d>,
    );
  });
  out.push(
    <Mesh3d key="robe" name="robe" allowOverlap shape={ROBE} transform={Transform.fromXyz(KB_AT[0], KB_AT[1] + 0.004 * Math.sin(f * 0.17) + 0.006 * heard(MUTTER.env, MUTTER.from, f, 5), KB_AT[2] + 0.5 - 0.004 * heard(MUTTER.env, MUTTER.from, f, 5)).withScale([1, 1 + 0.01 * Math.sin(f * 0.17), 1 + 0.012 * Math.sin(f * 0.17)])}>
      <StandardMaterial base_color="#141518" perceptual_roughness={0.88} />
    </Mesh3d>,
  );
  out.push(
    <Mesh3d key="kbase" name="keyboard-base" shape={BASE} transform={Transform.fromXyz(...KB_AT)}>
      <StandardMaterial base_color="#272b2f" perceptual_roughness={0.4} metallic={0.25} />
    </Mesh3d>,
  );
  return <>{out}</>;
}

// =====================================================================================================================
// the subtitle
// =====================================================================================================================
export const CAPTION = "I'm not sure this is on brand for us.";
function Caption({ f }: { f: number }) {
  const { height } = useVideoConfig();
  const o = interpolate(f, [T.captionFrom, T.captionFrom + 4, T.captionTo - 6, T.captionTo], [0, 1, 1, 0], clamp);
  if (o <= 0) return null;
  const px = (n: number) => (n * height) / 1080;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: px(92) }}>
      <div style={{ color: "#ffffff", opacity: o, fontFamily: "Inter, Helvetica Neue, Helvetica, sans-serif", fontWeight: 500, fontSize: px(62), letterSpacing: px(0.3), textAlign: "center", textShadow: `0 0 ${px(10)}px rgba(0,0,0,0.85), 0 ${px(2)}px ${px(4)}px rgba(0,0,0,0.75)` }}>{CAPTION}</div>
    </AbsoluteFill>
  );
}

// =====================================================================================================================
// the shots
// =====================================================================================================================
const IDS = ["29-arrive", "29-room", "30-hands", "30b-glyphs", "31-note"];
export const isRoom = (id: string) => IDS.includes(id);
const K = (p: V3): V3 => add(KB_AT, p);
export const ROOM_SHOTS = (tArrive: number, t29: number, t30: number, t30b: number, t31: number, t32: number): Shot2[] => [
  // v4: what they see, from behind their seats: the idle screen, the link arriving, the aliens walking in past the lens
  // and sitting; it ends where 29-room starts, at its pace, so the two play as one move
  { id: "29-arrive", from: tArrive, to: t29, p0: [0.3, 1.58, 1.82], p1: [0.22, 1.5, 1.45], l0: [0.02, 2.16, -8.5], l1: [0, 2.2, -8.5], fov: 36, stop: 1.0, focus: [10.4, 10.0] },
  // behind the heads, the screen beyond them, pushing in a little; focused on the screen, the heads soft
  { id: "29-room", from: t29, to: t30, p0: [0.22, 1.5, 1.45], p1: [0.12, 1.53, 1.1], l0: [0, 2.2, -8.5], l1: [0.05, 2.24, -8.5], fov: 36, stop: 1.0, focus: [10.0, 9.7] },
  // close on the hands from beside the keys, the screen soft beyond them (v4: the first two presses, then the cut to
  // the screen; the push at v3's pace, so it ends 38% of the way along v3's)
  { id: "30-hands", from: t30, to: t30b, p0: K([0.16, 0.33, -0.43]), p1: K([0.1408, 0.3223, -0.4146]), l0: K([0.0, 0.0, 0.03]), l1: K([0.0, 0.0, 0.0319]), fov: 36, stop: 2.4, focus: [0.58, 0.5646] },
  // v4: close on the comment on the screen as each press writes its words, from low and left among the seats, drifting
  // in; the send lights its edge
  { id: "30b-glyphs", from: t30b, to: t31, p0: [1.05, 2.45, -4.6], p1: [1.2, 2.55, -5.1], l0: [1.68, 2.93, -8.5], l1: [1.7, 2.95, -8.5], fov: 30, stop: 2.0, focus: [3.95, 3.45] },
  // over the heads to the note on the screen, tighter, still pushing
  { id: "31-note", from: t31, to: t32, p0: [0.62, 1.64, 0.7], p1: [0.68, 1.68, 0.1], l0: [0.85, 2.72, -8.5], l1: [0.9, 2.76, -8.5], fov: 22, stop: 1.4, focus: [9.4, 8.8] },
];

export function RoomShot({ f, s, debug = "" }: { f: number; s: Shot2; debug?: string }) {
  const t = (f - s.from) / (s.to - s.from);
  // a hand on the camera: a breath of drift, never still
  const w = (a: number, b: number) => Math.sin(f * a + b) * 0.6 + Math.sin(f * a * 2.3 + b * 1.7) * 0.4;
  const amp = s.id === "30-hands" ? 0.003 : 0.02;
  const look = lerp3(s.l0, s.l1, t);
  const cam: Lens = { pos: lerp3(s.p0, s.p1, t), look: [look[0] + amp * w(0.051, 0), look[1] + amp * w(0.067, 1.3), look[2]], fov: (s.fov * Math.PI) / 180, stop: s.stop, focus: s.focus ? lerp(s.focus[0], s.focus[1], t) : undefined };
  const white = s.id === "29-arrive" ? interpolate(f - s.from, [0, 9], [1, 0], clamp) : 0;
  return (
    <AbsoluteFill style={{ background: "#000000" }}>
      <Camera3d transform={Transform.fromXyz(...cam.pos).lookingAt(cam.look)} projection={{ Perspective: { fov: cam.fov, near: 0.02, far: 100 } }}>
        {!debug.includes("nosolari") && <SolariLighting bounces={2} />}
        {cam.stop !== undefined && !debug.includes("nodof") && <DepthOfField focal_distance={cam.focus ?? 8} aperture_f_stops={cam.stop} />}
      </Camera3d>
      <ToneMapping exposure={s.id === "30-hands" ? EXPOSURE + HANDS_OPEN : EXPOSURE} />
      <GlobalAmbientLight brightness={0} />
      {!debug.includes("nograde") && <Grade saturation={1.0} midtones={{ contrast: 1.08 }} vignette={{ intensity: 0.32, radius: 0.78, smoothness: 4 }} />}
      <Room f={f} z={s.id === "30b-glyphs" ? 2 : 1} />
      {s.id !== "30-hands" && <Heads f={f} />}
      {s.id === "30-hands" && <HandsAndKeys f={f} />}
      {white > 0 && <AbsoluteFill style={{ background: "#f4fbff", opacity: white }} />}
      {s.id === "31-note" && <Caption f={f} />}
    </AbsoluteFill>
  );
}

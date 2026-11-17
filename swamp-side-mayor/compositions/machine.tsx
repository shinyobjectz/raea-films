// The machine: a monitor the size of a house standing in the pond and a keyboard on the near shore, both summoned up
// out of the water and the mud, hung with weed, water pouring off them. Built here from solids, so every part can
// move: it rises, it sheds water, its keys sink under the goose. After ENTER the screen shows the real raea app making
// this film (plan.ts SHOWN). v6: no mud coat or drips on it (the director 11-16, "the dripping ooze"), and what flies off
// it is water in streaks, not round clods.
import { Img, staticFile } from "raea";
import { ImagePlane, Instances, Screen, crossSection, manifold, sdf } from "raea/3d";
import { StandardMaterial } from "raea/pbr";
import { Cuboid, Cylinder, Mesh3d, Sphere } from "raea/mesh";
import { Quat, Transform } from "raea/transform";
import { CUE, G, KB, KEYS, MON, playedBeat, pressed, rise, shownAt, typedAt, type V3 } from "./plan";
import { WATER } from "./set";
import { STAR } from "./ruins";

const rnd = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const sm = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const [W, H, D] = MON.size;
// the case: a rounded box with the screen's well cut into its face and a CRT's tapered back, on a neck and a foot
const CASE = manifold.union(manifold.roundedBox(W, H, D, 0.3), manifold.hull(manifold.roundedBox(W - 0.6, H - 0.6, 0.2, 0.08).move(0, -0.1, -D / 2 + 0.1), manifold.roundedBox(W * 0.55, H * 0.55, 0.2, 0.08).move(0, -0.3, -D / 2 - 2.2)))
  .minus(manifold.roundedBox(MON.screen[0] + 0.3, MON.screen[1] + 0.3, 0.5, 0.12).move(0, 0.25, D / 2 - 0.2));
const NECK = manifold.box(2.2, 2.6, 1.8).move(0, -H / 2 - 1.2, -0.3), FOOT = manifold.roundedBox(5.2, 0.6, 3.6, 0.2).move(0, -H / 2 - 2.6, 0);
// water thrown off it: a streak with a round head and a thin tail, a little lumpy, long along z (each instance is
// turned to face along its flight and stretched by its speed)
const STREAK = sdf.smoothUnion(0.02, sdf.ellipsoid(0.035, 0.035, 0.05).move(0, 0, 0.06), sdf.cone([0, 0, 0.05], [0, 0, -0.16], 0.03, 0.006)).displace(0.006, 13, 2, 7).solid(0.006);
// the keyboard, in its own plane (x across, y up, z toward the typist), turned by its tilt so the back stands higher:
// a beige case with a bezel round a darker plate, sculpted caps (a tapered, rounded top over the base)
const KBW = 15 * KB.pitch + 0.42, KBD = 5 * KB.pitch + 0.42, IN = 0.17;
const KCASE = manifold.roundedBox(KBW, 0.4, KBD, 0.07).move(0, -0.12, 0)
  .minus(manifold.box(KBW - 2 * IN, 0.4, KBD - 2 * IN).move(0, 0.2, 0));
const KPLATE = manifold.box(KBW - 2 * IN + 0.02, 0.04, KBD - 2 * IN + 0.02).move(0, 0.06, 0);
const CAPS = new Map<number, ReturnType<typeof manifold.box>>();
const cap = (wd: number, dd: number) => manifold.hull(manifold.roundedBox(wd, 0.03, dd, 0.025).move(0, -0.07, 0), manifold.roundedBox(wd - 0.1, 0.03, dd - 0.11, 0.035).move(0, 0.07, -0.012));
const capOf = (w: number) => { if (!CAPS.has(w)) CAPS.set(w, cap(w * KB.pitch - 0.07, KB.pitch - 0.07)); return CAPS.get(w)!; };
// the old tall ENTER: one key over two rows, its top in the Q row (1.5 wide) and its foot in the A row (1.25 wide,
// flush right), as one cap
const ENTER_TOP = KEYS.find((k) => k.ch === "\n")!, ENTER_FOOT = KEYS.find((k) => k.ch === "\n~")!;
const EF: [number, number] = [(ENTER_FOOT.col - ENTER_TOP.col) * KB.pitch, (ENTER_FOOT.row - ENTER_TOP.row) * KB.pitch];
const ENTER_CAP = manifold.union(cap(1.5 * KB.pitch - 0.07, KB.pitch - 0.07), cap(1.25 * KB.pitch - 0.07, KB.pitch * 0.6).move(EF[0], 0, EF[1] - 0.17), cap(1.25 * KB.pitch - 0.07, KB.pitch - 0.07).move(EF[0], 0, EF[1]));
const MOD = new Set(["\b", "\t", "\\", "caps", "shiftL", "shiftR", "ctrlL", "altL", "altR", "ctrlR", "`", "-", "=", "[", "]", ";", "'", "#", ",", ".", "/"]);
const KWEED = Array.from({ length: 26 }, (_, i) => { const x = (rnd(i + 300) - 0.5) * KBW * 0.9, len = 0.25 + rnd(i * 3 + 301) * 0.5;
  return { position: [x, 0.08 - len / 2, -KBD / 2 - 0.02] as V3, rotation: [0.15, rnd(i * 6 + 302) * 3, (rnd(i * 2 + 303) - 0.5) * 0.3] as V3, scale: [1 + rnd(i), len, 1] as V3 }; });
// bracken and weed hung over the top edge and the sides
const WEED = Array.from({ length: 150 }, (_, i) => { const side = i % 5 === 0, edge = (rnd(i) < 0.5 ? -1 : 1) * (W / 2 - rnd(i * 11) * W * 0.22), x = side ? (i % 10 ? -1 : 1) * (W / 2 + 0.03) : edge, len = 0.4 + rnd(i * 3) * 1.2;   // hung at the corners, clear of the screen
  return { position: [x, (side ? H / 2 - rnd(i * 9) * 2 : H / 2 + 0.1) - len / 2, side ? (rnd(i * 4) - 0.5) * D : D / 2 + 0.03 - (i % 3 === 0 ? rnd(i * 8) * D : 0)] as V3, rotation: [0, rnd(i * 6) * 3, (rnd(i * 2) - 0.5) * 0.25] as V3, scale: [1 + rnd(i) * 1.5, len, 1] as V3 }; });
const tiltQ = Quat.fromAxisAngle([1, 0, 0], KB.tilt);   // the back (-z) up, the front down, as a typist sets it
const BEIGE = "#e6dcc0", DARK = "#bfb294";
/** Euler angles (x, then y, then z: Rx . Ry . Rz) that turn +z onto v */
const alongZ = (v: V3): V3 => { const l = Math.hypot(...v) || 1, f: V3 = [v[0] / l, v[1] / l, v[2] / l]; return [Math.atan2(-f[1], f[2]), Math.asin(Math.max(-1, Math.min(1, f[0]))), 0]; };
const HIDE = { position: [0, -50, 0] as V3, scale: [0.001, 0.001, 0.001] as V3 };

/** Water off the machine as it comes up: streams pouring off the monitor's top edge and shoulders, and spray flung
 * off the keyboard, each drop a streak stretched by its speed, falling back into the pond. */
function water(b: number, my: number, ky: number) {
  const out: { position: V3; rotation?: V3; scale: V3 }[] = [];
  const g = 9.8;
  // pours: 14 places along the top edge and down the shoulders, each sending a drop every 0.06 s while the monitor
  // comes up and for a while after (thinning out), each falling from where the edge was when it left
  for (let i = 0; i < 14; i++) {
    const x = (i / 13 - 0.5) * (W - 0.4) + (rnd(i) - 0.5) * 0.3, z = MON.c[2] + (i % 3 === 0 ? D / 2 + 0.02 : (rnd(i + 7) - 0.5) * D * 0.8);
    for (let j = 0; j < 22; j++) {
      const be = Math.floor((b - CUE.boil) / 0.09) * 0.09 + CUE.boil - j * 0.09 + rnd(i * 31 + j) * 0.05; if (be < CUE.boil + 0.8 || be > CUE.boil + CUE.up + 2.5) { out.push(HIDE); continue; }
      const thin = 1 - sm((be - CUE.boil - CUE.up) / 2.5); if (rnd(i * 13 + Math.floor(be * 11)) > thin) { out.push(HIDE); continue; }
      const t0 = G(be), tt = G(b) - t0, ey = MON.c[1] - (1 - rise(be).mon) * 9.5 + H / 2, vx = (rnd(i * 3 + j) - 0.5) * 0.5, vz = (i % 3 === 0 ? 0.6 : 0.2) + rnd(j + i) * 0.4;
      const p: V3 = [MON.c[0] + x + vx * tt, ey + 0.05 - 0.5 * g * tt * tt, z + vz * tt]; if (p[1] < WATER) { out.push(HIDE); continue; }
      const v: V3 = [vx, -g * tt, vz], s = Math.hypot(...v);
      out.push({ position: p, rotation: alongZ(v), scale: [0.9, 0.9, 0.8 + s * 0.22] });
    }
  }
  // spray off the keys as they burst out of the mud: drops flung up and out
  for (let i = 0; i < 40; i++) {
    const b0 = CUE.keys + 0.15 + rnd(i * 3.1) * 1.6, tt = G(b) - G(b0);
    if (tt < 0 || tt > 1.4) { out.push(HIDE); continue; }
    const x0 = (rnd(i * 5.3) - 0.5) * KBW, vx = x0 * 0.8 + (rnd(i * 2.2) - 0.5) * 2, vy = 2.5 + rnd(i * 7) * 3, vz = (rnd(i * 4) - 0.4) * 3;
    const p: V3 = [KB.c[0] + x0 + vx * tt, KB.c[1] + ky + 0.2 + vy * tt - 0.5 * g * tt * tt, KB.c[2] + vz * tt]; if (p[1] < -0.05) { out.push(HIDE); continue; }
    const v: V3 = [vx, vy - g * tt, vz], s = Math.hypot(...v);
    out.push({ position: p, rotation: alongZ(v), scale: [0.8, 0.8, 0.8 + s * 0.2] });
  }
  void my;
  return out;
}

// raea's cat (apps/site/public/cat.svg, the pixel cat), in a unit square centred on it, y up; its eyes are holes in it
const CAT_OUT: [number, number][] = [[-0.26563,0.46875],[-0.29688,0.46875],[-0.29688,0.4375],[-0.32813,0.4375],[-0.32813,0.3125],[-0.29688,0.3125],[-0.29688,0.25],[-0.26563,0.25],[-0.26563,0.15625],[-0.29688,0.15625],[-0.29688,0.125],[-0.32813,0.125],[-0.32813,0.0625],[-0.35938,0.0625],[-0.35938,0],[-0.39063,0],[-0.39063,-0.125],[-0.42188,-0.125],[-0.42188,-0.21875],[-0.45313,-0.21875],[-0.45313,-0.375],[-0.42188,-0.375],[-0.42188,-0.40625],[-0.35938,-0.40625],[-0.35938,-0.375],[-0.32813,-0.375],[-0.32813,-0.3125],[-0.29688,-0.3125],[-0.29688,-0.25],[-0.26563,-0.25],[-0.26563,-0.21875],[-0.23438,-0.21875],[-0.23438,-0.25],[-0.17188,-0.25],[-0.17188,-0.28125],[-0.14063,-0.28125],[-0.14063,-0.46875],[-0.10938,-0.46875],[-0.10938,-0.5],[-0.01563,-0.5],[-0.01563,-0.46875],[0.01563,-0.46875],[0.01563,-0.375],[0.04688,-0.375],[0.04688,-0.3125],[0.14063,-0.3125],[0.14063,-0.28125],[0.23438,-0.28125],[0.23438,-0.3125],[0.26563,-0.3125],[0.26563,-0.34375],[0.29688,-0.34375],[0.29688,-0.375],[0.35938,-0.375],[0.35938,-0.40625],[0.42188,-0.40625],[0.42188,-0.375],[0.45313,-0.375],[0.45313,-0.3125],[0.42188,-0.3125],[0.42188,-0.25],[0.39063,-0.25],[0.39063,-0.1875],[0.35938,-0.1875],[0.35938,-0.125],[0.32813,-0.125],[0.32813,-0.09375],[0.35938,-0.09375],[0.35938,-0.0625],[0.39063,-0.0625],[0.39063,0.15625],[0.35938,0.15625],[0.35938,0.375],[0.26563,0.375],[0.26563,0.34375],[0.23438,0.34375],[0.23438,0.3125],[0.10938,0.3125],[0.10938,0.375],[0.07813,0.375],[0.07813,0.40625],[-0.01563,0.40625],[-0.01563,0.375],[-0.04688,0.375],[-0.04688,0.3125],[-0.07813,0.3125],[-0.07813,0.1875],[-0.10938,0.1875],[-0.10938,0.25],[-0.14063,0.25],[-0.14063,0.3125],[-0.17188,0.3125],[-0.17188,0.34375],[-0.20313,0.34375],[-0.20313,0.4375],[-0.17188,0.4375],[-0.17188,0.5],[-0.26563,0.5]];
const CAT_EYES: [number, number][][] = [[[0.14063,0.15625],[0.10938,0.15625],[0.10938,0.0625],[0.14063,0.0625]], [[0.29688,0.15625],[0.26563,0.15625],[0.26563,0.0625],[0.29688,0.0625]]];
const CAT_S = 0.42,   // v8: 0.95 (the director 11-16: "this should be much smaller and chrome, not blue")
  sc = (p: [number, number][]) => p.map(([x, y]) => [x * CAT_S, y * CAT_S] as [number, number]);
/** v7 (the director 11-16: "just use the cat logo and make sure it's a 3D icon on the computer, no black rectangle background"):
 * the cat cut out and stood proud of the bezel, 14 cm deep, eyes filled a little back in the holes */
const CAT = crossSection.of([sc(CAT_OUT)]).minus(crossSection.of(CAT_EYES.map(sc))).extrude(0.14);
// v7 stills: eyes filled 3 cm back in their holes vanished at the shots' distance and the cat read as a blob, so the
// eyes stand 3 cm proud of the face and the cat sits on a navy rim, the sticker line every hero thing has
const CAT_RIM = crossSection.of([sc(CAT_OUT)]).offset(0.016, { join: "miter" }).extrude(0.1);
/** v8: where the cat sits on the bezel (bottom left, under the glass), and its chrome: the world is drawn unlit, so a
 * metal material comes out flat; the face is painted chrome instead (assets/logo/cat-chrome.png: a sky over a dark
 * horizon over the ground, a bevel and a streak), on steel sides */
const CAT_X = -W / 2 + 0.8, CAT_Y = -H / 2 + 0.55;
const ACCENT = "#8c9cfb";   // the app's accent
/** how far the cat stands out of the case (0 in it, 1 out; it overshoots as it springs out at power-on) */
const catOut = (b: number) => { const k = (b - CUE.boot - 0.35) / 0.5; return k <= 0 ? 0.0 : k >= 1 ? 1 : 1 + 0.35 * Math.sin(Math.PI * k) * (1 - k) - (1 - k) ** 3; };
/** which frame of the power-on (0..10; past 10 it's on) */
const onFrame = (b: number) => Math.max(0, Math.floor((G(b) - G(CUE.boot)) * 30));
/** page: draw the screen's picture as a page (a flat <Screen> holding an <Img>, which waits for its picture every frame)
 * rather than an ImagePlane, whose picture isn't waited for: a picture new every frame (the film playing, the upload,
 * the video page) came out black in the 9:16 cut's stills on a loaded machine (film.tsx#goose-9x16) */
export function Machine({ t, b, eye = [0, 1, 30], page = false }: { t: number; b: number; eye?: V3; page?: boolean }) {
  const r = rise(b), my = MON.c[1] - (1 - r.mon) * 9.5, ky = -(1 - r.kb) * 1.5, typed = typedAt(b), on = b >= CUE.boot;
  // what it shows: it boots as it comes up, then the raea app on this film's project; the prompt as it's typed; after
  // ENTER the app making the film (the files filling in, the feed, the film playing, a note, publish)
  const shown = b >= CUE.enter ? shownAt(b) : null;
  // with a player on it, the film plays in it: the capture with the film's frame for this moment pasted in, one picture
  // per frame (tools/played.ts; the film's frames in assets/app/film, from the render before this one)
  const screen = shown ? (shown.seq ? shown.seq[Math.max(0, Math.floor((b - shown.from) / (shown.every ?? 0.5))) % shown.seq.length]
      : shown.img === "app/images" ? `app/images-r${Math.min(5, Math.max(0, Math.floor((b - shown.from) / 0.9)))}`
      : shown.live ? `${shown.live}/f${String(Math.round(t * 30)).padStart(5, "0")}`
      : shown.film ? `app/played/${shown.img.replace("app/", "")}${shown.clay ? "-clay" : ""}-${String(Math.round(G(playedBeat(b)) * 30)).padStart(4, "0")}` : shown.img)
    : b >= CUE.keys + 1.5 ? `screen/type${String(Math.min(21, typed)).padStart(2, "0")}` : b >= CUE.app ? "screen/home"
    // v7 (the director 11-16: "animate the screen coming on"): a tube warming up: a bright line out from a dot in the middle, the
    // picture opening up and down from it overbright, then settling (assets/screen/on00..on10, a frame each at 30 a second)
    : onFrame(b) <= 10 ? `screen/on${String(onFrame(b)).padStart(2, "0")}` : Math.floor(b * 2) % 2 ? "screen/boot1" : "screen/boot0";
  const at = (x: number, y: number, z: number) => Transform.fromXyz(MON.c[0] + x, my + y, MON.c[2] + z);
  // the keys' summoning: a circle of light under the keyboard, beams up its edge, sparks (b 72-74.5)
  const mg = sm((b - CUE.keys + 0.3) / 0.5) * (1 - sm((b - 74.0) / 0.6)), spin = b * 0.5;
  return (
    <>
      <Mesh3d pass="hero" name="case" shape={CASE} allowOverlap transform={at(0, 0, 0)}><StandardMaterial base_color={BEIGE} unlit /></Mesh3d>
      <Mesh3d pass="hero" name="neck" shape={NECK} allowOverlap transform={at(0, 0, 0)}><StandardMaterial base_color={DARK} unlit /></Mesh3d>
      <Mesh3d pass="hero" name="foot" shape={FOOT} allowOverlap transform={at(0, 0, 0)}><StandardMaterial base_color={BEIGE} unlit /></Mesh3d>
      <Mesh3d pass="hero" name="glass" allowOverlap transform={at(0, 0.25, D / 2 - 0.42)}><Cuboid half_size={[MON.screen[0] / 2 + 0.1, MON.screen[1] / 2 + 0.1, 0.02]} /><StandardMaterial base_color={on ? "#0c1210" : "#1b2420"} unlit /></Mesh3d>
      {on && !page && <ImagePlane key={screen} name="screen" src={staticFile(`${screen}.png`)} width={MON.screen[0]} height={MON.screen[1]} position={[MON.c[0], my + 0.25, MON.c[2] + D / 2 - 0.39]} shadow={false} pass="ui" />}
      {on && page && <Screen name="mon-screen" crt={false} resolution={[1360, 940]} size={[MON.screen[0], MON.screen[1]]} position={[MON.c[0], my + 0.25, MON.c[2] + D / 2 - 0.39]} background="#0c1210" pass="ui">
        <Img src={staticFile(`${screen}.png`)} style={{ position: "absolute", left: 0, top: 0, width: 1360, height: 940 }} />
      </Screen>}
      {[0, 1, 2].map((k) => <Mesh3d pass="hero" key={k} name={`vent-${k}`} allowOverlap transform={at(W / 2 - 1.2, -H / 2 + 0.5 + k * 0.22, D / 2 + 0.01)}><Cuboid half_size={[0.6, 0.05, 0.02]} /><StandardMaterial base_color="#8f8468" unlit /></Mesh3d>)}
      {/* the maker's mark on the bezel, as old computers had: raea's cat, in 3D, standing out of the case; it springs out
          of it as the screen comes on (it was a sticker on a dark plate, and a green lamp before that) */}
      {(() => { const c = catOut(b), k = Math.max(0.05, c), z = D / 2 - 0.14 + 0.14 * c; return <>
        <Mesh3d pass="hero" name="cat" shape={CAT} allowOverlap transform={at(CAT_X, CAT_Y, z).withScale([1, 1, k])}><StandardMaterial base_color="#8a96a6" unlit /></Mesh3d>
        <Mesh3d pass="hero" name="cat-rim" shape={CAT_RIM} allowOverlap transform={at(CAT_X, CAT_Y, z - 0.005).withScale([1, 1, k])}><StandardMaterial base_color="#1c2640" unlit /></Mesh3d>
        <ImagePlane name="cat-face" src={staticFile("logo/cat-chrome.png")} width={CAT_S} height={CAT_S} position={[MON.c[0] + CAT_X, my + CAT_Y, MON.c[2] + z + 0.14 * k + 0.004]} shadow={false} pass="ui" />
      </>; })()}
      <Instances name="weed" at={WEED} position={[MON.c[0], my, MON.c[2]]} shadow={false}><Cuboid half_size={[0.035, 0.5, 0.01]} /><StandardMaterial base_color="#5cb83f" perceptual_roughness={1} reflectance={0} /></Instances>
      {/* the keyboard: case, plate, a cap for every key (each sinks when it's struck and goes yellow), their legends */}
      <Mesh3d pass="hero" name="kb" shape={KCASE} allowOverlap transform={Transform.fromXyz(KB.c[0], KB.c[1] + ky, KB.c[2]).withRotation(tiltQ)}><StandardMaterial base_color={BEIGE} unlit /></Mesh3d>
      <Mesh3d pass="hero" name="kb-plate" shape={KPLATE} allowOverlap transform={Transform.fromXyz(KB.c[0], KB.c[1] + ky, KB.c[2]).withRotation(tiltQ)}><StandardMaterial base_color="#8a7f66" unlit /></Mesh3d>
      {[0, 1, 2].map((i) => <Mesh3d pass="hero" key={`led-${i}`} name={`led-${i}`} allowOverlap transform={Transform.fromXyz(KB.c[0] + KBW / 2 - 0.9 + i * 0.25, KB.c[1] + ky + 0.1 * Math.cos(KB.tilt) + (KBD / 2 - IN / 2) * Math.sin(KB.tilt), KB.c[2] - (KBD / 2 - IN / 2) * Math.cos(KB.tilt)).withRotation(tiltQ)}><Cuboid half_size={[0.07, 0.015, 0.035]} /><StandardMaterial base_color={on && (i !== 1 || Math.floor(b) % 2) ? "#58f07a" : "#47523f"} unlit /></Mesh3d>)}
      {KEYS.map((k, i) => { if (k.ch === "\n~") return null; const d = pressed(k, b) * (k.ch === "\n" ? 0.11 : 0.09); return (
        <Mesh3d pass="hero" key={i} name={`key-${i}`} shape={k.ch === "\n" ? ENTER_CAP : capOf(k.w)} allowOverlap transform={Transform.fromXyz(k.at[0], k.at[1] + ky - d, k.at[2]).withRotation(tiltQ)}>
          <StandardMaterial base_color={k.ch === "\n" ? "#ff7a1a" : d > 0.02 ? "#ffd166" : MOD.has(k.ch) ? "#d6ccae" : "#f6f0de"} unlit /></Mesh3d>
      ); })}
      {KEYS.map((k, i) => { const d = pressed(k, b) * (k.ch === "\n" ? 0.11 : 0.09), c = Math.cos(KB.tilt), sn = Math.sin(KB.tilt); if (!k.label) return null; return (
        <ImagePlane key={`cap-${i}`} name={`cap-${i}`} src={staticFile("fx/keys.png")} grid={[8, 8]} frame={i} width={(k.w * KB.pitch - 0.17) * 0.86} height={(KB.pitch - 0.18) * 0.86} pass="ui" shadow={false}
          position={[k.at[0], k.at[1] + ky - d + 0.087 * c + 0.012 * sn, k.at[2] + 0.087 * sn - 0.012 * c]} rotation={[-Math.PI / 2 + KB.tilt, 0, 0]} />
      ); })}
      <Instances name="kb-weed" at={KWEED} position={[KB.c[0], KB.c[1] + ky + KBD / 2 * Math.sin(KB.tilt), KB.c[2]]} shadow={false}><Cuboid half_size={[0.025, 0.5, 0.008]} /><StandardMaterial base_color="#5cb83f" perceptual_roughness={1} reflectance={0} /></Instances>
      {/* water off it as it comes up: streams off the monitor, spray off the keys (drawn as stickers) */}
      {((b > CUE.boil && b < CUE.boil + CUE.up + 5) || (b > CUE.keys && b < CUE.keys + 2.6)) && (
        <Instances name="pour" pass="hero" shape={STREAK} shadow={false} at={water(b, my, ky)}><StandardMaterial base_color="#e3f5ff" unlit /></Instances>
      )}
      {/* the keys' summoning: a circle of light under them that turns, beams standing up round it, sparks going up */}
      {mg > 0.001 && (
        <>
          <ImagePlane name="kb-sigil" src={staticFile("fx/sigil.png")} width={1} height={1} position={[KB.c[0], 0.03, KB.c[2]]} rotation={[-Math.PI / 2, 0, spin]} scale={[Math.max(0.001, 9.2 * mg), Math.max(0.001, 9.2 * mg), 1]} shadow={false} />
          {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2 + spin * 0.6, R = 4.1, x = KB.c[0] + Math.cos(a) * R, z = KB.c[2] + Math.sin(a) * R * 0.55, hgt = 4.5 * mg * (0.75 + 0.25 * Math.sin(b * 6 + i));
            return <ImagePlane key={`beam-${i}`} name={`kb-beam-${i}`} src={staticFile("fx/beam.png")} width={1} height={1} position={[x, hgt / 2, z]} rotation={[0, Math.atan2(eye[0] - x, eye[2] - z), 0]} scale={[Math.max(0.001, 0.55 * mg), Math.max(0.001, hgt), 1]} pass="ui" shadow={false} />; })}
          <Instances name="kb-sparks" shape={STAR} shadow={false} at={Array.from({ length: 60 }, (_, i) => { const a = rnd(i) * Math.PI * 2, R = 1 + rnd(i + 3) * 3.4, ph = ((b * 0.9 + rnd(i + 9)) % 1), y = ph * 3.5;
            return { position: [KB.c[0] + Math.cos(a) * R, y, KB.c[2] + Math.sin(a) * R * 0.55] as V3, rotation: [rnd(i) * 3, b * 3 + i, 0] as V3, scale: 1.6 * mg * (1 - ph) }; })}>
            <StandardMaterial base_color="#ffe27a" unlit /></Instances>
        </>
      )}
    </>
  );
}

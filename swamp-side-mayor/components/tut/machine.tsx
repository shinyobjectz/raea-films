// The tutorial's machine (tutorial.script.ts): the music video's monitor and keyboard (compositions/machine.tsx), built
// the same way from the same solids, but already up and on, with a 16:9 glass to carry the real app as raea's window
// captures it (1600 x 900), and a Mac's keyboard (keyboard.json: esc, command, option) so the keys Goose stands on are
// the ones the narrator names. In place of the music video's mud drips and bracken, ivy grown over it (ivy.ts; the director,
// 11-16). What's on the glass is a prop (`screen`, a file under assets/); which keys are down, and how far, is another
// (`down`, by each key's character); `t` and `wind` move the ivy's leaves.
import { staticFile } from "raea";
import { ImagePlane, Instances, manifold } from "raea/3d";
import { StandardMaterial } from "raea/pbr";
import { Cuboid, Cylinder, Mesh3d, Sphere } from "raea/mesh";
import { Quat, Transform } from "raea/transform";
import layout from "./keyboard.json";
import { GLASS, TKB, TMON, type V3 } from "./machine-dims";
import { IVY, LEAF, ivyLeaves } from "./ivy";
export { GLASS, TKB, TMON, type V3 };


export type Key = { ch: string; label: string; at: V3; w: number; i: number };
function keyAt(col: number, row: number): V3 { const z = row * TKB.pitch, c = Math.cos(TKB.tilt), sn = Math.sin(TKB.tilt); return [TKB.c[0] + col * TKB.pitch, TKB.c[1] + 0.2 * c - z * sn, TKB.c[2] + 0.2 * sn + z * c]; }
const ROWS = layout.rows as [string, string, number][][];
export const TKEYS: Key[] = (() => { let i = 0; return ROWS.flatMap((row, r) => { let x = 0; return row.map(([ch, label, w]) => { const k = { ch, label, w, i: i++, at: keyAt(x + w / 2 - 7.5, r - 2) }; x += w; return k; }); }); })();
/** a key by its character ("cmdL", "b", " ", "esc", "\\", "/", "z") */
export const tkey = (ch: string) => TKEYS.find((k) => k.ch === ch) ?? TKEYS[0];

const [W, H, D] = TMON.size;
const CASE = manifold.union(manifold.roundedBox(W, H, D, 0.3), manifold.hull(manifold.roundedBox(W - 0.6, H - 0.6, 0.2, 0.08).move(0, -0.1, -D / 2 + 0.1), manifold.roundedBox(W * 0.55, H * 0.55, 0.2, 0.08).move(0, -0.3, -D / 2 - 2.2)))
  .minus(manifold.roundedBox(TMON.screen[0] + 0.3, TMON.screen[1] + 0.3, 0.5, 0.12).move(0, 0.25, D / 2 - 0.2));
const NECK = manifold.box(2.2, 2.6, 1.8).move(0, -H / 2 - 1.2, -0.3), FOOT = manifold.roundedBox(5.2, 0.6, 3.6, 0.2).move(0, -H / 2 - 2.6, 0);
// the keyboard, as the music video's: case, bezel, plate, sculpted caps
const KBW = 15 * TKB.pitch + 0.42, KBD = 5 * TKB.pitch + 0.42, IN = 0.17;
const KCASE = manifold.roundedBox(KBW, 0.4, KBD, 0.07).move(0, -0.12, 0).minus(manifold.box(KBW - 2 * IN, 0.4, KBD - 2 * IN).move(0, 0.2, 0));
const KPLATE = manifold.box(KBW - 2 * IN + 0.02, 0.04, KBD - 2 * IN + 0.02).move(0, 0.06, 0);
const CAPS = new Map<number, ReturnType<typeof manifold.box>>();
const capOf = (w: number) => { if (!CAPS.has(w)) { const wd = w * TKB.pitch - 0.07, dd = TKB.pitch - 0.07;
  CAPS.set(w, manifold.hull(manifold.roundedBox(wd, 0.03, dd, 0.025).move(0, -0.07, 0), manifold.roundedBox(wd - 0.1, 0.03, dd - 0.11, 0.035).move(0, 0.07, -0.012))); } return CAPS.get(w)!; };
const MOD = new Set(["esc", "\b", "\t", "\\", "caps", "\n", "shiftL", "shiftR", "ctrlL", "optL", "cmdL", "cmdR", "optR", "ctrlR", "-", "=", "[", "]", ";", "'", ",", ".", "/"]);
const tiltQ = Quat.fromAxisAngle([1, 0, 0], TKB.tilt);
const BEIGE = "#e6dcc0", DARK = "#bfb294";

/**
 * screen: what the glass shows, a file under assets/ (a capture of the app), or null for the dark glass.
 * next: the capture it shows next, put up early behind the dark glass so it has loaded when its turn comes (an image
 * plane drawn on the frame it's made shows nothing that frame: every new capture flashed the glass black for a frame,
 * raea check's flash-frame on the film, 11-16).
 * down: how far each key is pushed (0..1), by its character; a key pushed past 0.02 goes yellow, as the giant keys do.
 */
export function TutMachine({ screen, next = null, down = {}, t = 0, wind = 0.3 }: { screen: string | null; next?: string | null; down?: Record<string, number>; t?: number; wind?: number }) {
  const at = (x: number, y: number, z: number) => Transform.fromXyz(TMON.c[0] + x, TMON.c[1] + y, TMON.c[2] + z);
  const kb = Transform.fromXyz(...TKB.c).withRotation(tiltQ);
  const c = Math.cos(TKB.tilt), sn = Math.sin(TKB.tilt);
  return (
    <>
      <Mesh3d pass="hero" name="case" shape={CASE} allowOverlap transform={at(0, 0, 0)}><StandardMaterial base_color={BEIGE} unlit /></Mesh3d>
      <Mesh3d pass="hero" name="neck" shape={NECK} allowOverlap transform={at(0, 0, 0)}><StandardMaterial base_color={DARK} unlit /></Mesh3d>
      <Mesh3d pass="hero" name="foot" shape={FOOT} allowOverlap transform={at(0, 0, 0)}><StandardMaterial base_color={BEIGE} unlit /></Mesh3d>
      <Mesh3d pass="hero" name="glass" allowOverlap transform={at(0, 0.25, D / 2 - 0.42)}><Cuboid half_size={[TMON.screen[0] / 2 + 0.1, TMON.screen[1] / 2 + 0.1, 0.02]} /><StandardMaterial base_color="#0c1210" unlit /></Mesh3d>
      {[screen, next !== screen ? next : null].map((f, i) => f && <ImagePlane key={f} name={`screen-${f.split("/").pop()!.replace(/\.png$/, "")}`} src={staticFile(f)} width={TMON.screen[0]} height={TMON.screen[1]} position={i ? [GLASS[0], GLASS[1], GLASS[2] - 0.3] : GLASS} shadow={false} pass="ui" />)}
      {[0, 1, 2].map((k) => <Mesh3d pass="hero" key={k} name={`vent-${k}`} allowOverlap transform={at(W / 2 - 1.2, -H / 2 + 0.5 + k * 0.22, D / 2 + 0.01)}><Cuboid half_size={[0.6, 0.05, 0.02]} /><StandardMaterial base_color="#8f8468" unlit /></Mesh3d>)}
      <Mesh3d pass="hero" name="lamp" allowOverlap transform={at(-W / 2 + 0.7, -H / 2 + 0.6, D / 2 + 0.02)}><Sphere radius={0.13} /><StandardMaterial base_color="#52ff7a" emissive="#2bd65a" perceptual_roughness={0.4} /></Mesh3d>
      <Mesh3d pass="hero" name="kb" shape={KCASE} allowOverlap transform={kb}><StandardMaterial base_color={BEIGE} unlit /></Mesh3d>
      <Mesh3d pass="hero" name="kb-plate" shape={KPLATE} allowOverlap transform={kb}><StandardMaterial base_color="#8a7f66" unlit /></Mesh3d>
      {TKEYS.map((k) => { const d = Math.min(1, down[k.ch] ?? 0) * 0.09; return (
        <Mesh3d pass="hero" key={k.i} name={`key-${k.i}`} shape={capOf(k.w)} allowOverlap transform={Transform.fromXyz(k.at[0], k.at[1] - d, k.at[2]).withRotation(tiltQ)}>
          <StandardMaterial base_color={d > 0.002 ? "#ffd166" : MOD.has(k.ch) ? "#d6ccae" : "#f6f0de"} unlit /></Mesh3d>
      ); })}
      {TKEYS.map((k) => { const d = Math.min(1, down[k.ch] ?? 0) * 0.09; if (!k.label) return null; return (
        <ImagePlane key={`cap-${k.i}`} name={`cap-${k.i}`} src={staticFile("tut-keys/legends.png")} grid={[8, 8]} frame={k.i} width={(k.w * TKB.pitch - 0.17) * 0.86} height={(TKB.pitch - 0.18) * 0.86} pass="ui" shadow={false}
          position={[k.at[0], k.at[1] - d + 0.087 * c + 0.012 * sn, k.at[2] + 0.087 * sn - 0.012 * c]} rotation={[-Math.PI / 2 + TKB.tilt, 0, 0]} />
      ); })}
      {/* the ivy: its stems, still, and its leaves, each with its own green, moving in the wind */}
      <Instances name="ivy-stems" allowOverlap at={IVY.stems} shadow={false}><Cylinder radius={0.03} half_height={0.5} /><StandardMaterial base_color="#4d5f2c" perceptual_roughness={1} reflectance={0} /></Instances>
      <Instances name="ivy-leaves" allowOverlap shape={LEAF} at={ivyLeaves(t, wind)} shadow={false}><StandardMaterial base_color="#ffffff" perceptual_roughness={1} reflectance={0} /></Instances>
    </>
  );
}

// The opening's first two worlds, which are not rooms. the director, 11-11 (assembly 22): "for the opening sets need to be more
// varied ... opening a door might open up somethign else compeltely outdoor abstract anything"; "one of them could use
// the cool ocean we worked on on the rock and the door is in the rock we pass over the ocean, we see some seagulls pass
// by ... closer vieww of the waves"; and, pinned on the cut:
//   0:00.2 "open in wireframe world here with a ancient door here and a torch on the side the cursor lights itself and
//           then it spawns an orb around it to render full res whiel that lgiht fades to wireframe in 3d space"
//   0:04.2 "the reason for the cursor just touching things makes no sense here. there always need sot be a purpose ...
//           maybe the cursor shinea a orb based light/glow that renders around it full res but then outside the orb it
//           fades to wireframe. this makes it feel liek the cursor is using a tool."
//   0:06.7 "somehow the waves here splash up this is the ocean rock door scene and that "eextinguishes" the lit cursor
//           idea to be full res now"
// ("wireframe" there is the film's own drawing, the pale line on the dark sheet: "i just mean the wirefram aesthetic we
// ahve been using for the dark mode".)
// So the film opens on a drawing, and the cursor's first act is to take a light to it:
//   hallway  THE THRESHOLD. A ruined wall of dressed stone stands in the dark with a great studded door in it, and an
//            iron torch burns beside the door: the one real thing, a small round of the real world about its flame.
//            The cursor comes in and touches the flame, and the flame leaps to it: the torch is left smoking, and the
//            cursor carries the fire, and with it a round of the real world that fades into the drawing at its edge.
//            It pushes the door; the leaves swing in on the sea.
//   kitchen  THE DOOR IN THE ROCK. Over the swell toward a great rock with a door in its foot, all drawn but what the
//            cursor's light falls on. The cursor takes the weather's slider and the sea gets up; a wave breaks on the
//            rock and the burst comes up over the cursor and puts its fire out, and from where the sea broke the real
//            world spreads out over everything: from here on the film is real. It takes the door's ring and pulls it open on the living room.
// Both stand on the take's one line (v3/walk.tsx takeCam), their doors at the line's -RZ, so the walk goes on through
// them without a cut. The sea is the storm shot's own (vendor/bevy_fft: tools/v3.sh renders these with the plugin build
// of raea), and the threshold's render has the sea world standing beyond its door, so what is seen through the door is
// the next world itself. The door in the rock opens on the living room, which is ray traced and can't stand in a
// forward-lit render: its own frames from this same lens are rendered ahead (tools/portals.sh) and shown in the doorway.
import { AbsoluteFill, Img, staticFile } from "raea";
import { AntiAliasing, BevyComponent, Bloom, Canvas3D, Entity, Environment, Fog, Model, Shadows, ShaderMesh, ToneMapping } from "raea/3d";
import { Camera3d } from "raea/camera";
import { DirectionalLight, SolariLighting } from "raea/light";
import { Cuboid, Mesh3d } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Transform } from "raea/transform";
import { RZ } from "../sets/rooms";
import { clamp01, ease, ramp, type V3 } from "../v2/math";
import type { Cam } from "./cam";
import { Panel3D, SLIDER, Slider, onPanel, sliderX, spring, type Panel } from "./controls";
import { Flame, Smoke, Spray } from "./fire";
import { Hand3D, at, edge, front, type Key } from "./hand3d";
import { FilmLook, type Look, Finish } from "./look";
import { LensDrops } from "./lens-drops";
import { FPS, H, PAD, W, type Shot } from "./plan";
/** how much the threshold's night is lifted before it is photocopied (the copy's levels are a page's, 4%..34%) */
export const COPY_GAIN = 0.95;   // (2.5 burned the stone to a clean white plaster, no toner in it)
import { DOOR_HOLD, ROOM_T } from "./times";
import { WORLD_IDS, roomView, shiftOf, takeCam } from "./walk";
import { Portal, goOut, shotOf, viewOf, type View, Doorway } from "./kit";
import { TAKE_KEYS } from "./takekeys";
import { KelpWorld, kelpView } from "./kelp";
import { CloudsWorld, cloudView } from "./clouds";
import { PixelWorld, pixelView } from "./pixel";
import { NaveWorld, naveView } from "./nave";
import { OilWorld, oilView } from "./oil";

const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const jerk = (k: number) => { const q = clamp01(k); return q * q * q * (10 - 15 * q + 6 * q * q); };
const smoothstep01 = (x: number) => { const q = clamp01(x); return q * q * (3 - 2 * q); };
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
/** the worlds drawn here, by the shot that holds each (the shots keep the names of the rooms they replaced) */
export const WORLDS = WORLD_IDS;
// (the next worlds whose frames have been rendered for a doorway: tools/portals.sh writes media/portal/ID.png and lists it in v3/portals.json)

// ---- the threshold -----------------------------------------------------------------------------------------------
export const WALL_FACE = -RZ + 0.15;                                        // the ruined wall's front (media/models/threshold/wall.glb)
export const TORCH: V3 = [1.3, 1.5, WALL_FACE];
export const TORCH_FLAME: V3 = add(TORCH, [0, 0.3287, 0.3166]);    // the head's top (threshold/torch.glb's sidecar; v3/arch-still.tsx)
const LEAF_HINGE: V3 = [0.936, 0, -RZ - 0.078];                     // the castle door's right leaf, and its ring
/** the right leaf's ring, the leaves `open` (0..1 of their 80 degrees, swinging away from us) */
const ring = (open: number): V3 => {
  const p = (-80 * Math.PI) / 180 * open, dx = -0.776, dy = -0.158;
  return [LEAF_HINGE[0] + dx * Math.cos(p) - dy * Math.sin(p), 1.08, LEAF_HINGE[2] - (dx * Math.sin(p) + dy * Math.cos(p))];
};
/** where the next world stands in this one: its own z 0 is this far along the line (the take's starts, v3/walk.tsx) */
export const SEA_SHIFT = shiftOf("hallway", "kitchen");

/** The cursor's fire: lit at `lit` (0 never), put out at `out`; how much flame there is, how far it is guttered, and how
 *  big the round of the real world about it is */
export function fireOf(t: number, lit: number | null, out = 99) {
  const on = lit !== null && t >= lit;
  const grow = on ? jerk((t - lit!) / 0.22) : 0;
  const gutter = clamp01((t - out) / 0.16);
  // (the orb blooms out with the flame, overshooting a little and settling, and goes as the flame does)
  const r = on ? 1.55 * (1 - Math.exp(-(t - lit!) * 7) * Math.cos((t - lit!) * 9)) * (1 - jerk((t - out) / 0.28)) : 0;
  return { on, flame: grow * (1 - gutter), gutter, r: Math.max(0, r) };
}

export function thresholdKeys(s: Shot, t: number) {
  const T = ROOM_T.hallway as { light: number; door: number };
  const len = s.seconds;
  const open = 0.97 * jerk(ramp(t, T.door + 0.02, len - 0.06)) + (t >= T.door ? 0.03 * (1 - Math.exp(-(t - T.door) * 28)) : 0);   // (no hard stop at fully open: the cursor rides the ring)
  const keys: Key[] = [
    { t: 0.3, p: edge(1, 0.15, 1.6) },
    { t: T.light, p: at(add(TORCH_FLAME, [0, 0.05, 0.02])), click: true, seen: "the cursor lights itself at the torch", margin: 0.08 },
    { t: T.door, p: front(() => ring(0), 0.03), press: true, seen: "push the great door" },
    { t: T.door + DOOR_HOLD, p: front(() => ring(open), 0.03) },
    ...goOut(len),
  ];
  return { T, len, open, keys };
}
TAKE_KEYS.hallway = (t: number) => thresholdKeys(shotOf("hallway"), t).keys;
export const thresholdView = (s: Shot, t: number): View => viewOf(s, t);

// ---- the opening: the copier's pass over the threshold itself --------------------------------------------------
// the director, 11-12: "we literally dont distingush two scenes its phtocopier look on the scene with thre torch and theres no
// creative cur or crossfade rerender as one scene to open up the door to the ocean". So the film opens on this world,
// PAD seconds before the song (the intro composition is this world at t from -PAD, tools/join.ts lays it ahead of the
// hallway's own frames with no cut or blend): dark under the lid; the lamp strikes, a flicker at the left edge; its band
// sweeps across, and behind it the place is there as its photocopy, the words "› made in raea" in white on it; the
// exposure flashes; the words go as the cursor comes in. The drawing everywhere is the photocopy (style 3), and the real
// place is only round the torch's flame and then the cursor's. The copier's beats are the old intro's (v3/intro.tsx),
// so its sound (media/foley/lock/intro.wav, tools/sound.sh) still lands on them. In intro frames (f = (t + PAD) * FPS):
const FLICK = [0.25, 0, 0.6, 0.15, 0.85];
const copierF = (t: number) => (t + PAD) * FPS;
/** the lamp, 0..1: it strikes at f17 with a flicker and burns as it crosses */
const lampOf = (f: number) => (f < 17 ? 0 : f < 22 ? FLICK[Math.floor(f - 17)] : 1) * (1 - ease(ramp(f, 44, 47)));
/** the lamp's band across the frame, 0 the left edge .. 1 the right: parked just off the left, then across f20-44 */
function bandOf(f: number) {
  const u = ramp(f, 20, 44), a = 0.14, v = 1 / (1 - a / 2);
  return -0.06 + 1.14 * (u < a ? (v * u * u) / (2 * a) : v * (u - a / 2));
}
/** the exposure's flash, 0..1: up f43-45, held, gone by f53 */
const flashOf = (f: number) => (f < 43 ? 0 : f < 45 ? ease(ramp(f, 43, 45)) : f < 46 ? 1 : (1 - ease(ramp(f, 46, 53))) ** 1.6);
export function Copier({ t }: { t: number }) {
  const f = copierF(t);
  if (f > 60) return null;
  const L = lampOf(f), x = bandOf(f) * W, fl = flashOf(f), words = 1 - ease(ramp(t, 0.2, 0.62));
  const cover = f < 44 ? Math.max(0, x) : W;        // (black ahead of the lamp: the sheet not yet copied)
  return (
    <AbsoluteFill>
      {/* (the tall frame has its own words, laid out for it: tools/made-in.sh tall; the 5:4 ones stretched to it were squashed) */}
      {words > 0.001 && <Img src={staticFile(H > W ? "title/made-in-white-tall.png" : "title/made-in-white.png")} style={{ position: "absolute", left: 0, top: 0, width: W, height: H, opacity: words }} />}
      {f < 44 && <div style={{ position: "absolute", left: cover, top: 0, width: W - cover + 2, height: H, background: "#000" }} />}
      {L > 0.001 && (
        <>
          <div style={{ position: "absolute", left: x - 170, top: 0, width: 340, height: H, opacity: L * 0.75, background: "linear-gradient(90deg, rgba(200,255,225,0), rgba(200,255,225,0.55), rgba(200,255,225,0))" }} />
          <div style={{ position: "absolute", left: x - 22, top: 0, width: 44, height: H, opacity: L, background: "linear-gradient(90deg, rgba(235,255,242,0), rgba(250,255,252,1), rgba(235,255,242,0))" }} />
        </>
      )}
      {fl > 0.001 && <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, background: "#f4fff8", opacity: fl }} />}
    </AbsoluteFill>
  );
}
/** the lens before the song (t < 0): at rest at -PAD and gathering, so it reaches the take's own lens at t 0 at the
 *  take's own speed (a push-in from rest, no jolt where the take begins) */
export function openingView(s: Shot, t: number): View {
  const v0 = thresholdView(s, 0), v1 = thresholdView(s, 1 / FPS);
  if (t >= 0) return thresholdView(s, t);
  const L = PAD, u = t + L;
  const p = (a: V3, b: V3): V3 => [0, 1, 2].map((i) => { const vel = (b[i] - a[i]) * FPS; return a[i] - (vel * L) / 2 + (vel * u * u) / (2 * L); }) as V3;
  return { ...v0, hand: null, cam: { ...v0.cam, eye: p(v0.cam.eye, v1.cam.eye), look: p(v0.cam.look, v1.cam.look) } };
}

function Threshold({ s, t }: { s: Shot; t: number }) {
  const { T, len, open } = thresholdKeys(s, t);
  const { hand, cam: c } = openingView(s, t);
  const fire = fireOf(t, T.light);
  // the torch's own flame: there until the cursor takes it, then guttering out, and smoking after
  const torchGo = clamp01((t - T.light) / 0.2);
  const tip = hand?.pos ?? c.eye;
  const look: Look = {
    base: 1, warm: 0.35, contrast: 0.62, halation: 0.55, style: 3, gain: COPY_GAIN,
    // (before the cursor comes, the real world is a small round about the torch's flame; then it is the cursor's)
    orb: fire.on ? { at: tip, r: fire.r, soft: 0.75 } : { at: TORCH_FLAME, r: 0.62, soft: 0.38 },
    void: { z: -RZ - 0.47, x0: -1.02, x1: 1.02, y1: 2.97, fade: 0.2 }, sea: SEA_LEVEL,
  };
  // (no fade in from black: the copier's lid and lamp are the opening now)
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Canvas3D>
        <Camera3d transform={Transform.fromXyz(...c.eye).lookingAt(c.look)} projection={{ Perspective: { fov: (c.fov * Math.PI) / 180, near: 0.03, far: 6000 } }}>{/* (ray traced, as every world is: the director, 11-12, "solari is kind of the ideal") */}<SolariLighting bounces={2} /></Camera3d>
        <AntiAliasing mode="smaa" />
        <ToneMapping mode="agx" exposure={0.6} />
        <Bloom intensity={0.32} threshold={0.8} />
        <Shadows mapSize={4096} distance={40} firstCascade={10} cascades={3} />
        <Environment src={staticFile("hdri/qwantani_moonrise_puresky.hdr")} intensity={0.035} rotation={1.2} />
        <Model name="wall" src={staticFile("models/threshold/wall.glb")} position={[0, 0, -RZ]} />
        <Model name="floor" src={staticFile("models/threshold/floor.glb")} position={[0, 0, -RZ]} />
        <Model name="castle-door" src={staticFile("models/cathedral/door.glb")} position={[0, 0, -RZ]} animation="open" time={clamp01(open) * 0.999} loop={false} />
        <Model name="torch" src={staticFile("models/threshold/torch.glb")} position={TORCH} />
        <Flame name="torch-flame" at={TORCH_FLAME} h={0.34} cam={c} t={s.from + t} gutter={torchGo} light={torchGo < 1 ? 5200 : 0} seed={1} />
        <Smoke name="torch-smoke" at={add(TORCH_FLAME, [0, 0.02, 0])} h={0.9} cam={c} t={s.from + t} age={fire.on ? (t - T.light - 0.1) / 1.6 : 0} />
        <Flame name="cursor-flame" at={add(tip, [0, 0.012, 0])} h={0.13 * fire.flame + 0.001} cam={c} t={s.from + t} gain={fire.flame} light={4200 * fire.flame} seed={4} />
        <OceanWorld shift={SEA_SHIFT} abs={s.from + t} k={0} cam={c} />
        <Hand3D hand={hand} cam={c} ev={0.6} />
        <FilmLook look={look} seed={s.f0} cam={c} finish={false} />
        {/* the sea through the castle door, as the sea's own render (v3/kit.tsx Doorway): the doors are pushed open away
            from us, so this world's upright things a metre past the opening (the leaves) are kept */}
        <Doorway next="kitchen" abs={s.from + t} cam={c} center={[0, 1.485, -RZ - 0.078]} half={[1.02, 1.485]} behind={1.05} open={open > 0.001 ? 1 : 0} />
        <Finish look={look} seed={s.f0} />
      </Canvas3D>
      <Copier t={t} />
    </AbsoluteFill>
  );
}

// ---- the door in the rock, over the sea -------------------------------------------------------------------------
// The sea is the storm shot's own on a fair day, its level 2.5 m under the lens so its swell is close, and the take
// crosses 17 m of it to a great rock with a door at its foot, framed by fallen stones and a step down to the water.
// Over the swell on the way stands the weather's slider. `k` is the weather (0 fair .. 1 the sea got up), `burst` the
// seconds since the wave burst up under the cursor (below 0: not yet).
export const SEA_LEVEL = -1.1, ROCK: V3 = [0.4, SEA_LEVEL - 0.6, -RZ - 1.3];          // (the crag, as rock-door.glb stands it)
export const PANEL: Panel = { at: [1.0, 1.35, 4.2], w: 1.2, res: SLIDER, yaw: -0.12 };   // (over the swell, a third of the way to the rock)
export const BURST_AT: V3 = [0.9, SEA_LEVEL + 0.15, 3.5];                 // where the wave bursts: the sea just past the slider (it leans back over it as it rises)
export const SUN: V3 = [-0.5, 0.36, 0.79];                                // (low, over our left shoulder: it falls full on the rock's face and the door, raking from the left)
/** where the swell breaks on the rock (its waterline left of the steps, past the boulder on the right, and round its left
 *  flank), how often, how high it throws (m/s up), how wide, and its lean toward us as it goes up */
const BREAKS: { at: V3; every: number; phase: number; speed: number; size: number; lean: [number, number] }[] = [
  { at: [-2.4, SEA_LEVEL + 0.05, -2.2], every: 2.3, phase: 0.2, speed: 6.5, size: 0.8, lean: [0.05, 0.3] },
  { at: [3.3, SEA_LEVEL + 0.05, -2.3], every: 2.7, phase: 1.3, speed: 7.5, size: 0.9, lean: [-0.05, 0.3] },
  { at: [-4.3, SEA_LEVEL, -3.6], every: 1.9, phase: 0.7, speed: 5.5, size: 0.65, lean: [0.15, 0.25] },
];
/** a spray's slices packed round it, not spread from the lens to 40 m: spread out, a break 12 m off fell between planes
 *  1.5 m apart and each plane drew its own hard white cut of the foam (Stay a25: rows of white columns) */
export const around = (cam: Cam, at: V3, r: number) => { const d = Math.hypot(at[0] - cam.eye[0], at[1] - cam.eye[1], at[2] - cam.eye[2]); return { near: Math.max(0.3, d - r), far: d + r }; };
export function OceanWorld({ shift, abs, k, burst = -1, open = 0, next, cam, sun }: { shift: number; abs: number; k: number; burst?: number; open?: number; next?: string; cam: Cam; /** the sun's illuminance (by default it dims a little as the sea gets up) */ sun?: number }) {
  const z = (p: V3): V3 => [p[0], p[1], p[2] + shift];
  // (the sea round the rock churns white for a while after the wave)
  const churn = burst > 0 ? Math.exp(-burst * 0.9) * jerk(burst / 0.25) : 0;
  return (
    <>
      <DirectionalLight illuminance={sun ?? mix(32000, 22000, k)} color="#ffdfae" shadow_maps_enabled soft_shadow_size={2.5} transform={Transform.fromXyz(SUN[0] * 200, SUN[1] * 200, SUN[2] * 200 + shift).lookingAt(z([0, 1, -RZ]))} />
      <Entity name="sea" position={z([0, SEA_LEVEL, -14])}>
        <BevyComponent type="bevy_fft::ocean::sea::Sea" value={{
          extent: 3000, dense: 150, vertices: 900, grid: 1024, tile: 256,
          // (a rough sea from the first frame, and rougher as the slider goes: the director, 11-12, "id look at making the water
          // more aggressive from the start so we can actually see it smash on the rocks". It had been a fair day's swell,
          // wind 5, amplitude 0.9, choppiness 0.85, until the slider)
          wind_speed: mix(9.0, 12.5, k), wind_direction: 2.2, directional_spread: 0.3, peak_enhancement: 3.3,
          // (a storm's sea as the slider tops out, its crests still under the lens, 2.5 m over the water: amplitude 2.2)
          amplitude: mix(1.5, 2.2, k), choppiness: mix(1.2, 1.55, k), time_scale: 1, time: 40 + abs,
          foam_intensity: 0.95, foam_cutoff: mix(0.7, 0.84, k), foam_falloff: 0.3, foam_trail_decay: 0.96,
          color: [mix(0.011, 0.005, k), mix(0.032, 0.017, k), mix(0.037, 0.022, k)], roughness: mix(0.1, 0.15, k), reflectance: 0.5,
          // (the shore ring is in world x, z: it was at the rock's z + 14, as if local to the sea, and lay as a sheet of white
          // water in front of the lens; the drawing hid it until the sea went real, Stay a25)
          fade_near: 900, fade_far: 2600, shore: [ROCK[0], z(ROCK)[2], 4.8, mix(2.4, 3.0, k) + 3.5 * churn],
        }} />
      </Entity>
      {/* the swell breaking on the rock's foot, each place on its own beat, white water thrown up the rock and falling
          back: on the song's clock, so the threshold's view of this sea and the rock's own agree */}
      {BREAKS.map((b, i) => (
        <Spray key={i} name={`break-${i}`} base={z(b.at)} tau={(abs + b.phase) % b.every} cam={cam} speed={b.speed} size={b.size} lean={b.lean} sun={SUN} sunColor={[2.2, 1.9, 1.5]} skyColor={[0.55, 0.6, 0.66]} seed={11 + i} {...around(cam, z(b.at), 3.5)} froth={1} />
      ))}
      {/* the great rock with its doorway hewn in its foot, the door in it, and the steps down to the water (blender/components/threshold/rock_door.py) */}
      <Model name="rock-door" src={staticFile("models/threshold/rock-door.glb")} position={z([0, 0, -RZ])} animation="open" time={clamp01(open) * 0.999} loop={false} {...({ allowOverlap: true } as object)} />
      <Model name="boulder" src={staticFile("models/sea/crag-e.glb")} position={z([2.3, SEA_LEVEL - 0.55, -RZ + 1.1])} rotation={[0, 2.1, 0.1]} scale={0.8} {...({ allowOverlap: true } as object)} />
      <Model name="gulls" src={staticFile("models/sea/gulls.glb")} position={z([-9 + 4.2 * (abs - 3), 4.2 + 0.2 * (abs - 3), -13 - 1.0 * (abs - 3)])} rotation={[0, 0.9, 0]} animation="fly" time={Math.abs(((abs * 0.9) % 2) - 1) * 0.999} loop={false} />
      <RockDoor shift={shift} next={next} abs={abs} cam={cam} />
    </>
  );
}
/** the door's ring, its leaf `open` (0..1 of its 88 degrees, swinging out toward us; rock-door.glb's sidecar) */
const RD_HINGE: V3 = [-0.515, 0, -RZ + 0.045];
const ringR = (open: number): V3 => { const a = ((88 * Math.PI) / 180) * open; return [RD_HINGE[0] + 0.88 * Math.cos(a) - 0.036 * Math.sin(a), 1.05, RD_HINGE[2] + 0.88 * Math.sin(a) + 0.036 * Math.cos(a)]; };
/** in the doorway, behind the leaf, once it opens: the next world (its own frames from this lens, v3/kit.tsx Portal) */
function RockDoor({ shift, next, abs, cam }: { shift: number; next?: string; abs: number; cam: Cam }) {
  return next ? <Portal next={next} abs={abs} center={[0, 1.09, -RZ - 0.06 + shift]} half={[0.53, 1.1]} cam={cam} /> : null;
}

/** the door in the rock's keys: in through the threshold's door, the weather's slider, the door's ring, and out */
export function oceanKeys(s: Shot, t: number) {
  const T = ROOM_T.kitchen as { slide: [number, number]; splash: number; door: number };
  const len = s.seconds;
  const k = ease(ramp(t, T.slide[0], T.slide[1]));
  // (the leaf swings out toward us, so it is right out of the way, flat against the rock's side, well before we reach it)
  const open = jerk(ramp(t, T.door + 0.02, T.door + 0.8));
  const knobAt = (): V3 => onPanel(PANEL, sliderX(0.06 + 0.88 * k), 95);
  const keys: Key[] = [
    { t: T.slide[0], p: knobAt, press: true, seen: "take the weather's slider" },
    { t: T.slide[1], p: knobAt },
    { t: T.door, p: front(() => ringR(0), 0.04), press: true, seen: "take the door's ring and pull it open" },
    { t: T.door + DOOR_HOLD, p: front(() => ringR(open), 0.04) },
    ...goOut(len),
  ];
  return { T, len, k, open, keys };
}
TAKE_KEYS.kitchen = (t: number) => oceanKeys(shotOf("kitchen"), t).keys;
export const oceanView = (s: Shot, t: number): View => viewOf(s, t);

function OceanDoor({ s, t, v }: { s: Shot; t: number; v: View }) {
  const { T, len, k, open } = oceanKeys(s, t);
  const panel = PANEL;
  const { hand, cam: c } = v;
  const tip = hand?.pos ?? c.eye;
  // the wave: as the slider tops out a crest bursts up under the cursor, and is on it a moment later, and the fire is out
  const burst = t - T.splash, hit = T.splash + 0.18;
  const fire = fireOf(t, -5, hit);                                    // (lit in the last world: it comes through the door burning)
  // The storm (the director, 11-11, on assembly 23: "this should be storming as the levers go"): as the slider is dragged the
  // sky closes over, the rain comes on slanting across the drawing, the light goes grey and low, and the lightning
  // strikes twice, the second as the slider tops out and the wave comes up. Then, as the wave puts the fire out and the
  // real world spreads from where it broke, the storm breaks: the rain thins and the sun comes back through the cloud
  // ("go from dark to light ... then to light to reveal the scene and beauty"). The sea stays up.
  const g0 = smoothstep01((k - 0.15) / 0.65);                          // the storm, as far as the slider has brought it
  const clear = jerk((t - hit - 0.1) / 1.5);                          // and its breaking, after the wave
  const gale = g0 * (1 - 0.62 * clear);
  const fr = Math.round(t * 30), strike = Math.round((T.slide[0] + 0.62 * (T.slide[1] - T.slide[0])) * 30), crest = Math.round((T.splash - 0.07) * 30);
  const flash = fr === strike || fr === strike + 2 || fr === crest || fr === crest + 1 ? 1 : fr === strike + 1 ? 0.35 : 0;
  const look: Look = { base: 1, warm: mix(mix(0.6, 0.12, g0), 0.42, clear), sat: mix(mix(0.95, 0.74, g0), 0.92, clear), contrast: 0.65, halation: 0.6, sea: SEA_LEVEL,
    storm: { slant: 0.22, amount: gale, t: s.from + t, flash, cover: 0.12 + 0.82 * gale, sun: SUN } };
  // The whole place is real from the door on (the director, 11-12: "make sure that ocean scene is mostly seen it is too drawn
  // for most of the time i want that door to open up and we are in the full color"). Until then the door opened on the
  // drawing with a round of the real world about the cursor's flame, and the real world came only with the wave (his
  // assembly-23 note, cm-10, "doors open to the dark outline version then to light"); the dark-to-light now lives in
  // the storm alone, which closes over as the slider goes and breaks after the wave.
  look.base = 0;
  // (the drawing is the same in any light; what the orb shows of the real world under the storm is lifted a little)
  const ev = mix(-1.1, -0.6, k) + 0.9 * g0 * (1 - clear);
  const fog = [mix(mix(185, 74, g0), 150, clear), mix(mix(182, 82, g0), 152, clear), mix(mix(166, 88, g0), 146, clear)].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("");
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Canvas3D>
        <Camera3d transform={Transform.fromXyz(...c.eye).lookingAt(c.look)} projection={{ Perspective: { fov: (c.fov * Math.PI) / 180, near: 0.03, far: 6000 } }}>{/* (ray traced, as every world is: the director, 11-12, "solari is kind of the ideal") */}<SolariLighting bounces={2} /></Camera3d>
        <AntiAliasing mode="smaa" />
        <ToneMapping mode="agx" exposure={ev} />
        <Bloom intensity={0.4} threshold={0.7} />
        <Shadows mapSize={8192} distance={90} firstCascade={24} cascades={3} />
        <Fog color={`#${fog}`} near={mix(600, 140, gale)} far={mix(6000, 1500, gale)} />
        <Environment src={staticFile("hdri/kloofendal_overcast_puresky.hdr")} intensity={mix(0.5, 0.24, gale)} rotation={2.2} />
        <OceanWorld shift={0} abs={s.from + t} k={k} burst={burst} open={open} next="living" cam={c} sun={mix(mix(32000, 6500, g0), 24000, clear)} />
        <Spray name="burst" base={BURST_AT} tau={burst} cam={c} speed={8.5} size={0.6} lean={[-0.05, 0.36]} sun={SUN} sunColor={[2.2, 1.9, 1.5]} skyColor={[0.55, 0.6, 0.66]} seed={3} {...around(c, BURST_AT, 4.5)} froth={0.75} />
        <Panel3D name="weather" panel={panel} ev={0} bright={2.6 - 0.8 * k} show={spring(t - T.slide[0] + 0.7) * (1 - ramp(t, T.slide[1] + 0.25, T.slide[1] + 0.6))}><Slider kind="storm" v={0.06 + 0.88 * k} press={hand?.press ?? 0} /></Panel3D>
        <Flame name="cursor-flame" at={add(tip, [0, 0.012, 0])} h={0.13 * fire.flame + 0.001} cam={c} t={s.from + t} gain={fire.flame} gutter={fire.gutter} light={2600 * fire.flame} seed={4} />
        <Smoke name="cursor-smoke" at={add(tip, [0, 0.02, 0])} h={0.55} cam={c} t={s.from + t} age={t > hit ? (t - hit) / 1.2 : 0} />
        <Hand3D hand={hand} cam={c} ev={ev} />
        <FilmLook look={look} seed={s.f0} cam={c} finish={false} />
        <Doorway next="living" abs={s.from + t} cam={c} center={[0, 1.09, -RZ - 0.06]} half={[0.53, 1.1]} />
        {/* the burst's water on the lens (the director, 11-12: "maybe a little bit of water splash on the lens like drops"): on
            the glass, so over everything, the doorway's picture too */}
        {!v.portal && <LensDrops age={t - hit} />}
        {!v.portal && <Finish look={look} seed={s.f0} />}
      </Canvas3D>
    </AbsoluteFill>
  );
}

/** each world's lens and cursor at t: what its portal renders in the last world's doorway are seen by (v3/film.tsx) */
export function viewFor(s: Shot, t: number): View {
  if (s.id === "hallway") return thresholdView(s, t);
  if (s.id === "kitchen") return oceanView(s, t);
  if (s.id === "gardendoor") return roomView(s, t);
  const w = NEW[s.id];
  if (w) return w.view(s, t);
  throw new Error(`viewFor: no view for ${s.id}`);
}
/** the new worlds after the sea (each in its own file), by the shot that holds it */
const NEW: Record<string, { view: (s: Shot, t: number) => View; Draw: (p: { s: Shot; t: number; v: View }) => JSX.Element }> = {
  living: { view: kelpView, Draw: KelpWorld },
  study: { view: cloudView, Draw: CloudsWorld },
  greenhouse: { view: pixelView, Draw: PixelWorld },
  dining: { view: naveView, Draw: NaveWorld },
  cellar: { view: oilView, Draw: OilWorld },
};

export function World({ s, t, override }: { s: Shot; t: number; /** a portal's render: the last world's lens, no cursor */ override?: View }) {
  if (s.id === "hallway") return <Threshold s={s} t={t} />;
  if (s.id === "kitchen") return <OceanDoor s={s} t={t} v={override ?? oceanView(s, t)} />;
  const w = NEW[s.id];
  if (w) return <w.Draw s={s} t={t} v={override ?? w.view(s, t)} />;
  return <AbsoluteFill style={{ background: "#000" }} />;
}

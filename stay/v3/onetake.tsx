// The opening as one shot, not shots joined (the director, 11-12: "is there also a way to do a version that actually is a
// single shot not just stitching clips to make it feel like a one shot. from the opening to the canyon"). A first
// step, the first door: the threshold and the door in the rock are one scene in one render, the threshold's own place
// (the sea world stands beyond its door at SEA_SHIFT, as it already did in the threshold's render), and one lens flies
// the take's path from the copier's opening through the castle door, over the swell, to the rock's door. No portal
// frames and no blend at the door: what is seen through it is the sea itself.
//   Before the take crosses the door (the kitchen shot's `from`): the threshold's lens, its photocopy look, with
//   everything past the door's plane real (so the sea through the doorway is the sea); after: the door in the rock's
//   lens moved into this place, its storm look. The exposure, the sky's light and the bloom ease over the crossing, as
//   the eye's would. The doorway at the end, on the living room, is still that world's frames (v3/kit.tsx Portal).
//   RAEA_BUNDLE_LIB=~/raea/target/release/libraea_bundle.dylib vendor/bin/raea-sea motion render v3/onetake.tsx --composition onetake -o out/v3/onetake.mp4
import { AbsoluteFill, Composition, registerRoot, staticFile, useCurrentFrame } from "raea";
import { AntiAliasing, Bloom, Canvas3D, Environment, Fog, Model, Shadows, ToneMapping } from "raea/3d";
import { Camera3d } from "raea/camera";
import { SolariLighting } from "raea/light";
import { Transform } from "raea/transform";
import { RZ } from "../sets/rooms";
import { clamp01, ease, ramp, type V3 } from "../v2/math";
import { Panel3D, Slider, spring } from "./controls";
import { Flame, Smoke, Spray } from "./fire";
import { Hand3D } from "./hand3d";
import { Doorway, moved, shotOf } from "./kit";
import { LensDrops } from "./lens-drops";
import { FilmLook, Finish, type Look } from "./look";
import { FPS, H, PAD, W } from "./plan";
import { BURST_AT, COPY_GAIN, Copier, OceanWorld, PANEL, SEA_SHIFT, SUN, TORCH, TORCH_FLAME, around, fireOf, oceanKeys, oceanView, openingView, thresholdKeys } from "./worlds";

const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const jerk = (k: number) => { const q = clamp01(k); return q * q * q * (10 - 15 * q + 6 * q * q); };
const smooth = (x: number) => { const q = clamp01(x); return q * q * (3 - 2 * q); };
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const z = (p: V3): V3 => [p[0], p[1], p[2] + SEA_SHIFT];             // the sea world's place in the threshold's

const HALL = shotOf("hallway"), SEA = shotOf("kitchen");
/** where the take crosses the castle door, song seconds; and how long the eye takes to settle to the sea's light */
const CROSS = SEA.from, SETTLE = 0.5;
export const ONETAKE_FRAMES = Math.round((PAD + SEA.from + SEA.seconds) * FPS);

/** the one take at `abs`, song seconds (from -PAD) */
function OneTake({ abs }: { abs: number }) {
  const th = abs - HALL.from, tk = abs - SEA.from, out = abs >= CROSS;
  // the light settling from the threshold's night to the sea's day, over the crossing
  const u = smooth((abs - CROSS + 0.15) / SETTLE);
  // --- the threshold's keys and the sea's, both always worked out (each world's things stand from the first frame)
  const T = thresholdKeys(HALL, th);
  const fireT = fireOf(th, T.T.light);
  const torchGo = clamp01((th - T.T.light) / 0.2);
  const O = oceanKeys(SEA, Math.max(0, tk));
  const k = out ? O.k : 0, open = out ? O.open : 0;
  const burst = tk - O.T.splash, hit = O.T.splash + 0.18;
  const fireO = fireOf(tk, -5, hit);
  const g0 = smooth((k - 0.15) / 0.65), clear = jerk((tk - hit - 0.1) / 1.5), gale = g0 * (1 - 0.62 * clear);
  // --- the lens and the cursor: the threshold's, then the sea's moved into this place
  const v = out ? moved(oceanView(SEA, tk), "kitchen", "hallway") : openingView(HALL, th);
  const c = v.cam, hand = v.hand;
  const tip = hand?.pos ?? c.eye;
  const fire = out ? fireO : fireT;
  // --- the look: the threshold's photocopy, real past the door's plane; then the sea's storm, all real
  const fr = Math.round(tk * 30), strike = Math.round((O.T.slide[0] + 0.62 * (O.T.slide[1] - O.T.slide[0])) * 30), crest = Math.round((O.T.splash - 0.07) * 30);
  const flash = out && (fr === strike || fr === strike + 2 || fr === crest || fr === crest + 1) ? 1 : out && fr === strike + 1 ? 0.35 : 0;
  const look: Look = out
    ? { base: 0, warm: mix(mix(0.6, 0.12, g0), 0.42, clear), sat: mix(mix(0.95, 0.74, g0), 0.92, clear), contrast: 0.65, halation: 0.6,
        storm: { slant: 0.22, amount: gale, t: abs, flash, cover: 0.12 + 0.82 * gale, sun: SUN } }
    : { base: 1, warm: 0.35, contrast: 0.62, halation: 0.55, style: 3, gain: COPY_GAIN,
        orb: fireT.on ? { at: tip, r: fireT.r, soft: 0.75 } : { at: TORCH_FLAME, r: 0.62, soft: 0.38 },
        void: { z: -RZ - 0.47, x0: -1.02, x1: 1.02, y1: 2.97, fade: 0.2 },
        // (past the door's plane the place is real: the sea seen through the doorway is the sea, not its copy)
        // (stay.wgsl flips where -(n.p + w) < 0: n -z and w -(RZ + 0.35) is every z past -RZ - 0.35)
        plane: [0, 0, -1, -(RZ + 0.35)] };
  // the threshold's pieces, parked far under the world once the take is through its door: behind the lens they still
  // threw the wall's shadow over the swell (a render keeps every part it starts with, so they move, never go)
  const gone = abs > CROSS + 0.4, P = (p: V3): V3 => (gone ? [p[0], p[1] - 500, p[2]] : p);
  const evSea = mix(-1.1, -0.6, k) + 0.9 * g0 * (1 - clear);
  const ev = mix(0.6, evSea, u);
  const fog = [mix(mix(185, 74, g0), 150, clear), mix(mix(182, 82, g0), 152, clear), mix(mix(166, 88, g0), 146, clear)].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("");
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Canvas3D>
        <Camera3d transform={Transform.fromXyz(...c.eye).lookingAt(c.look)} projection={{ Perspective: { fov: (c.fov * Math.PI) / 180, near: 0.03, far: 6000 } }}>
          <SolariLighting bounces={2} />
        </Camera3d>
        <AntiAliasing mode="smaa" />
        <ToneMapping mode="agx" exposure={ev} />
        <Bloom intensity={mix(0.32, 0.4, u)} threshold={mix(0.8, 0.7, u)} />
        <Shadows mapSize={8192} distance={90} firstCascade={24} cascades={3} />
        <Fog color={`#${fog}`} near={mix(600, 140, gale)} far={mix(6000, 1500, gale)} />
        <Environment src={staticFile("hdri/kloofendal_overcast_puresky.hdr")} intensity={mix(0.035, mix(0.5, 0.24, gale), u)} rotation={2.2} />
        {/* the threshold: the ruined wall, its floor, the castle door and the torch */}
        <Model name="wall" src={staticFile("models/threshold/wall.glb")} position={P([0, 0, -RZ])} shadow={false} />
        <Model name="floor" src={staticFile("models/threshold/floor.glb")} position={P([0, 0, -RZ])} shadow={false} />
        <Model name="castle-door" src={staticFile("models/cathedral/door.glb")} position={P([0, 0, -RZ])} animation="open" time={clamp01(T.open) * 0.999} loop={false} shadow={false} />
        <Model name="torch" src={staticFile("models/threshold/torch.glb")} position={P(TORCH)} shadow={false} />
        <Flame name="torch-flame" at={P(TORCH_FLAME)} h={0.34} cam={c} t={abs} gutter={torchGo} light={torchGo < 1 ? 5200 : 0} seed={1} />
        <Smoke name="torch-smoke" at={P(add(TORCH_FLAME, [0, 0.02, 0]))} h={0.9} cam={c} t={abs} age={fireT.on ? (th - T.T.light - 0.1) / 1.6 : 0} />
        {/* the sea world beyond it, live: the swell, the rock and its door, the breaks, the gulls; the slider and the wave */}
        <OceanWorld shift={SEA_SHIFT} abs={abs} k={k} burst={out ? burst : -1} open={open} next="living" cam={c} sun={mix(mix(32000, 6500, g0), 24000, clear)} />
        <Spray name="burst" base={z(BURST_AT)} tau={out ? burst : -1} cam={c} speed={8.5} size={0.6} lean={[-0.05, 0.36]} sun={SUN} sunColor={[2.2, 1.9, 1.5]} skyColor={[0.55, 0.6, 0.66]} seed={3} {...around(c, z(BURST_AT), 4.5)} froth={0.75} />
        <Panel3D name="weather" panel={{ ...PANEL, at: z(PANEL.at) }} ev={0} bright={2.6 - 0.8 * k} show={out ? spring(tk - O.T.slide[0] + 0.7) * (1 - ramp(tk, O.T.slide[1] + 0.25, O.T.slide[1] + 0.6)) : 0}><Slider kind="storm" v={0.06 + 0.88 * k} press={hand?.press ?? 0} /></Panel3D>
        {/* the cursor and its fire, one the whole way */}
        <Flame name="cursor-flame" at={add(tip, [0, 0.012, 0])} h={0.13 * fire.flame + 0.001} cam={c} t={abs} gain={fire.flame} gutter={fire.gutter} light={mix(4200, 2600, u) * fire.flame} seed={4} />
        <Smoke name="cursor-smoke" at={add(tip, [0, 0.02, 0])} h={0.55} cam={c} t={abs} age={out && tk > hit ? (tk - hit) / 1.2 : 0} />
        <Hand3D hand={hand} cam={c} ev={ev} />
        <FilmLook look={look} seed={7} cam={c} finish={false} />
        {/* the rock's door at the end opens on the living room: still that world's own frames, for now */}
        <Doorway next="living" abs={abs} cam={c} center={[0, 1.09, -RZ - 0.06 + SEA_SHIFT]} half={[0.53, 1.1]} />
        {out && <LensDrops age={tk - hit} />}
        <Finish look={look} seed={7} />
      </Canvas3D>
      <Copier t={th} />
    </AbsoluteFill>
  );
}

const Play = () => <OneTake abs={useCurrentFrame() / FPS - PAD} />;
registerRoot(() => <Composition id="onetake" component={Play} width={W} height={H} fps={FPS} durationInFrames={ONETAKE_FRAMES} />);

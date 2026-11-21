// Berlin, Winter 1917, long cut v5 (out/rebuilt/v5/shots.md, "Interiors, cutaways, under"): the new interior, cutaway
// and underground shots, one composition each (a render settles its 3D look on its first frame, so nothing mounts or
// hides over a render; every camera moves by transform from its first frame to its last).
//   s5-court-dusk     the test court (interiors/sets/court.ts) without its snow and sledge, pushing toward the side wing
//   s5-court-privy    the same court in its snow, at the yard door, drifting
//   s5-cellar         a house cellar's slatted compartment: coal, potatoes, jars (cellar.ts compartment)
//   s5-cellar-coal    the third cellar's compartments, away from the corridor (no breakthrough hole in frame)
//   s5-kitchen-room   the side-wing kitchen with its iron bed (kitchen.ts room)
//   s5-kitchen-window the kitchen window and its lace, over the court (kitchen.ts tilt-start)
//   s5-kitchen-lamp   the kitchen at evening by its lamp (kitchen.ts dusk lamp)
//   s5-gallery-N      the generated rooms' window views, one frame each, panned as a grid after the render
//   s5-house-L{n}     one house cut away to level n, each a 2 s window of one orbit; joined by dissolves after the render
//   s5-room-best/clerk/wing   the walkable city's rooms furnished for who lives in them (city-rooms.tsx)
//   s5-salon          a bel étage salon by the gallery's generator (interior-salon.tsx), seed 3 at dusk
//   s5-warkitchen     the war kitchen from the queue's pavement (interiors/warkitchen.ts street cam), seed 5
//   s5-sewers3d-crossing / -station   Radial System III in 3D, the ground left out (sewers3d.tsx), orbiting
//   s5-sewer-shaft    up the shaft from the egg sewer, lantern-lit, no thud (underground-sewer.tsx)
import { AbsoluteFill, Composition, registerRoot, staticFile, useCurrentFrame } from "raea";
import { Model, VolumetricFog } from "raea/3d";
import { Camera3d, Canvas3D } from "raea/camera";
import { AmbientLight, DirectionalLight, PointLight, RectLight, Shadows } from "raea/light";
import { Fog } from "raea/pbr";
import { Bloom, ToneMapping } from "raea/post_process";
import { Transform } from "raea/transform";
import { LUM, SetRooms, SetView } from "../interiors/draw/set";
import { COURT_FP } from "../interiors/sets/court";
import { CELLAR } from "../interiors/sets/cellar";
import { KITCHEN_DAY, KITCHEN_DUSK, KITCHEN_SHELL } from "../interiors/sets/kitchen";
import { GALLERY, generated } from "../interiors/sets/gallery";
import { warKitchenSet } from "../interiors/warkitchen";
import type { AtlasRoom } from "../interiors/atlas";
import type { Cam, Set } from "../interiors/sets/types";
import { CityCut, Houses } from "../components/interiors/Houses";
import type { CityLook } from "../components/world/City";
import { type HouseRec, houseSet } from "../interiors/cityroom";
import type { RoomRec } from "../tools/city/rooms";
import { SEWER, SewerLantern, SewerSet } from "../components/underground/sewer";
import hOrth from "../assets/world/friedrichstadt/interiors/3911541_58190321.json";
import hTailor from "../assets/world/friedrichstadt/interiors/3910956_58193211.json";
import hCrowd from "../assets/world/friedrichstadt/interiors/3914894_58190593.json";
import rec from "../assets/world/friedrichstadt/interiors/3913048_58191217.json";
import sewers from "../assets/graybox/friedrichstadt/sewers/index.json";
import under from "../assets/graybox/friedrichstadt/under/index.json";

const FPS = 24;
type V3 = [number, number, number];
const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const t01 = (f: number, n: number) => Math.min(1, Math.max(0, f / (n - 1)));

/** a set camera moved: `push` m toward what it looks at, `side` m level to its right, `rise` m up (eased by k) */
function moved(base: Cam, k: number, push: number, side = 0, rise = 0): Cam {
  const d = [base.at[0] - base.eye[0], base.at[1] - base.eye[1], base.at[2] - base.eye[2]];
  const len = Math.hypot(d[0], d[1], d[2]), u = d.map((x) => x / len);
  const sx = -u[2], sz = u[0];
  const eye: V3 = [base.eye[0] + u[0] * push * k + sx * side * k, base.eye[1] + u[1] * push * k + rise * k, base.eye[2] + u[2] * push * k + sz * side * k];
  const at: V3 = [base.at[0] + sx * side * k * 0.6, base.at[1] + rise * k * 0.5, base.at[2] + sz * side * k * 0.6];
  return { ...base, eye, at };
}
const camOf = (set: Set, id: string) => set.cams.find((c) => c.id === id)!;
function SetShot({ set, cam, exposure = 0, shadows = 2 }: { set: Set; cam: Cam; exposure?: number; shadows?: number }) {
  return (
    <AbsoluteFill style={{ background: "#050506" }}>
      <Canvas3D>
        <SetView set={set} cam={cam} exposure={exposure} shadows={shadows} />
      </Canvas3D>
    </AbsoluteFill>
  );
}

// the court in October for the film's first scene: no snow banks, no sledge
const COURT_AUTUMN: Set = { ...COURT_FP, id: "court-autumn", rooms: COURT_FP.rooms.map((r) => ({ ...r, props: r.props.filter((p) => !p.prop.startsWith("snow-bank") && p.prop !== "rodel") })) };
// the cellar chain's third cellar, from its corridor side toward its slatted compartments (the holes are behind)
const CELLAR_C: Cam = (() => {
  const b = camOf(CELLAR, "compartment");
  const dx = (camOf(CELLAR, "chain").eye[0] - 6.8) / 2; // L + FW: one cellar on, from B to C
  return { ...b, id: "coal", eye: [b.eye[0] + dx - 1.2, 1.45, 1.6], at: [b.at[0] + dx - 0.4, 0.45, 5.6], fov: 56 };
})();

const KL = KITCHEN_SHELL.l, KD = KITCHEN_SHELL.d, CF = (camOf(CELLAR, "chain").eye[0] - 6.8) / 2;
const EXTRA: Record<string, Cam> = {
  // the court's far corner, back across the snow to the carpet rack, the pump and the dust chest
  privy: { id: "privy", eye: [1.4, 1.65, 1.6], at: [7.5, 1.3, 10.5], fov: 62, note: "" },
  // the coal sacks by the cellar neck on the court's right wall
  coal: { id: "coal", eye: [6.0, 1.5, 0.9], at: [9.2, 0.5, 4.6], fov: 52, note: "" },
  // the second cellar from its corridor, diagonally into its slatted compartment
  cellar: { id: "cellar", eye: [CF + 4.6, 1.6, 2.7], at: [CF + 5.6, 0.45, 6.0], fov: 66, lamp: 60, note: "" },
  // the kitchen from the dresser's corner across to the lodger's bed and the range
  room: { id: "room", eye: [0.7, 1.55, KD - 0.5], at: [KL - 0.6, 0.7, 1.0], fov: 62, note: "" },
  // oblique at the window: the lace curtain, the wool between the casements, the court beyond
  window: { id: "window", eye: [KL / 2 - 1.2, 1.5, KD - 1.4], at: [KL / 2 + 0.25, 1.45, KD], fov: 55, note: "" },
};
const salonRoom: AtlasRoom = { n: 96, recipe: "salon", seed: 3, lit: true, note: "salon seed 3" };
const SALON = generated(salonRoom);
const WAR = warKitchenSet(5.0);

// ---- the walkable city's rooms (city-rooms.tsx's Scene, its camera pushing, no caption) ----
const NOON: CityLook = { snow: 0.7, wet: 0.3, soot: 0.8, damp: 0.7, lit: 0.05, litShop: 0.3, lamp: 0.6, dark: 0.06, skyTop: [0.5, 0.55, 0.6], skyHor: [0.75, 0.77, 0.8], ice: 0.6, nits: 800, hour: 12 };
const inRoom = (r: RoomRec, p: V3): V3 => { const c = Math.cos(r.yaw), s = Math.sin(r.yaw); return [r.at[0] + c * p[0] + s * p[2], r.at[1] + p[1], r.at[2] - s * p[0] + c * p[2]]; };
const mid = (r: RoomRec): V3 => inRoom(r, [r.l / 2, 0, r.d / 2]);
type RoomShot = { house: HouseRec; lv: number; room: number };
const H = (x: unknown) => x as HouseRec;
const ROOMS: Record<string, RoomShot> = {
  "s5-room-best": { house: H(hOrth), lv: 1, room: 2 }, // a first-floor salon
  "s5-room-clerk": { house: H(hTailor), lv: 2, room: 22 }, // coats for the Konfektion sewn at home, second floor
  "s5-room-wing": { house: H(hCrowd), lv: 0, room: 13 }, // six asleep in one Stube, two of them Schlafgänger
};
function CityRoom({ s, k }: { s: RoomShot; k: number }) {
  const r = s.house.rooms.find((x) => x.lv === s.lv && x.id === s.room)!;
  const win = r.open.find((o) => o.kind === "window" && o.wall === "front");
  const x0 = win ? r.l - win.u : 0.35, x1 = win ? (x0 < r.l / 2 ? 0.72 : 0.28) * r.l : r.l * 0.875 - 0.15;
  const e0 = inRoom(r, [x0, 1.6, r.d - 0.4]), at = inRoom(r, [x1, 1.1, 0.2]);
  // push 0.7 m into the room and drift 0.3 m sideways over the shot
  const d = [at[0] - e0[0], at[2] - e0[2]], L = Math.hypot(d[0], d[1]), u = [d[0] / L, d[1] / L];
  const eye: V3 = [e0[0] + u[0] * 0.7 * k - u[1] * 0.3 * k, e0[1] - 0.05 * k, e0[2] + u[1] * 0.7 * k + u[0] * 0.3 * k];
  const c = mid(r);
  const set = houseSet(s.house, { lights: false, only: (x) => x.lv === s.lv && Math.hypot(mid(x)[0] - c[0], mid(x)[2] - c[2]) < 10 });
  const sky = r.open.filter((o) => o.kind === "window").map((o) => {
    const p = o.wall === "front" ? [r.l - o.u, r.d + 0.4, r.l - o.u, r.d - 2] : o.wall === "back" ? [o.u, -0.4, o.u, 2] : o.wall === "left" ? [-0.4, r.d - o.u, 2, r.d - o.u] : [r.l + 0.4, o.u, r.l - 2, o.u];
    return { at: inRoom(r, [p[0], o.y + o.h / 2, p[1]]), look: inRoom(r, [p[2], 0.6, p[3]]), w: o.w, h: o.h };
  });
  return (
    <AbsoluteFill style={{ background: "#a7adb3" }}>
      <Canvas3D>
        <Camera3d transform={Transform.fromXyz(...eye).lookingAt(at)} projection={{ Perspective: { fov: (55 * Math.PI) / 180, near: 0.05, far: 4000 } }} />
        <DirectionalLight transform={Transform.fromXyz(eye[0] - 30, eye[1] + 60, eye[2] + 100).lookingAt(eye)} illuminance={3500} color="#e8e4dc" />
        {sky.map((q, i) => <RectLight key={i} name={`sky-${i}`} transform={Transform.fromXyz(...q.at).lookingAt(q.look)} intensity={1600 * LUM} width={q.w} height={q.h} color="#c9d6e8" />)}
        <AmbientLight brightness={42} color="#9aa8bd" />
        <Fog color="#a7adb3" near={300} far={1800} />
        <ToneMapping mode="agx" exposure={-3.5} />
        <CityCut eye={at} look={NOON} clip={[0, 0, 0, 1]} maxLod={0} />
        <Houses eye={at} range={40} />
        <SetRooms set={set} shells={false} shadows={0} glows={0} />
      </Canvas3D>
    </AbsoluteFill>
  );
}

// ---- one house cut away level by level (city-house.tsx): one orbit, each level its own 2 s window of it ----
const KEY = rec.key;
const [be0, bn0, be1, bn1] = rec.bbox;
const HC: V3 = [(be0 + be1) / 2 - 391000, 0, -((bn0 + bn1) / 2 - 5819000)];
const HR = Math.max(be1 - be0, bn1 - bn0);
const LEVELS = rec.levels as { n: number; kind: string; y: number; top: number }[];
export const HOUSE_STEP = 1.4, HOUSE_WIN = 2.0; // s between level windows, and each window's length
const HOUSE_TOTAL = HOUSE_STEP * (LEVELS.length - 1) + HOUSE_WIN;
function HouseCut({ upTo, t }: { upTo: number; t: number }) {
  const k = ease(t / HOUSE_TOTAL);
  const L = LEVELS.find((l) => l.n === upTo)!;
  // the eye orbits 50 degrees round the house and rises with the levels, looking at the level shown
  const a = (-38 + 50 * k) * (Math.PI / 180), y = LEVELS[0].y + (LEVELS[LEVELS.length - 1].y - LEVELS[0].y) * k;
  const at: V3 = [HC[0], y, HC[2]];
  const eye: V3 = [HC[0] + Math.sin(a) * HR * 0.62, y + HR * 0.62, HC[2] + Math.cos(a) * HR * 0.62];
  return (
    <AbsoluteFill style={{ background: "#1c1b1a" }}>
      <Canvas3D>
        <Camera3d transform={Transform.fromXyz(...eye).lookingAt(at)} projection={{ Perspective: { fov: (40 * Math.PI) / 180, near: 0.5, far: 2000 } }} />
        <AmbientLight brightness={180} color="#c9ccd6" />
        <DirectionalLight transform={Transform.fromXyz(at[0] - 40, at[1] + 90, at[2] + 25).lookingAt(at)} illuminance={9000} color="#f4e6d0" shadow />
        <Model name={`house-${KEY}`} src={staticFile(`world/friedrichstadt/interiors/${KEY}.glb`)} hide={LEVELS.filter((l) => l.n > upTo).map((l) => `L${l.n}`)} shadow />
        <ToneMapping mode="agx" exposure={-1.2} />
      </Canvas3D>
    </AbsoluteFill>
  );
}

// ---- Radial System III in 3D (sewers3d.tsx), orbiting ----
const tiles = (under as { tiles: { tile: string }[] }).tiles;
const III = (sewers as { stations: { system: string; at: number[]; invert: number }[] }).stations.find((s) => s.system === "III")!;
function Sewers({ eye, at, fov }: { eye: V3; at: V3; fov: number }) {
  return (
    <AbsoluteFill style={{ background: "#121416" }}>
      <Canvas3D>
        <Camera3d transform={Transform.fromXyz(...eye).lookingAt(at)} projection={{ Perspective: { fov: (fov * Math.PI) / 180, near: 0.5, far: 4000 } }} />
        <DirectionalLight transform={Transform.fromXyz(eye[0] + 300, 900, eye[2] + 600).lookingAt(at)} illuminance={7000} color="#fff1e0" shadow_maps_enabled />
        <AmbientLight brightness={600} color="#9fb0c8" />
        <Shadows distance={1500} firstCascade={120} mapSize={4096} />
        <Fog color="#121416" near={600} far={2200} />
        <ToneMapping mode="agx" />
        <Model name="sewers" src={staticFile("graybox/friedrichstadt/sewers/sewers.glb")} />
        {tiles.map((q) => <Model key={q.tile} name={`under-${q.tile}`} src={staticFile(`graybox/friedrichstadt/under/${q.tile}.glb`)} />)}
      </Canvas3D>
    </AbsoluteFill>
  );
}
/** a point orbited `deg` degrees about a centre's vertical axis */
const orbit = (p: V3, c: V3, deg: number): V3 => {
  const a = (deg * Math.PI) / 180, dx = p[0] - c[0], dz = p[2] - c[2];
  return [c[0] + dx * Math.cos(a) - dz * Math.sin(a), p[1], c[2] + dx * Math.sin(a) + dz * Math.cos(a)];
};

type Shot = { id: string; seconds: number; draw: (t: number, n: number) => JSX.Element };
const SHOTS: Shot[] = [
  { id: "s5-court-dusk", seconds: 7, draw: (t, n) => <SetShot set={COURT_AUTUMN} cam={moved(camOf(COURT_AUTUMN, "court"), ease(t / n), 1.4, 0.25, 0.1)} /> },
  { id: "s5-court-privy", seconds: 6, draw: (t, n) => <SetShot set={COURT_FP} cam={moved(EXTRA.privy, ease(t / n), 0.9, 0.3)} /> },
  { id: "s5-cellar", seconds: 6, draw: (t, n) => <SetShot set={CELLAR} cam={moved(EXTRA.cellar, ease(t / n), 0.5, 0.2)} /> },
  { id: "s5-cellar-coal", seconds: 6, draw: (t, n) => <SetShot set={COURT_FP} cam={moved(EXTRA.coal, ease(t / n), 0.6, -0.2)} /> },
  { id: "s5-kitchen-room", seconds: 6, draw: (t, n) => <SetShot set={KITCHEN_DAY} cam={moved(EXTRA.room, ease(t / n), 0.4, 0.2)} /> },
  { id: "s5-kitchen-window", seconds: 6, draw: (t, n) => <SetShot set={KITCHEN_DAY} cam={moved({ ...camOf(KITCHEN_DAY, "window"), eye: [KL / 2 + 0.05, 1.62, KD - 0.55], at: [KL / 2 - 0.4, -2.2, KD + 7] }, ease(t / n), 0.3, 0.1)} /> },
  { id: "s5-kitchen-lamp", seconds: 6, draw: (t, n) => <SetShot set={KITCHEN_DUSK} cam={moved(camOf(KITCHEN_DUSK, "lamp"), ease(t / n), 0.4, 0.25)} /> },
  { id: "s5-salon", seconds: 6, draw: (t, n) => <SetShot set={SALON} cam={moved(SALON.cams[0], ease(t / n), 0.6, 0.3)} /> },
  { id: "s5-warkitchen", seconds: 6, draw: (t, n) => <SetShot set={WAR} cam={moved(camOf(WAR, "street"), ease(t / n), 1.3, 0.3)} shadows={3} /> },
  ...Object.entries(ROOMS).map(([id, s]) => ({ id, seconds: 6, draw: (t: number, n: number) => <CityRoom s={s} k={ease(t / n)} /> })),
  { id: "s5-sewers3d-crossing", seconds: 7, draw: (t, n) => { const c: V3 = [-268, 27, -30]; return <Sewers eye={orbit([-120, 95, 150], c, -12 + 24 * ease(t / n))} at={c} fov={42} />; } },
  { id: "s5-sewers3d-station", seconds: 7, draw: (t, n) => {
    const s = III.at as V3, c: V3 = [s[0] - 25, III.invert, s[2] - 60];
    return <Sewers eye={orbit([s[0] + 70, s[1] + 45 - 8 * ease(t / n), s[2] + 75], c, 18 * ease(t / n))} at={c} fov={48} />;
  } },
  { id: "s5-sewer-shaft", seconds: 6, draw: (t, n) => {
    const k = ease(t / n), z = -SEWER.shaftAt + 3.2 - 1.4 * k;
    return (
      <AbsoluteFill style={{ background: "#000" }}>
        <Canvas3D>
          <Camera3d transform={Transform.fromXyz(0.12, 0.85, z).lookingAt([0, 1.2 + 1.6 * k, -SEWER.shaftAt])} projection={{ Perspective: { fov: (60 * Math.PI) / 180, near: 0.03, far: 60 } }} />
          <VolumetricFog ambient={0.01} ambientColor="#2a2a30" />
          <AmbientLight brightness={3} color="#5a6070" />
          <Bloom intensity={0.15} />
          <ToneMapping mode="agx" exposure={0.3} />
          <SewerSet s={{ t, thud: -1, day: 0.6, haze: 0.6 }} dustAt={99} />
          <SewerLantern at={[0.35, 1.5, -SEWER.shaftAt + 4.2]} k={0.8} />
        </Canvas3D>
      </AbsoluteFill>
    );
  } },
];

// twelve of the generated rooms' window views, one frame each (spread over the atlas)
const GALLERY_PICK = Array.from({ length: 12 }, (_, i) => GALLERY[Math.floor((i * GALLERY.length) / 12)]);

registerRoot(() => (
  <>
    {SHOTS.map((s) => (
      <Composition key={s.id} id={s.id} width={1920} height={1080} fps={FPS} durationInFrames={Math.round(s.seconds * FPS)} component={() => {
        const f = useCurrentFrame();
        return s.draw(f / FPS, s.seconds);
      }} />
    ))}
    {LEVELS.map((l, i) => (
      <Composition key={`L${l.n}`} id={`s5-house-L${l.n}`} width={1920} height={1080} fps={FPS} durationInFrames={Math.round(HOUSE_WIN * FPS)} component={() => {
        const f = useCurrentFrame();
        return <HouseCut upTo={l.n} t={i * HOUSE_STEP + f / FPS} />;
      }} />
    ))}
    {GALLERY_PICK.map((s, i) => (
      <Composition key={`g${i}`} id={`s5-gallery-${i}`} width={1920} height={1080} fps={FPS} durationInFrames={1} component={() => <SetShot set={s} cam={s.cams[0]} />} />
    ))}
  </>
));

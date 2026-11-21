// Berlin long cut v5 (out/rebuilt/v5/shots.md, "City exteriors"): the new city shots, one composition each so each
// renders as its own run (a render settles its 3D look on its first frame). Every camera moves from its first frame to
// its last, slowly and eased; people walk at a normal pace, and anyone a street shot would bring within 40 m of the
// camera is left out of every frame (the rebuilt-showcase rule: the stand-ins glide close up).
//   s5-smoke-aerial    the winter city at first light from the south, chimney smoke leaning east (world-smoke's aerial)
//   s5-graybox-aerial  the graybox Friedrichstadt: every building at its 1887 code height, a slow aerial (graybox.tsx)
//   s5-stream-run      the baked city's tiles streaming in at dusk, a drone's run east along Leipziger (world-stream)
//   s5-blocks-aerial   high over the blocks south of Leipziger Straße, courtyard behind courtyard, a slow crane
//   s5-shops-corner    Friedrichstraße's ground-floor shops at dusk, a slow track along the west pavement
//   s5-facade-windows  a house front at dusk (the bel-etage house), a slow tilt up its lit floors
//   s5-skyline-dusk    the skyline from the south at dusk, a slow push
//   s5-roof-copper     low over the roofs north of Leipziger, toward the Gendarmenmarkt's domes, a lateral slide
//   s5-queue           the 07:15 bread queue at the side-street bakery (people-street's stop), a slow dolly
//   s5-queue-wide      the same street wider, craning up
//   s5-wilhelm         Wilhelmstraße's Foreign Office front by day, from across the street, drifting north (no crowd:
//                      the midday crowd's placement count changes mid-shot and raea refuses it; Kling's key adds people)
//   s5-ending-walk     a walk north up Wilhelmstraße's east pavement at dusk
import { AbsoluteFill, Composition, registerRoot, staticFile, useCurrentFrame } from "raea";
import { Camera3d, Canvas3D } from "raea/camera";
import { AmbientLight, DirectionalLight, Environment, Shadows } from "raea/light";
import { Model } from "raea/3d";
import { Fog } from "raea/pbr";
import { ToneMapping } from "raea/post_process";
import { Transform } from "raea/transform";
import { snapshot } from "raea/people";
import { CityShot, DAWN, DAY, DUSK, at35, ease, mix, type V3 } from "../components/rebuilt/city-shot";
import { City, TILES, toScene, type CityLook } from "../components/world/City";
import { WINTER_DUSK } from "../components/world/shaders";
import { Crowd } from "../components/people/Crowd";
import { cityAround, passersAround } from "../people/city";
import { Smoke } from "../components/world/smoke";
const FAR_SHADOWS = 900; // how far the sun's shadows reach on a far shot (m)
import { streamAt, type StreamTile } from "../world/stream";
import index from "../assets/graybox/friedrichstadt/index.json";

const FPS = 24;
const t01 = (f: number, n: number) => Math.min(1, Math.max(0, f / (n - 1)));
const Sky = ({ k = 1.36, file = "day" }: { k?: number; file?: string }) => <Environment src={staticFile(`env/ingame-${file}.hdr`)} intensity={k} />;

/** ids of everyone who comes within 40 m of a moving camera at any frame (left out of every frame) */
function nearIds(eyeAt: (f: number) => V3, frames: number, within: number, clock: string): string[] {
  const ids = new Set<string>(), [hh, mm] = clock.split(":").map(Number), m0 = hh * 60 + mm;
  for (let f = 0; f < frames; f += 2) {
    const eye = eyeAt(f), m = m0 + f / FPS / 60, close = (at: V3) => Math.hypot(at[0] - eye[0], at[2] - eye[2]) < 40;
    for (const x of snapshot(cityAround({ eye }), m, eye, { near: within, middle: within })) if (x.level === "near" && close(x.at as V3)) ids.add(x.id);
    for (const x of passersAround(eye, m, within, 1, 0.8)) if (close(x.at as V3)) ids.add(x.id);
  }
  return [...ids];
}
/** the queue keeps its standing people: only the passers-by (who walk) are kept 15 m clear */
function passerIds(eyeAt: (f: number) => V3, frames: number, within: number, clock: string): string[] {
  const ids = new Set<string>(), [hh, mm] = clock.split(":").map(Number), m0 = hh * 60 + mm;
  for (let f = 0; f < frames; f += 2) {
    const eye = eyeAt(f), m = m0 + f / FPS / 60;
    for (const x of passersAround(eye, m, within, 1, 0.8)) if (Math.hypot(x.at[0] - eye[0], x.at[2] - eye[2]) < 15) ids.add(x.id);
  }
  return [...ids];
}

// ---- cameras (eye and look at frame f of n) ----
type Path = (f: number, n: number) => { eye: V3; at: V3 };
// world-smoke's aerial, pushed slower and further: from 400 m over Kreuzberg to 300 m, toward the Gendarmenmarkt
const smokeP: Path = (f, n) => ({ eye: mix(at35(390930, 5818540, 400), at35(390885, 5818800, 300), ease(t01(f, n))), at: at35(390800, 5819290, 40) });
// graybox.tsx's aerial (from over Kreuzberg, north-east across the Friedrichstadt), sliding east and descending
const grayP: Path = (f, n) => { const k = ease(t01(f, n)); return { eye: toScene(389300 + 560 * k, 5817200 + 380 * k, 620 - 170 * k), at: toScene(391300 + 120 * k, 5819500, 34) }; };
// south of Leipziger: the blocks between Friedrichstraße and Charlottenstraße, looking down at 55 degrees, craning
const blocksP: Path = (f, n) => { const k = ease(t01(f, n)); return { eye: at35(390700 + 30 * k, 5818560 + 40 * k, 175 - 25 * k), at: at35(390830 + 20 * k, 5818760 + 30 * k, 0) }; };
// Friedrichstraße just south of the Leipziger crossing: the east pavement, tracking north, looking across at the west shops
const shopsP: Path = (f, n) => { const k = ease(t01(f, n)); return { eye: at35(390746, 5818955 + 7 * k, 1.62), at: at35(390716, 5818985 + 7 * k, 4.2) }; };
// Friedrichstraße's west front north of the Leipziger crossing (the centreline at x 390723 here, about 22 m wide): from
// the east pavement, tilting up the lit floors
const facadeP: Path = (f, n) => { const k = ease(t01(f, n)); return { eye: at35(390730, 5819146 + 3 * k, 1.62), at: at35(390712, 5819158 + 3 * k, 4 + 10 * k) }; };
// world-skyline's second view (from 1 km south, 120 m up), pushing in at dusk
const skyP: Path = (f, n) => { const k = ease(t01(f, n)); return { eye: toScene(391000, 5818000 + 160 * k, 120 - 15 * k), at: toScene(391100, 5819700, 45) }; };
// low over the roofs north of Leipziger, sliding west, the domes ahead
const roofP: Path = (f, n) => { const k = ease(t01(f, n)); return { eye: at35(391080 - 45 * k, 5819170 + 10 * k, 50), at: at35(390910 - 20 * k, 5819468, 32) }; };
// people-street's queue (its door at local [-415.73, 34.51, -142.75], the line running +z), dollying along the line
const DOOR: V3 = [-415.73, 34.51, -142.75];
const queueP: Path = (f, n) => { const k = ease(t01(f, n)); return { eye: [DOOR[0] - 10, DOOR[1] + 1.65, DOOR[2] + 30 - 1.6 * k], at: [DOOR[0] - 0.5, DOOR[1] + 1.3, DOOR[2] + 9 - 1 * k] }; };
const queueWideP: Path = (f, n) => { const k = ease(t01(f, n)); return { eye: [DOOR[0] - 13 - 2 * k, DOOR[1] + 3 + 2.5 * k, DOOR[2] + 34 + 3 * k], at: [DOOR[0] - 1, DOOR[1] + 1, DOOR[2] + 8] }; };
// the Foreign Office (Wilhelmstraße 75-76) from the east pavement opposite, drifting north
const wilhelmP: Path = (f, n) => { const k = ease(t01(f, n)); return { eye: toScene(390274 - 2 * k, 5819252 + 10 * k, 36.62), at: toScene(390238, 5819290 + 10 * k, 46) }; };
// walking north up Wilhelmstraße's east pavement past the Foreign Office at 1.3 m/s, looking up the street toward the Linden
const walkP: Path = (f, n) => { const k = t01(f, n); return { eye: toScene(390256 - 4 * k, 5819300 + 13 * k, 36.62), at: toScene(390186, 5819620, 44) }; };

const N = (s: number) => Math.round(s * FPS);
const NEAR = {
  shops: nearIds((f) => shopsP(f, N(6)).eye, N(6), 90, "16:30"),
  facade: nearIds((f) => facadeP(f, N(6)).eye, N(6), 90, "16:45"),
  queue: passerIds((f) => queueP(f, N(6)).eye, N(6), 90, "07:15"),
  queueWide: passerIds((f) => queueWideP(f, N(6)).eye, N(6), 120, "07:15"),
  walk: nearIds((f) => walkP(f, N(10)).eye, N(10), 90, "16:45"),
};

// ---- the graybox (graybox.tsx's lit tiles), on a moving camera ----
const GRAY = (index as { tiles: { tile: string }[] }).tiles;
function Graybox({ eye, at }: { eye: V3; at: V3 }) {
  const target: V3 = [at[0], 34, at[2]];
  const a = (205 * Math.PI) / 180, e = (13 * Math.PI) / 180;
  const sun: V3 = [target[0] + Math.sin(a) * Math.cos(e) * 2000, target[1] + Math.sin(e) * 2000, target[2] - Math.cos(a) * Math.cos(e) * 2000];
  return (
    <AbsoluteFill style={{ background: "#9aa3ab" }}>
      <Canvas3D>
        <Camera3d transform={Transform.fromXyz(...eye).lookingAt(at)} projection={{ Perspective: { fov: (38 * Math.PI) / 180, near: 2, far: 9000 } }} />
        <DirectionalLight transform={Transform.fromXyz(...sun).lookingAt(target)} illuminance={9000} color="#ffe2c4" shadow_maps_enabled />
        <AmbientLight brightness={180} color="#b8c4d6" />
        <Shadows distance={4000} firstCascade={400} mapSize={4096} />
        <Fog color="#9aa3ab" near={2400} far={12000} />
        <ToneMapping mode="agx" />
        {GRAY.map((t) => <Model key={t.tile} name={`tile-${t.tile}`} src={staticFile(`graybox/friedrichstadt/${t.tile}.glb`)} />)}
      </Canvas3D>
    </AbsoluteFill>
  );
}

// ---- the streamer's run (world-stream.tsx), without its map and numbers ----
const SDUSK: CityLook = { ...WINTER_DUSK, lit: 0.33, litShop: 0.7, lamp: 2.2, dark: 0.02, skyTop: [0.05, 0.07, 0.12], skyHor: [0.35, 0.3, 0.32], ice: 0.6, nits: 22, gasNits: 500, arcNits: 1600, lampsLit: 0.6, lights: 6 };
const SA = [390600, 5819012], SB = [391600, 5819078], SH = 35.0 + 25, SN = N(12);
const spath = (f: number): [number, number] => { const k = Math.min(1, Math.max(0, f / (SN - 1))); return [SA[0] + (SB[0] - SA[0]) * k, SA[1] + (SB[1] - SA[1]) * k]; };
function Stream({ f }: { f: number }) {
  const s = streamAt("world-stream", TILES as unknown as StreamTile[], spath, f);
  const [e, n] = spath(f);
  const eye = toScene(e, n, SH), at = toScene(e + 220 * 0.998, n + 220 * 0.066, 38);
  return (
    <AbsoluteFill style={{ background: "#3a3c48" }}>
      <Canvas3D>
        <Camera3d transform={Transform.fromXyz(...eye).lookingAt(at)} projection={{ Perspective: { fov: (55 * Math.PI) / 180, near: 0.3, far: 7000 } }} />
        <DirectionalLight transform={Transform.fromXyz(eye[0] - 1500, eye[1] + 70, eye[2] + 1000).lookingAt(eye)} illuminance={30} color="#ffb080" />
        <AmbientLight brightness={5} color="#6a7894" />
        <Fog color="#3a3c48" near={160} far={1400} />
        <ToneMapping mode="agx" exposure={6.6} />
        <City eye={eye} look={{ ...SDUSK, hour: 17 }} stream={s} />
      </Canvas3D>
    </AbsoluteFill>
  );
}

const SKYDUSK = { ...DUSK, fog: [700, 5200] as [number, number] };

type Shot = { id: string; seconds: number; draw: (f: number, n: number) => JSX.Element };
const SHOTS: Shot[] = [
  { id: "s5-smoke-aerial", seconds: 7, draw: (f, n) => { const p = smokeP(f, n); return <CityShot eye={p.eye} at={p.at} fov={24} sky={DAWN} bias={0.6}><Smoke t={f / FPS + 30} eye={p.eye} around={at35(390820, 5819060)} thick={1.6} swell={0.4} /></CityShot>; } },
  { id: "s5-graybox-aerial", seconds: 7, draw: (f, n) => { const p = grayP(f, n); return <Graybox eye={p.eye} at={p.at} />; } },
  // the run's middle 7 s of its 12 (frames 60-227): warm from frame 0 as world-stream replays it
  { id: "s5-stream-run", seconds: 7, draw: (f) => <Stream f={f + 60} /> },
  { id: "s5-blocks-aerial", seconds: 7, draw: (f, n) => { const p = blocksP(f, n); return <CityShot eye={p.eye} at={p.at} fov={45} sky={DAY} amb={0} bias={0.5} levels="detail" shadows={FAR_SHADOWS}><Sky /><Smoke t={f / FPS + 12} eye={p.eye} around={at35(390830, 5818760)} thick={1.2} /></CityShot>; } },
  { id: "s5-shops-corner", seconds: 6, draw: (f, n) => { const p = shopsP(f, n); return <CityShot eye={p.eye} at={p.at} fov={48} sky={DUSK}><Crowd eye={shopsP(0, N(6)).eye} clock="16:30" t={f / FPS} within={90} without={NEAR.shops} /></CityShot>; } },
  { id: "s5-facade-windows", seconds: 6, draw: (f, n) => { const p = facadeP(f, n); return <CityShot eye={p.eye} at={p.at} fov={55} sky={DUSK}><Crowd eye={facadeP(0, N(6)).eye} clock="16:45" t={f / FPS} within={90} without={NEAR.facade} /></CityShot>; } },
  { id: "s5-skyline-dusk", seconds: 7, draw: (f, n) => { const p = skyP(f, n); return <CityShot eye={p.eye} at={p.at} fov={50} sky={SKYDUSK} bias={0.6}><Smoke t={f / FPS + 50} eye={p.eye} around={toScene(391050, 5818900, 35)} thick={1.2} /></CityShot>; } },
  { id: "s5-roof-copper", seconds: 6, draw: (f, n) => { const p = roofP(f, n); return <CityShot eye={p.eye} at={p.at} fov={42} sky={DAY} amb={0} levels="detail" shadows={FAR_SHADOWS}><Sky /><Smoke t={f / FPS + 70} eye={p.eye} around={at35(391020, 5819260)} thick={1.3} swell={0.3} /></CityShot>; } },
  { id: "s5-queue", seconds: 6, draw: (f, n) => { const p = queueP(f, n); return <CityShot eye={p.eye} at={p.at} fov={50} sky={DAWN}><Crowd eye={queueP(0, N(6)).eye} clock="07:15" t={f / FPS} without={NEAR.queue} /></CityShot>; } },
  { id: "s5-queue-wide", seconds: 6, draw: (f, n) => { const p = queueWideP(f, n); return <CityShot eye={p.eye} at={p.at} fov={50} sky={DAWN}><Crowd eye={queueWideP(0, N(6)).eye} clock="07:15" t={f / FPS} without={NEAR.queueWide} /></CityShot>; } },
  { id: "s5-wilhelm", seconds: 6, draw: (f, n) => { const p = wilhelmP(f, n); return <CityShot eye={p.eye} at={p.at} fov={50} sky={DAY} amb={0} levels="detail" shadows={FAR_SHADOWS}><Sky /></CityShot>; } },
  { id: "s5-ending-walk", seconds: 10, draw: (f, n) => { const p = walkP(f, n); return <CityShot eye={p.eye} at={p.at} fov={50} sky={DUSK}><Crowd eye={walkP(0, N(10)).eye} clock="16:45" t={f / FPS} within={90} without={NEAR.walk} /></CityShot>; } },
];

function ShotView({ s }: { s: Shot }) {
  const f = useCurrentFrame();
  return s.draw(f, N(s.seconds));
}

registerRoot(() => (
  <>
    {SHOTS.map((s) => (
      <Composition key={s.id} id={s.id} width={1920} height={1080} fps={FPS} durationInFrames={N(s.seconds)} component={() => <ShotView s={s} />} />
    ))}
  </>
));

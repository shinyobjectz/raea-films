// Berlin, Winter 1917: Rebuilt from the Record, v2 (the director's notes on v1, 11-20: "seeing WAY more visuals of what that
// might look like", "good places to have more recreations in full high definition"). The recreations each how-step
// cuts to, full frame, one composition each (a render settles its 3D look on its first frame):
//   rb-plan    straight down over the 500 m the desk's aerial prints show (tile 3904_58188: E 390400-390900,
//              N 5818800-5819300), 500 m tall in frame like the print, then down and tilting east along Leipziger
//              Straße until the traced plan stands as a city (the plan beat, and the ending's match from 2026)
//   rb-shops   Leipziger Straße's north shopfronts, close, at a walker's pace (the address book's shops)
//   rb-loft    the porter's loft at Ritterstraße 120 from the plate's own place (z2_1917_MP_0075), pushing in slowly
import { AbsoluteFill, Composition, registerRoot, staticFile, useCurrentFrame } from "raea";
import { Canvas3D } from "raea/camera";
import { Environment } from "raea/light";
import { CityShot, DAY, at35, ease, mix, type V3 } from "../components/rebuilt/city-shot";
import { Crowd } from "../components/people/Crowd";
import { cityAround, passersAround } from "../people/city";
import { snapshot } from "raea/people";
import { Smoke } from "../components/world/smoke";
import { SetView } from "../interiors/draw/set";
import { PORTER_DAY } from "../interiors/sets/porter";
const FAR_SHADOWS = 900; // how far the sun's shadows reach on a far shot (m)

const FPS = 24;
type Line = { e: number; n: number; dx: number; dy: number };
const LEIP: Line = { e: 391196.8, n: 5819056.8, dx: 0.9978, dy: 0.066 };
const onL = (L: Line, s: number, off: number, up = 0): V3 => at35(L.e + L.dx * s - L.dy * off, L.n + L.dy * s + L.dx * off, up);
const Sky = () => <Environment src={staticFile("env/ingame-day.hdr")} intensity={1.36} />;
const t01 = (f: number, n: number) => Math.min(1, Math.max(0, f / (n - 1)));

/** the street crowd's stand-ins glide (the director, 11-20: people at a normal pace, on the ground), so a walking shot keeps
 *  only those who stay over `near` m from its camera the whole shot; anyone nearer at any frame is left out of every
 *  frame, so none pops out crossing a cut-off (as compositions/rebuilt-people.tsx does) */
function nearIds(eyeAt: (t: number) => V3, seconds: number, within: number, near = 40, busy = 1): string[] {
  const ids = new Set<string>(), m0 = 13 * 60;
  for (let f = 0; f <= seconds * FPS; f += 2) {
    const t = f / FPS, eye = eyeAt(t), m = m0 + t / 60, close = (at: V3) => Math.hypot(at[0] - eye[0], at[2] - eye[2]) < near;
    for (const x of snapshot(cityAround({ eye }), m, eye, { near: within, middle: within })) if (x.level === "near" && close(x.at as V3)) ids.add(x.id);
    for (const x of passersAround(eye, m, within, busy, 0.8)) if (close(x.at as V3)) ids.add(x.id);
  }
  return [...ids];
}
const walkEye = (t: number) => onL(LEIP, -175 + 1.35 * t, -8.5 + 0.025 * Math.sin(t * Math.PI * 1.85), 1.64);
const shopsEye = (t: number) => onL(LEIP, -118 + 1.3 * t, 5.5, 2.4);
const WALK_NEAR = nearIds(walkEye, 10.5, 90), SHOPS_NEAR = nearIds(shopsEye, 7, 70);

// the aerial tile's middle, and the height that puts its 500 m across the frame's 1080 rows at a 40 degree lens
const MID = { e: 390650, n: 5819050 }, FOV = 40, TOP = 250 / Math.tan(((FOV / 2) * Math.PI) / 180);

type Shot = { id: string; seconds: number; draw: (f: number, n: number, full?: boolean) => JSX.Element };
const SHOTS: Shot[] = [
  { id: "rb-plan", seconds: 8, draw: (f, n) => {
    // held straight down for the first 1.5 s (north up: the look leans 0.5 m north so the camera's up is north), then
    // down to 160 m and tilting to look east along Leipziger Straße; drifting the whole time
    const t = f / FPS, k = ease(Math.min(1, Math.max(0, (t - 1.5) / 6.4)));
    const top = at35(MID.e, MID.n - 6 * t, TOP - 4 * t), topAt = at35(MID.e, MID.n - 6 * t + 0.5, 0);
    const low = onL(LEIP, -560, -40, 160), lowAt = onL(LEIP, -200, 0, 0);
    const eye = mix(top, low, k), at = mix(topAt, lowAt, k);
    return <CityShot eye={eye} at={at} fov={FOV + (50 - FOV) * k} sky={DAY} amb={0} bias={0.5} levels="detail" shadows={FAR_SHADOWS}><Sky /><Smoke t={t + 12} eye={eye} around={at35(MID.e, MID.n)} thick={1.1} /></CityShot>;
  } },
  { id: "rb-walk", seconds: 10.5, draw: (f, _n, full) => {
    // a walker's eye on the south pavement, going east at 1.35 m/s, looking ahead along the street
    const s = -175 + 1.35 * (f / FPS), eye = walkEye(f / FPS), at = onL(LEIP, s + 40, -2.5, 2.2);
    return <CityShot eye={eye} at={at} fov={52} sky={DAY} amb={0} levels="detail" shadows={FAR_SHADOWS}><Sky /><Crowd eye={eye} clock="13:00" t={f / FPS} within={90} without={full ? [] : WALK_NEAR} /></CityShot>;
  } },
  { id: "rb-shops", seconds: 7, draw: (f, n, full) => {
    // 2.4 m up over the north kerb, looking ahead and across at the shopfronts 8-10 m away, moving east at 1.3 m/s
    const s = -118 + 1.3 * (f / FPS), eye = onL(LEIP, s, 5.5, 2.4), at = onL(LEIP, s + 11, 11.5, 2.6);
    return <CityShot eye={eye} at={at} fov={50} sky={DAY} amb={0} levels="detail" shadows={FAR_SHADOWS}><Sky /><Crowd eye={eye} clock="13:00" t={f / FPS} within={70} without={full ? [] : SHOPS_NEAR} /></CityShot>;
  } },
  { id: "rb-loft", seconds: 7, draw: (f, n) => {
    // from the plate's place (porter-day's stube camera), pushing in 0.6 m toward the window wall and drifting left
    const base = PORTER_DAY.cams.find((c) => c.id === "stube")!, k = ease(t01(f, n));
    const eye: V3 = [base.eye[0] - 0.35 * k, base.eye[1] - 0.04 * k, base.eye[2] - 0.6 * k];
    const at: V3 = [base.at[0] - 0.25 * k, base.at[1], base.at[2]];
    return (
      <AbsoluteFill style={{ background: "#050506" }}>
        <Canvas3D>
          <SetView set={PORTER_DAY} cam={{ ...base, eye, at }} />
        </Canvas3D>
      </AbsoluteFill>
    );
  } },
];

registerRoot(() => (
  <>
    {SHOTS.map((s) => (
      <Composition key={s.id} id={s.id} width={1920} height={1080} fps={FPS} durationInFrames={Math.round(s.seconds * FPS)} component={() => {
        const f = useCurrentFrame();
        return s.draw(f, Math.round(s.seconds * FPS));
      }} />
    ))}
    {/* every passer-by kept, for v3's depth passes only: Wan VACE turns their silhouettes into people walking */}
    {SHOTS.map((s) => (
      <Composition key={`${s.id}-crowd`} id={`${s.id}-crowd`} width={1920} height={1080} fps={FPS} durationInFrames={Math.round(s.seconds * FPS)} component={() => {
        const f = useCurrentFrame();
        return s.draw(f, Math.round(s.seconds * FPS), true);
      }} />
    ))}
  </>
));

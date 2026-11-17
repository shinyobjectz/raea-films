// The tall film's two kinds of shot (thermal/shots.tsx's, for 1080x1920): a line of type broken into lines that fill
// the safe box's width, and a stock clip seen through a 9:16 window of it.
import { staticFile, useCurrentFrame } from "raea";
import { ToneMapping } from "raea/3d";
import { Camera3d, Matchmove, matchmoveView, type MatchmoveSolve } from "raea/camera";
import { Mesh3d } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Text3D } from "raea/text";
import { Transform } from "raea/transform";
import { layersFor } from "../depth";
import { Heat, type HeatPalette } from "../heat";
import { heat } from "../temp";
import { CLIPS, type TraceAt } from "../shots";
import { H, MID, TYPE, W, camXY, kAt } from "./frame";

export const FPS = 30;
const FONTS = `@font-face { font-family: 'IBM Plex Mono'; font-weight: 500; src: url(${staticFile("fonts/IBMPlexMono-Medium.ttf")}); }`;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const outCubic = (x: number) => 1 - (1 - clamp01(x)) ** 3;
const inOut = (x: number) => { const k = clamp01(x); return k * k * (3 - 2 * k); };
/** the type's glow against the frame: the tall frame's height is 1.78 of the wide one's, so the same reach in screen
 * heights would be 1.78 times as wide around type of about the same size */
const TYPE_GLOW = 0.6;

/** TypeShot on the tall frame: the line broken into `lines` (centred, stacked), the heat front sweeping them as one,
 * the camera easing in on the safe box's middle; the caption (lines by "\n") types on under them at 60 px */
export function TypeShotT({ lines, id, size = 0.6, span = 105, caption }: { lines: string[]; id: string; size?: number; span?: number; caption?: string }) {
  const f = useCurrentFrame();
  const REVEAL = 28, OUT = 20;
  const r = outCubic(f / REVEAL);
  const front = 0.1 + 0.95 * r;
  const flare = 3.2 * (1 - inOut((f - REVEAL * 0.75) / 12));
  const linger = 1.3 - 0.75 * inOut((f - REVEAL) / 40) + 0.12 * Math.sin(f * 0.13);
  const cool = 1 - inOut((f - (span - OUT)) / OUT) * 1.05 + 0.03 * Math.sin(f * 0.18);
  const z = 9 - 0.55 * inOut(f / span);
  const [cx, cy] = camXY(z);
  const gap = size * 1.3;
  const lift = caption ? 0.3 : 0;
  const n = lines.length;
  const yOf = (i: number) => lift + ((n - 1) / 2 - i) * gap;
  // the caption under the last line, from that line's place on the frame
  const capTop = MID.y - (yOf(n - 1) - size * 0.55) * kAt(z) + 48;
  const shown = caption ? Math.floor(caption.length * clamp01((f - REVEAL + 4) / 22)) : 0;
  const capK = clamp01((f - REVEAL + 4) / 6) * (1 - inOut((f - (span - OUT)) / (OUT * 0.6)));
  return (
    <>
      <Camera3d transform={Transform.fromXyz(cx, cy + 0.02 * Math.sin(f * 0.05), z).lookingAt([cx, cy, 0])} />
      {lines.map((l, i) => (
        <Mesh3d key={i} name={`line-${id}-${i}`} transform={Transform.fromXyz(0, yOf(i), 0)}>
          <Text3D size={size} depth={0.02} weight={700}>{l}</Text3D>
          <StandardMaterial base_color={heat(1)} unlit />
        </Mesh3d>
      ))}
      <Heat frame={f} recipe={{ lum: 1, gamma: 1 }} floor={0.02} gain={1.05} haze={1} front={front} soft={0.025} flare={flare} cool={Math.max(0, cool)} linger={linger} type glow={TYPE_GLOW} />
      <ToneMapping mode="none" />
      {caption ? (
        <div style={{ position: "absolute", left: MID.x - 480, top: capTop, width: 960, textAlign: "center", fontFamily: "IBM Plex Mono", fontWeight: 500, fontSize: TYPE.label, lineHeight: 1.2, letterSpacing: TYPE.track, color: "rgba(255,255,255,0.9)", opacity: capK, whiteSpace: "pre" }}>
          <style>{FONTS}</style>
          {caption.slice(0, shown).toUpperCase()}
          <span style={{ opacity: shown < caption.length && Math.floor(f / 4) % 2 === 0 ? 1 : 0 }}>▍</span>
        </div>
      ) : null}
    </>
  );
}

/** where the window is on frame f: the clip's u and v at its middle, and how far in (1: the clip's full height) */
export type View = (f: number) => [number, number, number];
/** a clip point (u across, v down, 0..1 of the clip) on the tall frame, in pixels */
export type ToFrame = (u: number, v: number) => { x: number; y: number };
const SRC = 16 / 9;

const FOOTAGE = { width: 1920, height: 1080 };
/** the 9:16 window on frame f: its left, top, width and height in the clip (0..1), kept inside the clip, exactly as
 * <Matchmove> places it (raea's matchmoveView) */
export function windowAt(view: View, f: number): [number, number, number, number] {
  const [cu, cv, zoom] = view(f);
  const v = matchmoveView(FOOTAGE, { width: W, height: H }, [cu, cv], zoom);
  return [v.x / v.width, v.y / v.height, W / v.width, H / v.height];
}

/** a camera that holds still: the clip as shot, no solve needed (<Matchmove> draws the footage and frames the window) */
const still = (from: number, seconds: number): MatchmoveSolve => ({
  mode: "static", ...FOOTAGE, fps: FPS, from, seconds, frames: 1, fov: 50, focal: FOOTAGE.height / 2 / Math.tan((25 * Math.PI) / 180), k1: 0,
  registered: 1, error: null, camera_height: 1.6, cameras: [{ t: from, position: [0, 0, 0], quaternion: [0, 0, 0, 1], solved: true }],
  points: [], ground: { y: 0, normal: [0, 1, 0] }, cut: null, notes: [],
});

/** ClipShot on the tall frame: the clip through the heat pass as the wide film has it, seen through a 9:16 window
 * that `view` places (and may move: a pan from one subject to the next); the trace reads the clip's depth where the
 * window is. `marks` draws over it, given where a clip point lands on the frame this frame. */
export function ClipShotT({ name, at, palette, trace, span = 6, view, marks }: { name: keyof typeof CLIPS | string; at?: number; palette?: HeatPalette; trace?: TraceAt; span?: number; view: View; marks?: (to: ToFrame) => React.ReactNode }) {
  const f = useCurrentFrame();
  const c = CLIPS[name];
  const from = at ?? c.at;
  const t = from + f / FPS;
  const d = trace ? layersFor(name, from, span) : null;
  const [cu, cv, zoom] = view(f);
  const [x0, y0, ww, wh] = windowAt(view, f);
  const to: ToFrame = (u, v) => ({ x: ((u - x0) / ww) * W, y: ((v - y0) / wh) * H });
  return (
    <>
      <Matchmove src={staticFile(`thermal/stock/${c.slug}.mp4`)} from={from} solve={still(from, span)} crop={[cu, cv]} zoom={zoom} />
      <Heat frame={f} recipe={c.recipe} palette={palette ?? c.palette} floor={c.floor} gain={c.gain} dots={c.dots} win={[x0, y0, ww, wh]} srcAspect={SRC} trace={d && trace ? { layers: d.layers, frame: d.index(t), inv: d.inv, ...trace(f) } : undefined} />
      {marks ? marks(to) : null}
    </>
  );
}

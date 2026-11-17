// The tutorial's previz (tutorial.script.ts, timed by components/tut/beats.json from the Fish read): every beat as a
// shot, on the real set, with the read under it. A beat is one or more parts, split evenly across its seconds: the glass
// (the camera framing the screen, the take's captured states shown in turn) or the swamp (a camera move and Goose posed
// from the music video's "show" clip, placed and turned by hand). A slate names the beat and what it's meant to show; a
// beat whose states the take hasn't captured yet says so on dark glass. Blocking only: no gags, no stickers, no foley.
import { AbsoluteFill, Audio, Composition, Sequence, registerRoot, staticFile, useCurrentFrame } from "raea";
import { FramePass, Model } from "raea/3d";
import { Camera3d } from "raea/camera";
import { Transform } from "raea/transform";
import { SUN, TutWorld } from "../components/tut/world";
import { Critters } from "./ruins";
import { STICKER, stickerUniforms } from "./sticker";
import { STAGE, type V3 } from "./plan";
import { height } from "./set";
import { TutMachine, GLASS, TMON } from "../components/tut/machine";
import { DOORS, Doors, TOWARD, door } from "../components/tut/doors";
import beats from "../components/tut/beats.json";

const FPS = 30;
const fr = (s: number) => Math.round(s * FPS);
type Beat = (typeof beats.beats)[number];

type Goose = { from: V3; to?: V3; yaw: number; clip: number; planks?: boolean; lift?: number };
type Swamp = { eye: V3 | [V3, V3]; at: V3 | [V3, V3]; fov?: number; goose?: Goose; screen?: string | null };
type Part = { glass: string[] } | Swamp | { black: true };

// where things stand: the stage in front of the monitor, Goose on the keyboard, the doors' middle
const g = (x: number, z: number): V3 => [x, height(x, z), z];
const ON_KEYS: V3 = [-0.4, 0.62, 0.4];
const MID: V3 = (() => { const s = DOORS.reduce((a, d) => [a[0] + d.at[0], a[1] + d.at[1], a[2] + d.at[2]], [0, 0, 0]); return [s[0] / 3, s[1] / 3 + 1.4, s[2] / 3] as V3; })();
const DOORS_EYE: V3 = [MID[0] + TOWARD[0] * 11, 1.8, MID[2] + TOWARD[1] * 11];
const GLASS_D = (TMON.screen[0] / 0.85) * (9 / 16) / (2 * Math.tan((15 * Math.PI) / 180));
const FACE_LENS = 0, FACE_GLASS = Math.PI;
// the show clip's poses (seconds into the music video): standing, waddling, wings out, wings up, stomping keys, dancing
const POSE = { stand: 8, waddle: 30.5, wingsOut: 39.31, wingsUp: 26.5, stomp: 56.5, dance: 84 };
const FIN = "tutorial-app/prev/finished-058.jpg";
const S = (n: string) => `tutorial-app/states/${n}.png`;

// in front of the giant keyboard (it runs z -0.9 to 1.7), so the keys don't fill the foreground
const medium = (z = -3.5): Swamp => ({ eye: [0.5, 1.15, z + 2.6], at: [0, 0.9, z], fov: 40, goose: { from: g(0, z), yaw: FACE_LENS, clip: POSE.stand } });
const through = (name: "publish" | "connections" | "settings", screen: string | null): Swamp => {
  const d = door(name); return { eye: DOORS_EYE, at: MID, fov: 46, screen, goose: { from: d.front, to: d.back, yaw: d.yaw + Math.PI, clip: POSE.waddle } };
};

const SHOTS: Record<string, Part[]> = {
  "00.01": [{ eye: [[5.5, 0.5, 12], [4.6, 0.6, 2.5]], at: [[0, 1.6, -6], [0, 2.2, -8]], fov: 42, screen: null, goose: { from: g(0, -3.5), yaw: FACE_LENS, clip: POSE.stand } }],
  "00.02": [{ ...medium(), screen: S("010-everything"), goose: { from: g(0, -3.5), yaw: FACE_LENS, clip: POSE.wingsOut } }],
  "00.03": [{ ...medium(), screen: S("010-everything"), goose: { from: g(0, -3.5), to: g(-4, -3), yaw: -Math.PI / 2, clip: POSE.waddle } }],
  "00.04": [{ eye: [-9, 0.4, 1.5], at: [-4.5, 1.2, -3.6], fov: 36, screen: S("010-everything"), goose: { from: g(-4.5, -3.6), yaw: 0.9, clip: POSE.stand } }],
  "00.05": [{ eye: [[-4, 1.1, -0.6], [0.4, 1.1, -0.9]], at: [[-4, 1.0, -3], [0, 1.0, -3.5]], fov: 40, screen: S("010-everything"), goose: { from: g(-4, -3), to: g(0, -3.5), yaw: Math.PI / 2, clip: POSE.waddle } }],
  "01.01": [{ eye: [1.1, 1.9, -1.2], at: GLASS, fov: 40, screen: S("010-everything"), goose: { from: g(0, -4), yaw: FACE_GLASS, clip: POSE.stand } }],
  "01.02": [{ glass: ["011-look-up-left", "012-look-down", "013-hover-night-shift", "014-hover-bakery"] }],
  "01.03": [{ glass: ["015-hover-duck", "016-duck-from-right"] }, { ...medium(), screen: S("016-duck-from-right") }],
  "01.04": [{ glass: ["017-project-open", "018-chat-box"] }],
  "01.05": [{ glass: ["019-panel-feed", "020-panel-hidden", "021-panel-back"] }],
  "02.01": [{ eye: DOORS_EYE, at: MID, fov: 50, screen: S("030-rail-foot"), goose: { from: [MID[0] + TOWARD[0] * 6 - 3, 0, MID[2] + TOWARD[1] * 6], to: [MID[0] + TOWARD[0] * 3, 0, MID[2] + TOWARD[1] * 3], yaw: Math.atan2(-TOWARD[0], -TOWARD[1]), clip: POSE.waddle } },
    { glass: ["030-rail-foot", "031-foot-publish", "032-foot-open-plugins", "033-foot-open-settings", "034-search-door"] }],
  "02.02": [through("settings", S("035-wrong-door-settings")), { glass: ["035-wrong-door-settings"] }],
  "02.03": [{ glass: ["036-connections", "037-connections-agents", "038-claude-row", "039-claude-connect-hover", "040-claude-connect-pressed", "041-chatgpt-row", "042-claude-after-connect"] }],
  "03.01": [{ glass: ["050-plus-hover", "051-new-project", "052-name-04", "052-name-08", "052-name-11", "053-icon-hover", "054-icon-open", "055-search-goose", "056-goose-hover", "057-goose-picked", "058-make-hover", "059-project-made"] }],
  "03.02": [{ glass: ["060-goose-tile"] }, { eye: [3.6, 1.0, -3.5], at: [0, 1.0, -3.5], fov: 40, screen: S("060-goose-tile"), goose: { from: g(0, -3.5), yaw: Math.PI / 2, clip: POSE.stand } }],
  "03.03": [{ eye: [-2.2, 2.6, 4.6], at: [-0.6, 0.6, 0.2], fov: 38, screen: S("061-pick-ai"), goose: { from: ON_KEYS, to: [0.8, 0.62, 0.3], yaw: FACE_GLASS, clip: POSE.stomp } },
    { glass: ["061-pick-ai", "062-ai-picked", "063-prompt-16", "063-prompt-32", "063-prompt-48", "063-prompt-62", "064-send-hover"] }],
  "03.04": [{ glass: ["065-answer-running", "066-stop-hover"] }],
  "03.05": [{ glass: ["067-slash", "068-goal-honk", "069-goal-deleting", "070-goal-gone", "071-goal-15", "071-goal-29", "072-goal-set"] }],
  "04.01": [{ glass: ["080-stills-landed", "082-cut-landed", "083-v2-landed", "084-reply", "085-goal-working", "086-goal-met"] }],
  "04.02": [{ glass: ["087-cut-hover", "088-cut-opening", "089-cut-full"] }],
  "04.03": [{ eye: [7, 0.8, -4.2], at: [0, 1.8, -7], fov: 44, screen: S("089-cut-full"), goose: { from: g(0, -4.4), to: g(0, -3.4), yaw: FACE_GLASS, clip: POSE.waddle } }],
  "04.04": [{ glass: ["090-esc-back"] }],
  "05.01": [{ glass: ["100-v2-at-058"] }, { eye: [-3.2, 1.25, 7.4], at: [-4.0, 0.95, 3.6], fov: 38, screen: S("100-v2-at-058"), goose: { from: g(-4, 3.6), yaw: 0.2, clip: POSE.wingsOut, planks: true } }],
  "05.02": [{ glass: ["101-comment-hover", "102-comment-on", "103-over-wing", "104-pin"] }],
  "05.03": [{ glass: [] }],
  "05.04": [{ glass: [] }],
  "05.05": [{ glass: [] }, { eye: [0.5, 0.25, 0.6], at: [0, 2.6, -4], fov: 44, screen: null, goose: { from: g(0, -3.5), yaw: FACE_LENS, clip: POSE.wingsUp, lift: 0.7 } }],
  "05.06": [medium()],
  "06.01": [{ glass: [] }],
  "06.02": [{ glass: [] }],
  "06.03": [{ eye: [1.4, 1.3, 2.2], at: [0.3, 0.45, 0.4], fov: 34, screen: null, goose: { from: ON_KEYS, yaw: FACE_GLASS, clip: POSE.stomp } }],
  "06.04": [{ glass: [] }],
  "07.01": [{ glass: [] }], "07.02": [{ glass: [] }], "07.03": [{ glass: [] }], "07.04": [{ glass: [] }],
  "08.01": [{ glass: [] }],
  "08.02": [{ eye: [0.8, 0.5, -1.4], at: [0, 2.4, -4], fov: 44, screen: null, goose: { from: g(0, -4), yaw: FACE_GLASS, clip: POSE.wingsUp } }, { glass: [] }],
  "08.03": [{ glass: [] }], "08.04": [{ glass: [] }],
  "09.01": [{ glass: [] }], "09.02": [{ glass: [] }],
  "09.03": [through("publish", null), { glass: [] }],
  "09.04": [{ eye: [1.5, 0.5, -1.8], at: [0, 0.6, -5], fov: 40, screen: null }],
  "10.01": [through("settings", null), { glass: [] }],
  "10.02": [{ eye: [0, 2.6, -10.2], at: [0, 1.2, -3.5], fov: 50, screen: null, goose: { from: g(0, -4.6), yaw: FACE_GLASS, clip: POSE.stomp } }],
  "11.01": [{ eye: [[2.6, 0.5, 0.2], [-2.6, 0.5, 0.2]], at: [0, 2.6, -8], fov: 44, screen: FIN, goose: { from: g(0, -3.5), yaw: FACE_GLASS, clip: POSE.dance } }],
  "11.02": [{ ...medium(), screen: FIN, goose: { from: g(0, -3.5), yaw: FACE_LENS, clip: POSE.dance + 2 } }],
  "11.03": [{ eye: [[0.4, 1.2, -0.7], [0.2, 1.3, -2.1]], at: [0, 1.5, -3.5], fov: 40, screen: FIN, goose: { from: g(0, -3.5), yaw: FACE_LENS, clip: POSE.dance } }],
  "11.04": [{ eye: [-1.6, 1.5, 2.6], at: [-0.3, 0.6, 0.4], fov: 34, screen: FIN, goose: { from: ON_KEYS, yaw: FACE_GLASS, clip: POSE.stomp } }],
  "11.05": [{ black: true }],
};

const lerp = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const ease = (k: number) => k * k * (3 - 2 * k);
const pair = (v: V3 | [V3, V3], k: number) => (Array.isArray(v[0]) ? lerp((v as [V3, V3])[0], (v as [V3, V3])[1], ease(k)) : (v as V3));

function beatAt(t: number): { b: Beat; part: Part; k: number; local: number } {
  const bs = beats.beats;
  const b = bs.find((x) => t >= x.start && t < x.start + x.seconds) ?? bs[bs.length - 1];
  const parts = SHOTS[b.id] ?? [{ glass: [] }];
  const u = Math.min(0.9999, Math.max(0, (t - b.start) / b.seconds)) * parts.length, i = Math.floor(u);
  return { b, part: parts[i], k: u - i, local: (u - i) * (b.seconds / parts.length) };
}

function Shot() {
  const frame = useCurrentFrame(), t = frame / FPS;
  const { b, part, k, local } = beatAt(t);
  const line = b.lines.find((l) => t >= b.start + l.at && t < b.start + l.at + l.seconds);
  let view: JSX.Element, screen: string | null = null, missing = false;
  if ("black" in part) {
    view = <AbsoluteFill style={{ background: "#000", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 18 }}>
      <img src={staticFile("logo/raea-lockup.png")} style={{ width: 300 }} />
      <div style={{ color: "#fff", font: "500 22px/1 Inter, sans-serif" }}>raea.io/docs</div>
    </AbsoluteFill>;
  } else {
    let eye: V3, at: V3, fov = 30, goose: Goose | undefined;
    if ("glass" in part) {
      eye = [GLASS[0], GLASS[1], GLASS[2] + GLASS_D]; at = GLASS;
      if (part.glass.length) screen = S(part.glass[Math.min(part.glass.length - 1, Math.floor(k * part.glass.length))]);
      else missing = true;
    } else { eye = pair(part.eye, k); at = pair(part.at, k); fov = part.fov ?? 40; goose = part.goose; screen = part.screen ?? null; }
    const gp = goose && (goose.to ? lerp(goose.from, goose.to, ease(k)) : goose.from);
    const lift = goose?.lift ? Math.sin(Math.PI * k) * goose.lift : 0;
    view = <>
      <Camera3d transform={Transform.fromXyz(...eye).lookingAt(at, [0, 1, 0])} projection={{ Perspective: { fov: (fov * Math.PI) / 180, far: 900 } }} />
      <TutWorld t={t} wind={0.1} rings={[]} motes={0} moteCount={"glass" in part ? 0 : 160} />
      <TutMachine screen={screen} t={t} />
      <Doors frame={frame} />
      <Critters t={t} b={0} look={STAGE} hop={0.2} jump={0} />
      <FramePass wesl={STICKER} prepass={{ depth: true, normal: true }} uniforms={stickerUniforms(SUN)} />
      {goose && gp && <Model name="goose" pass="hero" flat src={staticFile(goose.planks ? "glb/goose-planks.glb" : "glb/goose.glb")} position={[gp[0], gp[1] + lift, gp[2]]} rotation={[0, goose.yaw, 0]} scale={1.7} graph={{ blend: [{ clip: "show", time: goose.clip + local, weight: 1 }] }} />}
    </>;
  }
  const say = { position: "absolute" as const, left: 60, right: 60, bottom: 26, textAlign: "center" as const, color: "#fff", font: "600 19px/1.3 Inter, sans-serif", textShadow: "0 2px 3px #000c" };
  return (
    <AbsoluteFill style={{ background: "#3896d4" }}>
      {view}
      {missing && <div style={{ position: "absolute", left: 150, right: 150, top: 175, color: "#e8e2cf", font: "600 15px/1.35 Inter, sans-serif", textAlign: "center" }}>STATE TO CAPTURE<br /><span style={{ fontWeight: 400 }}>{b.onScreen.slice(0, 220)}</span></div>}
      <div style={{ position: "absolute", left: 12, top: 10, padding: "4px 8px", background: "#000a", color: "#fff", font: "600 13px/1.3 Inter, sans-serif", borderRadius: 4, maxWidth: 560 }}>
        {b.id} · {b.heading}<br /><span style={{ fontWeight: 400, opacity: 0.85 }}>{(b.camera ?? "").slice(0, 110)}</span>
      </div>
      {line && <div style={say}>{line.says}</div>}
    </AbsoluteFill>
  );
}

function Prev() {
  return (
    <>
      <Shot />
      {beats.beats.flatMap((b) => b.lines.map((l, i) => (
        <Sequence key={`${b.id}-${i}`} name={`vo-${b.id}-${i}`} from={fr(b.start + l.at)} durationInFrames={fr(l.seconds) + 3} layout="none">
          <Audio src={staticFile(l.file)} />
        </Sequence>
      )))}
    </>
  );
}

registerRoot(() => <Composition id="tutprev" component={Prev} width={960} height={540} fps={FPS} durationInFrames={fr(beats.seconds)} />);

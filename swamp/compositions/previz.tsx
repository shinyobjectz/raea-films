// Previz for the 0.1.5 hype film (hype.script.ts): grey boxes, placeholder screen, real blocking, camera and timing.
// It is the plan, not the piece: no look, no real props, no sound. Colours carry meaning only:
// cool white = the app's light, beige = the robot, amber = the thing made.
import { AbsoluteFill, Composition, Easing, interpolate, registerRoot, useCurrentFrame } from "raea";
import { Entity, Screen } from "raea/3d";
import { Camera3d } from "raea/camera";
import { AmbientLight, DirectionalLight, PointLight } from "raea/light";
import { Cone, Cuboid, Cylinder, Mesh3d, Sphere } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Quat, Transform } from "raea/transform";

type V3 = [number, number, number];
const FPS = 30;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.inOut(Easing.cubic);
const lerp3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
// a seeded 0..1, fixed per index
const rnd = (i: number, k = 0) => {
  const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// ---- the film's beats (frames), from hype.script.ts ----
const BEATS = [
  { from: 0, name: "1 The wake", text: "Low through reeds. Dead monitor. Robot darts across." },
  { from: 90, name: "1 The wake", text: "Keyboard under grass and rubble. Robot bumps a key." },
  { from: 165, name: "1 The wake", text: "Monitor wakes. Light floods the mist." },
  { from: 270, name: "2 One line", text: "Robot taps New project in the rail." },
  { from: 390, name: "2 One line", text: "Keys press themselves; the line types." },
  { from: 600, name: "2 One line", text: "Robot slams Return." },
  { from: 645, name: "3 It gets made", text: "Tasks tick. Sun breaks through. Arc round the screen." },
  { from: 825, name: "3 It gets made", text: "The item lands in the feed. Robot dives." },
  { from: 915, name: "4 It plays", text: "Click. It plays full size. The swamp's fireflies answer." },
  { from: 1125, name: "4 It plays", text: "Robot sits on the bezel. End line." },
];
const END = 1320;

// ---- the monitor ----
const SW = 4.0, SH = 2.25; // the glass, metres
const MON: V3 = [0, 1.45, 0];
// a point on the glass (u, v from the top left, 0..1) in the world, `out` metres in front
const onScreen = (u: number, v: number, out = 0.3): V3 => [MON[0] + (u - 0.5) * SW, MON[1] + (0.5 - v) * SH, 0.2 + out];

// ---- the keyboard, on the bank in front ----
const KB: V3 = [0.25, 0.2, 3.3];
const COLS = 14, ROWS = 4, KEY = 0.11;
const keyAt = (c: number, r: number): V3 => [KB[0] + (c - (COLS - 1) / 2) * KEY * 1.12, KB[1] + 0.05, KB[2] + (r - (ROWS - 1) / 2) * KEY * 1.12];
const RETURN_KEY = keyAt(13, 2);
const WAKE_KEY = keyAt(6, 1);

// ---- typing ----
const LINE = "a paper lantern drifting on dark water at dusk. fireflies wake around it.";
const TYPE_FROM = 400, TYPE_TO = 592;
const typed = (f: number) => Math.round(interpolate(f, [TYPE_FROM, TYPE_TO], [0, LINE.length], clamp));
// which key a character presses (a placeholder layout: seeded)
const charKey = (i: number): [number, number] => [Math.floor(rnd(i, 1) * 13), Math.floor(rnd(i, 2) * 4)];

// ---- cameras: one shot a row, each already moving at its start and still moving at its end ----
type Shot = { from: number; to: number; p0: V3; p1: V3; l0: V3; l1: V3; fov?: number };
const SHOTS: Shot[] = [
  { from: 0, to: 90, p0: [-3.4, 0.4, 9.2], p1: [-2.7, 0.5, 7.4], l0: [0.6, 1.3, 0], l1: [0.5, 1.4, 0], fov: 42 },
  { from: 90, to: 165, p0: [-0.7, 0.95, 4.5], p1: [0.5, 0.85, 4.35], l0: [-0.2, 0.2, 3.3], l1: [0.4, 0.2, 3.3], fov: 38 },
  { from: 165, to: 270, p0: [0.5, 0.55, 5.3], p1: [0.2, 1.25, 6.5], l0: [0.1, 1.0, 0], l1: [0, 1.5, 0], fov: 44 },
  { from: 270, to: 390, p0: [-1.0, 1.75, 4.1], p1: [-1.25, 1.7, 3.5], l0: [-1.2, 1.7, 0], l1: [-1.3, 1.65, 0], fov: 36 },
  // typing: screen, keys, screen, keys, screen: each shorter
  { from: 390, to: 462, p0: [-0.9, 0.85, 3.3], p1: [-0.75, 0.8, 2.9], l0: [-0.75, 0.62, 0], l1: [-0.65, 0.6, 0], fov: 34 },
  { from: 462, to: 510, p0: [-0.5, 0.6, 4.25], p1: [-0.1, 0.55, 4.15], l0: [0.0, 0.22, 3.3], l1: [0.3, 0.22, 3.3], fov: 34 },
  { from: 510, to: 552, p0: [-0.6, 0.8, 2.9], p1: [-0.5, 0.76, 2.65], l0: [-0.6, 0.6, 0], l1: [-0.55, 0.58, 0], fov: 34 },
  { from: 552, to: 578, p0: [0.9, 0.5, 4.1], p1: [0.65, 0.48, 4.05], l0: [0.4, 0.22, 3.3], l1: [0.25, 0.22, 3.3], fov: 32 },
  { from: 578, to: 600, p0: [-0.45, 0.76, 2.65], p1: [-0.4, 0.74, 2.5], l0: [-0.55, 0.58, 0], l1: [-0.5, 0.57, 0], fov: 34 },
  { from: 600, to: 645, p0: [1.7, 0.5, 3.95], p1: [1.45, 0.42, 3.85], l0: [RETURN_KEY[0], 0.25, RETURN_KEY[2]], l1: [RETURN_KEY[0], 0.22, RETURN_KEY[2]], fov: 30 },
  { from: 645, to: 825, p0: [-3.6, 1.2, 4.6], p1: [-0.6, 1.5, 5.6], l0: [-0.3, 1.5, 0], l1: [0.1, 1.5, 0], fov: 40 },
  { from: 825, to: 915, p0: [1.3, 1.6, 4.4], p1: [1.15, 1.6, 3.3], l0: [1.1, 1.6, 0], l1: [1.15, 1.6, 0], fov: 36 },
  { from: 915, to: 1125, p0: [0.1, 1.5, 3.2], p1: [-0.5, 1.9, 7.0], l0: [0, 1.5, 0], l1: [-0.3, 1.75, 0], fov: 42 },
  { from: 1125, to: END, p0: [-0.5, 1.9, 7.0], p1: [-0.75, 1.98, 7.5], l0: [-0.3, 1.75, 0], l1: [-0.4, 1.8, 0], fov: 42 },
];
const shotAt = (f: number) => SHOTS.find((s) => f >= s.from && f < s.to) ?? SHOTS[SHOTS.length - 1];

// ---- the robot's path: [frame, place]; it eases between them and bobs ----
const NEW_PROJECT = onScreen(0.034, 0.378);
const CHAT_BOX = onScreen(0.61, 0.93);
const CARD = onScreen(0.8, 0.3);
const PATH: [number, V3][] = [
  [0, [-5.2, 0.7, 6.2]],
  [80, [0.2, 0.55, 4.6]],
  [100, [-0.7, 0.75, 3.5]],
  [150, [WAKE_KEY[0], 0.36, WAKE_KEY[2]]],
  [162, [WAKE_KEY[0], 0.27, WAKE_KEY[2]]], // the bump
  [175, [WAKE_KEY[0] + 0.1, 0.5, WAKE_KEY[2]]],
  [262, onScreen(0.3, 0.45, 0.6)],
  [316, NEW_PROJECT],
  [322, onScreen(0.034, 0.378, 0.12)], // tap
  [330, NEW_PROJECT],
  [388, CHAT_BOX],
  [596, onScreen(0.61, 0.93)],
  [612, [RETURN_KEY[0] + 0.15, 0.85, RETURN_KEY[2] + 0.1]], // wind up
  [622, [RETURN_KEY[0], 0.27, RETURN_KEY[2]]], // the hit
  [640, [RETURN_KEY[0] + 0.1, 0.55, RETURN_KEY[2]]],
  [700, onScreen(0.42, 0.5, 0.5)],
  [850, onScreen(0.55, 0.4, 0.5)],
  [880, onScreen(0.62, 0.3, 0.7)], // spin here
  [912, CARD],
  [916, onScreen(0.8, 0.3, 0.12)], // the click
  [940, onScreen(0.9, 0.2, 0.5)],
  [1120, onScreen(0.86, 0.1, 0.6)],
  [1175, [1.3, MON[1] + SH / 2 + 0.36, 0.05]], // sits on the bezel's top edge
  [END, [1.3, MON[1] + SH / 2 + 0.36, 0.05]],
];
const robotAt = (f: number): V3 => {
  let i = 0;
  while (i < PATH.length - 2 && f >= PATH[i + 1][0]) i++;
  const [f0, a] = PATH[i], [f1, b] = PATH[i + 1];
  const p = lerp3(a, b, interpolate(f, [f0, f1], [0, 1], { ...clamp, easing: ease }));
  const settle = interpolate(f, [1150, 1175], [1, 0], clamp);
  return [p[0], p[1] + Math.sin(f / 7) * 0.025 * settle, p[2]];
};

// ---- the placeholder app on the glass (1280 x 720) ----
const TASKS = ["Write the composition", "Light the water", "Wake the fireflies", "Render and post"];
function AppPage() {
  const f = useCurrentFrame();
  const made = f >= 330; // the new project exists
  const sent = f >= 624;
  const n = typed(f);
  const done = TASKS.map((_, i) => f >= 690 + i * 32);
  const card = f >= 850;
  const open = f >= 918;
  const grey = "#9aa3b0";
  const ink = "#20242b";
  if (f < 165) return <AbsoluteFill style={{ background: "#0c0f0e" }} />;
  if (open) {
    // the item full size, playing: amber stands in for the lantern loop
    const t = ((f - 918) % 180) / 180;
    return (
      <AbsoluteFill style={{ background: "#141210", fontFamily: "Inter", color: "#f3e9d8" }}>
        <div style={{ position: "absolute", left: 24, top: 18, fontSize: 22 }}>← Lantern</div>
        <div style={{ position: "absolute", left: 90, top: 70, width: 1100, height: 580, background: "#2a1c0c", borderRadius: 12 }} />
        <div style={{ position: "absolute", left: 300 + t * 560, top: 300, width: 120, height: 150, background: "#ffb347", borderRadius: 18 }} />
        <div style={{ position: "absolute", left: 90, top: 668, width: 1100 * t, height: 8, background: "#ffb347" }} />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ background: "#e9ebee", fontFamily: "Inter", color: ink }}>
      {/* the rail */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 72, height: 720, background: "#cfd3da" }} />
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ position: "absolute", left: 16, top: 60 + i * 64, width: 40, height: 40, borderRadius: 20, background: grey }} />
      ))}
      {made && <div style={{ position: "absolute", left: 16, top: 252, width: 40, height: 40, borderRadius: 20, background: "#ffb347" }} />}
      <div style={{ position: "absolute", left: 16, top: made ? 316 : 252, width: 40, height: 40, borderRadius: 20, border: "3px dashed #9aa1ac", boxSizing: "border-box", fontSize: 30, lineHeight: "32px", textAlign: "center", color: "#9aa1ac" }}>+</div>
      {/* the chat */}
      <div style={{ position: "absolute", left: 96, top: 22, fontSize: 26, fontWeight: 700 }}>{made ? "Lantern" : "Everything"}</div>
      {sent && (
        <div style={{ position: "absolute", left: 250, top: 90, width: 500, padding: 16, background: "#dfe6f5", borderRadius: 14, fontSize: 22, lineHeight: "30px" }}>{LINE}</div>
      )}
      {sent && f >= 660 && (
        <div style={{ position: "absolute", left: 110, top: 230, width: 520, fontSize: 22, lineHeight: "40px" }}>
          <div style={{ color: "#6a7280" }}>Agent · making it</div>
          {TASKS.map((t, i) => (f >= 672 + i * 8 ? <div key={t}>{done[i] ? "☑" : "☐"} {t}</div> : null))}
        </div>
      )}
      <div style={{ position: "absolute", left: 96, top: 606, width: 660, height: 92, borderRadius: 16, border: "2px solid #c2c7d0", background: "#ffffff", boxSizing: "border-box", padding: "12px 18px", fontSize: 24, lineHeight: "32px", color: n && !sent ? ink : "#9aa1ac" }}>
        {made ? (sent ? "Message" : n ? LINE.slice(0, n) + "▍" : "Say what to make") : "Message"}
      </div>
      {/* the feed */}
      <div style={{ position: "absolute", left: 780, top: 0, width: 500, height: 720, background: "#d9dce2" }} />
      <div style={{ position: "absolute", left: 804, top: 22, fontSize: 22, color: "#6a7280" }}>Feed · Source · Tasks</div>
      {card && (
        <div style={{ position: "absolute", left: 804, top: 70, width: 452, height: 310, borderRadius: 14, background: "#ffffff" }}>
          <div style={{ position: "absolute", left: 12, top: 12, width: 428, height: 240, borderRadius: 10, background: "#2a1c0c" }} />
          <div style={{ position: "absolute", left: 200, top: 100, width: 50, height: 62, borderRadius: 8, background: "#ffb347" }} />
          <div style={{ position: "absolute", left: 14, top: 264, fontSize: 22, fontWeight: 700 }}>Lantern</div>
        </div>
      )}
    </AbsoluteFill>
  );
}

// ---- the grey world ----
const GREY = (v: string) => <StandardMaterial base_color={v} perceptual_roughness={0.9} />;
const TREES: V3[] = [[-6, 0, -5], [-3.5, 0, -8], [2.5, 0, -7], [6.5, 0, -4], [-8, 0, 1], [8.5, 0, 2], [5, 0, -11], [-1, 0, -12], [-10, 0, -8], [10, 0, -9]];
const REEDS = Array.from({ length: 46 }, (_, i): V3 => [-6 + rnd(i, 3) * 12, 0, 4.6 + rnd(i, 4) * 5.5]).filter((p) => Math.abs(p[0] - 0.2) > 1.6 || p[2] > 6.2);
const GRASS = Array.from({ length: 70 }, (_, i): V3 => [KB[0] + (rnd(i, 5) - 0.5) * 2.6, 0.17, KB[2] + (rnd(i, 6) - 0.5) * 1.3]);
const RUBBLE = Array.from({ length: 12 }, (_, i): V3 => [KB[0] + (rnd(i, 7) - 0.5) * 2.4, 0.2, KB[2] + (rnd(i, 8) - 0.5) * 1.2]);
const FLIES = Array.from({ length: 140 }, (_, i) => ({
  p: [(rnd(i, 9) - 0.5) * 18, 0.3 + rnd(i, 10) * 2.6, -4 + rnd(i, 11) * 12] as V3,
  at: 925 + Math.hypot((rnd(i, 9) - 0.5) * 18, -4 + rnd(i, 11) * 12 - 0.5) * 12, // they spread outward from the screen
}));

function Film() {
  const f = useCurrentFrame();
  const s = shotAt(f);
  const t = (f - s.from) / (s.to - s.from); // linear: the camera never eases to a stop inside a shot
  const cam = lerp3(s.p0, s.p1, t), look = lerp3(s.l0, s.l1, t);
  const power = interpolate(f, [165, 190], [0, 1], clamp);
  const sun = interpolate(f, [680, 800], [0, 1], clamp);
  const amber = interpolate(f, [918, 960], [0, 1], clamp);
  const r = robotAt(f);
  const spin = interpolate(f, [868, 892], [0, Math.PI * 2], { ...clamp, easing: ease });
  const nose = Math.max(interpolate(f, [95, 115, 172, 200], [0, 1, 1, 0], clamp), interpolate(f, [598, 612, 634, 650], [0, 1, 1, 0], clamp));
  const tilt = Math.PI * (0.14 + 0.86 * nose); // the cone's tip is the pointer's hot spot: the tip, not the body, lands on the target
  const n = typed(f);
  const beat = [...BEATS].reverse().find((b) => f >= b.from)!;
  const lineN = Math.round(interpolate(f, [1160, 1200], [0, 16], clamp));
  const subN = Math.round(interpolate(f, [1206, 1232], [0, 15], clamp));
  return (
    <AbsoluteFill style={{ background: "#5d6660" }}>
      <Camera3d transform={Transform.fromXyz(...cam).lookingAt(look)} projection={{ Perspective: { fov: ((s.fov ?? 40) * Math.PI) / 180 } }} />
      <AmbientLight brightness={260 + sun * 160} />
      <DirectionalLight transform={Transform.fromXyz(-6, 9, -7).lookingAt([0, 1, 2])} illuminance={2500 + sun * 9000} color={sun > 0.05 ? "#ffd9a8" : "#dfe6f0"} shadow_maps_enabled />
      {/* the screen's light on the swamp: cool, then amber when the piece plays */}
      <PointLight transform={Transform.fromXyz(0, 1.5, 1.6)} intensity={power * 900000} color={amber > 0.5 ? "#ffb869" : "#dfe9ff"} range={14} />

      {/* water and the bank */}
      <Mesh3d transform={Transform.fromXyz(0, -0.05, 0)}><Cuboid half_size={[30, 0.05, 30]} />{GREY("#3f4744")}</Mesh3d>
      <Mesh3d transform={Transform.fromXyz(0.2, 0.06, 3.5)}><Cuboid half_size={[2.2, 0.08, 1.0]} />{GREY("#6c7268")}</Mesh3d>

      {/* the monitor: sunk, leaning a little */}
      <Entity transform={Transform.fromXyz(...MON).withRotation(Quat.fromEuler("XYZ", -0.04, 0, 0.03))}>
        <Mesh3d><Cuboid half_size={[SW / 2 + 0.16, SH / 2 + 0.16, 0.18]} />{GREY("#4a4f4c")}</Mesh3d>
        <Mesh3d allowOverlap transform={Transform.fromXyz(0, -SH / 2 - 0.3, -0.1)}><Cuboid half_size={[0.5, 0.3, 0.2]} />{GREY("#444846")}</Mesh3d>
        <Screen name="monitor" position={[0, 0, 0.19]} size={[SW, SH]} resolution={[1280, 720]} crt={false} power={power} brightness={1} background="#0c0f0e">
          <AppPage />
        </Screen>
      </Entity>

      {/* the keyboard under grass and rubble */}
      <Mesh3d transform={Transform.fromXyz(...KB)}><Cuboid half_size={[0.95, 0.03, 0.3]} />{GREY("#55595a")}</Mesh3d>
      {Array.from({ length: COLS * ROWS }, (_, k) => {
        const c = k % COLS, row = Math.floor(k / COLS);
        const p = keyAt(c, row);
        let down = 0;
        if (c === 6 && row === 1) down = interpolate(f, [158, 162, 170], [0, 1, 0], clamp);
        if (c === 13 && row === 2) down = Math.max(down, interpolate(f, [620, 622, 632], [0, 1, 0], clamp));
        if (f >= TYPE_FROM && f <= TYPE_TO + 4 && n > 0) {
          const [kc, kr] = charKey(n - 1);
          if (kc === c && kr === row) down = 1;
        }
        return (
          <Mesh3d key={k} name={`key-${k}`} allowOverlap transform={Transform.fromXyz(p[0], p[1] - down * 0.025, p[2])}>
            <Cuboid half_size={[KEY * 0.45, 0.02, KEY * 0.45]} />
            {GREY(down > 0.5 ? "#e9edf2" : "#8c9196")}
          </Mesh3d>
        );
      })}
      {GRASS.map((p, i) => (
        <Mesh3d key={i} name={`grass-${i}`} allowOverlap transform={Transform.fromXyz(...p).withRotation(Quat.fromEuler("XYZ", (rnd(i, 12) - 0.5) * 0.5, 0, (rnd(i, 13) - 0.5) * 0.6 + Math.sin(f / 9 + i) * 0.04))}>
          <Cuboid half_size={[0.008, 0.07 + rnd(i, 14) * 0.09, 0.008]} />{GREY("#7d8a72")}
        </Mesh3d>
      ))}
      {RUBBLE.map((p, i) => (
        <Mesh3d key={i} name={`rubble-${i}`} allowOverlap transform={Transform.fromXyz(...p).withRotation(Quat.fromEuler("XYZ", rnd(i, 15) * 3, rnd(i, 16) * 3, 0))}>
          <Cuboid half_size={[0.04 + rnd(i, 17) * 0.06, 0.03 + rnd(i, 18) * 0.04, 0.04 + rnd(i, 19) * 0.05]} />{GREY("#9a9a94")}
        </Mesh3d>
      ))}

      {/* trees and reeds */}
      {TREES.map((p, i) => (
        <Mesh3d key={i} name={`tree-${i}`} transform={Transform.fromXyz(p[0], 5, p[2])}><Cylinder radius={0.35 + rnd(i, 20) * 0.3} half_height={5} />{GREY("#4b514d")}</Mesh3d>
      ))}
      {REEDS.map((p, i) => (
        <Mesh3d key={i} name={`reed-${i}`} allowOverlap transform={Transform.fromXyz(p[0], 0.5 + rnd(i, 21) * 0.3, p[2]).withRotation(Quat.fromEuler("XYZ", 0, 0, (rnd(i, 22) - 0.5) * 0.25 + Math.sin(f / 14 + i) * 0.02))}>
          <Cylinder radius={0.012} half_height={0.5 + rnd(i, 21) * 0.3} />{GREY("#66705f")}
        </Mesh3d>
      ))}

      {/* the robot cursor: a pointer arrow, nose down-left as a cursor's is; beige */}
      <Entity transform={Transform.fromXyz(r[0] + Math.sin(tilt) * 0.13, r[1] - Math.cos(tilt) * 0.13, r[2]).withRotation(Quat.fromEuler("XYZ", 0, spin, tilt))}>
        <Mesh3d allowOverlap><Cone radius={0.09} height={0.26} /><StandardMaterial base_color="#e6d5b4" perceptual_roughness={0.6} /></Mesh3d>
        <Mesh3d allowOverlap transform={Transform.fromXyz(0, -0.17, 0)}><Cylinder radius={0.03} half_height={0.06} /><StandardMaterial base_color="#cdbb97" perceptual_roughness={0.6} /></Mesh3d>
        <Mesh3d allowOverlap transform={Transform.fromXyz(0, 0, 0.07)}><Sphere radius={0.025} /><StandardMaterial base_color="#ffffff" emissive="#bfe3ff" /></Mesh3d>
      </Entity>

      {/* the swamp's fireflies, spreading out from the screen once the piece plays */}
      {FLIES.map((fl, i) => {
        const on = interpolate(f, [fl.at, fl.at + 12], [0, 1], clamp);
        if (on <= 0) return null;
        const blink = 0.6 + 0.4 * Math.sin(f / 6 + i * 1.7);
        return (
          <Mesh3d key={i} name={`fly-${i}`} transform={Transform.fromXyz(fl.p[0] + Math.sin(f / 40 + i) * 0.15, fl.p[1] + Math.sin(f / 31 + i * 2) * 0.1, fl.p[2]).withScale([on, on, on])}>
            <Sphere radius={0.035} /><StandardMaterial base_color="#ffb347" emissive="#ffb347" unlit />
          </Mesh3d>
        );
      })}

      {/* the end line: placeholder type where the pencil line will write */}
      {f >= 1160 && (
        <div style={{ position: "absolute", left: 70, top: 64, fontFamily: "Inter", color: "#f4efe2", background: "#5d6660", padding: "6px 12px" }}>
          <div style={{ fontSize: 44, fontWeight: 700 }}>{"the new raea app".slice(0, lineN)}</div>
          <div style={{ fontSize: 30, marginTop: 6 }}>{"0.1.5 · raea.io".slice(0, subN)}</div>
        </div>
      )}

      {/* the previz slug */}
      <div style={{ position: "absolute", left: 60, bottom: 62, width: 840, height: 44, background: "#15171a", color: "#cfd3d8", fontFamily: "Inter", fontSize: 17, lineHeight: "44px", paddingLeft: 16, boxSizing: "border-box" }}>
        PREVIZ · {(f / FPS).toFixed(1)}s · shot {SHOTS.indexOf(s) + 1}/{SHOTS.length} · {beat.name} · {beat.text}
      </div>
    </AbsoluteFill>
  );
}

registerRoot(() => <Composition id="previz" component={Film} width={960} height={540} fps={FPS} durationInFrames={END} />);

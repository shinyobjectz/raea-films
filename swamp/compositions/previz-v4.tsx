// Previz v4 for the 0.1.5 hype film (hype.script.ts): grey boxes, placeholder screen, real blocking, camera and timing.
// It is the plan, not the piece: no look, no real props, no sound.
// v4: the project the robot makes is the swamp itself. After the first line, it works four of the app's own
// controls (a slider, a colour pick, a part dragged in the scene, the timeline), and each one changes the world
// around the monitor, until the whole world is different from the one the film opened on.
// Colour here only marks what has been changed: everything starts grey.
import { AbsoluteFill, Composition, Easing, Img, interpolate, registerRoot, useCurrentFrame } from "raea";
import { Entity, Screen } from "raea/3d";
import { Camera3d } from "raea/camera";
import { AmbientLight, DirectionalLight, PointLight } from "raea/light";
import { Cone, Cuboid, Cylinder, Mesh3d, Sphere } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Quat, Transform } from "raea/transform";
import mark from "../assets/brand/raea-mark-paper.png";

type V3 = [number, number, number];
const FPS = 30;
const END = 1500;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.inOut(Easing.cubic);
const lerp3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rnd = (i: number, k = 0) => {
  const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const hex = (a: string, b: string, t: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
};

// ---- the film's beats (frames) ----
const BEATS = [
  { from: 0, name: "1 The wake", text: "Low through reeds. Dead swamp, dead monitor. Robot darts across." },
  { from: 90, name: "1 The wake", text: "Keyboard under grass and rubble. Robot bumps a key." },
  { from: 165, name: "1 The wake", text: "Monitor wakes. Light floods the mist." },
  { from: 270, name: "2 One line", text: "Robot taps New project in the rail." },
  { from: 360, name: "2 One line", text: "Keys press themselves; the line types." },
  { from: 510, name: "2 One line", text: "Robot slams Return." },
  { from: 555, name: "3 It gets made", text: "Tasks tick. The swamp lands in the feed as a scene." },
  { from: 690, name: "4 Light", text: "Robot drags the Sun slider." },
  { from: 770, name: "4 Light", text: "The real sun comes up through the trees." },
  { from: 840, name: "5 Water", text: "Robot picks a colour for the water." },
  { from: 905, name: "5 Water", text: "The real water clears; lilies open outward." },
  { from: 975, name: "6 Growth", text: "Robot drags a tree taller in the scene." },
  { from: 1040, name: "6 Growth", text: "The real canopy leafs out in a wave." },
  { from: 1110, name: "7 Time", text: "Robot scrubs the timeline to dusk and lets go." },
  { from: 1190, name: "7 Time", text: "Dusk. Fireflies spread out from the screen." },
  { from: 1380, name: "7 Time", text: "A different world. Robot on the bezel. The logomark alone." },
];

// ---- the monitor ----
const SW = 4.0, SH = 2.25;
const MON: V3 = [0, 1.45, 0];
const onScreen = (u: number, v: number, out = 0.3): V3 => [MON[0] + (u - 0.5) * SW, MON[1] + (0.5 - v) * SH, 0.2 + out];
const px = (x: number, y: number, out = 0.3) => onScreen(x / 1280, y / 720, out); // a point of the 1280x720 page

// ---- the keyboard ----
const KB: V3 = [0.25, 0.2, 3.3];
const COLS = 14, ROWS = 4, KEY = 0.11;
const keyAt = (c: number, r: number): V3 => [KB[0] + (c - (COLS - 1) / 2) * KEY * 1.12, KB[1] + 0.05, KB[2] + (r - (ROWS - 1) / 2) * KEY * 1.12];
const RETURN_KEY = keyAt(13, 2);
const WAKE_KEY = keyAt(6, 1);

// ---- typing ----
const LINE = "bring this swamp back to life.";
const TYPE_FROM = 366, TYPE_TO = 504;
const typed = (f: number) => Math.round(interpolate(f, [TYPE_FROM, TYPE_TO], [0, LINE.length], clamp));
const charKey = (i: number): [number, number] => [Math.floor(rnd(i, 1) * 13), Math.floor(rnd(i, 2) * 4)];

// ---- what the robot's controls do, each a 0..1 the screen and the world both read ----
const sunAt = (f: number) => interpolate(f, [735, 805], [0, 1], { ...clamp, easing: ease }); // the Sun slider
const waterAt = (f: number) => interpolate(f, [888, 950], [0, 1], clamp); // the colour pick
const growAt = (f: number) => interpolate(f, [1005, 1075], [0, 1], { ...clamp, easing: ease }); // the tree dragged taller
const duskAt = (f: number) => interpolate(f, [1130, 1192], [0, 1], { ...clamp, easing: ease }); // the playhead

// places on the page (1280 x 720)
const SLIDER = { x0: 830, x1: 1230, y: 150 };
const SWATCH = { x: (i: number) => 846 + i * 78, y: 330, pick: 3 };
const TREE_HANDLE = { x: 420, y0: 273, y1: 133 }; // the top of the second tree in the full-size scene
const TL = { x0: 120, x1: 1160, y: 668 };

// ---- cameras ----
type Shot = { from: number; to: number; p0: V3; p1: V3; l0: V3; l1: V3; fov?: number };
const SHOTS: Shot[] = [
  { from: 0, to: 90, p0: [-3.4, 0.4, 9.2], p1: [-2.7, 0.5, 7.4], l0: [0.6, 1.3, 0], l1: [0.5, 1.4, 0], fov: 42 },
  { from: 90, to: 165, p0: [-0.7, 0.95, 4.5], p1: [0.5, 0.85, 4.35], l0: [-0.2, 0.2, 3.3], l1: [0.4, 0.2, 3.3], fov: 38 },
  { from: 165, to: 270, p0: [0.5, 0.55, 5.3], p1: [0.2, 1.25, 6.5], l0: [0.1, 1.0, 0], l1: [0, 1.5, 0], fov: 44 },
  { from: 270, to: 360, p0: [-1.0, 1.75, 4.1], p1: [-1.25, 1.7, 3.5], l0: [-1.2, 1.7, 0], l1: [-1.3, 1.65, 0], fov: 36 },
  // typing: screen, keys, screen
  { from: 360, to: 430, p0: [-0.9, 0.85, 3.2], p1: [-0.75, 0.8, 2.85], l0: [-0.75, 0.62, 0], l1: [-0.65, 0.6, 0], fov: 34 },
  { from: 430, to: 472, p0: [-0.5, 0.6, 4.25], p1: [-0.1, 0.55, 4.15], l0: [0.0, 0.22, 3.3], l1: [0.3, 0.22, 3.3], fov: 34 },
  { from: 472, to: 510, p0: [-0.6, 0.8, 2.8], p1: [-0.5, 0.76, 2.6], l0: [-0.6, 0.6, 0], l1: [-0.55, 0.58, 0], fov: 34 },
  { from: 510, to: 555, p0: [1.7, 0.5, 3.95], p1: [1.45, 0.42, 3.85], l0: [RETURN_KEY[0], 0.25, RETURN_KEY[2]], l1: [RETURN_KEY[0], 0.22, RETURN_KEY[2]], fov: 30 },
  { from: 555, to: 690, p0: [-3.4, 1.2, 4.6], p1: [-1.0, 1.5, 5.4], l0: [-0.3, 1.5, 0], l1: [0.1, 1.5, 0], fov: 40 },
  // light: the slider close, then the sun arriving, seen from the water with the monitor against it
  { from: 690, to: 770, p0: [1.0, 2.25, 3.2], p1: [1.35, 2.2, 2.7], l0: [1.1, 2.1, 0], l1: [1.3, 2.08, 0], fov: 32 },
  { from: 770, to: 840, p0: [3.4, 0.35, 6.0], p1: [2.9, 0.45, 5.4], l0: [-0.4, 2.0, 0], l1: [-0.5, 2.3, -1], fov: 46 },
  // water: the swatches close, then the surface from just above it
  { from: 840, to: 905, p0: [1.2, 1.7, 2.9], p1: [1.35, 1.66, 2.5], l0: [1.25, 1.55, 0], l1: [1.3, 1.53, 0], fov: 32 },
  { from: 905, to: 975, p0: [-2.6, 0.22, 6.4], p1: [-2.0, 0.3, 5.6], l0: [0.2, 0.9, 0], l1: [0.1, 1.1, 0], fov: 44 },
  // growth: the scene full size, then up into the canopy past the monitor
  { from: 975, to: 1040, p0: [-0.75, 1.75, 3.5], p1: [-0.7, 1.9, 3.1], l0: [-0.7, 1.7, 0], l1: [-0.68, 1.85, 0], fov: 34 },
  { from: 1040, to: 1110, p0: [4.6, 0.5, 5.6], p1: [4.1, 0.6, 5.0], l0: [-1, 4.2, -4], l1: [-1, 4.8, -4.5], fov: 56 },
  // time: the playhead close, then the one big move of the film
  { from: 1110, to: 1190, p0: [-0.8, 0.95, 3.9], p1: [0.2, 0.9, 3.6], l0: [-0.6, 0.85, 0], l1: [0.3, 0.85, 0], fov: 36 },
  { from: 1190, to: 1380, p0: [0.1, 1.3, 3.4], p1: [-0.5, 1.9, 7.0], l0: [0, 1.4, 0], l1: [-0.3, 1.9, 0], fov: 42 },
  { from: 1380, to: END, p0: [-0.5, 1.9, 7.0], p1: [-0.72, 1.97, 7.45], l0: [-0.3, 1.9, 0], l1: [-0.4, 1.95, 0], fov: 42 },
];
const shotAt = (f: number) => SHOTS.find((s) => f >= s.from && f < s.to) ?? SHOTS[SHOTS.length - 1];

// ---- the robot's path ----
const NEW_PROJECT = onScreen(0.034, 0.378);
const CHAT_BOX = onScreen(0.61, 0.93);
const CARD = px(1030, 200);
const SEAT: V3 = [1.3, MON[1] + SH / 2 + 0.36, 0.05];
const PATH: [number, V3][] = [
  [0, [-5.2, 0.7, 6.2]],
  [80, [0.2, 0.55, 4.6]],
  [100, [-0.7, 0.75, 3.5]],
  [150, [WAKE_KEY[0], 0.36, WAKE_KEY[2]]],
  [162, [WAKE_KEY[0], 0.27, WAKE_KEY[2]]],
  [175, [WAKE_KEY[0] + 0.1, 0.5, WAKE_KEY[2]]],
  [262, onScreen(0.3, 0.45, 0.6)],
  [316, NEW_PROJECT],
  [322, onScreen(0.034, 0.378, 0.12)],
  [330, NEW_PROJECT],
  [362, CHAT_BOX],
  [508, CHAT_BOX],
  [522, [RETURN_KEY[0] + 0.15, 0.85, RETURN_KEY[2] + 0.1]],
  [532, [RETURN_KEY[0], 0.27, RETURN_KEY[2]]],
  [550, [RETURN_KEY[0] + 0.1, 0.55, RETURN_KEY[2]]],
  [610, onScreen(0.45, 0.5, 0.5)],
  [668, onScreen(0.55, 0.4, 0.5)],
  // light: grab the knob, drag it right
  [728, px(SLIDER.x0, SLIDER.y)],
  [735, px(SLIDER.x0, SLIDER.y, 0.12)],
  [805, px(SLIDER.x1, SLIDER.y, 0.12)],
  [815, px(SLIDER.x1, SLIDER.y)],
  // water: pick the swatch
  [882, px(SWATCH.x(SWATCH.pick), SWATCH.y)],
  [888, px(SWATCH.x(SWATCH.pick), SWATCH.y, 0.12)],
  [896, px(SWATCH.x(SWATCH.pick), SWATCH.y)],
  // open the scene full size
  [962, CARD],
  [966, px(1030, 200, 0.12)],
  // growth: drag the tree's handle up
  [1000, px(TREE_HANDLE.x, TREE_HANDLE.y0)],
  [1005, px(TREE_HANDLE.x, TREE_HANDLE.y0, 0.12)],
  [1075, px(TREE_HANDLE.x, TREE_HANDLE.y1, 0.12)],
  [1085, px(TREE_HANDLE.x, TREE_HANDLE.y1)],
  // time: grab the playhead, scrub to dusk, let go
  [1124, px(TL.x0 + 200, TL.y)],
  [1130, px(TL.x0 + 200, TL.y, 0.12)],
  [1192, px(TL.x1 - 120, TL.y, 0.12)],
  [1215, px(TL.x1 - 60, TL.y - 200, 0.6)],
  [1375, onScreen(0.86, 0.1, 0.6)],
  [1420, SEAT],
  [END, SEAT],
];
const robotAt = (f: number): V3 => {
  let i = 0;
  while (i < PATH.length - 2 && f >= PATH[i + 1][0]) i++;
  const [f0, a] = PATH[i], [f1, b] = PATH[i + 1];
  const p = lerp3(a, b, interpolate(f, [f0, f1], [0, 1], { ...clamp, easing: ease }));
  const settle = interpolate(f, [1395, 1420], [1, 0], clamp);
  return [p[0], p[1] + Math.sin(f / 7) * 0.025 * settle, p[2]];
};

// ---- the placeholder app on the glass ----
const TASKS = ["Read the swamp", "Build it as a scene", "Wire its controls", "Post it"];
const SWATCHES = ["#3f4744", "#59606b", "#7a6a55", "#2f8f86", "#8a5a7a"];
function SceneThumb({ w, h, f }: { w: number; h: number; f: number }) {
  // the swamp as the app shows it: it follows the same four values the world does
  const sun = sunAt(f), water = waterAt(f), grow = growAt(f), dusk = duskAt(f);
  const sky = hex(hex("#565d5a", "#c9b98f", sun), "#3a2a3e", dusk);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, background: sky, overflow: "hidden", borderRadius: 10 }}>
      <div style={{ position: "absolute", left: 0, top: h * 0.68, width: w, height: h * 0.32, background: hex("#3f4744", "#2f8f86", water) }} />
      {[0.12, 0.3, 0.5, 0.72, 0.9].map((x, i) => (
        <div key={i}>
          <div style={{ position: "absolute", left: w * x - w * 0.012, top: h * (0.68 - 0.3 - 0.25 * grow), width: w * 0.024, height: h * (0.3 + 0.25 * grow), background: "#2e3331" }} />
          <div style={{ position: "absolute", left: w * x - w * 0.06 * grow, top: h * (0.68 - 0.36 - 0.25 * grow), width: w * 0.12 * grow, height: h * 0.16 * grow, borderRadius: h, background: "#6fa35a" }} />
        </div>
      ))}
      <div style={{ position: "absolute", left: w * 0.42, top: h * 0.5, width: w * 0.16, height: h * 0.2, background: "#1b1e1d", border: "3px solid #8d9396", boxSizing: "border-box" }} />
    </div>
  );
}
function AppPage() {
  const f = useCurrentFrame();
  if (f < 165) return <AbsoluteFill style={{ background: "#0c0f0e" }} />;
  const made = f >= 330;
  const sent = f >= 534;
  const n = typed(f);
  const card = f >= 660;
  const open = f >= 968;
  const ink = "#20242b";
  const sun = sunAt(f);
  if (open) {
    // the scene full size: its parts can be dragged, and its timeline is its transport
    const hy = TREE_HANDLE.y0 + (TREE_HANDLE.y1 - TREE_HANDLE.y0) * growAt(f);
    const head = f < 1130 ? TL.x0 + 200 : f < 1192 ? interpolate(f, [1130, 1192], [TL.x0 + 200, TL.x1 - 120], clamp) : TL.x1 - 120 + ((f - 1192) % 240) * 0.4;
    return (
      <AbsoluteFill style={{ background: "#141614", fontFamily: "Inter", color: "#e8e6df" }}>
        <div style={{ position: "absolute", left: 24, top: 16, fontSize: 22 }}>← Swamp</div>
        <div style={{ position: "absolute", left: 90, top: 60, width: 1100, height: 560 }}>
          <SceneThumb w={1100} h={560} f={f} />
        </div>
        {f >= 990 && f < 1100 && (
          <div style={{ position: "absolute", left: TREE_HANDLE.x - 60, top: hy, width: 120, height: 441 - hy, border: "2px solid #8fd0ff", boxSizing: "border-box" }}>
            <div style={{ position: "absolute", left: 50, top: -9, width: 18, height: 18, borderRadius: 9, background: "#8fd0ff" }} />
          </div>
        )}
        <div style={{ position: "absolute", left: TL.x0, top: TL.y - 3, width: TL.x1 - TL.x0, height: 6, borderRadius: 3, background: "#3a3f3c" }} />
        <div style={{ position: "absolute", left: TL.x0, top: TL.y - 3, width: head - TL.x0, height: 6, borderRadius: 3, background: "#ffb347" }} />
        <div style={{ position: "absolute", left: head - 9, top: TL.y - 16, width: 18, height: 32, borderRadius: 6, background: "#ffffff" }} />
      </AbsoluteFill>
    );
  }
  const controls = f >= 700; // the panel turns to Controllers
  return (
    <AbsoluteFill style={{ background: "#e9ebee", fontFamily: "Inter", color: ink }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 72, height: 720, background: "#cfd3da" }} />
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ position: "absolute", left: 16, top: 60 + i * 64, width: 40, height: 40, borderRadius: 20, background: "#9aa3b0" }} />
      ))}
      {made && <div style={{ position: "absolute", left: 16, top: 252, width: 40, height: 40, borderRadius: 20, background: "#6fa35a" }} />}
      <div style={{ position: "absolute", left: 16, top: made ? 316 : 252, width: 40, height: 40, borderRadius: 20, border: "3px dashed #9aa1ac", boxSizing: "border-box", fontSize: 30, lineHeight: "32px", textAlign: "center", color: "#9aa1ac" }}>+</div>
      <div style={{ position: "absolute", left: 96, top: 22, fontSize: 26, fontWeight: 700 }}>{made ? "Swamp" : "Everything"}</div>
      {sent && <div style={{ position: "absolute", left: 420, top: 84, padding: 16, background: "#dfe6f5", borderRadius: 14, fontSize: 22, lineHeight: "30px" }}>{LINE}</div>}
      {sent && f >= 572 && (
        <div style={{ position: "absolute", left: 110, top: 190, width: 520, fontSize: 22, lineHeight: "40px" }}>
          <div style={{ color: "#6a7280" }}>Agent · making it</div>
          {TASKS.map((t, i) => (f >= 580 + i * 6 ? <div key={t}>{f >= 596 + i * 20 ? "☑" : "☐"} {t}</div> : null))}
        </div>
      )}
      <div style={{ position: "absolute", left: 96, top: 606, width: 660, height: 92, borderRadius: 16, border: "2px solid #c2c7d0", background: "#ffffff", boxSizing: "border-box", padding: "12px 18px", fontSize: 24, lineHeight: "32px", color: n && !sent ? ink : "#9aa1ac" }}>
        {made ? (sent ? "Message" : n ? LINE.slice(0, n) + "▍" : "Say what to make") : "Message"}
      </div>
      {/* the panel: the feed, then the project's controllers */}
      <div style={{ position: "absolute", left: 780, top: 0, width: 500, height: 720, background: "#d9dce2" }} />
      <div style={{ position: "absolute", left: 804, top: 22, fontSize: 22, color: "#6a7280" }}>{controls ? "Feed · Source · Tasks · " : "Feed · Source · Tasks · Controllers"}{controls && <b style={{ color: ink }}>Controllers</b>}</div>
      {!controls && card && (
        <div style={{ position: "absolute", left: 804, top: 70, width: 452, height: 310, borderRadius: 14, background: "#ffffff" }}>
          <div style={{ position: "absolute", left: 12, top: 12, width: 428, height: 240 }}><SceneThumb w={428} h={240} f={f} /></div>
          <div style={{ position: "absolute", left: 14, top: 264, fontSize: 22, fontWeight: 700 }}>Swamp · scene</div>
        </div>
      )}
      {controls && (
        <>
          <div style={{ position: "absolute", left: 820, top: 84, fontSize: 24, fontWeight: 700 }}>Light</div>
          <div style={{ position: "absolute", left: 820, top: 116, fontSize: 20, color: "#6a7280" }}>Sun</div>
          <div style={{ position: "absolute", left: SLIDER.x0, top: SLIDER.y - 4, width: SLIDER.x1 - SLIDER.x0, height: 8, borderRadius: 4, background: "#b9bec8" }} />
          <div style={{ position: "absolute", left: SLIDER.x0, top: SLIDER.y - 4, width: (SLIDER.x1 - SLIDER.x0) * sun, height: 8, borderRadius: 4, background: "#ffb347" }} />
          <div style={{ position: "absolute", left: SLIDER.x0 + (SLIDER.x1 - SLIDER.x0) * sun - 13, top: SLIDER.y - 13, width: 26, height: 26, borderRadius: 13, background: "#ffffff", border: "2px solid #8a909a", boxSizing: "border-box" }} />
          <div style={{ position: "absolute", left: 820, top: 250, fontSize: 24, fontWeight: 700 }}>Water</div>
          <div style={{ position: "absolute", left: 820, top: 282, fontSize: 20, color: "#6a7280" }}>Colour</div>
          {SWATCHES.map((c, i) => (
            <div key={c} style={{ position: "absolute", left: SWATCH.x(i) - 26, top: SWATCH.y - 26, width: 52, height: 52, borderRadius: 26, background: c, border: (f >= 888 ? i === SWATCH.pick : i === 0) ? "4px solid #20242b" : "4px solid #d9dce2", boxSizing: "border-box" }} />
          ))}
          <div style={{ position: "absolute", left: 820, top: 420, width: 420, height: 236 }}><SceneThumb w={420} h={236} f={f} /></div>
          <div style={{ position: "absolute", left: 820, top: 664, fontSize: 20, fontWeight: 700 }}>Swamp · scene</div>
        </>
      )}
    </AbsoluteFill>
  );
}

// ---- the world ----
const GREY = (v: string) => <StandardMaterial base_color={v} perceptual_roughness={0.9} />;
const TREES: V3[] = [[-6, 0, -5], [-3.5, 0, -8], [2.5, 0, -7], [6.5, 0, -4], [-8, 0, 1], [8.5, 0, 2], [5, 0, -11], [-1, 0, -12], [-10, 0, -8], [10, 0, -9]];
const REEDS = Array.from({ length: 46 }, (_, i): V3 => [-6 + rnd(i, 3) * 12, 0, 4.6 + rnd(i, 4) * 5.5]).filter((p) => Math.abs(p[0] - 0.2) > 1.6 || p[2] > 6.2);
const GRASS = Array.from({ length: 70 }, (_, i): V3 => [KB[0] + (rnd(i, 5) - 0.5) * 2.6, 0.17, KB[2] + (rnd(i, 6) - 0.5) * 1.3]);
const RUBBLE = Array.from({ length: 12 }, (_, i): V3 => [KB[0] + (rnd(i, 7) - 0.5) * 2.4, 0.2, KB[2] + (rnd(i, 8) - 0.5) * 1.2]);
const LILIES = Array.from({ length: 60 }, (_, i) => {
  const p: V3 = [(rnd(i, 23) - 0.5) * 14, 0.012, 0.8 + rnd(i, 24) * 8];
  return { p, r: 0.12 + rnd(i, 25) * 0.14, at: 895 + Math.hypot(p[0], p[2] - 1) * 7 };
}).filter((l) => !(Math.abs(l.p[0] - 0.2) < 2.3 && l.p[2] > 2.4 && l.p[2] < 4.6));
const FLIES = Array.from({ length: 140 }, (_, i) => {
  const p: V3 = [(rnd(i, 9) - 0.5) * 18, 0.3 + rnd(i, 10) * 2.6, -4 + rnd(i, 11) * 12];
  return { p, at: 1185 + Math.hypot(p[0], p[2] - 0.5) * 12 };
});

function Film() {
  const f = useCurrentFrame();
  const s = shotAt(f);
  const t = (f - s.from) / (s.to - s.from);
  const cam = lerp3(s.p0, s.p1, t), look = lerp3(s.l0, s.l1, t);
  const power = interpolate(f, [165, 190], [0, 1], clamp);
  const sun = sunAt(f), water = waterAt(f), grow = growAt(f), dusk = duskAt(f);
  const r = robotAt(f);
  const nose = Math.max(interpolate(f, [95, 115, 172, 200], [0, 1, 1, 0], clamp), interpolate(f, [508, 522, 544, 560], [0, 1, 1, 0], clamp));
  const tilt = Math.PI * (0.14 + 0.86 * nose); // the cone's tip is the pointer's hot spot
  const spin = interpolate(f, [1196, 1220], [0, Math.PI * 2], { ...clamp, easing: ease });
  const n = typed(f);
  const beat = [...BEATS].reverse().find((b) => f >= b.from)!;
  const sky = hex(hex("#5d6660", "#b9b08f", sun), "#4a3a4c", dusk);
  return (
    <AbsoluteFill style={{ background: sky }}>
      <Camera3d transform={Transform.fromXyz(...cam).lookingAt(look)} projection={{ Perspective: { fov: ((s.fov ?? 40) * Math.PI) / 180 } }} />
      <AmbientLight brightness={260 + sun * 200 - dusk * 220} />
      {/* the sun climbs from behind the trees as the slider goes, and drops toward dusk with the playhead */}
      <DirectionalLight transform={Transform.fromXyz(-6, 2 + sun * 8 - dusk * 6.5, -7).lookingAt([0, 1, 2])} illuminance={2500 + sun * 9500 - dusk * 7000} color={hex(hex("#dfe6f0", "#ffd9a8", sun), "#ff9a6a", dusk)} shadow_maps_enabled />
      <PointLight transform={Transform.fromXyz(0, 1.5, 1.6)} intensity={power * 900000} color={hex("#dfe9ff", "#ffb869", dusk)} range={14} />

      {/* water and the bank */}
      <Mesh3d transform={Transform.fromXyz(0, -0.05, 0)}><Cuboid half_size={[30, 0.05, 30]} />{GREY(hex("#3f4744", "#2f8f86", water))}</Mesh3d>
      <Mesh3d transform={Transform.fromXyz(0.2, 0.06, 3.5)}><Cuboid half_size={[2.2, 0.08, 1.0]} />{GREY(hex("#6c7268", "#6f8a5c", grow))}</Mesh3d>
      {LILIES.map((l, i) => {
        const on = interpolate(f, [l.at, l.at + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
        if (on <= 0) return null;
        return (
          <Mesh3d key={i} name={`lily-${i}`} allowOverlap transform={Transform.fromXyz(...l.p).withScale([on, 1, on])}>
            <Cylinder radius={l.r} half_height={0.012} />{GREY(i % 4 === 0 ? "#f0c9da" : "#7fb26a")}
          </Mesh3d>
        );
      })}

      {/* the monitor */}
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
        if (c === 13 && row === 2) down = Math.max(down, interpolate(f, [530, 532, 542], [0, 1, 0], clamp));
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
          <Cuboid half_size={[0.008, 0.07 + rnd(i, 14) * 0.09, 0.008]} />{GREY(hex("#7d8a72", "#7fb84f", grow))}
        </Mesh3d>
      ))}
      {RUBBLE.map((p, i) => (
        <Mesh3d key={i} name={`rubble-${i}`} allowOverlap transform={Transform.fromXyz(...p).withRotation(Quat.fromEuler("XYZ", rnd(i, 15) * 3, rnd(i, 16) * 3, 0))}>
          <Cuboid half_size={[0.04 + rnd(i, 17) * 0.06, 0.03 + rnd(i, 18) * 0.04, 0.04 + rnd(i, 19) * 0.05]} />{GREY("#9a9a94")}
        </Mesh3d>
      ))}

      {/* trees: bare trunks that leaf out in a wave from the monitor when the tree is dragged taller */}
      {TREES.map((p, i) => {
        const g = interpolate(grow, [Math.min(0.6, Math.hypot(p[0], p[2]) / 22), Math.min(0.6, Math.hypot(p[0], p[2]) / 22) + 0.4], [0, 1], clamp);
        const rad = 0.35 + rnd(i, 20) * 0.3;
        return (
          <Entity key={i} transform={Transform.IDENTITY}>
            <Mesh3d name={`tree-${i}`} transform={Transform.fromXyz(p[0], 5, p[2])}><Cylinder radius={rad} half_height={5} />{GREY("#4b514d")}</Mesh3d>
            {g > 0 && [0, 1, 2].map((k) => (
              <Mesh3d key={k} name={`leaf-${i}-${k}`} allowOverlap transform={Transform.fromXyz(p[0] + (rnd(i * 3 + k, 26) - 0.5) * 2.2, 7.2 + k * 1.1, p[2] + (rnd(i * 3 + k, 27) - 0.5) * 2.2).withScale([g, g, g])}>
                <Sphere radius={1.5 + rnd(i * 3 + k, 28) * 0.8} />{GREY("#6fa35a")}
              </Mesh3d>
            ))}
          </Entity>
        );
      })}
      {REEDS.map((p, i) => (
        <Mesh3d key={i} name={`reed-${i}`} allowOverlap transform={Transform.fromXyz(p[0], 0.5 + rnd(i, 21) * 0.3, p[2]).withRotation(Quat.fromEuler("XYZ", 0, 0, (rnd(i, 22) - 0.5) * 0.25 + Math.sin(f / 14 + i) * 0.02))}>
          <Cylinder radius={0.012} half_height={0.5 + rnd(i, 21) * 0.3} />{GREY(hex("#66705f", "#79a85a", grow))}
        </Mesh3d>
      ))}

      {/* the robot cursor */}
      <Entity transform={Transform.fromXyz(r[0] + Math.sin(tilt) * 0.13, r[1] - Math.cos(tilt) * 0.13, r[2]).withRotation(Quat.fromEuler("XYZ", 0, spin, tilt))}>
        <Mesh3d allowOverlap><Cone radius={0.09} height={0.26} /><StandardMaterial base_color="#e6d5b4" perceptual_roughness={0.6} /></Mesh3d>
        <Mesh3d allowOverlap transform={Transform.fromXyz(0, -0.17, 0)}><Cylinder radius={0.03} half_height={0.06} /><StandardMaterial base_color="#cdbb97" perceptual_roughness={0.6} /></Mesh3d>
        <Mesh3d allowOverlap transform={Transform.fromXyz(0, 0, 0.07)}><Sphere radius={0.025} /><StandardMaterial base_color="#ffffff" emissive="#bfe3ff" /></Mesh3d>
      </Entity>

      {/* fireflies, spreading out from the screen once the playhead reaches dusk */}
      {FLIES.map((fl, i) => {
        const on = interpolate(f, [fl.at, fl.at + 12], [0, 1], clamp);
        if (on <= 0) return null;
        return (
          <Mesh3d key={i} name={`fly-${i}`} allowOverlap transform={Transform.fromXyz(fl.p[0] + Math.sin(f / 40 + i) * 0.15, fl.p[1] + Math.sin(f / 31 + i * 2) * 0.1, fl.p[2]).withScale([on, on, on])}>
            <Sphere radius={0.035} /><StandardMaterial base_color="#ffb347" emissive="#ffb347" unlit />
          </Mesh3d>
        );
      })}

      {/* the only mark of ours: raea's logomark alone, once the robot has settled. No words, no version. */}
      {f >= 1425 && (
        <Img src={mark} style={{ position: "absolute", left: 70, top: 62, width: 60, height: 64, opacity: interpolate(f, [1425, 1443], [0, 1], clamp) }} />
      )}

      {/* the previz slug */}
      <div style={{ position: "absolute", left: 60, bottom: 62, width: 840, height: 44, background: "#15171a", color: "#cfd3d8", fontFamily: "Inter", fontSize: 17, lineHeight: "44px", paddingLeft: 16, boxSizing: "border-box" }}>
        PREVIZ · {(f / FPS).toFixed(1)}s · shot {SHOTS.indexOf(s) + 1}/{SHOTS.length} · {beat.name} · {beat.text}
      </div>
    </AbsoluteFill>
  );
}

registerRoot(() => <Composition id="previz" component={Film} width={960} height={540} fps={FPS} durationInFrames={END} />);

// Controls in the place (the director, 11-11: "some scenes that would benfit from not jsut clickign and stuff but folor swatch
// pickings, sliders, or other toggle buttons. as long as they feel juicy and like react components"). Each is a real
// React component, drawn on a small see-through screen that stands in the scene (on a wall, like a dimmer or a switch
// plate), and the cursor works it where it is: it takes the slider's knob and drags it, clicks a swatch, flips a
// toggle. What it controls answers as it moves (the sun goes down with the slider, the wall takes the swatch's colour,
// the lantern lights with the toggle). No words on any of them.
import { Screen } from "raea/3d";
import type { V3 } from "../v2/math";

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** a spring's answer to a step at 0: over to 1 with one small overshoot (for a pop, a knob landing, a swatch picked) */
export const spring = (t: number, f = 9, d = 7) => (t <= 0 ? 0 : 1 - Math.exp(-d * t) * Math.cos(f * t));
const GLASS: React.CSSProperties = { background: "rgba(16,17,22,0.86)", border: "2px solid rgba(255,255,255,0.14)", boxShadow: "0 10px 30px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)" };

// (how bright a panel's screen is drawn against the shot's exposure: found by trial, see studies/NOTES.md)
const BRIGHT = (ev: number) => { void ev; return 1; };
/** a panel on a wall that faces +z: where it is (its middle), its width in metres, its picture's size in pixels */
export type Panel = { at: V3; w: number; res: [number, number]; /** its turn about the upright (0 faces +z) */ yaw?: number };
/** a point of a panel's picture (pixels from its top left) in the place, a finger's width proud of it */
export const onPanel = (p: Panel, x: number, y: number): V3 => { const m = p.w / p.res[0], a = p.yaw ?? 0, dx = (x - p.res[0] / 2) * m, out = 0.012 * Math.max(1, p.w); return [p.at[0] + dx * Math.cos(a) + out * Math.sin(a), p.at[1] + (p.res[1] / 2 - y) * m, p.at[2] - dx * Math.sin(a) + out * Math.cos(a)]; };
/** the panel in the scene. `show` 0..1 is its pop (it grows out of the wall with a small overshoot); it is always there
 *  (a render keeps what it starts with), a speck while hidden. `ev` is the shot's exposure, which a screen's own light
 *  has to be set against. */
export function Panel3D({ name, panel, show, ev, bright, children }: { name: string; panel: Panel; show: number; ev: number; /** its screen's own light, times (a shot whose lens is stopped well down needs it brighter) */ bright?: number; children: React.ReactNode }) {
  const k = Math.max(0.001, show);
  return (
    <Screen name={name} crt={false} background="transparent" brightness={BRIGHT(ev) * (bright ?? 1)} resolution={panel.res} size={[panel.w]} position={panel.at} rotation={[0, panel.yaw ?? 0, 0]} scale={[k, k, k]}>
      {children}
    </Screen>
  );
}

// ---- a slider: a day, from its sun to its moon. `v` 0..1 is the knob; `press` 0..1 is the knob held
export const SLIDER: [number, number] = [760, 190];
export const sliderX = (v: number) => 150 + 460 * clamp01(v);
export function Slider({ v, press, kind = "day" }: { v: number; press: number; /** what its two ends are: a day (sun to moon), or the ground (flat to folded up) */ kind?: "day" | "fold" | "storm" }) {
  const x = sliderX(v), r = 34 - 5 * press;
  return (
    <div style={{ width: SLIDER[0], height: SLIDER[1], position: "relative" }}>
      <div style={{ position: "absolute", left: 14, top: 22, width: SLIDER[0] - 28, height: SLIDER[1] - 44, borderRadius: 73, ...GLASS }} />
      {kind === "fold" && <>
        <svg style={{ position: "absolute", left: 50, top: 60 }} width={70} height={70} viewBox="-35 -35 70 70"><path d="M-26,10 L26,10" stroke="#cfd6ff" strokeWidth={7} strokeLinecap="round" fill="none" /></svg>
        <svg style={{ position: "absolute", left: SLIDER[0] - 120, top: 60 }} width={70} height={70} viewBox="-35 -35 70 70"><path d="M-24,-20 C-24,24 24,24 24,-20" stroke="#cfd6ff" strokeWidth={7} strokeLinecap="round" fill="none" /></svg>
      </>}
      {/* the sun */}
      {kind !== "fold" && <svg style={{ position: "absolute", left: 50, top: 60 }} width={70} height={70} viewBox="-35 -35 70 70">
        <circle r={13} fill="#ffd27a" />{Array.from({ length: 8 }, (_, i) => <line key={i} x1={Math.cos((i * Math.PI) / 4) * 20} y1={Math.sin((i * Math.PI) / 4) * 20} x2={Math.cos((i * Math.PI) / 4) * 29} y2={Math.sin((i * Math.PI) / 4) * 29} stroke="#ffd27a" strokeWidth={5} strokeLinecap="round" />)}
      </svg>}
      {kind === "storm" && <svg style={{ position: "absolute", left: SLIDER[0] - 120, top: 60 }} width={70} height={70} viewBox="-35 -35 70 70"><path d="M6,-30 L-14,4 L0,4 L-8,30 L16,-6 L2,-6 Z" fill="#cfe0ff" /></svg>}
      {/* the moon */}
      {kind === "day" && <svg style={{ position: "absolute", left: SLIDER[0] - 120, top: 60 }} width={70} height={70} viewBox="-35 -35 70 70"><path d="M8,-24 A26,26 0 1 0 24,10 A20,20 0 0 1 8,-24 Z" fill="#aab6ff" /></svg>}
      <div style={{ position: "absolute", left: 150, top: 88, width: 460, height: 14, borderRadius: 7, background: "rgba(255,255,255,0.13)" }} />
      <div style={{ position: "absolute", left: 150, top: 88, width: x - 150, height: 14, borderRadius: 7, background: kind === "fold" ? "linear-gradient(90deg, #9aa6ff, #7c8cff)" : kind === "storm" ? "linear-gradient(90deg, #ffd27a, #8fa0c8 50%, #cfe0ff)" : "linear-gradient(90deg, #ffd27a, #ff9a5a 55%, #7c8cff)" }} />
      <div style={{ position: "absolute", left: x - r - 14 * press, top: 95 - r - 14 * press, width: 2 * r + 28 * press, height: 2 * r + 28 * press, borderRadius: 99, background: "rgba(124,140,255,0.28)" }} />
      <div style={{ position: "absolute", left: x - r, top: 95 - r, width: 2 * r, height: 2 * r, borderRadius: 99, background: "#ffffff", boxShadow: "0 6px 16px rgba(0,0,0,0.5)" }} />
    </div>
  );
}

// ---- a toggle: `on` 0..1 is where its knob is (give it a spring), `press` its squeeze
export const TOGGLE: [number, number] = [300, 190];
export const TOGGLE_AT: [number, number] = [150, 95];
export function Toggle({ on, press }: { on: number; press: number }) {
  const k = clamp01(on), x = 96 + 108 * on;
  return (
    <div style={{ width: TOGGLE[0], height: TOGGLE[1], position: "relative" }}>
      <div style={{ position: "absolute", left: 14, top: 22, width: TOGGLE[0] - 28, height: TOGGLE[1] - 44, borderRadius: 73, ...GLASS }} />
      <div style={{ position: "absolute", left: 60, top: 55, width: 180, height: 80, borderRadius: 40, background: `rgb(${Math.round(60 + 195 * k)},${Math.round(62 + 108 * k)},${Math.round(70 + 20 * k)})`, boxShadow: `0 0 ${Math.round(34 * k)}px rgba(255,170,90,${(0.75 * k).toFixed(2)})` }} />
      <div style={{ position: "absolute", left: x - 32 - 6 * press, top: 95 - 32 + 4 * press, width: 64 + 12 * press, height: 64 - 8 * press, borderRadius: 40, background: "#ffffff", boxShadow: "0 5px 12px rgba(0,0,0,0.45)" }} />
    </div>
  );
}

// ---- swatches: a row of colours; `picked` is the one clicked and `k` 0..1 its landing (give it a spring)
export const SWATCH: [number, number] = [680, 190];
export const swatchX = (i: number, n: number) => 340 + (i - (n - 1) / 2) * 112;
export function Swatches({ colors, picked, k }: { colors: string[]; picked: number; k: number }) {
  return (
    <div style={{ width: SWATCH[0], height: SWATCH[1], position: "relative" }}>
      <div style={{ position: "absolute", left: 14, top: 22, width: SWATCH[0] - 28, height: SWATCH[1] - 44, borderRadius: 73, ...GLASS }} />
      {colors.map((c, i) => {
        const on = i === picked ? k : 0, r = 38 * (1 + 0.2 * on);
        return (
          <div key={c}>
            <div style={{ position: "absolute", left: swatchX(i, colors.length) - r - 9, top: 95 - r - 9, width: 2 * r + 18, height: 2 * r + 18, borderRadius: 99, border: `5px solid rgba(255,255,255,${clamp01(on).toFixed(2)})`, boxSizing: "border-box" }} />
            <div style={{ position: "absolute", left: swatchX(i, colors.length) - r, top: 95 - r, width: 2 * r, height: 2 * r, borderRadius: 99, background: c, boxShadow: "inset 0 -6px 10px rgba(0,0,0,0.25), 0 4px 10px rgba(0,0,0,0.4)" }} />
          </div>
        );
      })}
    </div>
  );
}

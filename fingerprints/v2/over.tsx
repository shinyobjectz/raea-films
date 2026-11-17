// The type over the picture: the film's few words, set in Instrument Serif (the artist) and IBM Plex Mono (the
// machine), and labels pinned to the hand and the desk by projecting their places through the shot's camera.
// Everything here is the frame's: no state, no timers.
import { Img, staticFile } from "raea";
import { CUE, PICKED, PRINTS, STRIP, slipAt } from "./act";
import { type Cam, project } from "./cam";
import { type Pose, type V3, carried } from "./rig";
import { hold, ramp, shot, type ShotName } from "./time";

export const FONTS = `
@font-face { font-family: 'Instrument Serif'; src: url(${staticFile("fonts/InstrumentSerif-Regular.ttf")}); }
@font-face { font-family: 'Instrument Serif'; font-style: italic; src: url(${staticFile("fonts/InstrumentSerif-Italic.ttf")}); }
@font-face { font-family: 'IBM Plex Mono'; src: url(${staticFile("fonts/IBMPlexMono-Regular.ttf")}); }
@font-face { font-family: 'IBM Plex Mono'; font-weight: 500; src: url(${staticFile("fonts/IBMPlexMono-Medium.ttf")}); }
`;
const INK = "#f4efe6";
const RED = "#ff5a45";
const SERIF = "Instrument Serif";
const MONO = "IBM Plex Mono";
const shade = "0 2px 18px rgba(0,0,0,0.55), 0 0 2px rgba(0,0,0,0.6)";

/** a word of the artist's, large, at the frame's lower left */
function Say({ text, k, x = 110, y = 780, size = 190, italic = true }: { text: string; k: number; x?: number; y?: number; size?: number; italic?: boolean }) {
  if (k <= 0) return null;
  return <div style={{ position: "absolute", left: x, top: y + (1 - k) * 24, fontFamily: SERIF, fontStyle: italic ? "italic" : "normal", fontSize: size, lineHeight: 1, color: INK, opacity: k, textShadow: shade, whiteSpace: "nowrap" }}>{text}</div>;
}
/** a label pinned to a place in the scene: a ring on the place, a hairline to the words */
function Pin({ cam, at, text, sub, k, dx = 150, dy = -120, color = INK, size = 62 }: { cam: Cam; at: V3; text: string; sub?: string; k: number; dx?: number; dy?: number; color?: string; size?: number }) {
  const wide = Math.max(text.length * size * 0.62, (sub?.length ?? 0) * size * 0.76 * 0.62);
  if (k <= 0) return null;
  const p = project(cam, at);
  if (!p.front) return null;
  // keep the words inside the frame's safe area
  const tx = Math.min(1920 - 70 - wide, Math.max(70, p.x + dx));
  const ty = Math.min(1080 - 130 - size, Math.max(130, p.y + dy));
  const ex = dx > 0 ? tx - 14 : tx + text.length * size * 0.6 + 14;
  const ey = ty + size * 0.62;
  const draw = Math.min(1, k * 1.6);
  return (
    <>
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, opacity: k }}>
        <circle cx={p.x} cy={p.y} r={9} fill="none" stroke={color} strokeWidth={2.5} />
        <circle cx={p.x} cy={p.y} r={2.5} fill={color} />
        <line x1={p.x} y1={p.y} x2={p.x + (ex - p.x) * draw} y2={p.y + (ey - p.y) * draw} stroke={color} strokeWidth={1.6} />
      </svg>
      <div style={{ position: "absolute", left: tx, top: ty, fontFamily: MONO, fontWeight: 500, fontSize: size, lineHeight: 1.05, color, opacity: ramp(k, 0.35, 1), textShadow: shade, whiteSpace: "nowrap" }}>
        {text}
        {sub ? <div style={{ fontSize: size * 0.76, fontWeight: 400, opacity: 0.9, marginTop: 6 }}>{sub}</div> : null}
      </div>
    </>
  );
}

const S = (n: ShotName) => shot(n);
/** where frame i of the contact strip is (its middle, on the desk); frame 0 is at the viewer's left */
const frameAt = (i: number): V3 => [STRIP.x + STRIP.w / 2 - ((40 + i * 396 + 186) / 2440) * STRIP.w, 0.02, STRIP.z];

export function Over({ t, cam, pose }: { t: number; cam: Cam; pose: Pose | null }) {
  const n = cam.name;
  const inShot = (a: number, b: number, rise = 0.35, fall = 0.3) => hold(t, a, b, rise, fall);
  return (
    <>
      <style>{FONTS}</style>
      {n === "hand" && pose ? <Pin cam={cam} at={carried("hand", [0.0, 0.3, -0.25], pose)} text="fig. 1: the hand" sub="the artist's own" k={inShot(CUE.my + 0.4, S("hand").to)} dx={-560} dy={-230} /> : null}
      {n === "draw" ? <Say text="It draws." k={inShot(S("draw").from + 0.5, S("draw").to)} /> : null}
      {n === "paint" ? <Say text="It paints." k={inShot(S("paint").from + 0.5, S("paint").to)} /> : null}
      {n === "conduct" ? (
        <>
          <Say text="It conducts." k={inShot(CUE.conducts - 0.3, CUE.badly - 0.15)} />
          <Say text="Badly." k={inShot(CUE.badly - 0.1, CUE.feeling - 0.7, 0.15)} />
          <Say text="But with feeling." k={inShot(CUE.feeling - 0.6, S("conduct").to)} />
        </>
      ) : null}
      {n === "machine" ? (
        <div style={{ position: "absolute", left: 110, top: 700, fontFamily: MONO, fontSize: 60, lineHeight: 1.35, color: INK, textShadow: shade, opacity: inShot(CUE.fast - 0.5, S("machine").to) }}>
          <div>the machine</div>
          <div style={{ opacity: ramp(t, CUE.fast - 0.1, CUE.fast + 0.2) }}>speed: <span style={{ fontWeight: 500 }}>very fast</span></div>
          <div style={{ opacity: ramp(t, CUE.taste - 0.1, CUE.taste + 0.2) }}>taste: <span style={{ fontWeight: 500, color: RED }}>boiled potato</span></div>
        </div>
      ) : null}
      {n === "print" ? (
        <div style={{ position: "absolute", left: 110, top: 150, opacity: inShot(CUE.name - 0.05, S("print").to, 0.3), color: INK, textShadow: shade }}>
          <div style={{ fontFamily: SERIF, fontSize: 230, lineHeight: 1 }}>Fingerprint</div>
          <div style={{ fontFamily: MONO, fontSize: 60, marginTop: 14, opacity: ramp(t, CUE.name + 0.6, CUE.name + 1.0) }}>by raea</div>
        </div>
      ) : null}
      {n === "approve" && pose ? (
        <>
          <Say text="It learns my taste." k={inShot(CUE.learns - 0.2, CUE.approve - 1.2)} size={150} />
          <Pin cam={cam} at={carried("thumb3", [0.92, -0.25, 0.5], pose)} text="approve" sub="the cuts I approve" k={inShot(CUE.approve - 0.15, S("approve").to)} dx={-700} dy={60} />
        </>
      ) : null}
      {n === "pick" ? (
        <>
          <Pin cam={cam} at={[PRINTS[PICKED][0], 0.03, PRINTS[PICKED][1] + 0.3]} text="pick" sub="the takes I pick" k={inShot(CUE.pick + 0.1, CUE.leave - 0.2)} dx={-560} dy={-300} />
          <Pin cam={cam} at={[slipAt(t)[0] + 0.3, 0.02, slipAt(t)[1]]} text="note" sub="the notes I leave" k={inShot(CUE.leave - 0.1, S("pick").to)} dx={160} dy={-330} />
        </>
      ) : null}
      {n === "hotel" ? (
        <>
          <Say text="In my words." k={inShot(S("hotel").from + 0.1, CUE.ten - 0.9)} size={160} />
          <div style={{ position: "absolute", left: 110, top: 760, fontFamily: MONO, fontSize: 150, fontWeight: 500, color: INK, textShadow: shade, opacity: inShot(CUE.ten - 0.9, CUE.hotel - 0.6, 0.2) }}>
            7/10
            <div style={{ position: "absolute", left: -14, top: 92, width: 400 * ramp(t, CUE.ten - 0.3, CUE.ten + 0.05), height: 10, background: RED }} />
          </div>
          <Say text="I am not a hotel." k={inShot(CUE.hotel - 0.55, S("hotel").to)} size={160} />
        </>
      ) : null}
      {n === "strip" ? (
        <>
          <Pin cam={cam} at={frameAt(2)} text={t < CUE.fixed + 0.1 ? "hiss 0:04" : t < CUE.tell - 0.1 ? "fixed" : "still there"} sub={t >= CUE.tell - 0.1 ? "the fix hid it" : undefined} k={inShot(CUE.finds + 0.4, S("strip").to)} dx={-420} dy={-330} color={t < CUE.fixed + 0.1 || t >= CUE.tell - 0.1 ? RED : INK} />
          <Pin cam={cam} at={frameAt(4)} text={t < CUE.fixed + 0.5 ? "too dark 0:07" : "fixed"} k={inShot(CUE.hate, S("strip").to)} dx={120} dy={-360} color={t < CUE.fixed + 0.5 ? RED : INK} />
        </>
      ) : null}
      {n === "cover" ? (
        <>
          <Say text="On my machine." k={inShot(CUE.machine - 0.6, CUE.team - 0.4)} size={150} y={150} />
          <Say text="Shared: what it learned." k={inShot(CUE.team - 0.2, CUE.never - 0.2)} size={120} y={150} />
          <Say text="Never the footage." k={inShot(CUE.never - 0.1, S("cover").to)} size={150} y={150} />
        </>
      ) : null}
      {n === "end" ? (
        <div style={{ position: "absolute", left: 800, top: 300, color: "#1d1b18" }}>
          <div style={{ fontFamily: SERIF, fontSize: 250, lineHeight: 1, opacity: ramp(t, CUE.end - 0.05, CUE.end + 0.35) }}>Fingerprint</div>
          <div style={{ display: "flex", alignItems: "center", gap: 34, marginTop: 40, opacity: ramp(t, CUE.raea - 0.05, CUE.raea + 0.3) }}>
            <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 130 }}>in</span>
            <div style={{ background: "#141312", borderRadius: 14, padding: "14px 20px 8px" }}><Img src={staticFile("brand/raea-logo.png")} style={{ height: 190 }} /></div>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 62, marginTop: 44, opacity: ramp(t, CUE.raea + 0.8, CUE.raea + 1.2) }}>raea.io</div>
        </div>
      ) : null}
    </>
  );
}

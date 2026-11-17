// The few words on screen: the narrator's exhibits, labelled the way he'd label them (IBM Plex Mono, pinned to the
// thing by a hairline), the name when he says it (Instrument Serif), and the end card.
import { Img, staticFile } from "raea";
import { AT, type Cam, DARK, HISS, type V3, camAt, project } from "./space";
import { CUE, hold, ramp } from "./time";

const FONTS = `
@font-face { font-family: 'Instrument Serif'; src: url(${staticFile("fonts/InstrumentSerif-Regular.ttf")}); }
@font-face { font-family: 'Instrument Serif'; font-style: italic; src: url(${staticFile("fonts/InstrumentSerif-Italic.ttf")}); }
@font-face { font-family: 'IBM Plex Mono'; src: url(${staticFile("fonts/IBMPlexMono-Regular.ttf")}); }
@font-face { font-family: 'IBM Plex Mono'; font-weight: 500; src: url(${staticFile("fonts/IBMPlexMono-Medium.ttf")}); }
`;
const INK = "#f4efe6", RED = "#ff8573", SERIF = "Instrument Serif", MONO = "IBM Plex Mono";
const shade = "0 2px 16px rgba(0,0,0,0.7), 0 0 3px rgba(0,0,0,0.8)";

function Pin({ cam, at, text, sub, k, dx = 180, dy = -150, color = INK, size = 60, mid }: { cam: Cam; at: V3; text: string; sub?: string; k: number; dx?: number; dy?: number; color?: string; size?: number; mid?: number }) {
  if (k <= 0) return null;
  const p = project(cam, at);
  // with `mid` (a second), the words hold where the point is then and only the hairline follows the point
  const q = mid !== undefined ? project(camAt(mid), at) : p;
  if (!p.front) return null;
  const wide = Math.max(text.length * size * 0.61, (sub?.length ?? 0) * size * 0.72 * 0.61);
  const tx = Math.min(1920 - 70 - wide, Math.max(70, q.x + dx));
  const ty = Math.min(1080 - 140 - size * (sub ? 1.9 : 1), Math.max(150, q.y + dy));
  const ex = dx > 0 ? tx - 14 : tx + wide + 14, ey = ty + size * 0.6;
  const draw = Math.min(1, k * 1.7);
  const inFrame = p.x > -200 && p.x < 2120 && p.y > -200 && p.y < 1280;
  return (
    <>
      {inFrame ? (
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, opacity: k }}>
          <circle cx={p.x} cy={p.y} r={10} fill="none" stroke={color} strokeWidth={2.5} />
          <circle cx={p.x} cy={p.y} r={2.5} fill={color} />
          <line x1={p.x} y1={p.y} x2={p.x + (ex - p.x) * draw} y2={p.y + (ey - p.y) * draw} stroke={color} strokeWidth={1.6} />
        </svg>
      ) : null}
      <div style={{ position: "absolute", left: tx, top: ty, fontFamily: MONO, fontWeight: 500, fontSize: size, lineHeight: 1.05, color, opacity: k > 0.35 ? 1 : 0, whiteSpace: "nowrap", background: "#04050a", padding: "16px 28px 18px", borderRadius: 6, marginLeft: -28, marginTop: -16 }}>
        <div>{text}</div>
        {sub ? <div style={{ fontSize: size * 0.72, fontWeight: 400, marginTop: 6 }}>{sub}</div> : null}
      </div>
    </>
  );
}

export function Over({ t, cam }: { t: number; cam: Cam }) {
  const h = (a: number, b: number, rise = 0.3, fall = 0.3) => hold(t, a, b, rise, fall);
  const up = (p: V3, y: number): V3 => [p[0], p[1] + y, p[2]];
  return (
    <>
      <style>{FONTS}</style>
      <Pin cam={cam} at={AT.nothing} text="fig. 0: nothing" sub="colourful" k={h(CUE.nothing + 0.3, CUE.stayed + 0.9)} dx={220} dy={-240} />
      <Pin cam={cam} at={up(AT.nothing, 0.1)} text="fig. 1: a hand" sub="bold" k={h(CUE.hand + 0.2, CUE.trouble - 0.6)} dx={-640} dy={-220} />
      <Pin cam={cam} at={up(AT.brain, 0.5)} text="DO NOT TOUCH" k={h(CUE.dont - 0.1, CUE.pop + 0.05, 0.2, 0.08)} dx={240} dy={-230} color={RED} />
      <Pin cam={cam} at={up(AT.brain, 0.5)} text="you touched it" k={h(CUE.touched, CUE.fine + 0.2)} dx={240} dy={-230} />
      <Pin cam={cam} at={AT.loop} text="chaos, with opinions" k={h(CUE.chaos, CUE.taste)} dx={260} dy={-180} />
      <Pin cam={cam} at={up(AT.paint, 0.3)} text="not that blue" k={h(CUE.blue - 0.3, CUE.notVase + 0.1, 0.15)} dx={-620} dy={-240} color={RED} />
      <Pin cam={cam} at={up(AT.vase, 0.5)} text="not that vase" k={h(CUE.notVase, CUE.thatOne - 0.2, 0.15)} dx={220} dy={-220} color={RED} />
      <Pin cam={cam} at={up(AT.vase, 0.5)} text="that one" sub={t > CUE.why ? "why? no idea" : undefined} k={h(CUE.thatOne, CUE.know - 0.4)} dx={-560} dy={-220} />
      <Pin cam={cam} at={[AT.vase[0] + 1.75, AT.vase[1] + 0.75, AT.vase[2] + 0.2]} text="he knows" k={h(CUE.know + 0.1, CUE.pattern - 1.5)} dx={150} dy={-170} />
      <Pin cam={cam} at={up(AT.whorl, 0.2)} text="yours" sub={t > CUE.biometrics - 0.3 ? "biometrics, not flattery" : undefined} k={h(CUE.yours - 0.2, CUE.videos - 0.2)} dx={-760} dy={-200} />
      <Pin cam={cam} at={DARK} text="too dark 0:07" k={Math.max(h(CUE.dark - 0.3, CUE.name - 0.8), h(CUE.reads, CUE.flag + 0.9))} dx={170} dy={-230} color={RED} />
      <Pin cam={cam} at={HISS} text="hiss 0:04" k={Math.max(h(CUE.hiss - 0.2, CUE.name - 0.8), h(CUE.reads, CUE.flag + 0.9))} dx={-520} dy={-260} color={RED} />
      <Pin cam={cam} at={DARK} text="fixed" k={h(CUE.fixed + 0.2, CUE.there - 0.6)} dx={170} dy={-230} />
      <Pin cam={cam} at={HISS} text="still there" sub="the fix hid it" k={h(CUE.there + 0.1, CUE.machine - 0.8)} mid={(CUE.there + CUE.machine) / 2} dx={180} dy={-250} color={RED} />
      <Pin cam={cam} at={up(AT.machine, 0.95)} text="your machine" sub={t > CUE.leaves - 0.3 ? "your footage stays in" : undefined} k={h(CUE.machine - 0.3, CUE.creativity - 0.6)} mid={(CUE.machine + CUE.creativity) / 2} dx={220} dy={-190} />
      <Pin cam={cam} at={up(AT.cat, 0.75)} text="fig. 12: a cat" sub="raea's" k={h(CUE.cat - 0.1, CUE.end - 0.4)} mid={(CUE.cat + CUE.end) / 2} dx={220} dy={-200} />

      {/* the name, when he gets to it */}
      <div style={{ position: "absolute", left: 110, top: 150, color: INK, textShadow: shade, opacity: h(CUE.name - 0.1, CUE.reads - 0.3, 0.35, 0.5) }}>
        <div style={{ fontFamily: SERIF, fontSize: 210, lineHeight: 1 }}>Fingerprint</div>
        <div style={{ fontFamily: MONO, fontSize: 60, marginTop: 18, lineHeight: 1.4 }}>
          <div style={{ opacity: ramp(t, CUE.approve - 0.2, CUE.approve + 0.2) }}>+ the cuts you approve</div>
          <div style={{ opacity: ramp(t, CUE.pick - 0.2, CUE.pick + 0.2) }}>+ the takes you pick</div>
          <div style={{ opacity: ramp(t, CUE.leave - 0.2, CUE.leave + 0.2) }}>+ the notes you leave</div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 110, top: 150, fontFamily: SERIF, fontStyle: "italic", fontSize: 150, color: INK, textShadow: shade, opacity: h(CUE.chaos2 - 0.2, CUE.cat - 1.2, 0.4, 0.5) }}>
        <span style={{ opacity: ramp(t, CUE.chaos2 - 0.2, CUE.chaos2 + 0.2) }}>chaos, </span>
        <span style={{ opacity: ramp(t, CUE.refusals2 - 0.2, CUE.refusals2 + 0.2) }}>refusals, </span>
        <span style={{ opacity: ramp(t, CUE.pattern2 - 0.2, CUE.pattern2 + 0.2) }}>a pattern.</span>
      </div>
      {/* the end */}
      <div style={{ position: "absolute", left: 110, top: 540, color: INK, textShadow: shade }}>
        <div style={{ fontFamily: SERIF, fontSize: 200, lineHeight: 1, opacity: ramp(t, CUE.end - 0.05, CUE.end + 0.35) }}>Fingerprint</div>
        <div style={{ display: "flex", alignItems: "center", gap: 30, marginTop: 20, opacity: ramp(t, CUE.raea - 0.05, CUE.raea + 0.3) }}>
          <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 100 }}>in</span>
          <Img src={staticFile("brand/raea-logo.png")} style={{ height: 140 }} />
          <span style={{ fontFamily: MONO, fontSize: 60, marginLeft: 30, opacity: ramp(t, CUE.staring - 0.4, CUE.staring) }}>raea.io</span>
        </div>
      </div>
    </>
  );
}

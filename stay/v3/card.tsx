// The end card. the director, 11-11: "new end card this one sucks"; "remove the subtext focus more on a cool loog animation and
// download for mac windows and linux desktop"; "use cards for those downloads or just have one download for desktop and
// have it say it integrates with you agent"; and on assembly 22: "we can make this CTA way better. id love to see a very
// cool designed animation and button very high end motion design and layout".
// The film's own idea once more, on raea's mark, which is pixel art: the cat is built a pixel at a time as a drawing
// (each pixel an outlined cell, set down over a draughtsman's floor that runs to a horizon behind it), and the word is
// drawn across in outline. The cursor clicks the cat and the real thing goes out from the click as a wave, as every place
// in the film did: each pixel fills and pops as the wave reaches it, and each letter fills up from its foot a pixel row
// at a time. Then the download button unfolds from a line into a pill, a light running across it; the cursor presses it,
// white floods out from the press inside it (the label turning dark where the white has reached), the pixel arrow
// drops, a bar runs along its foot, and raea.io is typed under it. Two clicks, both on the song's grid.
import { AbsoluteFill, Img, staticFile } from "raea";
import { clamp01, ease, ramp } from "../v2/math";
import { Cursor } from "../v2/ui";
import { FACE, MONO } from "../parts/type";
import { spring } from "./controls";
import { CAT_CELLS, CAT_UNIT } from "./card-cells";
import { FPS, FRAMES, H, W, onBeat } from "./plan";

const SANS = "GeistStay, sans-serif";
const PIC_W = 1664, PIC_H = 596;                                                  // the lockup's picture
const LW = 780, S = LW / PIC_W, LH = PIC_H * S, LX = (W - LW) / 2, LY = 268;      // the lockup, on the frame
const BW = 560, BH = 118, BX = (W - BW) / 2, BY = 690;                            // the button
/** the letters of RAEA in the picture: their columns, and the rows they stand in; their pixels are 12.18 px */
const LETTERS: [number, number][] = [[738, 933], [982, 1176], [1225, 1420], [1469, 1663]];
const WORD_TOP = 146, WORD_FOOT = 450, WORD_UNIT = 12.16;
const CAT: [number, number] = [LX + 258 * S, LY + 343 * S], BTN: [number, number] = [BX + BW - 92, BY + BH - 38];
export const CARD_CLICKS = [onBeat("card", 1.15), onBeat("card", 3.2)];           // (on the cat, on the button)
/** how fast the real thing goes out from the click, px a second */
const WAVE = 1500;
/** the floor's horizon, and its vanishing point (behind the lockup) */
const HZ = 628, VX = W / 2;
const hash = (i: number) => { const x = Math.sin(i * 91.17 + 7.31) * 43758.5453; return x - Math.floor(x); };

/** the cursor's place: in from the corner to the cat, a rest, then down to the button; each reach overshoots a little */
function cursorAt(u: number, c1: number, c2: number): [number, number] {
  const go = (a: [number, number], b: [number, number], k: number): [number, number] => {
    const e = ease(clamp01(k)), over = Math.sin(Math.PI * clamp01(k)) * 0.06, bow = Math.sin(Math.PI * e) * 26;
    return [a[0] + (b[0] - a[0]) * (e + over * (1 - e)) + bow * 0.4, a[1] + (b[1] - a[1]) * (e + over * (1 - e)) - bow];
  };
  const start: [number, number] = [W + 40, H * 0.86], away: [number, number] = [BTN[0] + 150, BTN[1] + 120];
  const drift: [number, number] = [Math.sin(u * 2.1) * 2.2, Math.cos(u * 1.7) * 1.8];
  const p = u < c1 + 0.35 ? go(start, CAT, (u - 0.15) / (c1 - 0.27)) : u < c2 + 0.5 ? go(CAT, BTN, (u - c1 - 0.35) / (c2 - c1 - 0.5)) : go(BTN, away, (u - c2 - 0.5) / 1.1);
  return [p[0] + drift[0], p[1] + drift[1]];
}

/** the floor: lines from the vanishing point down to the frame's foot, and lines across it coming slowly toward us */
function Floor({ u, c1 }: { u: number; c1: number }) {
  const grow = ease(ramp(u, 0.0, 1.0)), lit = 1 + 1.4 * (u >= c1 ? Math.exp(-2.2 * (u - c1)) : 0), far = (y: number) => clamp01((y - HZ) / 260);
  const rays = Array.from({ length: 23 }, (_, i) => -2200 + i * 260 + VX);
  const across = Array.from({ length: 12 }, (_, k) => HZ + 452 / (1 + (k + ((u * 0.42) % 1)) * 0.62)).filter((y) => y < H);
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
      {rays.map((x, i) => {
        // (each ray starts a little way out from the vanishing point, so they don't gather into a bright spike there)
        const ex = VX + (x - VX) * grow, ey = HZ + (H - HZ) * grow, sx = VX + (x - VX) * 0.07, sy = HZ + (H - HZ) * 0.07;
        return <path key={`r${i}`} d={`M${sx.toFixed(1)},${sy.toFixed(1)} L${ex.toFixed(1)},${ey.toFixed(1)}`} stroke={`rgba(219,214,199,${(0.075 * lit * grow).toFixed(3)})`} strokeWidth={1} fill="none" />;
      })}
      {across.map((y, k) => {
        const a = 0.09 * lit * far(y) * ease(ramp(u, 0.15 + 0.05 * k, 0.6 + 0.05 * k));
        return <path key={`a${k}`} d={`M0,${y.toFixed(1)} L${W},${y.toFixed(1)}`} stroke={`rgba(219,214,199,${a.toFixed(3)})`} strokeWidth={1} fill="none" />;
      })}
    </svg>
  );
}

/** the pixel arrow on the button: a stem and a head, on a 3 px grid */
const ARROW: [number, number][] = [[3, 0], [3, 1], [3, 2], [3, 3], [0, 3], [1, 4], [2, 5], [3, 6], [4, 5], [5, 4], [6, 3], [3, 4], [3, 5], [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [6, 8]];

function Label({ dark, drop }: { dark: boolean; drop: number }) {
  const ink = dark ? "#0a0a0c" : "#ffffff";
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: BW, height: BH, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 9 }}>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 18 }}>
        <div style={{ position: "relative", width: 7 * 3.6, height: 9 * 3.6, top: drop }}>
          {ARROW.map(([x, y], i) => <div key={i} style={{ position: "absolute", left: x * 3.6, top: y * 3.6, width: 3.6, height: 3.6, background: ink }} />)}
        </div>
        <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 38, letterSpacing: -0.6, color: ink }}>Download for desktop</span>
      </div>
    </div>
  );
}

export function EndCard({ t, from }: { t: number; from: number }) {
  const u = t - from, end = FRAMES / FPS - from, [c1, c2] = CARD_CLICKS;
  const out = 1 - ramp(u, end - 0.55, end - 0.05);
  const [x, y] = cursorAt(u, c1, c2);
  const ring = (c: number) => (u >= c && u < c + 0.45 ? (u - c) / 0.45 : -1);
  const reach = (px: number, py: number) => c1 + Math.hypot(px - CAT[0], py - CAT[1]) / WAVE;   // when the wave reaches a point
  // the button: a line drawn out from the middle, then it opens into a pill (springing), its words set in as it does
  const open0 = c1 + 0.42, line = ease(ramp(u, open0, open0 + 0.26)), tall = Math.max(0, spring(u - open0 - 0.2, 12, 8));
  const bw = Math.max(2, BW * line), bh = Math.max(2, 2 + (BH - 2) * tall);
  const words = ease(ramp(u, open0 + 0.32, open0 + 0.7)), track = 2.6 + 9 * (1 - words);
  const press = u < c2 ? 0 : Math.exp(-9 * (u - c2)) * (u - c2 < 0.08 ? (u - c2) / 0.08 : 1);
  const flood = u < c2 ? 0 : ease(ramp(u, c2, c2 + 0.42)) * BW * 1.15;              // the white, out from the press
  const fx = BTN[0] - BX, fy = BTN[1] - BY;
  const drop = u < c2 ? 0 : 7 * Math.exp(-6 * (u - c2 - 0.12)) * Math.sin(Math.max(0, u - c2 - 0.12) * 18) * (u > c2 + 0.12 ? 1 : 0);
  const bar = ease(ramp(u, c2 + 0.35, c2 + 1.75));
  const sweep = ((u - open0 - 0.55) % 1.7) / 1.7;                                    // the light that runs across it
  const url = "raea.io", typed = u < c2 + 0.55 ? 0 : Math.min(url.length, Math.floor((u - c2 - 0.55) / 0.065) + 1);
  const caret = u >= c2 + 0.5 && Math.floor((u - c2) / 0.31) % 2 === 0;
  const glow = u < c1 ? 0 : ease(ramp(u, c1, c1 + 0.6));
  return (
    <AbsoluteFill style={{ background: "#050506", opacity: out }}>
      <style>{FACE}</style>
      <Floor u={u} c1={c1} />
      {/* the light the real thing gives off */}
      {glow > 0 && <div style={{ position: "absolute", left: W / 2 - 4, top: LY + LH * 0.5 - 4, width: 8, height: 8, borderRadius: 9999, boxShadow: `0 0 260px 150px rgba(255,238,214,${(0.055 * glow).toFixed(3)})` }} />}
      {/* the cat, a pixel at a time: set down as outlined cells, filled as the wave from the click reaches each */}
      {CAT_CELLS.map(([cx, cy], i) => {
        const td = 0.1 + 0.62 * ((cy / 32) * 0.62 + (cx / 29) * 0.38) + 0.07 * hash(i);
        if (u < td) return null;
        const size = CAT_UNIT * S, px = LX + cx * CAT_UNIT * S, py = LY + cy * CAT_UNIT * S;
        const set = Math.min(1.15, spring(u - td, 16, 9)), tr = reach(px + size / 2, py + size / 2) + 0.03 * hash(i + 99);
        const f = u < tr ? 0 : clamp01((u - tr) / 0.06), pop = u < tr ? 1 : 1 + 0.32 * Math.exp(-13 * (u - tr));
        const k = Math.max(0.05, set) * pop, s2 = size * k, fall = (1 - Math.min(1, set)) * -12;
        return <div key={i} style={{ position: "absolute", left: px + (size - s2) / 2, top: py + (size - s2) / 2 + fall, width: s2, height: s2, boxSizing: "border-box", background: `rgba(255,255,255,${f.toFixed(3)})`, border: `1px solid rgba(219,214,199,${(0.62 * (1 - f) * clamp01((u - td) / 0.1)).toFixed(3)})` }} />;
      })}
      {/* the word: drawn across in outline, then each letter filled from its foot up, a pixel row at a time */}
      {LETTERS.map(([a, b], i) => {
        const left = LX + a * S, w = (b - a) * S, drawn = clamp01((ease(ramp(u, 0.3, 1.0)) * (PIC_W - 700) - (a - 700)) / (b - a));
        const tr = reach(left + w / 2, LY + ((WORD_TOP + WORD_FOOT) / 2) * S), rows = (WORD_FOOT - WORD_TOP) / WORD_UNIT;
        const filled = u < tr ? 0 : Math.ceil(clamp01((u - tr) / 0.2) * rows), fh = filled * WORD_UNIT * S;
        const pop = u < tr + 0.2 ? 1 : 1 + 0.06 * Math.exp(-12 * (u - tr - 0.2));
        return (
          <div key={i} style={{ position: "absolute", left, top: LY, width: w, height: LH, transform: `scale(${pop.toFixed(4)})` }}>
            <div style={{ position: "absolute", left: 0, top: 0, width: w * drawn, height: LH, overflow: "hidden", opacity: 0.8 * (1 - (fh > 0 ? 0.85 : 0)) }}>
              <Img src={staticFile("brand/raea-lockup-line.png")} style={{ position: "absolute", left: -a * S, top: 0, width: LW, height: LH }} />
            </div>
            {fh > 0 && (
              <div style={{ position: "absolute", left: 0, top: WORD_FOOT * S - fh, width: w, height: fh, overflow: "hidden" }}>
                <Img src={staticFile("brand/raea-lockup.png")} style={{ position: "absolute", left: -a * S, top: -(WORD_FOOT * S - fh), width: LW, height: LH }} />
              </div>
            )}
          </div>
        );
      })}
      {/* the button */}
      {u >= open0 && (
        <div style={{ position: "absolute", left: BX + (BW - bw) / 2, top: BY + (BH - bh) / 2 + press * 4, width: bw, height: bh, borderRadius: Math.min(bh, BH) / 2, boxSizing: "border-box", overflow: "hidden",
          border: "1.5px solid rgba(255,255,255,0.88)", background: "#0b0b0e", transform: `scale(${(1 - 0.035 * press).toFixed(4)})`, boxShadow: `0 18px 60px rgba(0,0,0,0.6), 0 0 ${(40 * words).toFixed(0)}px rgba(255,240,220,${(0.08 * words).toFixed(3)})` }}>
          <div style={{ position: "absolute", left: (bw - BW) / 2, top: (bh - BH) / 2, width: BW, height: BH, opacity: words }}>
            {u < c2 + 0.2 && sweep > 0 && <div style={{ position: "absolute", left: -260 + sweep * (BW + 520), top: -20, width: 150, height: BH + 40, transform: "skewX(-18deg)", background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.13), rgba(255,255,255,0))" }} />}
            <div style={{ position: "absolute", left: 0, top: 6 * (1 - words), width: BW, height: BH }}><Label dark={false} drop={drop} /></div>
            {flood > 0 && (
              <div style={{ position: "absolute", left: fx - flood, top: fy - flood, width: flood * 2, height: flood * 2, borderRadius: 9999, overflow: "hidden", background: "#ffffff" }}>
                <div style={{ position: "absolute", left: flood - fx, top: flood - fy, width: BW, height: BH }}><Label dark drop={drop} /></div>
              </div>
            )}
            {bar > 0 && <div style={{ position: "absolute", left: 0, top: BH - 5, width: BW * bar, height: 5, background: "rgba(10,10,12,0.85)" }} />}
          </div>
        </div>
      )}
      {/* what it runs on, under it, tracking in as the button opens */}
      {u >= open0 + 0.3 && <div style={{ position: "absolute", left: 0, top: BY + BH + 30, width: W, textAlign: "center", fontFamily: MONO, fontWeight: 500, fontSize: 15, letterSpacing: track, whiteSpace: "nowrap", color: `rgba(255,255,255,${(0.62 * words).toFixed(3)})` }}>MAC · WINDOWS · LINUX · WORKS WITH YOUR AGENT</div>}
      {/* and where to get it, typed */}
      {u >= c2 + 0.5 && (
        <div style={{ position: "absolute", left: 0, top: BY + BH + 84, width: W, display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 3 }}>
          <span style={{ fontFamily: MONO, fontWeight: 500, fontSize: 26, letterSpacing: 1, color: "rgba(255,255,255,0.9)" }}>{url.slice(0, typed)}</span>
          <div style={{ width: 13, height: 26, background: caret ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0)" }} />
        </div>
      )}
      <Cursor x={x} y={y} press={Math.max(press, u >= c1 && u < c1 + 0.12 ? 1 : 0)} ring={Math.max(ring(c1), ring(c2))} />
    </AbsoluteFill>
  );
}

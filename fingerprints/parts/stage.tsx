// What every scene stands on: the global frame (so cues read straight off the timeline and the score), a camera
// that moves through keyframes without ever stopping, the slide that brings each scene's board in over the last, an
// SVG layer for ink with its filters, and a rubber stamp.
import type { CSSProperties, ReactNode } from "react";
import { useCurrentFrame } from "raea";
import { C, GrainFilter, InkFilter } from "./draw";
import { clamp, easeOut, nudge } from "./ink";
import { BOARD_LEAD } from "./timeline";

/** a scene's Sequence starts LEAD frames before its downbeat, when its board starts to slide in (with the score's
 * paper-slide); the board takes SLIDE frames, landing just before the downbeat */
export const LEAD = BOARD_LEAD;
export const SLIDE = 8;

/** the global frame inside a scene whose Sequence starts at `from - lead` */
export const useG = (from: number, lead = LEAD) => useCurrentFrame() + from - lead;

type Key = [number, number, number, number, number?]; // frame, x, y, scale, rotation (deg)

/** the camera at frame f: a Catmull-Rom curve through the keys, carried on at the end slopes past either end so it
 * never stops */
export function camAt(f: number, keys: Key[]): [number, number, number, number] {
  const ks = keys.map((k) => [k[0], k[1], k[2], Math.log(k[3]), k[4] ?? 0]);
  const n = ks.length;
  const val = (i: number, c: number) => ks[i][c];
  const slope = (i: number, c: number) => {
    const a = ks[Math.max(0, i - 1)];
    const b = ks[Math.min(n - 1, i + 1)];
    return (b[c] - a[c]) / Math.max(1, b[0] - a[0]);
  };
  const out = [0, 0, 0, 0];
  for (let c = 1; c <= 4; c++) {
    if (f <= ks[0][0]) out[c - 1] = val(0, c) + slope(0, c) * (f - ks[0][0]);
    else if (f >= ks[n - 1][0]) out[c - 1] = val(n - 1, c) + slope(n - 1, c) * (f - ks[n - 1][0]);
    else {
      let i = 0;
      while (ks[i + 1][0] < f) i++;
      const d = ks[i + 1][0] - ks[i][0];
      const t = (f - ks[i][0]) / d;
      const h00 = 2 * t ** 3 - 3 * t ** 2 + 1;
      const h10 = t ** 3 - 2 * t ** 2 + t;
      const h01 = -2 * t ** 3 + 3 * t ** 2;
      const h11 = t ** 3 - t ** 2;
      out[c - 1] = h00 * val(i, c) + h10 * d * slope(i, c) + h01 * val(i + 1, c) + h11 * d * slope(i + 1, c);
    }
  }
  return [out[0], out[1], Math.exp(out[2]), out[3]];
}

/** the camera over the desk: the frame's centre looks at desk point (x, y), scaled and turned */
export function CamPath({ f, keys, children }: { f: number; keys: Key[]; children?: ReactNode }) {
  const [x, y, s, r] = camAt(f, keys);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: "0px 0px", transform: `translate(960px, 540px) scale(${s}) rotate(${r}deg) translate(${-x}px, ${-y}px)` }}>
      {children}
    </div>
  );
}

/** a scene's board sliding in over the last, by hand: stepped on twos, a little turned until it lands */
export function SlideIn({ lf, from = "right", children }: { lf: number; from?: "right" | "left" | "bottom" | "top"; children?: ReactNode }) {
  const t = clamp(Math.floor(lf / 2) * 2 / SLIDE);
  const e = easeOut(t);
  const d = 1 - e;
  const dx = from === "right" ? 2000 * d : from === "left" ? -2000 * d : 0;
  const dy = from === "bottom" ? 1150 * d : from === "top" ? -1150 * d : 0;
  const rot = (from === "right" || from === "top" ? 3 : -3) * d;
  const shadow = d > 0.001 ? "0 0 40px 6px rgba(30,18,6,0.55)" : undefined;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, overflow: "hidden", transform: d > 0.001 ? `translate(${dx}px, ${dy}px) rotate(${rot}deg)` : undefined, boxShadow: shadow }}>
      {children}
    </div>
  );
}

/** an SVG for ink in desk coordinates, with this layer's filters: url(#ID-ink) roughens like ink on tooth (reseeded
 * on twos), url(#ID-grain) speckles like a rubber stamp. An SVG is drawn at its own size, so ink outside `box` (x, y,
 * w, h; the frame by default) is cut off: a scene whose camera pulls back past the frame passes a bigger box. */
export function InkLayer({ id, g, children, scale = 2.6, style, grain = 0.62, box = [0, 0, 1920, 1080] }: { id: string; g: number; children?: ReactNode; scale?: number; style?: CSSProperties; grain?: number; box?: [number, number, number, number] }) {
  const [bx, by, bw, bh] = box;
  return (
    <svg width={bw} height={bh} viewBox={`${bx} ${by} ${bw} ${bh}`} style={{ position: "absolute", left: bx, top: by, overflow: "visible", ...style }}>
      <defs>
        <InkFilter id={`${id}-ink`} f={g} scale={scale} />
        <GrainFilter id={`${id}-grain`} seed={7} amount={grain} />
      </defs>
      <g filter={`url(#${id}-ink)`}>{children}</g>
    </svg>
  );
}

/** a rubber stamp's impression: a boxed word in a stamp's ink, pressed at frame `at` (it lands a size too big and
 * a little light, then settles); needs an InkLayer's grain filter by id */
export function Stamp({ g, at, x, y, text, size = 72, rot = -8, color = C.red, grain, k = 1, font = "Special Elite", box = true }: { g: number; at: number; x: number; y: number; text: string; size?: number; rot?: number; color?: string; grain: string; k?: number; font?: string; box?: boolean }) {
  if (g < at) return null;
  const s = g < at + 2 ? 1.12 : 1;
  const o = g < at + 2 ? 0.7 : 1;
  const j = nudge(k, g, 0.5);
  const w = text.length * size * 0.62 + size * 0.7;
  const h = size * 1.35;
  return (
    <g transform={`translate(${x + j.x} ${y + j.y}) rotate(${rot + j.r}) scale(${s})`} opacity={o} filter={`url(#${grain})`}>
      {box ? <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={size * 0.12} fill="none" stroke={color} strokeWidth={size * 0.09} /> : null}
      <text x={0} y={size * 0.34} textAnchor="middle" fontFamily={font} fontSize={size} fontWeight={700} fill={color} letterSpacing={size * 0.04}>
        {text}
      </text>
    </g>
  );
}

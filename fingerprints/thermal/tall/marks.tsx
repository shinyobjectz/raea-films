// The tall film's marks (thermal/marks.tsx's, redrawn for a phone held upright): the same white HUD ink and mono type,
// typed on from a frame of the shot, at 60 px so they read at arm's length (thermal/tall/frame.ts). A label can run to
// two lines ("\n", broken by sense, never mid-phrase), and it stands where it is put, inside the safe box: a tag's dot
// is on the thing, its label is placed, and the leader runs from the dot to the label's nearest edge. Words, never
// numbers or scores.
import { staticFile, useCurrentFrame } from "raea";
import { H, TYPE, W, monoW } from "./frame";

const FONTS = `@font-face { font-family: 'IBM Plex Mono'; font-weight: 500; src: url(${staticFile("fonts/IBMPlexMono-Medium.ttf")}); }`;
export const INK = "rgba(255,255,255,0.94)";
const MONO = "IBM Plex Mono";
const PAD_X = 14, PAD_Y = 6, LINE = 1.15, BORDER = 2;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => { const k = clamp01(x); return 1 - (1 - k) ** 3; };
export const typed = (s: string, f: number, at: number, cps = 1.4) => s.slice(0, Math.max(0, Math.floor((f - at) * cps)));

/** a label's box when fully typed: [width, height] in pixels */
export function labelSize(text: string, size: number = TYPE.label): [number, number] {
  const lines = text.split("\n");
  return [Math.max(...lines.map((l) => monoW(l, size))) + 2 * (PAD_X + BORDER), lines.length * size * LINE + 2 * (PAD_Y + BORDER)];
}

/** a label in the HUD's box, anchored at its top left (align "l") or top right ("r") */
export function LabelT({ x, y, text, k, solid = false, align = "l", size = TYPE.label }: { x: number; y: number; text: string; k: number; solid?: boolean; align?: "l" | "r"; size?: number }) {
  if (!text) return null;
  return (
    <div style={{ position: "absolute", ...(align === "l" ? { left: x } : { right: W - x }), top: y, fontFamily: MONO, fontWeight: 500, fontSize: size, lineHeight: LINE, letterSpacing: TYPE.track, whiteSpace: "pre", padding: `${PAD_Y}px ${PAD_X}px`, border: `${BORDER}px solid ${INK}`, background: solid ? INK : "rgba(0,0,0,0.6)", color: solid ? "#000" : INK, opacity: k, textAlign: align === "l" ? "left" : "right" }}>
      <style>{FONTS}</style>
      {text.toUpperCase()}
    </div>
  );
}

/** a tag: a dot on the thing at (x, y), its label placed at (lx, ly) (top left, or top right with align "r"), and a
 * leader from the dot to the label's nearest edge, all drawn on from frame `at` and gone by `out` */
export function TagT({ x, y, lx, ly, align = "l", text, at, solid = false, out = 1e9 }: { x: number; y: number; lx: number; ly: number; align?: "l" | "r"; text: string; at: number; solid?: boolean; out?: number }) {
  const f = useCurrentFrame();
  const k = ease((f - at) / 10) * (1 - clamp01((f - out) / 8));
  if (k <= 0) return null;
  const [w, h] = labelSize(text);
  const bx = align === "l" ? lx : lx - w;
  // the label's edge nearest the dot
  const tx = Math.max(bx, Math.min(bx + w, x)), ty = Math.max(ly, Math.min(ly + h, y));
  const ex = x + (tx - x) * k, ey = y + (ty - y) * k;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H }}>
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
        <circle cx={x} cy={y} r={12} fill="none" stroke={INK} strokeWidth={3} opacity={k} />
        <circle cx={x} cy={y} r={4.5} fill={INK} opacity={k} />
        <path d={`M ${x} ${y} L ${ex} ${ey}`} stroke={INK} strokeWidth={2.5} opacity={k} />
      </svg>
      <LabelT x={lx} y={ly} align={align} text={typed(text, f, at + 4)} k={k} solid={solid} />
    </div>
  );
}

/** a box drawn on round a place, its corners first, its label typed on above it (or below, with `below`) */
export function BoxT({ x, y, w, h, at, label, out = 1e9, below = false }: { x: number; y: number; w: number; h: number; at: number; label?: string; out?: number; below?: boolean }) {
  const f = useCurrentFrame();
  const k = ease((f - at) / 12) * (1 - clamp01((f - out) / 8));
  if (k <= 0) return null;
  const per = 2 * (w + h);
  const c = 44;
  const [, lh] = label ? labelSize(label) : [0, 0];
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H }}>
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
        <rect x={x} y={y} width={w} height={h} fill="none" stroke={INK} strokeWidth={3} strokeDasharray={`${per * k} ${per}`} />
        {[[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].map(([px, py, sx, sy], i) => (
          <path key={i} d={`M ${px} ${py + sy * c} L ${px} ${py} L ${px + sx * c} ${py}`} fill="none" stroke={INK} strokeWidth={7} opacity={k} />
        ))}
      </svg>
      {label ? <LabelT x={x} y={below ? y + h + 14 : y - lh - 14} text={typed(label, f, at + 6)} k={k} /> : null}
    </div>
  );
}

/** a panel of rows (what the agent is handed): a title, then each row's name small and its words at full size,
 * each typed on after the one before */
export function PanelT({ title, rows, at, x, y, w }: { title: string; rows: [string, string][]; at: number; x: number; y: number; w: number }) {
  const f = useCurrentFrame();
  const k = ease((f - at) / 10);
  if (k <= 0) return null;
  let t = at + 8;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, boxSizing: "border-box", fontFamily: MONO, fontWeight: 500, letterSpacing: TYPE.track, color: INK, opacity: k, background: "rgba(0,0,0,0.62)", border: `${BORDER}px solid ${INK}`, padding: "22px 28px" }}>
      <style>{FONTS}</style>
      <div style={{ display: "inline-block", background: INK, color: "#000", padding: "0 12px", marginBottom: 18, fontSize: TYPE.head, lineHeight: LINE }}>{title.toUpperCase()}</div>
      {rows.map(([a, b], i) => {
        const start = t;
        t += (a.length + b.length) / 1.4 + 6;
        return (
          <div key={i} style={{ marginTop: i ? 14 : 0 }}>
            <div style={{ fontSize: TYPE.aside, lineHeight: LINE, opacity: 0.62, whiteSpace: "pre" }}>{typed(a.toUpperCase(), f, start, 3)}</div>
            <div style={{ fontSize: TYPE.label, lineHeight: LINE, whiteSpace: "pre" }}>{typed(b, f, start + 4)}</div>
          </div>
        );
      })}
    </div>
  );
}

/** four frames every second, seen: a row of small frames, one more every 7.5 frames of the film, the newest filled,
 * under its words */
export function TicksT({ at, label, x, y, every = 7.5, show = 8 }: { at: number; label: string; x: number; y: number; every?: number; show?: number }) {
  const f = useCurrentFrame();
  if (f < at) return null;
  const n = Math.floor((f - at) / every) + 1;
  const m = Math.min(n, show);
  return (
    <div style={{ position: "absolute", left: x, top: y, fontFamily: MONO, fontWeight: 500, fontSize: TYPE.label, lineHeight: LINE, letterSpacing: TYPE.track, color: INK }}>
      <style>{FONTS}</style>
      <div style={{ marginBottom: 18, whiteSpace: "pre", textShadow: "0 0 12px rgba(0,0,0,0.9)" }}>{typed(label.toUpperCase(), f, at, 2)}</div>
      <div style={{ display: "flex", gap: 14 }}>
        {Array.from({ length: m }, (_, i) => {
          const j = n - m + i;
          return <div key={j} style={{ width: 76, height: 46, border: `2.5px solid ${INK}`, background: j === n - 1 ? INK : "rgba(0,0,0,0.4)", opacity: 0.35 + 0.65 * ((i + 1) / m) }} />;
        })}
      </div>
    </div>
  );
}

/** what one of the stack's models does, written on its block: the role at full size, the model's name small after it */
export function BlockT({ x, y, w, h, role, model, at, k }: { x: number; y: number; w: number; h: number; role: string; model?: string; at: number; k: number }) {
  const f = useCurrentFrame();
  if (k <= 0 || f < at) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", fontFamily: MONO, fontWeight: 500, letterSpacing: TYPE.track, color: INK, opacity: k, whiteSpace: "pre" }}>
      <style>{FONTS}</style>
      <span style={{ fontSize: TYPE.label, background: "rgba(0,0,0,0.55)", padding: "0 10px" }}>{typed(role.toUpperCase(), f, at)}</span>
      {model ? <span style={{ fontSize: TYPE.aside, opacity: 0.7, background: "rgba(0,0,0,0.55)", padding: "0 8px" }}>{typed(model.toUpperCase(), f, at + 6)}</span> : null}
    </div>
  );
}

/** the small heading typed on at the safe box's top left (what the shot is), in up to two lines */
export function HeadT({ text, at, x = 80, y = 286 }: { text: string; at: number; x?: number; y?: number }) {
  const f = useCurrentFrame();
  const s = typed(text.toUpperCase(), f, at, 1.6);
  if (!s) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, fontFamily: MONO, fontWeight: 500, fontSize: TYPE.head, lineHeight: LINE, letterSpacing: 4, color: "rgba(255,255,255,0.88)", whiteSpace: "pre", textShadow: "0 0 14px rgba(0,0,0,0.9)" }}>
      <style>{FONTS}</style>
      {s}
    </div>
  );
}

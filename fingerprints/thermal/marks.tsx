// What Fingerprint marks on a shot, drawn over the heat in the HUD's ink: a box drawn on round a place (a box on the
// frame, the hiss on a spectrogram), a tag pinned to a point with a leader (a note in the person's words, a verdict),
// and a small panel of rows (what the agent is handed). Each starts at a frame of the shot (`at`) and types on.
// Words, never numbers or scores. Positions in pixels of the 1920x1080 frame.
import { staticFile, useCurrentFrame } from "raea";

const FONTS = `@font-face { font-family: 'IBM Plex Mono'; font-weight: 500; src: url(${staticFile("fonts/IBMPlexMono-Medium.ttf")}); }`;
const INK = "rgba(255,255,255,0.94)";
const MONO = "IBM Plex Mono";
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => { const k = clamp01(x); return 1 - (1 - k) ** 3; };
const typed = (s: string, f: number, at: number, cps = 1.4) => s.slice(0, Math.max(0, Math.floor((f - at) * cps)));

/** a box drawn on round a place, its corners first, with a label typed on above it */
export function Box({ x, y, w, h, at, label, out = 1e9 }: { x: number; y: number; w: number; h: number; at: number; label?: string; out?: number }) {
  const f = useCurrentFrame();
  const k = ease((f - at) / 12) * (1 - clamp01((f - out) / 8));
  if (k <= 0) return null;
  const per = 2 * (w + h);
  const c = 28;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080 }}>
      <style>{FONTS}</style>
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        <rect x={x} y={y} width={w} height={h} fill="none" stroke={INK} strokeWidth={2} strokeDasharray={`${per * k} ${per}`} />
        {[[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].map(([px, py, sx, sy], i) => (
          <path key={i} d={`M ${px} ${py + sy * c} L ${px} ${py} L ${px + sx * c} ${py}`} fill="none" stroke={INK} strokeWidth={5} opacity={k} />
        ))}
      </svg>
      {label ? <Label x={x} y={y - 44} text={typed(label, f, at + 6)} k={k} /> : null}
    </div>
  );
}

function Label({ x, y, text, k, solid = false }: { x: number; y: number; text: string; k: number; solid?: boolean }) {
  if (!text) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, fontFamily: MONO, fontWeight: 500, fontSize: 24, letterSpacing: 3, whiteSpace: "pre", padding: "3px 10px", border: `1.5px solid ${INK}`, background: solid ? INK : "rgba(0,0,0,0.55)", color: solid ? "#000" : INK, opacity: k }}>
      {text.toUpperCase()}
    </div>
  );
}

/** a tag pinned to a point: a dot, a leader out to (dx, dy), and the words typed on */
export function Tag({ x, y, dx = 120, dy = -90, text, at, solid = false, out = 1e9 }: { x: number; y: number; dx?: number; dy?: number; text: string; at: number; solid?: boolean; out?: number }) {
  const f = useCurrentFrame();
  const k = ease((f - at) / 10) * (1 - clamp01((f - out) / 8));
  if (k <= 0) return null;
  const ex = x + dx * k, ey = y + dy * k;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080 }}>
      <style>{FONTS}</style>
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        <circle cx={x} cy={y} r={7} fill="none" stroke={INK} strokeWidth={2} opacity={k} />
        <circle cx={x} cy={y} r={2.5} fill={INK} opacity={k} />
        <path d={`M ${x} ${y} L ${ex} ${ey}`} stroke={INK} strokeWidth={1.5} opacity={k} />
      </svg>
      <Label x={ex + (dx < 0 ? -10 : 10) - (dx < 0 ? text.length * 17.5 + 22 : 0)} y={ey - 20} text={typed(text, f, at + 4)} k={k} solid={solid} />
    </div>
  );
}

/** a small panel of rows, bottom left inside the HUD frame, each typed on after the one before */
export function Panel({ title, rows, at, x = 130, y = 700 }: { title: string; rows: [string, string][]; at: number; x?: number; y?: number }) {
  const f = useCurrentFrame();
  const k = ease((f - at) / 10);
  if (k <= 0) return null;
  let t = at + 8;
  return (
    <div style={{ position: "absolute", left: x, top: y, fontFamily: MONO, fontWeight: 500, fontSize: 24, letterSpacing: 2.5, color: INK, opacity: k, background: "rgba(0,0,0,0.6)", border: `1.5px solid ${INK}`, padding: "14px 22px", minWidth: 560 }}>
      <style>{FONTS}</style>
      <div style={{ display: "inline-block", background: INK, color: "#000", padding: "0 8px", marginBottom: 10 }}>{title.toUpperCase()}</div>
      {rows.map(([a, b], i) => {
        const start = t;
        t += (a.length + b.length) / 1.4 + 6;
        return (
          <div key={i} style={{ whiteSpace: "pre", lineHeight: 1.55 }}>
            <span style={{ opacity: 0.6 }}>{typed(a.toUpperCase().padEnd(9, " "), f, start, 3)}</span>
            {typed(b, f, start + 4)}
          </div>
        );
      })}
    </div>
  );
}

/** four frames every second, seen: a row of small frames along the bottom, one more every 7.5 frames of the film,
 * the newest filled, with a label (04b: what the picture model looks at) */
export function Ticks({ at, label, every = 7.5 }: { at: number; label: string; every?: number }) {
  const f = useCurrentFrame();
  if (f < at) return null;
  const n = Math.floor((f - at) / every) + 1;
  const SHOW = 16;
  return (
    <div style={{ position: "absolute", left: 130, top: 900, fontFamily: MONO, fontWeight: 500, fontSize: 22, letterSpacing: 4, color: INK }}>
      <style>{FONTS}</style>
      <div style={{ marginBottom: 12, whiteSpace: "pre" }}>{typed(label.toUpperCase(), f, at, 2)}</div>
      <div style={{ display: "flex", gap: 10 }}>
        {Array.from({ length: Math.min(n, SHOW) }, (_, i) => {
          const k = n - Math.min(n, SHOW) + i;
          const newest = k === n - 1;
          return <div key={k} style={{ width: 44, height: 26, border: `1.5px solid ${INK}`, background: newest ? INK : "transparent", opacity: 0.35 + 0.65 * ((i + 1) / Math.min(n, SHOW)) }} />;
        })}
      </div>
    </div>
  );
}

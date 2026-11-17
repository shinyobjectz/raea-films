// The heat-map shots' HUD, after the director's second reference: a thin white frame, corner brackets, a small menu of
// bracketed words top left (words, never numbers: the film's readouts say what Fingerprint is doing), tabs top right,
// and dotted arcs that sweep across the picture between points it is watching. Drawn over the 3D, in IBM Plex Mono.
import { staticFile, useCurrentFrame } from "raea";

const FONTS = `@font-face { font-family: 'IBM Plex Mono'; src: url(${staticFile("fonts/IBMPlexMono-Regular.ttf")}); }
@font-face { font-family: 'IBM Plex Mono'; font-weight: 500; src: url(${staticFile("fonts/IBMPlexMono-Medium.ttf")}); }`;
const INK = "rgba(255,255,255,0.92)";
const MONO = "IBM Plex Mono";

/** `rows`: the menu's lines as [word, state]; `pick` the row with the arrow; `arcs` pairs of points (0..1 of the
 * frame) the dotted arcs join, drawn on as the shot goes; `tabs` the small boxes top right */
export function Hud({ rows, pick = 0, arcs = [], tabs = [], k = 1 }: { rows: [string, string][]; pick?: number; arcs?: [[number, number], [number, number]][]; tabs?: string[]; k?: number }) {
  const f = useCurrentFrame();
  const W = 1920, H = 1080, M = 96, TOP = 150;
  const blink = Math.floor(f / 15) % 2 === 0;
  const bracket = (x: number, y: number, sx: number, sy: number) => `M ${x} ${y + sy * 36} L ${x} ${y} L ${x + sx * 36} ${y}`;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, opacity: k }}>
      <style>{FONTS}</style>
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
        <rect x={M} y={TOP} width={W - 2 * M} height={H - TOP - M * 0.8} fill="none" stroke={INK} strokeWidth={1.5} />
        {[bracket(W / 2 - 300, H / 2 - 170, 1, 1), bracket(W / 2 + 300, H / 2 - 170, -1, 1), bracket(W / 2 - 300, H / 2 + 170, 1, -1), bracket(W / 2 + 300, H / 2 + 170, -1, -1)].map((d, i) => (
          <path key={i} d={d} fill="none" stroke={INK} strokeWidth={3} />
        ))}
        {arcs.map(([a, b], i) => {
          const x0 = a[0] * W, y0 = a[1] * H, x1 = b[0] * W, y1 = b[1] * H;
          const lift = Math.hypot(x1 - x0, y1 - y0) * 0.45;
          const cx = (x0 + x1) / 2, cy = Math.min(y0, y1) - lift;
          const drawn = Math.max(0, Math.min(1, (f - i * 6) / 40));
          return (
            <g key={i}>
              <path d={`M ${x0} ${y0} Q ${cx} ${cy} ${x1} ${y1}`} fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" strokeDasharray="0.1 9" pathLength={1000} strokeDashoffset={0} style={{ opacity: drawn }} />
              <circle cx={x0} cy={y0} r={4} fill={INK} />
              <circle cx={x1} cy={y1} r={4} fill={INK} style={{ opacity: drawn }} />
            </g>
          );
        })}
      </svg>
      <div style={{ position: "absolute", left: M + 24, top: TOP + 22, fontFamily: MONO, fontWeight: 500, fontSize: 19, lineHeight: 1.45, color: INK, letterSpacing: 1.5 }}>
        <div style={{ display: "inline-block", border: `1.5px solid ${INK}`, padding: "0 8px", marginBottom: 6 }}>FINGERPRINT</div>
        {rows.map(([w, s], i) => (
          <div key={i} style={{ whiteSpace: "nowrap" }}>
            <span style={{ display: "inline-block", width: 22, opacity: i === pick && blink ? 1 : 0 }}>▶</span>
            {w.padEnd(10, " ")} [ {s} ]
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", right: M + 24, top: TOP + 22, display: "flex", gap: 8, fontFamily: MONO, fontSize: 15, color: INK, letterSpacing: 1.5 }}>
        {tabs.map((t, i) => <div key={i} style={{ border: `1.5px solid ${INK}`, padding: "1px 8px", background: i === 0 ? INK : "transparent", color: i === 0 ? "#000" : INK }}>{t}</div>)}
      </div>
    </div>
  );
}

// Ink on paper, as React: strokes that draw on and boil on twos, a fingerprint, handwriting and typewriting.
import { staticFile } from "raea";
import { type Line, boil, clamp, hash, inked, nudge, polyline, prog, trim } from "./ink";
import { fingerprint } from "./print";

export const C = {
  paper: "#efe6d2",
  ink: "#1c1915",
  red: "#c4372b",
  blue: "#2c5aa0",
  kraft: "#b48a5a",
  tape: "#e9d9a6",
  sticky: "#f2e49a",
  green: "#3d7a4f",
  ochre: "#c8901e",
};

export const FONTS = `
@font-face { font-family: 'Caveat'; src: url(${staticFile("fonts/Caveat.ttf")}); }
@font-face { font-family: 'Special Elite'; src: url(${staticFile("fonts/SpecialElite.ttf")}); }
@font-face { font-family: 'Reenie Beanie'; src: url(${staticFile("fonts/ReenieBeanie.ttf")}); }
@font-face { font-family: 'Permanent Marker'; src: url(${staticFile("fonts/PermanentMarker.ttf")}); }
@font-face { font-family: 'DM Serif Display'; src: url(${staticFile("fonts/DMSerifDisplay.ttf")}); }
`;

/** an SVG filter that roughens edges like ink on tooth (its noise reseeded every 2 frames: the boil) */
export function InkFilter({ id, f, scale = 3, freq = 0.04 }: { id: string; f: number; scale?: number; freq?: number }) {
  return (
    <filter id={id} x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves={2} seed={Math.floor(f / 2) % 97} result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale={scale} xChannelSelector="R" yChannelSelector="G" />
    </filter>
  );
}

/** a stamp's grain: ink that didn't take, in specks and streaks */
export function GrainFilter({ id, seed = 1, amount = 0.55 }: { id: string; seed?: number; amount?: number }) {
  return (
    <filter id={id} x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9 0.6" numOctaves={3} seed={seed} result="t" />
      <feColorMatrix in="t" type="matrix" values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.6 ${2.6 * amount + 0.3}`} result="m" />
      <feComposite in="SourceGraphic" in2="m" operator="in" />
    </filter>
  );
}

export type InkProps = {
  lines: Line[];
  f: number; // frame, for the boil
  t?: number; // 0-1: how much is drawn, in order
  color?: string;
  size?: number;
  boilAmp?: number;
  k?: number; // a key for this drawing's boil
  opacity?: number;
  each?: boolean; // t applies to every line at once instead of one after another
};

/** strokes drawn on in order (t from 0 to 1 across them all, by length), boiling */
export function Ink({ lines, f, t = 1, color = C.ink, size = 3, boilAmp = 1, k = 1, opacity = 1, each = false }: InkProps) {
  const n = lines.length;
  const paths: string[] = [];
  for (let i = 0; i < n; i++) {
    const local = each ? t : clamp(t * n - i);
    if (local <= 0) continue;
    const l = boil(trim(lines[i], local), f, k * 101 + i, boilAmp);
    const d = inked(l, { size: size * (0.85 + hash(k, i) * 0.3) });
    if (d) paths.push(d);
  }
  return <path d={paths.join(" ")} fill={color} opacity={opacity} />;
}

/** thin, even lines (string, dotted paths), not pressure strokes */
export function Wire({ lines, f, t = 1, color = C.red, width = 2, dash, k = 1, boilAmp = 0.8 }: { lines: Line[]; f: number; t?: number; color?: string; width?: number; dash?: string; k?: number; boilAmp?: number }) {
  return (
    <>
      {lines.map((l, i) => {
        const tl = trim(l, clamp(t * lines.length - i));
        if (tl.length < 2) return null;
        return <path key={i} d={polyline(boil(tl, f, k * 7 + i, boilAmp))} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} />;
      })}
    </>
  );
}

const PRINT = fingerprint(3);
const PRINT_LEN = PRINT.length;

/** the fingerprint: drawn ridge by ridge (core outward) as t goes 0 to 1; `ink` darkens it like a pressed stamp */
export function Print({ f, t = 1, cx, cy, s, color = C.ink, size = 0.021, rot = 0, k = 5, words, range = [0, 1], opacity = 1, boilAmp = 0.6 }: { f: number; t?: number; cx: number; cy: number; s: number; color?: string; size?: number; rot?: number; k?: number; words?: boolean; range?: [number, number]; opacity?: number; boilAmp?: number }) {
  const ca = Math.cos(rot);
  const sa = Math.sin(rot);
  const paths: string[] = [];
  const i0 = Math.floor(range[0] * PRINT_LEN);
  const i1 = Math.floor(range[1] * PRINT_LEN);
  const shown = t * (i1 - i0);
  for (let i = i0; i < i1; i++) {
    const local = clamp(shown - (i - i0));
    if (local <= 0) break;
    const pts = trim(PRINT[i].line, local).map(([x, y]) => [cx + (x * ca - y * sa) * s, cy + (x * sa + y * ca) * s] as [number, number]);
    const d = inked(boil(pts, f, k * 1000 + i, boilAmp), { size: size * s, thinning: 0.35, taper: size * s * 1.5, pressure: (u) => 0.6 + 0.4 * Math.sin(Math.PI * u) });
    if (d) paths.push(d);
  }
  return <path d={paths.join(" ")} fill={color} opacity={(words ? 0.25 : 1) * opacity} />;
}
export const PRINT_RIDGES = PRINT;

/** handwriting: letters appear as if written (t 0-1), each nudged per frame step */
export function Hand({ text, f, t = 1, x, y, size = 64, color = C.red, rot = 0, font = "Caveat", weight = 600, k = 3, anchor = "start" }: { text: string; f: number; t?: number; x: number; y: number; size?: number; color?: string; rot?: number; font?: string; weight?: number; k?: number; anchor?: "start" | "middle" | "end" }) {
  const shown = Math.floor(clamp(t) * text.length + 0.0001);
  if (shown === 0) return null; // nothing written yet: no text at all, so the checks don't read the unwritten line
  const j = nudge(k, f, 0.8);
  return (
    <text x={x + j.x} y={y + j.y} fontFamily={font} fontSize={size} fontWeight={weight} fill={color} textAnchor={anchor} transform={`rotate(${rot + j.r} ${x} ${y})`}>
      {text.slice(0, shown)}
      <tspan fillOpacity={0}>{text.slice(shown)}</tspan>
    </text>
  );
}

/** a typewriter: one key at a time from frame `start`, every `every` frames */
export function typed(text: string, f: number, start: number, every = 3.75) {
  const n = Math.floor((f - start) / every) + 1;
  return text.slice(0, Math.max(0, Math.min(text.length, n)));
}

/** a word's write-on progress: starts at `start`, `perChar` frames a letter */
export const writeT = (f: number, start: number, chars: number, perChar = 1.6) => prog(f, start, start + chars * perChar);

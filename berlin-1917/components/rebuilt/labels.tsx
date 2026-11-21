// The Berlin film's labels, as one family: the archive's own hand. the director on v4's (11-21): "the lower thirds and labels
// really suck … very vanilla and stock". So nothing here is a flat bar or plain white type: every label is a piece of
// paper the archive could have made (an index card, a typed slip, a ledger leaf, a catalogue line with its stamp),
// typed on with a typewriter face, ruled by a red pencil, and lit like an object, with its own backing so it reads on
// the paper desk and on dark footage alike. Everything is a pure function of t (the scene's seconds).
//   Caption      lower third over a shot: an index card, the place typeset, a red rule drawn under it, the note typed
//   Tag          on the desk: a typed paper slip held by a strip of tape
//   Stat         a figure: a ledger leaf, the numerals typed, a double total rule drawn under them
//   Source       the catalogue line: a red rubber stamp, then the reference typed on a paper strip
//   Corner       the made-not-found mark (the AI and model disclosure), one small consistent badge
//   Leader       a pencil line from a label to what it names
//   ChapterCard  a chapter's title card: a tabbed index card
// Same props as berlin-rebuilt-v4.tsx's components, so they drop in; new props are optional.
import { staticFile } from "raea";
import type { ReactNode } from "react";

export const PAPER = "#f3ecdc", CARD = "#f6f0e1", SLIP = "#fbf8ef", INK = "#1d1b18", RED = "#a8322a";
const RULE = "rgba(64,100,150,0.26)", MARGIN = "rgba(168,50,42,0.55)";
export const TYPE = "'Courier Prime', 'Courier New', monospace";
export const HEAD = "'Old Standard TT', 'Old Standard', Georgia, serif";
export const NUM = "'League Gothic', 'Oswald', sans-serif";
const SHADOW = "0 12px 28px rgba(20,14,6,0.38), 0 2px 4px rgba(20,14,6,0.25), inset 0 0 38px rgba(140,100,40,0.13)";

const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const ramp = (t: number, a: number, d = 0.6) => ease((t - a) / d);
const lin = (t: number, a: number, d: number) => (t <= a ? 0 : t >= a + d ? 1 : (t - a) / d);
/** a small fixed tilt from the text itself, so slips never sit in rows like a template */
const jitter = (s: string, amp = 1) => {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9973;
  return ((h % 200) / 100 - 1) * amp;
};
/** typed text: the typed part, then the rest held invisible so the paper never resizes as it types */
function Typed({ text, p }: { text: string; p: number }) {
  const n = Math.round(text.length * Math.max(0, Math.min(1, p)));
  return (
    <>
      {text.slice(0, n)}
      <span style={{ color: "transparent" }}>{text.slice(n)}</span>
    </>
  );
}
/** seconds a line takes to type: quick, never a crawl */
const typeTime = (s: string, cps = 48) => Math.min(1.1, Math.max(0.25, s.length / cps));

/** a red pencil rule, drawn left to right from `at`, with a hand's slight wobble */
function Pencil({ w, t, at, d = 0.55, color = RED, width = 4, seed = "" }: { w: number; t: number; at: number; d?: number; color?: string; width?: number; seed?: string }) {
  const p = ramp(t, at, d);
  if (p <= 0) return null;
  const j = jitter(seed || String(w), 2.2);
  const path = `M2 ${6 + j * 0.3} C ${w * 0.3} ${3 - j}, ${w * 0.62} ${9 + j}, ${w - 2} ${5 - j * 0.4}`;
  return (
    <svg width={w} height={14} style={{ display: "block", overflow: "visible" }}>
      <path d={path} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={`${w * 1.05} ${w * 1.05}`} strokeDashoffset={w * 1.05 * (1 - p)} opacity={0.88} />
    </svg>
  );
}

export function Fonts() {
  return (
    <style>{`
      @font-face { font-family: 'League Gothic'; src: url(${staticFile("fonts/LeagueGothic.ttf")}); }
      @font-face { font-family: 'Old Standard TT'; font-weight: 700; src: url(${staticFile("fonts/OldStandard-Bold.ttf")}); }
      @font-face { font-family: 'Courier Prime'; font-weight: 400; src: url(${staticFile("fonts/CourierPrime-Regular.ttf")}); }
      @font-face { font-family: 'Courier Prime'; font-weight: 700; src: url(${staticFile("fonts/CourierPrime-Bold.ttf")}); }
    `}</style>
  );
}

/** index-card ruling: blue lines on the card, under a red header rule */
const ruled = (top: number, step = 34, header = true) => ({
  backgroundColor: CARD,
  backgroundImage: `linear-gradient(${header ? MARGIN : "transparent"}, ${header ? MARGIN : "transparent"}), repeating-linear-gradient(to bottom, transparent 0, transparent ${step - 2}px, ${RULE} ${step - 2}px, ${RULE} ${step}px)`,
  backgroundSize: `100% 2px, 100% 100%`,
  backgroundPosition: `0 ${top}px, 0 ${top + 2}px`,
  backgroundRepeat: "no-repeat, repeat",
});

/** a place and what made it, over a shot, bottom left: an index card slid up from below.
 *  ref: an accession line typed small at the card's head (a plate's number, an archive), optional */
export function Caption({ place, source, t, at, out, ref }: { place: string; source?: string; t: number; at: number; out?: number; ref?: string }) {
  const p = ramp(t, at, 0.5), q = out == null ? 0 : ramp(t, out, 0.4);
  if (p <= 0 || q >= 1) return null;
  const placeW = Math.min(1040, Math.round(place.length * 0.5 * 60) + 10);
  const head = ref ? 44 : 14;
  return (
    <div style={{ position: "absolute", left: 90, bottom: 134, transform: `translateY(${(1 - p) * 46 + q * 24}px) rotate(${-0.7 + jitter(place, 0.4)}deg)`, transformOrigin: "0 100%", opacity: Math.min(1, p * 1.6) * (1 - q) }}>
      <div style={{ ...ruled(head + 70), padding: `${ref ? 12 : 16}px 30px 14px 30px`, minWidth: 560, maxWidth: 1120, boxShadow: SHADOW, borderRadius: 4 }}>
        {ref ? <div style={{ fontFamily: TYPE, fontSize: 24, color: "rgba(29,27,24,0.72)", letterSpacing: 1, marginBottom: 6 }}><Typed text={ref} p={lin(t, at + 0.1, typeTime(ref))} /></div> : null}
        <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 60, lineHeight: 1.05, color: INK }}>{place}</div>
        <Pencil w={placeW} t={t} at={at + 0.3} seed={place} />
        {source ? <div style={{ fontFamily: TYPE, fontSize: 30, lineHeight: 1.25, color: INK, marginTop: 6 }}><Typed text={source} p={lin(t, at + 0.55, typeTime(source))} /></div> : null}
      </div>
    </div>
  );
}

/** a label on the desk: a typed paper slip held by a strip of tape, sliding down onto the desk at `at`.
 *  size: v4's League Gothic size, turned into the typewriter's (so v4's call sites keep their scale) */
export function Tag({ x, y, text, t, at, out, size = 46, rot = 0, anchor = "left", red = false }: { x: number; y: number; text: string; t: number; at: number; out?: number; size?: number; rot?: number; anchor?: "left" | "center" | "right"; red?: boolean }) {
  const p = ramp(t, at, 0.32), q = out == null ? 0 : ramp(t, out, 0.3);
  if (p <= 0 || q >= 1) return null;
  const fs = Math.round(Math.max(26, size * 0.68));
  // placed by the slip's estimated width (Courier is 0.6 em a character), never by a percent translate (raea check
  // reads a wrapper's text against the bare desk beside it, not its own paper)
  const wide = text.length * fs * 0.6 + 40;
  const left = anchor === "center" ? x - wide / 2 : anchor === "right" ? x - wide : x;
  const tilt = rot + jitter(text, 1.1);
  return (
    <div style={{ position: "absolute", left, top: y, transform: `translateY(${(1 - p) * -22 + q * -10}px) rotate(${tilt}deg)`, opacity: Math.min(1, p * 1.5) * (1 - q) }}>
      <div style={{ position: "relative", background: SLIP, padding: `${Math.round(fs * 0.36)}px 20px ${Math.round(fs * 0.3)}px`, boxShadow: "0 8px 18px rgba(30,20,8,0.30), 0 1px 2px rgba(30,20,8,0.3)", borderLeft: `5px solid ${red ? RED : "rgba(29,27,24,0.85)"}` }}>
        <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: fs, lineHeight: 1.1, color: INK, whiteSpace: "nowrap" }}><Typed text={text} p={lin(t, at + 0.12, typeTime(text, 60))} /></div>
        <div style={{ position: "absolute", left: 18, top: -11, width: 64, height: 22, background: "rgba(232,221,184,0.78)", boxShadow: "0 1px 2px rgba(0,0,0,0.12)", transform: `rotate(${-6 + jitter(text + "t", 3)}deg)` }} />
      </div>
    </div>
  );
}

/** figures, top left: ledger leaves, a red margin, the numerals typed and a double total rule drawn under them */
export function Stat({ items, t }: { items: { at: number; n?: string; label: string; red?: boolean; out?: number }[]; t: number }) {
  return (
    <div style={{ position: "absolute", left: 90, top: 140, display: "flex", flexDirection: "column", gap: 18, alignItems: "flex-start" }}>
      {items.map((it, i) => {
        const p = ramp(t, it.at, 0.35), q = it.out == null ? 0 : ramp(t, it.out, 0.3);
        if (p <= 0 || q >= 1) return null;
        const nW = it.n ? Math.round(it.n.length * 0.56 * 116) + 8 : 0;
        return (
          <div key={i} style={{ transform: `translateX(${(1 - p) * -60 + q * -40}px) rotate(${jitter(it.label, 0.6)}deg)`, opacity: Math.min(1, p * 1.5) * (1 - q) }}>
            <div style={{ ...ruled(0, 38), backgroundImage: `linear-gradient(to right, transparent 26px, ${MARGIN} 26px, ${MARGIN} 28px, transparent 28px), repeating-linear-gradient(to bottom, transparent 0, transparent 36px, ${RULE} 36px, ${RULE} 38px)`, backgroundSize: "100% 100%, 100% 100%", backgroundPosition: "0 0, 0 0", padding: "10px 30px 14px 46px", boxShadow: SHADOW, maxWidth: 900 }}>
              {it.n ? (
                <>
                  <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 116, lineHeight: 1, color: it.red ? RED : INK, whiteSpace: "nowrap" }}><Typed text={it.n} p={lin(t, it.at + 0.1, typeTime(it.n, 18))} /></div>
                  <Pencil w={Math.min(840, nW)} t={t} at={it.at + 0.35} d={0.45} color={it.red ? RED : INK} width={3} seed={it.n} />
                  <div style={{ marginTop: -6 }}><Pencil w={Math.min(840, nW)} t={t} at={it.at + 0.45} d={0.45} color={it.red ? RED : INK} width={3} seed={it.n + "2"} /></div>
                </>
              ) : null}
              <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 32, lineHeight: 1.2, color: INK, marginTop: it.n ? 6 : 0, maxWidth: 820 }}><Typed text={it.label} p={lin(t, it.at + (it.n ? 0.4 : 0.1), typeTime(it.label))} /></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** the catalogue line, bottom left: a red rubber stamp lands, then the reference types on a paper strip.
 *  light: over footage (the strip goes a shade more opaque; the stamp is the same everywhere) */
export function Source({ text, t, at = 0, out, light = false }: { text: string; t: number; at?: number; out?: number; light?: boolean }) {
  const p = ramp(t, at, 0.3), q = out == null ? 0 : ramp(t, out, 0.3);
  if (p <= 0 || q >= 1) return null;
  const stamp = lin(t, at, 0.16);
  return (
    <div style={{ position: "absolute", left: 90, bottom: 134, display: "flex", alignItems: "center", gap: 14, opacity: (1 - q), maxWidth: 1240 }}>
      <div style={{ flex: "none", fontFamily: NUM, fontSize: 30, letterSpacing: 4, color: RED, border: `3px solid ${RED}`, padding: "3px 10px 1px", background: light ? "rgba(246,240,225,0.94)" : "rgba(246,240,225,0.6)", transform: `rotate(-3deg) scale(${1.3 - 0.3 * ease(stamp)})`, opacity: stamp > 0 ? 0.92 : 0 }}>SOURCE</div>
      <div style={{ background: light ? "rgba(246,240,225,0.95)" : "rgba(250,246,236,0.9)", padding: "6px 14px 5px", fontFamily: TYPE, fontSize: 26, lineHeight: 1.25, color: INK, boxShadow: "0 3px 10px rgba(20,14,6,0.22)", opacity: Math.min(1, p * 1.4), maxWidth: 1090 }}>
        <Typed text={text} p={lin(t, at + 0.15, Math.min(1.6, text.length / 70))} />
      </div>
    </div>
  );
}

/** made, not found: the disclosure on every AI-finished or modelled shot, bottom right, one small badge (wording kept
 *  exactly as the caller gives it) */
export function Corner({ text, o = 1 }: { text: string; o?: number }) {
  if (o <= 0) return null;
  return (
    <div style={{ position: "absolute", right: 90, bottom: 134, opacity: o, display: "flex", alignItems: "center", gap: 10, background: "rgba(246,240,225,0.9)", padding: "5px 14px 3px 10px", boxShadow: "0 3px 10px rgba(0,0,0,0.3)", borderLeft: `4px solid ${RED}` }}>
      <div style={{ width: 16, height: 16, borderRadius: 8, border: `2.5px solid ${RED}`, position: "relative", flex: "none" }}>
        <div style={{ position: "absolute", left: 5, top: -5, width: 1.5, height: 22, background: RED }} />
        <div style={{ position: "absolute", left: -5, top: 5, width: 22, height: 1.5, background: RED }} />
      </div>
      <div style={{ fontFamily: NUM, fontSize: 28, letterSpacing: 2, color: INK, textTransform: "uppercase", whiteSpace: "nowrap" }}>{text}</div>
    </div>
  );
}

/** a pencil line from a label to what it names, drawn from `at`, a dot where it lands (in the parent's px) */
export function Leader({ from, to, t, at, out, color = RED, width = 3 }: { from: [number, number]; to: [number, number]; t: number; at: number; out?: number; color?: string; width?: number }) {
  const p = ramp(t, at, 0.5), q = out == null ? 0 : ramp(t, out, 0.3);
  if (p <= 0 || q >= 1) return null;
  const [x0, y0] = from, [x1, y1] = to;
  const mx = (x0 + x1) / 2 + (y1 - y0) * 0.12, my = (y0 + y1) / 2 - (x1 - x0) * 0.12;
  const len = Math.hypot(x1 - x0, y1 - y0) * 1.1 + 10;
  const l = Math.min(x0, x1) - 20, tp = Math.min(y0, y1) - 20;
  return (
    <svg style={{ position: "absolute", left: l, top: tp, overflow: "visible", opacity: 1 - q }} width={Math.abs(x1 - x0) + 40} height={Math.abs(y1 - y0) + 40}>
      <path d={`M${x0 - l} ${y0 - tp} Q ${mx - l} ${my - tp} ${x1 - l} ${y1 - tp}`} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={`${len} ${len}`} strokeDashoffset={len * (1 - p)} opacity={0.9} />
      <circle cx={x1 - l} cy={y1 - tp} r={7 * ramp(t, at + 0.4, 0.2)} fill="none" stroke={color} strokeWidth={width} opacity={0.9} />
    </svg>
  );
}

/** a chapter's title card, centred: a tabbed index card, the number typed in its tab, the title set, a red rule */
export function ChapterCard({ n, title, t, at, out, children }: { n: string; title: string; t: number; at: number; out?: number; children?: ReactNode }) {
  const p = ramp(t, at, 0.55), q = out == null ? 0 : ramp(t, out, 0.45);
  if (p <= 0 || q >= 1) return null;
  const w = Math.max(700, Math.min(1500, title.length * 58 + 150));
  return (
    <div style={{ position: "absolute", left: 960 - w / 2, top: 360, width: w, transform: `translateY(${(1 - p) * 60 - q * 30}px) rotate(${-0.6 + jitter(title, 0.5)}deg)`, opacity: Math.min(1, p * 1.5) * (1 - q) }}>
      <div style={{ position: "absolute", left: 40, top: -46, height: 48, padding: "8px 26px 0", background: CARD, borderRadius: "6px 6px 0 0", fontFamily: TYPE, fontWeight: 700, fontSize: 28, color: RED, letterSpacing: 2 }}><Typed text={n} p={lin(t, at + 0.6, typeTime(n))} /></div>
      <div style={{ ...ruled(0, 40, false), padding: "26px 56px 30px", boxShadow: SHADOW, borderRadius: "0 4px 4px 4px" }}>
        <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 96, lineHeight: 1.0, color: INK }}>{title}</div>
        <div style={{ marginTop: 6 }}><Pencil w={Math.min(w - 112, title.length * 50)} t={t} at={at + 0.45} d={0.7} width={5} seed={title} /></div>
        {children}
      </div>
    </div>
  );
}

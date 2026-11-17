// The words on the picture, in raea's type (Geist, Geist Mono), laid over the frame in the graybox (the build draws
// them into the picture with the print's shader): the prompts typed at the generator in act one, the slams, a change's
// own words (let it breathe, its letters drifting apart as the sea slows; turn, turning with the plant), and the card.
// Also the placeholders for the app's pictures, each saying it is one, and the word that lies on the road.
import { AbsoluteFill, Img, staticFile } from "raea";
import { FPS, FRAMES, PROMPTS, SLAMS, SLOW, TYPE_EVERY, WORDS, H, W } from "./plan";
import { plantYaw } from "./glass";
import type { Comment } from "./plan";

export const FONT = "GeistStay, sans-serif";
export const MONO = "GeistMonoStay, monospace";
export const FACE = `@font-face { font-family: GeistStay; src: url(${staticFile("fonts/Geist.ttf")}); font-weight: 100 900; }
@font-face { font-family: GeistMonoStay; src: url(${staticFile("fonts/GeistMono.ttf")}); font-weight: 100 900; }`;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** what's typed of the prompt at `t`, and whether the caret shows */
function prompt(t: number) {
  const p = PROMPTS.find((x) => t >= x.from - 0.3 && t < x.until);
  if (!p) return null;
  const every = p.every ?? TYPE_EVERY;
  const n = Math.max(0, Math.min(p.text.length, Math.floor((t - p.from) / every) + 1));
  const done = n >= p.text.length;
  const caret = !done || Math.floor((t - p.from - p.text.length * every) / 0.45) % 2 === 0;
  return { text: p.text.slice(0, t < p.from ? 0 : n), caret };
}

export function Words({ t }: { t: number }) {
  const p = prompt(t);
  const slam = SLAMS.find((s) => t >= s.t && t < s.until);
  const breathe = WORDS[0], turn = WORDS[1];
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <style>{FACE}</style>
      {p && (
        <div style={{ position: "absolute", left: 0, right: 0, top: H * 0.78, display: "flex", justifyContent: "center", fontFamily: MONO, fontSize: 34, color: "#ffffff", whiteSpace: "pre" }}>
          <span style={{ opacity: 0.55 }}>{"› "}</span>
          <span>{p.text}</span>
          {/* the caret: a bar, not a glyph, taking no width so the line holds still */}
          <span style={{ position: "relative", width: 0 }}>
            <span style={{ position: "absolute", left: 3, top: "0.14em", width: "0.48em", height: "1em", background: "#ffffff", opacity: p.caret ? 1 : 0 }} />
          </span>
        </div>
      )}
      {slam && (() => {
        const a = t - slam.t;
        const s = 1.25 - 0.25 * clamp01(a / (2 / 30)) + 0.03 * a;
        return (
          <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
            <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 150, letterSpacing: -4, color: "#ffffff", transform: `scale(${s})`, whiteSpace: "nowrap" }}>{slam.text}</span>
          </AbsoluteFill>
        );
      })()}
      {t >= breathe.from && t < breathe.until && (() => {
        const k = clamp01((t - SLOW.from) / (breathe.until - SLOW.from));
        return (
          <div style={{ position: "absolute", left: 0, right: 0, top: H * 0.2, display: "flex", justifyContent: "center", fontFamily: FONT, fontWeight: 300, fontSize: 92, letterSpacing: `${0.02 + 0.36 * k}em`, color: "#ffffff", opacity: clamp01((t - breathe.from) / 0.5) * 0.92, whiteSpace: "nowrap" }}>{breathe.text}</div>
        );
      })()}
      {t >= turn.from && t < turn.until && (
        <div style={{ position: "absolute", left: W * 0.5, top: H * 0.16, display: "flex", justifyContent: "center", fontFamily: FONT, fontWeight: 900, fontSize: 190, color: "#ffffff", transform: `translateX(-50%) scaleX(${Math.cos(plantYaw(t)).toFixed(3)})` }}>{turn.text}</div>
      )}
    </AbsoluteFill>
  );
}

/** the end card: raea's lockup, the release under it. It holds 2.5 s (nothing stands still 3 s without a reason),
 *  then fades with the song's ring-out to black on its last frame; the lockup drifts a hair closer all the while */
export const CARD_HOLD = 2.5;
export function EndCard({ t, from }: { t: number; from: number }) {
  const out = from + 0.6 + CARD_HOLD;
  const a = clamp01((t - from) / 0.6) * (1 - clamp01((t - out) / (FRAMES / FPS - out)));
  const s = 1 + 0.035 * clamp01((t - from) / (FRAMES / FPS - from));
  return (
    <AbsoluteFill style={{ background: "#000000", justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 34, transform: `scale(${s.toFixed(5)})` }}>
      <style>{FACE}</style>
      <Img src={staticFile("brand/raea-lockup.png")} style={{ width: 640, height: (640 * 596) / 1664, opacity: a }} />
      <span style={{ fontFamily: MONO, fontWeight: 500, fontSize: 24, letterSpacing: 5, color: "#ffffff", opacity: 0.8 * a, marginRight: -5 }}>0.1.1 · MAC · WINDOWS · LINUX</span>
    </AbsoluteFill>
  );
}

// ---- placeholders (tools/ph.sh renders them to media/ph) ----------------------------------------------------------
const PH = { border: "4px dashed rgba(255,255,255,0.55)", tag: { fontFamily: MONO, fontWeight: 500, letterSpacing: 4, color: "#ffffff", opacity: 0.6 } };
/** a comment's card until the real app's is captured: plainly a placeholder, never drawn to pass for the app */
export function CommentPlaceholder({ c }: { c: Comment }) {
  return (
    <AbsoluteFill style={{ background: "#141416", border: PH.border, borderRadius: 28, padding: "30px 40px", flexDirection: "column", gap: 14 }}>
      <style>{FACE}</style>
      <span style={{ ...PH.tag, fontSize: 22 }}>PLACEHOLDER · COMMENT {c.n} · THE APP'S CARD GOES HERE</span>
      <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 46, lineHeight: 1.12, color: "#ffffff" }}>{c.text}</span>
    </AbsoluteFill>
  );
}
/** what each of the app's screens will show, said on its placeholder */
export const SCREEN_SAYS: Record<string, string> = {
  "watch-sea": "Watch: the film so far, the sea's frame in the viewer, comment 1 resolved in its thread",
  "watch-canyon": "Watch: a canyon frame in the viewer, where the cursor pins comment 2",
  "tools-2": "The agent's tool log on comment 2: read, edit the sun to 6°, render, check",
  "tools-4": "The agent's tool log on comment 4: read, edit the plant's rotation, render, check",
  inspect: "Play: the plant picked, its Inspector card open",
  timeline: "Watch's timeline: all six comments from the film, resolved",
};
export function ScreenPlaceholder({ name }: { name: string }) {
  return (
    <AbsoluteFill style={{ background: "#0c0c0e" }}>
      <style>{FACE}</style>
      <div style={{ position: "absolute", left: 56, top: 56, right: 56, bottom: 56, borderRadius: 28, border: PH.border, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 110px", gap: 34 }}>
        <span style={{ ...PH.tag, fontSize: 34 }}>PLACEHOLDER · A CAPTURE OF THE RAEA APP GOES HERE</span>
        <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 92, lineHeight: 1.05, color: "#ffffff" }}>{SCREEN_SAYS[name]}</span>
      </div>
    </AbsoluteFill>
  );
}
/** a word as a picture, white on clear, for a word laid in the 3D (wetter, on the road) */
export function WordPicture({ text }: { text: string }) {
  return (
    <AbsoluteFill style={{ background: "transparent", justifyContent: "center", alignItems: "center" }}>
      <style>{FACE}</style>
      <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 300, letterSpacing: -8, color: "#ffffff" }}>{text}</span>
    </AbsoluteFill>
  );
}

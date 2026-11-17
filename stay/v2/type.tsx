// Graybox v2's words on the picture: the line typed at the generator (mono, on the lower thirds line) and the slams.
// the director, 11-11: "the opening prompt things are dumb the dont make sense" and "text like golden hour should gave some
// war effects": the prompts now tell the generator's side of it in plain words, a line a reroll, and a slam arrives
// warped (each letter stretched and sheared, settling in a wave) and, when it names a light, in that light's colour.
import { AbsoluteFill } from "raea";
import { FACE, FONT, MONO } from "../parts/type";
import { H, W } from "./plan";
import { clamp01 } from "./math";

/** the generator's prompt: each line types over the last from its `from` (seconds), a letter every 45 ms */
/** `busy`: seconds from which the generator is working on the line (a bar runs under it) until its picture comes */
export function Prompt({ lines, t, until = Infinity, busy }: { lines: { text: string; from: number }[]; t: number; until?: number; busy?: [number, number][] }) {
  const live = [...lines].reverse().find((l) => t >= l.from);
  if (!live || t >= until) return null;
  const n = Math.max(0, Math.min(live.text.length, Math.floor((t - live.from) / 0.045) + 1));
  const done = n >= live.text.length;
  const work = (busy ?? []).find(([a, b]) => t >= a && t < b);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <style>{FACE}</style>
      <div style={{ position: "absolute", left: 0, width: W, top: H * (2 / 3) - 34, display: "flex", justifyContent: "center" }}>
        <div style={{ position: "relative", overflow: "hidden", display: "flex", padding: "10px 26px", borderRadius: 14, background: "rgba(0,0,0,0.62)", fontFamily: MONO, fontSize: 52, color: "#fff", whiteSpace: "pre" }}>
          <span style={{ opacity: 0.55 }}>{"› "}</span><span>{live.text.slice(0, n)}</span>
          {work && <span style={{ position: "absolute", left: `${((((t - work[0]) / 0.9) % 1) * 130 - 30).toFixed(1)}%`, bottom: 0, width: "30%", height: 4, background: "#fff", opacity: 0.8 }} />}
          <span style={{ position: "relative", width: 0 }}><span style={{ position: "absolute", left: 3, top: "0.14em", width: "0.48em", height: "1em", background: "#fff", opacity: !done || Math.floor(t / 0.45) % 2 === 0 ? 1 : 0 }} /></span>
        </div>
      </div>
    </AbsoluteFill>
  );
}

const mix = (a: number[], b: number[], k: number) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(",")})`;
/** a slam: big bold type that arrives warped. Each letter comes in stretched tall and sheared, a wave running along
 *  the word as it settles; `warm` sets it in a low sun's colours (pale gold at the top of the wave to deep orange) */
export function Slam({ text, t, from, warm = false, size = 150 }: { text: string; t: number; from: number; warm?: boolean; size?: number }) {
  if (t < from) return null;
  const a = t - from;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", pointerEvents: "none" }}>
      <style>{FACE}</style>
      <div style={{ display: "flex", fontFamily: FONT, fontWeight: 900, fontSize: size, letterSpacing: -4, whiteSpace: "pre", transform: `scale(${(1 + 0.03 * a).toFixed(4)})` }}>
        {[...text].map((ch, i) => {
          const k = clamp01((a - i * 0.022) / 0.34), e = 1 - (1 - k) ** 3;
          // the warp: tall and leaning as it lands, then a small standing wave that dies away
          const wave = Math.sin(a * 7 - i * 0.7) * 0.06 * Math.exp(-a * 1.6);
          const sy = 1 + (1 - e) * 1.9 + wave, skew = (1 - e) * -32 + wave * 60, dy = (1 - e) * -70 + wave * -90;
          const heat = warm ? clamp01(0.5 + 0.5 * Math.sin(a * 2.2 - i * 0.55)) : 0;
          return <span key={i} style={{ display: "inline-block", transformOrigin: "50% 100%", transform: `translateY(${dy.toFixed(1)}px) skewX(${skew.toFixed(2)}deg) scaleY(${sy.toFixed(3)})`, opacity: k > 0 ? 1 : 0, color: warm ? mix([255, 236, 170], [255, 138, 46], heat) : "#ffffff", textShadow: warm ? `0 0 ${(26 + 18 * heat).toFixed(0)}px rgba(255,120,20,0.55)` : "none" }}>{ch}</span>;
        })}
      </div>
    </AbsoluteFill>
  );
}

/** the film's sentence, a line a place, set INTO the place: flat type on a clear sheet standing in the scene, so the
 *  room's own things cut into it by depth and it slides behind them as the camera moves. Each letter comes up from
 *  below its line, stretched and leaning, and settles in a small wave (the warp); `out` (seconds) drops them away.
 *  Put it inside the shot's <Canvas3D>. `wide` is the sheet's width in metres, `turn` its turn about y. */
import { Screen } from "raea/3d";
export function Word3D({ text, t, from, out = Infinity, at, wide, turn = 0, color = "#ffffff", name = "word" }: { text: string; t: number; from: number; out?: number; at: [number, number, number]; wide: number; turn?: number; color?: string; name?: string }) {
  const a = t - from, RES: [number, number] = [2400, 420];
  const size = Math.min(330, (RES[0] * 0.96) / (text.length * 0.6));
  return (
    <Screen name={name} crt={false} background="transparent" resolution={RES} size={[wide]} position={at} rotation={[0, turn, 0]}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <style>{FACE}</style>
        <div style={{ display: "flex", fontFamily: FONT, fontWeight: 900, fontSize: size, letterSpacing: -size * 0.03, whiteSpace: "pre", color }}>
          {[...text].map((ch, i) => {
            const k = clamp01((a - i * 0.035) / 0.42), e = 1 - (1 - k) ** 3;
            const gone = clamp01((t - out - i * 0.02) / 0.3), g = gone * gone;
            const wave = Math.sin(a * 6 - i * 0.7) * 0.05 * Math.exp(-Math.max(0, a) * 1.4);
            const sy = 1 + (1 - e) * 1.2 + wave, skew = (1 - e) * -24 + wave * 50, dy = (1 - e) * size * 1.15 + g * size * 1.3;
            return <span key={i} style={{ display: "inline-block", transformOrigin: "50% 100%", transform: `translateY(${dy.toFixed(1)}px) skewX(${skew.toFixed(2)}deg) scaleY(${sy.toFixed(3)})`, opacity: a > i * 0.035 && gone < 1 ? 1 : 0 }}>{ch}</span>;
          })}
        </div>
      </AbsoluteFill>
    </Screen>
  );
}

// v2's motion graphics (the director on v1, 11-13: "more motion graphics, less stock footage"): what a line describes, drawn
// in heat. Each shot is unlit slabs and type whose grey is their temperature (thermal/hot.tsx heat()), seen through
// the same heat pass as the type, with the HUD's marks (thermal/marks.tsx) pinned to them. Clip cards warm when
// they're liked, cool and fall when thrown away; a mark is the hottest thing in a frame; a disguised flaw is a cold
// cover with the heat still showing through. Cues are frames of the shot (the film computes them from the words).
import { useCurrentFrame } from "raea";
import { ToneMapping } from "raea/3d";
import { Camera3d } from "raea/camera";
import { Cuboid, Mesh3d } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Text3D } from "raea/text";
import { Quat, Transform } from "raea/transform";
import { Heat, type HeatPalette } from "./heat";
import { heat } from "./temp";
import { Box, Panel, Tag } from "./marks";

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => { const k = clamp01(x); return k * k * (3 - 2 * k); };
const outCubic = (x: number) => 1 - (1 - clamp01(x)) ** 3;
/** a value going from a to b over `dur` frames from frame t0 */
const ramp = (f: number, t0: number, dur: number, a: number, b: number) => a + (b - a) * ease((f - t0) / dur);

const TAN = Math.tan(Math.PI / 8); // the camera's 45 degree vertical field of view
/** where a point of the shot's world lands on screen (pixels), the camera at (0, 0, cz) looking down -z */
const px = (x: number, y: number, cz: number, z = 0): [number, number] => {
  const k = 540 / ((cz - z) * TAN);
  return [960 + x * k, 540 - y * k];
};

/** a screen point as a Tag's x and y */
const at = ([x, y]: [number, number]) => ({ x, y });

/** a slab of one temperature */
/** a slab of one temperature; its size is fixed by its first frame (a shape keeps its first frame's size in a
 * render), so it grows by `s` (both ways), `sx` and `sy` */
export function Slab({ name, x, y, z = 0, w, h, t, s = 1, sx = 1, sy = 1, rot = 0, alpha = 1 }: { name: string; x: number; y: number; z?: number; w: number; h: number; t: number; s?: number; sx?: number; sy?: number; rot?: number; alpha?: number }) {
  return (
    <Mesh3d name={name} transform={Transform.fromXyz(x, y, z).withRotation(Quat.fromRotationZ(rot)).withScale([s * sx, s * sy, 1])}>
      <Cuboid half_size={[w / 2, h / 2, 0.02]} />
      {alpha < 1 ? <StandardMaterial base_color={heat(t, alpha)} unlit alpha_mode="Blend" /> : <StandardMaterial base_color={heat(t)} unlit />}
    </Mesh3d>
  );
}

/** a clip's thumbnail in heat: a frame, the picture a little cooler, its lower part (the subject) warmer */
export function Card({ name, x, y, z = 0, w, h, t, s = 1, rot = 0, look = 0 }: { name: string; x: number; y: number; z?: number; w: number; h: number; t: number; s?: number; rot?: number; look?: number }) {
  const i = 0.07;
  const band = 0.4 + 0.15 * Math.sin(look * 2.3); // the subject's share of the picture's height
  const ih = h - 2 * i;
  return (
    <>
      <Slab name={`${name}-frame`} x={x} y={y} z={z} w={w} h={h} t={t} s={s} rot={rot} />
      <Slab name={`${name}-pic`} x={x} y={y} z={z + 0.03} w={w - 2 * i} h={ih} t={t * 0.55} s={s} rot={rot} />
      <Slab name={`${name}-subject`} x={x + Math.cos(look) * w * 0.15 * s} y={y - (ih * (1 - band) * s) / 2} z={z + 0.05} w={w * 0.4} h={ih * band} t={t * 0.85} s={s} rot={rot} />
    </>
  );
}

/** the pass and the camera every motion graphic shares: black is cold, white is the hottest */
function Stage({ f, cz, palette = "flare", children }: { f: number; cz: number; palette?: HeatPalette; children: React.ReactNode }) {
  return (
    <>
      <Camera3d transform={Transform.fromXyz(0, 0, cz).lookingAt([0, 0, 0])} />
      {children}
      <Heat frame={f} recipe={{ lum: 1, gamma: 1 }} floor={0.02} gain={1.05} palette={palette} />
      <ToneMapping mode="none" />
    </>
  );
}

const FONT = "IBM Plex Mono";
/** a mono caption typed on at the top left, like the HUD's */
function Caption({ text, at, f }: { text: string; at: number; f: number }) {
  const n = Math.max(0, Math.floor((f - at) * 1.6));
  if (n <= 0) return null;
  return <div style={{ position: "absolute", left: 130, top: 150, fontFamily: FONT, fontWeight: 500, fontSize: 24, letterSpacing: 6, color: "rgba(255,255,255,0.85)", whiteSpace: "pre" }}>{text.slice(0, n).toUpperCase()}</div>;
}

/** 02: "The cuts you warm to. The notes you leave. The takes you throw away." A row of clips on a timeline; one
 * warms white-hot, a note drops onto another, the last cools and falls off. */
export function Warm({ warm, notes, takes, away, span }: { warm: number; notes: number; takes: number; away: number; span: number }) {
  const f = useCurrentFrame();
  const cz = 9.4 - 0.5 * ease(f / span);
  const X = [-5, -2.5, 0, 2.5, 5];
  const Y = 0.35, W = 2.1, H = 1.2;
  const fall = Math.max(0, (f - away) / 30);
  const pinY = 3.6 - (3.6 - 1.12) * clamp01((f - (notes - 7)) / 7) ** 2;
  const play = -6.2 + 12.4 * (f / span);
  return (
    <Stage f={f} cz={cz}>
      <Slab name="timeline" x={0} y={-0.62} w={13.5} h={0.03} t={0.32} />
      <Slab name="playhead" x={play} y={0.2} z={0.12} w={0.025} h={1.9} t={0.62} />
      {X.map((x, i) => {
        const inn = outCubic((f - 2 - i * 3) / 12);
        let t = 0.3 * inn + 0.02 * Math.sin(f * 0.11 + i);
        let y = Y, rot = 0, z = 0;
        if (i === 1) { t = ramp(f, warm - 3, 14, t, 1.0); z = 0.3 * ease((f - warm) / 14); }
        if (i === 3) t = ramp(f, notes, 12, t, 0.5);
        if (i === 4) { t = ramp(f, takes, 14, t, 0.05); y = Y - 9.8 * 0.5 * fall * fall * 2.2; rot = -1.1 * fall; }
        return <Card key={i} name={`w${i}`} x={x} y={y - 0.25 * (1 - inn)} z={z} w={W} h={H} t={t} s={0.9 + 0.1 * inn} rot={rot} look={i} />;
      })}
      {f >= notes - 7 ? <><Slab name="pin" x={2.5} y={pinY} z={0.2} w={0.2} h={0.2} t={0.95} /><Slab name="pin-stem" x={2.5} y={pinY - 0.2} z={0.2} w={0.035} h={0.24} t={0.8} /></> : null}
      <Tag {...at(px(-2.5, Y + H / 2 + 0.05, cz, 0.3))} dx={-90} dy={-160} text="warm to" at={warm + 8} solid />
      <Tag {...at(px(2.5, 1.22, cz, 0.2))} dx={90} dy={-150} text="“tighten this”" at={notes + 3} />
      <Tag {...at(px(5, Y - H / 2, cz))} dx={-130} dy={200} text="thrown away" at={takes + 4} out={away + 16} />
    </Stage>
  );
}
/** Lines of words in heat, each lit as it's said: 04d (what it reads: a note, a script, a brief) and 05 (an axis
 * named in your words, looked for from day one) */
export function Words({ lines, cues, caption, span }: { lines: string[]; cues: number[]; caption: string; span: number }) {
  const f = useCurrentFrame();
  const cz = 9 - 0.4 * ease(f / span);
  return (
    <Stage f={f} cz={cz}>
      {lines.map((l, i) => {
        const k = cues[i];
        const t = f < k ? 0 : ramp(f, k, 6, 0, 1) - ramp(f, k + 10, 24, 0, 0.3);
        return (
          <Mesh3d key={i} name={`note-${i}`} transform={Transform.fromXyz(-0.4 + i * 0.4, 1.15 - i * 1.15 + 0.2 * ease(f / span), 0)}>
            <Text3D size={0.52} depth={0.02} weight={500}>{l}</Text3D>
            <StandardMaterial base_color={heat(t)} unlit />
          </Mesh3d>
        );
      })}
      <Caption text={caption} at={cues[0] - 4} f={f} />
    </Stage>
  );
}

/** 07: "Pick one version over another, and it learns why one wins." A and B; B goes white-hot, A goes cold. */
export function Pick({ pick, why, span }: { pick: number; why: number; span: number }) {
  const f = useCurrentFrame();
  const cz = 9 - 0.35 * ease(f / span);
  const inn = outCubic(f / 12);
  const W = 3.6, H = 2.1;
  const b = ramp(f, pick, 10, 0.42, 0.85), a = ramp(f, pick, 14, 0.42, 0.1);
  const az = -0.9 * ease((f - pick) / 16), bz = 0.25 * ease((f - pick) / 12);
  return (
    <Stage f={f} cz={cz}>
      <Card name="a" x={-2.45 - 0.25 * ease((f - pick) / 16)} y={0.1} z={az} w={W} h={H} t={a * inn} s={0.92 + 0.08 * inn} look={0.4} />
      <Card name="b" x={2.45} y={0.1} z={bz} w={W} h={H} t={b * inn} s={0.92 + 0.08 * inn} look={2.1} />
      <Mesh3d name="a-letter" transform={Transform.fromXyz(-2.45 - 0.25 * ease((f - pick) / 16), 0.1, az + 0.1)}><Text3D size={1.1} depth={0.02} weight={700}>A</Text3D><StandardMaterial base_color={heat(Math.min(1, a * 1.5) * inn)} unlit /></Mesh3d>
      <Mesh3d name="b-letter" transform={Transform.fromXyz(2.45, 0.1, bz + 0.1)}><Text3D size={1.1} depth={0.02} weight={700}>B</Text3D><StandardMaterial base_color={heat(Math.min(1, b * 1.25) * inn)} unlit /></Mesh3d>
      <Tag {...at(px(2.45 + W / 2 - 0.2, 0.1 + H / 2, cz, bz))} dx={-130} dy={-170} text="why B wins" at={why} solid />
    </Stage>
  );
}

/** 14: "Before you ever see a new cut, it marks the moments you'd flag, in your words." A new cut's frames slide
 * by; a mark drops on each moment, the hottest thing there, with the words. */
export function Marks({ drops, span }: { drops: number[]; span: number }) {
  const f = useCurrentFrame();
  const cz = 9;
  const off = 0.7 - 1.4 * (f / span);
  const MARKED = [1, 4, 6];
  const WORDS = ["“too dark”", "“lands late”", "“hiss”"];
  const x = (i: number) => -5.6 + 1.4 * i + off;
  return (
    <Stage f={f} cz={cz} palette="jet">
      <Slab name="ruler" x={0} y={-0.45} w={14} h={0.03} t={0.3} />
      {Array.from({ length: 10 }, (_, i) => {
        const m = MARKED.indexOf(i);
        const t0 = 0.2 + 0.05 * Math.sin(i * 1.7);
        const t = m >= 0 ? ramp(f, drops[m] + 6, 10, t0, 0.62) : t0;
        return <Card key={i} name={`n${i}`} x={x(i)} y={0.2} w={1.25} h={0.72} t={t * outCubic((f - i * 1.5) / 10)} look={i * 1.3} />;
      })}
      {MARKED.map((i, m) => {
        const k = clamp01((f - drops[m]) / 7);
        if (f < drops[m]) return null;
        return <Slab key={i} name={`mark${m}`} x={x(i)} y={3.2 - (3.2 - 0.3) * k * k} z={0.1} w={0.07} h={1.3} t={1} />;
      })}
      {MARKED.map((i, m) => <Tag key={m} {...at(px(x(i), 0.95, cz, 0.1))} dx={m === 2 ? -60 : 50} dy={-150 - 40 * (m % 2)} text={WORDS[m]} at={drops[m] + 7} />)}
      <Caption text="a new cut · before you see it" at={2} f={f} />
    </Stage>
  );
}

/** 15: "Your agent gets the moment and your words. Never a score to chase." The marked frame, what the agent is
 * handed, and a score that goes cold and drops out. */
export function Agent({ agent, never, score, span }: { agent: number; never: number; score: number; span: number }) {
  const f = useCurrentFrame();
  const cz = 9 - 0.3 * ease(f / span);
  const drop = Math.max(0, (f - score - 8) / 30);
  const st = f < never ? 0 : ramp(f, never, 6, 0, 0.9) - ramp(f, score + 4, 12, 0, 0.9);
  return (
    <Stage f={f} cz={cz}>
      <Card name="frame" x={-3.6} y={0.35} w={3.6} h={2.05} t={0.42 * outCubic(f / 10)} look={4} />
      <Slab name="frame-mark" x={-3.1} y={0.35} z={0.1} w={0.07} h={2.5} t={outCubic(f / 10)} />
      {f >= never ? (
        <Mesh3d name="score" transform={Transform.fromXyz(2.6, -1.9 - 6 * drop * drop, 0).withRotation(Quat.fromRotationZ(-0.6 * drop))}>
          <Text3D size={0.8} depth={0.02} weight={700}>87/100</Text3D>
          <StandardMaterial base_color={heat(Math.max(0, st))} unlit />
        </Mesh3d>
      ) : null}
      <Tag {...at(px(-3.1, 1.6, cz, 0.1))} dx={60} dy={-120} text="0:41" at={6} solid />
      <Panel title="to your agent" at={agent} x={870} y={300} rows={[["moment", "0:41"], ["words", "“the cut lands late”"]]} />
    </Stage>
  );
}

/** 16: "It fixes them, and the fingerprint checks the work: fixed, still there, or only disguised." Three marked
 * frames and a check sweeping them: one flaw cools away, one stays hot, one is covered and still glows through. */
export function Check({ checks, fixed, still, disguised, span }: { checks: number; fixed: number; still: number; disguised: number; span: number }) {
  const f = useCurrentFrame();
  const cz = 9.2 - 0.3 * ease(f / span);
  const X = [-4.1, 0, 4.1];
  const sweep = -6.4 + 12.8 * clamp01((f - checks) / Math.max(8, fixed - 6 - checks));
  const spot = (i: number) => {
    if (i === 0) return ramp(f, fixed, 16, 0.95, 0.22);
    if (i === 1) return 0.92 + 0.08 * Math.sin(Math.max(0, f - still) * 0.5);
    return 0.95;
  };
  const cover = ease((f - disguised + 6) / 9);
  return (
    <Stage f={f} cz={cz}>
      {X.map((x, i) => <Card key={i} name={`c${i}`} x={x} y={0.25} w={3.4} h={1.95} t={0.24 * outCubic((f - i * 3) / 10)} look={i * 2 + 1} />)}
      {X.map((x, i) => <Slab key={i} name={`spot${i}`} x={x + 0.6} y={0.45} z={0.09} w={0.55} h={0.55} t={spot(i) * outCubic((f - 6 - i * 3) / 10)} />)}
      {cover > 0 ? <Slab name="cover" x={X[2] + 0.6} y={0.45 + 2.2 * (1 - cover)} z={0.14} w={0.95} h={0.9} t={0.2} alpha={0.8} /> : null}
      {f >= checks && f <= fixed + 2 ? <Slab name="sweep" x={sweep} y={0.25} z={0.2} w={0.03} h={2.6} t={0.85} /> : null}
      <Tag {...at(px(X[0] + 0.6, 0.72, cz, 0.09))} dx={-80} dy={-170} text="fixed" at={fixed + 6} solid />
      <Tag {...at(px(X[1] + 0.6, 0.72, cz, 0.09))} dx={60} dy={-170} text="still there" at={still + 2} />
      <Tag {...at(px(X[2] + 0.6, 0.9, cz, 0.14))} dx={-90} dy={-150} text="disguised" at={disguised + 4} />
    </Stage>
  );
}

/** What a fingerprint stands on, as a stack (v3, the director 11-13: "educational about ... the models and systems
 * underneath without being technical"): one block for each frozen model, lit as it's named and settling cold, since
 * they never change; `top`: a thin white-hot layer, the person's own, settles on them; `split`: that layer comes
 * apart into small judges, one for each thing the person cares about, each lighting in a blink. Cues are frames. */
export function Stack({ blocks, rise = [], top, split, judges = [], span, cold = 0.05 }: { blocks: [string, number][]; rise?: number[]; top?: number; split?: number; judges?: string[]; span: number; cold?: number }) {
  const f = useCurrentFrame();
  const cz = 9.4 - 0.4 * ease(f / span);
  const W = 4.8, H = 0.5, GAP = 0.14, X = -1.3;
  const y = (i: number) => -2.2 + i * (H + GAP);
  const topY = y(blocks.length) - GAP / 2 + 0.06;
  const N = 5, jw = (W - (N - 1) * 0.16) / N;
  const sp = split === undefined ? 0 : ease((f - split) / 14);
  return (
    <Stage f={f} cz={cz}>
      {blocks.map(([label, at], i) => {
        // a block rises at its `rise` frame (else as it's named), flashes as it's named, and settles cold
        const k = outCubic((f - (rise[i] ?? at - 4)) / 12);
        if (k <= 0) return null;
        const t = (f < at ? cold * 2 : ramp(f, at + 6, 22, 0.6, cold)) * k;
        return <Slab key={i} name={`model-${i}`} x={X} y={y(i) - 1.2 * (1 - k)} w={W} h={H} t={t} s={0.94 + 0.06 * k} />;
      })}
      {blocks.map(([label, at], i) => <Tag key={i} {...at2(px(X + W / 2, y(i), cz))} dx={110} dy={0} text={label} at={at + 2} />)}
      {top !== undefined && f >= top - 10 ? (
        sp <= 0 ? (
          <Slab name="yours" x={X} y={topY + 2.2 * (1 - outCubic((f - top + 10) / 14))} z={0.04} w={W} h={0.16} t={0.98} />
        ) : (
          Array.from({ length: N }, (_, j) => {
            const blink = split !== undefined ? 0.55 + 0.45 * Math.exp(-(((f - split - 10 - j * 4) / 3) ** 2)) : 1;
            return <Slab key={j} name={`judge-${j}`} x={X - W / 2 + jw / 2 + j * (jw + 0.16 * sp) - 0.32 * sp} y={topY + 0.55 * sp} z={0.04} w={jw * (1 - 0.15 * sp) + (W / N - jw) * (1 - sp)} h={0.16 + 0.26 * sp} t={blink} />;
          })
        )
      ) : null}
      {top !== undefined && sp <= 0 ? <Tag {...at2(px(X + W / 2 - 0.3, topY, cz, 0.04))} dx={130} dy={-90} text="yours" at={top + 6} solid /> : null}
      {judges.map((w, j) => <Tag key={`j${j}`} {...at2(px(X - W / 2 + jw / 2 + (j * 2) * (jw + 0.16) - 0.32, topY + 0.55 + 0.21, cz, 0.04))} dx={-60 + j * 60} dy={-110 - 40 * j} text={w} at={(split ?? 0) + 10 + j * 8 * 2} />)}
    </Stage>
  );
}
const at2 = ([x, y]: [number, number]) => ({ x, y });

/** 04c's second half: "what happens. A voice. A door. A hum." A strip of sound, each event boxed and named as it's
 * said, the way a sound-event model (YAMNet) hears it: what, and when. */
export function Events({ cues, span }: { cues: number[]; span: number }) {
  const f = useCurrentFrame();
  const cz = 9;
  const N = 72;
  const xs = (i: number) => -6 + (12 * i) / (N - 1);
  // a voice: a busy mid band at the left; a door: one tall hit in the middle; a hum: a low even band at the right
  const amp = (i: number) => {
    const x = xs(i);
    if (x < -2.2 && x > -5.2) return 0.45 + 0.35 * Math.abs(Math.sin(i * 1.9) * Math.sin(i * 0.7 + 1));
    if (Math.abs(x - 0.2) < 0.35) return 1.9 - Math.abs(x - 0.2) * 2.5;
    if (x > 2.4 && x < 5.4) return 0.32 + 0.03 * Math.sin(i * 2.1);
    return 0.06 + 0.04 * Math.abs(Math.sin(i * 3.3));
  };
  const region = (i: number) => { const x = xs(i); return x < -2.2 && x > -5.2 ? 0 : Math.abs(x - 0.2) < 0.6 ? 1 : x > 2.4 && x < 5.4 ? 2 : -1; };
  const play = -6.2 + 12.4 * (f / span);
  const BOX: [number, number, number, number][] = [[-5.3, 0.95, -2.1, -0.95], [-0.45, 2.0, 0.85, -2.0], [2.3, 0.55, 5.5, -0.55]];
  const NAME = ["a voice", "a door", "a hum"];
  return (
    <Stage f={f} cz={cz}>
      {Array.from({ length: N }, (_, i) => {
        const r = region(i);
        const lit = r >= 0 ? ramp(f, cues[r], 6, 0.3, 0.92) - ramp(f, cues[r] + 14, 20, 0, 0.3) : 0.22;
        const a = amp(i) * outCubic((f - i * 0.25) / 8);
        return <Slab key={i} name={`bar-${i}`} x={xs(i)} y={0} w={0.07} h={2} sy={Math.max(0.01, a)} t={lit} />;
      })}
      <Slab name="events-playhead" x={play} y={0} z={0.1} w={0.02} h={4.4} t={0.55} />
      {BOX.map(([x0, y0, x1, y1], k) => {
        const [ax, ay] = px(x0, y0, cz), [bx, by] = px(x1, y1, cz);
        return <Box key={k} x={ax} y={ay} w={bx - ax} h={by - ay} at={cues[k]} label={NAME[k]} />;
      })}
      <Caption text="what happens, and when" at={2} f={f} />
    </Stage>
  );
}

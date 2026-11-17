// The tall film's motion graphics (thermal/mograph.tsx's, laid out again for a phone held upright): what ran across
// the wide frame runs down this one. The clips are a column on a timeline that runs down, A sits over B, a new cut's
// frames scroll up past the marks, the three sounds are three rows, the checked frames stack. The same slabs, cards and
// heat; the camera centres on the safe box (thermal/tall/frame.ts), the words stay in it at 60 px, and only pictures
// run on into the frame's bottom, where the networks' captions sit.
import { useCurrentFrame } from "raea";
import { ToneMapping } from "raea/3d";
import { Camera3d } from "raea/camera";
import { Mesh3d } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Text3D } from "raea/text";
import { Quat, Transform } from "raea/transform";
import { Heat, type HeatPalette } from "../heat";
import { heat } from "../temp";
import { Card, Slab } from "../mograph";
import { camXY, kAt, px } from "./frame";
import { BlockT, BoxT, HeadT, PanelT, TagT } from "./marks";

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => { const k = clamp01(x); return k * k * (3 - 2 * k); };
const outCubic = (x: number) => 1 - (1 - clamp01(x)) ** 3;
const ramp = (f: number, t0: number, dur: number, a: number, b: number) => a + (b - a) * ease((f - t0) / dur);
const P = ([x, y]: [number, number]) => ({ x, y });
/** type in 3D drawn about as large on the tall frame as on the wide one, so its glow is cut to match (shots.tsx) */
const TYPE_GLOW = 0.6;

/** the pass and the camera every tall motion graphic shares, the camera centred on the safe box */
function StageT({ f, cz, palette = "flare", glow, children }: { f: number; cz: number; palette?: HeatPalette; glow?: number; children: React.ReactNode }) {
  const [cx, cy] = camXY(cz);
  return (
    <>
      <Camera3d transform={Transform.fromXyz(cx, cy, cz).lookingAt([cx, cy, 0])} />
      {children}
      <Heat frame={f} recipe={{ lum: 1, gamma: 1 }} floor={0.02} gain={1.05} palette={palette} glow={glow} />
      <ToneMapping mode="none" />
    </>
  );
}

/** 02: the cuts you warm to, the notes you leave, the takes you throw away. A column of clips on a timeline that runs
 * down, the playhead crossing them; the first warms white-hot, a note drops onto the second, the third cools and
 * falls away. The words stand to the right of the column. */
export function WarmT({ warm, notes, takes, away, span }: { warm: number; notes: number; takes: number; away: number; span: number }) {
  const f = useCurrentFrame();
  const cz = 9.4 - 0.5 * ease(f / span);
  const X = -0.75, CW = 1.9, CH = 1.07;
  const Y = [1.35, 0, -1.35, -2.7];
  const fall = Math.max(0, (f - away) / 30);
  const pinX = X + 0.45, pinTop = Y[1] + CH / 2 + 0.1;
  const pinY = 3.2 - (3.2 - pinTop) * clamp01((f - (notes - 7)) / 7) ** 2;
  const play = 2.6 - 6.6 * (f / span);
  const LX = 600;
  const ly = (y: number) => px(0, y, cz)[1];
  return (
    <StageT f={f} cz={cz}>
      <Slab name="timeline" x={-1.85} y={-0.6} w={0.03} h={7.6} t={0.32} />
      <Slab name="playhead" x={X - 0.25} y={play} z={0.12} w={CW + 0.7} h={0.025} t={0.62} />
      {Y.map((y0, i) => {
        const inn = outCubic((f - 2 - i * 3) / 12);
        let t = 0.3 * inn + 0.02 * Math.sin(f * 0.11 + i);
        let y = y0, rot = 0, z = 0, x = X;
        if (i === 0) { t = ramp(f, warm - 3, 14, t, 1.0); z = 0.3 * ease((f - warm) / 14); }
        if (i === 1) t = ramp(f, notes, 12, t, 0.5);
        if (i === 2) { t = ramp(f, takes, 14, t, 0.05); y = y0 - 9.8 * 0.5 * fall * fall * 2.2; rot = -1.1 * fall; x = X - 0.6 * fall; z = fall > 0 ? 0.15 : 0; }
        return <Card key={i} name={`w${i}`} x={x} y={y - 0.25 * (1 - inn)} z={z} w={CW} h={CH} t={t} s={0.9 + 0.1 * inn} rot={rot} look={i} />;
      })}
      {f >= notes - 7 ? <><Slab name="pin" x={pinX} y={pinY} z={0.2} w={0.2} h={0.2} t={0.95} /><Slab name="pin-stem" x={pinX} y={pinY - 0.2} z={0.2} w={0.035} h={0.24} t={0.8} /></> : null}
      <TagT {...P(px(X + CW / 2, Y[0] + 0.2, cz, 0.3))} lx={LX} ly={ly(Y[0] + 0.45)} text="warm to" at={warm + 8} solid />
      <TagT {...P(px(pinX, pinTop + 0.1, cz, 0.2))} lx={LX} ly={ly(Y[1] + 0.6)} text={"“tighten\nthis”"} at={notes + 3} />
      <TagT {...P(px(X + CW / 2, Y[2], cz))} lx={LX} ly={ly(Y[2] + 0.3)} text={"thrown\naway"} at={takes + 4} out={away + 16} />
    </StageT>
  );
}

/** Lines of words in heat, each lit as it's said, stacked and centred (04d, 05), the heading over them */
export function WordsT({ lines, cues, caption, span }: { lines: string[]; cues: number[]; caption: string; span: number }) {
  const f = useCurrentFrame();
  const cz = 9 - 0.4 * ease(f / span);
  return (
    <StageT f={f} cz={cz} glow={TYPE_GLOW}>
      {lines.map((l, i) => {
        const k = cues[i];
        const t = f < k ? 0 : ramp(f, k, 6, 0, 1) - ramp(f, k + 10, 24, 0, 0.3);
        return (
          <Mesh3d key={i} name={`note-${i}`} transform={Transform.fromXyz(0, 1.0 - i * 1.0 + 0.15 * ease(f / span), 0)}>
            <Text3D size={0.27} depth={0.02} weight={500}>{l}</Text3D>
            <StandardMaterial base_color={heat(t)} unlit />
          </Mesh3d>
        );
      })}
      <HeadT text={caption} at={cues[0] - 4} />
    </StageT>
  );
}

/** 07: pick one version over another. A over B; B goes white-hot, A goes cold and falls back. */
export function PickT({ pick, why, span }: { pick: number; why: number; span: number }) {
  const f = useCurrentFrame();
  const cz = 9 - 0.35 * ease(f / span);
  const inn = outCubic(f / 12);
  const CW = 2.84, CH = 1.6, YA = 1.1, YB = -1.0;
  const b = ramp(f, pick, 10, 0.42, 0.85), a = ramp(f, pick, 14, 0.42, 0.1);
  const az = -0.9 * ease((f - pick) / 16), bz = 0.25 * ease((f - pick) / 12);
  const ya = YA + 0.15 * ease((f - pick) / 16);
  const [rx, gy] = px(CW / 2, (YA - CH / 2 + YB + CH / 2) / 2, cz);
  return (
    <StageT f={f} cz={cz}>
      <Card name="a" x={0} y={ya} z={az} w={CW} h={CH} t={a * inn} s={0.92 + 0.08 * inn} look={0.4} />
      <Card name="b" x={0} y={YB} z={bz} w={CW} h={CH} t={b * inn} s={0.92 + 0.08 * inn} look={2.1} />
      <Mesh3d name="a-letter" transform={Transform.fromXyz(0, ya, az + 0.1)}><Text3D size={0.95} depth={0.02} weight={700}>A</Text3D><StandardMaterial base_color={heat(Math.min(1, a * 1.5) * inn)} unlit /></Mesh3d>
      <Mesh3d name="b-letter" transform={Transform.fromXyz(0, YB, bz + 0.1)}><Text3D size={0.95} depth={0.02} weight={700}>B</Text3D><StandardMaterial base_color={heat(Math.min(1, b * 1.25) * inn)} unlit /></Mesh3d>
      <TagT {...P(px(CW / 2 - 0.3, YB + CH / 2 - 0.22, cz, bz))} lx={rx} ly={gy - 42} align="r" text="why B wins" at={why} solid />
    </StageT>
  );
}

/** 14: before you ever see a new cut, it marks the moments you'd flag, in your words. The cut's frames scroll up a
 * timeline that runs down; a mark slides in across each moment, the hottest thing there, with the words beside it. */
export function MarksT({ drops, span }: { drops: number[]; span: number }) {
  const f = useCurrentFrame();
  const cz = 9;
  const off = 0.4 * (f / span);
  const MARKED = [0, 1, 2];
  const WORDS = ["“too dark”", "“lands\nlate”", "“hiss”"];
  const X = -0.95, FW = 1.5, FH = 0.84;
  const y = (i: number) => 0.6 - 1.05 * i + off;
  return (
    <StageT f={f} cz={cz} palette="jet">
      <Slab name="ruler" x={-1.85} y={-0.8} w={0.03} h={8} t={0.3} />
      {Array.from({ length: 8 }, (_, i) => {
        const m = MARKED.indexOf(i);
        const t0 = 0.2 + 0.05 * Math.sin(i * 1.7);
        const t = m >= 0 ? ramp(f, drops[m] + 6, 10, t0, 0.62) : t0;
        return <Card key={i} name={`n${i}`} x={X} y={y(i)} w={FW} h={FH} t={t * outCubic((f - i * 1.5) / 10)} look={i * 1.3} />;
      })}
      {MARKED.map((i, m) => {
        if (f < drops[m]) return null;
        const k = clamp01((f - drops[m]) / 7);
        return <Slab key={i} name={`mark${m}`} x={-3.6 + (3.6 - 1.2) * k * k} y={y(i)} z={0.1} w={1.4} h={0.07} t={1} />;
      })}
      {MARKED.map((i, m) => {
        const two = WORDS[m].includes("\n");
        return <TagT key={m} {...P(px(-0.5, y(i), cz, 0.1))} lx={520} ly={px(0, y(i), cz)[1] - (two ? 77 : 42)} text={WORDS[m]} at={drops[m] + 7} />;
      })}
      <HeadT text={"a new cut\nbefore you see it"} at={2} />
    </StageT>
  );
}

/** 15: your agent gets the moment and your words, never a score to chase. The marked frame on top, what the agent is
 * handed under it, and a score that goes cold and drops out of the bottom. */
export function AgentT({ agent, never, score, span }: { agent: number; never: number; score: number; span: number }) {
  const f = useCurrentFrame();
  const cz = 9 - 0.3 * ease(f / span);
  const drop = Math.max(0, (f - score - 8) / 30);
  const st = f < never ? 0 : ramp(f, never, 6, 0, 0.9) - ramp(f, score + 4, 12, 0, 0.9);
  const CY = 1.05, CW = 2.6, CH = 1.46, MX = 0.5;
  const [mx, my] = px(MX, CY + CH / 2, cz, 0.1);
  return (
    <StageT f={f} cz={cz}>
      <Card name="frame" x={0} y={CY} w={CW} h={CH} t={0.42 * outCubic(f / 10)} look={4} />
      <Slab name="frame-mark" x={MX} y={CY} z={0.1} w={0.07} h={CH + 0.4} t={outCubic(f / 10)} />
      {f >= never ? (
        <Mesh3d name="score" transform={Transform.fromXyz(0.3, -1.65 - 6 * drop * drop, 0).withRotation(Quat.fromRotationZ(-0.6 * drop))}>
          <Text3D size={0.5} depth={0.02} weight={700}>87/100</Text3D>
          <StandardMaterial base_color={heat(Math.max(0, st))} unlit />
        </Mesh3d>
      ) : null}
      <TagT x={mx} y={my} lx={mx + 26} ly={px(0, CY + 0.45, cz)[1]} text="0:41" at={6} solid />
      <PanelT title="to your agent" at={agent} x={80} y={px(0, CY - CH / 2 - 0.2, cz)[1]} w={860} rows={[["moment", "0:41"], ["words", "“the cut lands late”"]]} />
    </StageT>
  );
}

/** 16: it fixes them, and the fingerprint checks the work: fixed, still there, or only disguised. Three marked frames
 * stacked and a check sweeping down them: one flaw cools away, one stays hot, one is covered and still glows through. */
export function CheckT({ checks, fixed, still, disguised, span }: { checks: number; fixed: number; still: number; disguised: number; span: number }) {
  const f = useCurrentFrame();
  const cz = 9.2 - 0.3 * ease(f / span);
  const Y = [1.3, 0, -1.3], X = -0.1, CW = 2.7, CH = 1.1, SX = X + 0.85;
  const sweep = 2.1 - 4.2 * clamp01((f - checks) / Math.max(8, fixed - 6 - checks));
  const spot = (i: number) => {
    if (i === 0) return ramp(f, fixed, 16, 0.95, 0.22);
    if (i === 1) return 0.92 + 0.08 * Math.sin(Math.max(0, f - still) * 0.5);
    return 0.95;
  };
  const cover = ease((f - disguised + 6) / 9);
  const NAMES = ["fixed", "still there", "disguised"], AT = [fixed + 6, still + 2, disguised + 4];
  return (
    <StageT f={f} cz={cz}>
      {Y.map((y, i) => <Card key={i} name={`c${i}`} x={X} y={y} w={CW} h={CH} t={0.24 * outCubic((f - i * 3) / 10)} look={i * 2 + 1} />)}
      {Y.map((y, i) => <Slab key={i} name={`spot${i}`} x={SX} y={y + 0.12} z={0.09} w={0.45} h={0.45} t={spot(i) * outCubic((f - 6 - i * 3) / 10)} />)}
      {cover > 0 ? <Slab name="cover" x={SX} y={Y[2] + 0.12 + 2.2 * (1 - cover)} z={0.14} w={0.8} h={0.75} t={0.2} alpha={0.8} /> : null}
      {f >= checks && f <= fixed + 2 ? <Slab name="sweep" x={X} y={sweep} z={0.2} w={CW + 0.5} h={0.03} t={0.85} /> : null}
      {Y.map((y, i) => {
        const [lx, ly] = px(X - CW / 2 + 0.12, y + CH / 2 - 0.12, cz);
        return <TagT key={i} {...P(px(SX - 0.22, y + 0.12, cz, 0.1))} lx={lx} ly={ly} text={NAMES[i]} at={AT[i]} solid={i === 0} />;
      })}
    </StageT>
  );
}

/** What a fingerprint stands on, as a stack (thermal/mograph.tsx Stack): a block for each frozen model, lit as it's
 * named and settling cold, what it does written on it ("model · role": the role large, the model small); `top`: the
 * person's own thin white-hot layer settles on them; `split` (with `low`, the stack low and unlabelled): that layer
 * comes apart into small judges, each lighting in a blink, the things they judge named above them. */
export function StackT({ blocks, rise = [], top, split, judges = [], span, cold = 0.05, low = false }: { blocks: [string, number][]; rise?: number[]; top?: number; split?: number; judges?: string[]; span: number; cold?: number; low?: boolean }) {
  const f = useCurrentFrame();
  const cz = 9.4 - 0.4 * ease(f / span);
  const n = blocks.length;
  const BW = 3.3, BH = low ? 0.32 : n <= 3 ? 0.72 : 0.5, GAP = low ? 0.08 : 0.12;
  const pitch = BH + GAP;
  const base = low ? -3.4 : (-(n - 1) / 2) * pitch - (top !== undefined ? 0.35 : 0);
  const y = (i: number) => base + i * pitch;
  const topY = y(n - 1) + BH / 2 + 0.2;
  const N = 5, jw = (BW - (N - 1) * 0.16) / N;
  const sp = split === undefined ? 0 : ease((f - split) / 14);
  const jx = (j: number) => -BW / 2 + jw / 2 + j * (jw + 0.16 * sp);
  const k = kAt(cz);
  // the judges' words: stacked in the safe box above them, the first named lowest, each leader clear of the others
  const JL: [number, number][] = [[90, 700], [250, 515], [420, 330]];
  return (
    <StageT f={f} cz={cz}>
      {blocks.map(([, at], i) => {
        const kk = outCubic((f - (rise[i] ?? at - 4)) / 12);
        if (kk <= 0) return null;
        const t = (f < at ? cold * 2 : ramp(f, at + 6, 22, 0.6, cold)) * kk;
        return <Slab key={i} name={`model-${i}`} x={0} y={y(i) - 1.2 * (1 - kk)} w={BW} h={BH} t={t} s={0.94 + 0.06 * kk} />;
      })}
      {low ? null : blocks.map(([label, at], i) => {
        const kk = outCubic((f - (rise[i] ?? at - 4)) / 12);
        const [model, role] = label.includes(" · ") ? label.split(" · ") : [undefined, label];
        const [bx, by] = px(-BW / 2, y(i) - 1.2 * (1 - kk) + BH / 2, cz);
        return <BlockT key={i} x={bx} y={by} w={BW * k} h={BH * k} role={role} model={model} at={at + 2} k={kk} />;
      })}
      {top !== undefined && f >= top - 10 ? (
        sp <= 0 ? (
          <Slab name="yours" x={0} y={topY + 2.2 * (1 - outCubic((f - top + 10) / 14))} z={0.04} w={BW} h={0.16} t={0.98} />
        ) : (
          Array.from({ length: N }, (_, j) => {
            const blink = split !== undefined ? 0.55 + 0.45 * Math.exp(-(((f - split - 10 - j * 4) / 3) ** 2)) : 1;
            return <Slab key={j} name={`judge-${j}`} x={jx(j)} y={topY + 0.55 * sp} z={0.04} w={jw * (1 - 0.15 * sp) + (BW / N - jw) * (1 - sp)} h={0.16 + 0.26 * sp} t={blink} />;
          })
        )
      ) : null}
      {top !== undefined && sp <= 0 ? (() => {
        const [rx, ry] = px(BW / 2, topY + 0.3, cz);
        return <TagT {...P(px(BW / 2 - 0.35, topY, cz, 0.04))} lx={rx} ly={ry - 85} align="r" text="yours" at={top + 6} solid />;
      })() : null}
      {judges.map((w, j) => <TagT key={`j${j}`} {...P(px(jx(j * 2), topY + 0.55 + 0.21, cz, 0.04))} lx={JL[j][0]} ly={JL[j][1]} text={w} at={(split ?? 0) + 10 + j * 8 * 2} />)}
    </StageT>
  );
}

/** 04c's second half: what happens. A voice, a door, a hum: three rows of a strip of sound, each boxed and named as
 * it's said, a playhead crossing it, the way a sound-event model (YAMNet) hears: what, and when. */
export function EventsT({ cues, span }: { cues: number[]; span: number }) {
  const f = useCurrentFrame();
  const cz = 9;
  const N = 26;
  const RY = [0.75, -0.55, -1.85];
  const xs = (i: number) => -1.6 + (3.2 * i) / (N - 1);
  // a voice: busy; a door: one hit in the middle; a hum: low and even
  const amp = (r: number, i: number) => {
    if (r === 0) return 0.14 + 0.2 * Math.abs(Math.sin(i * 1.9) * Math.sin(i * 0.7 + 1));
    if (r === 1) { const d = Math.abs(i - 12.5); return d < 2.5 ? 0.36 - d * 0.1 : 0.03 + 0.02 * Math.abs(Math.sin(i * 3.3)); }
    return 0.12 + 0.012 * Math.sin(i * 2.1);
  };
  const NAME = ["a voice", "a door", "a hum"];
  const BH = 0.4;
  void span;
  return (
    <StageT f={f} cz={cz}>
      {RY.map((ry, r) => Array.from({ length: N }, (_, i) => {
        const c = cues[r];
        const lit = ramp(f, c + i * 0.35, 6, 0.22, 0.92) - ramp(f, c + 14 + i * 0.35, 20, 0, 0.3);
        const a = amp(r, i) * outCubic((f - i * 0.25 - r * 2) / 8);
        return <Slab key={`${r}-${i}`} name={`bar-${r}-${i}`} x={xs(i)} y={ry} w={0.07} h={2} sy={Math.max(0.01, a)} t={lit} />;
      }))}
      {RY.map((ry, r) => (f >= cues[r] ? <Slab key={`ph${r}`} name={`playhead-${r}`} x={-1.7 + 3.4 * clamp01((f - cues[r]) / 30)} y={ry} z={0.1} w={0.02} h={2 * BH + 0.1} t={0.55} /> : null))}
      {RY.map((ry, r) => {
        const [ax, ay] = px(-1.66, ry + BH, cz), [bx, by] = px(1.66, ry - BH, cz);
        return <BoxT key={r} x={ax} y={ay} w={bx - ax} h={by - ay} at={cues[r]} label={NAME[r]} />;
      })}
      <HeadT text="what happens, and when" at={2} />
    </StageT>
  );
}

// 1. The eye (bars 0-3). An eye is drawn in ink on a white sheet while the voice says every editor has one; the
// coffee film's strip comes in under it on threes, its sound track drawn below; then the eye finds each fault as the
// voice names it (too dark, the hiss, too soft) and a red pencil circles it.
import { Img, staticFile } from "raea";
import { C, Hand, Ink } from "../draw";
import { type Line, arrow, clamp, easeInOut, handCircle, prog, step } from "../ink";
import { Cut, Desk, On, Sheet, TEX, Tape } from "../paper";
import { Eye, FilmStrip, STILL, Waveform } from "../props";
import { CamPath, InkLayer } from "../stage";
import { word } from "../timeline";

// the strip: six shots of two seconds, 0 to 12 s across x 270..1662
const FW = 220;
const GAP = 12;
const STRIP_X = 258;
const STRIP_Y = 610;
const BAND = Math.round(FW * 0.1);
const FH = Math.round(FW * 0.5625);
const frameBox = (i: number) => ({ x: STRIP_X + GAP + i * (FW + GAP), y: STRIP_Y + BAND, w: FW, h: FH });
const WAVE = { x: 270, y: 880, w: 1392, h: 110 };
const HISS = [5.5 / 12, 10 / 12] as const;

const DARK = word("02", "dark");
const HISSW = word("02", "hiss");
const SOFT = word("02", "soft");

/** where the eye looks: at each fault as it's named, moved by hand (on twos, eased) */
function gaze(g: number): [number, number] {
  const keys: [number, [number, number]][] = [
    [0, [0, 0]],
    [DARK - 12, [0.02, 0.04]],
    [DARK - 2, [0.24, 0.13]],
    [HISSW - 4, [0.24, 0.13]],
    [HISSW + 4, [0.1, 0.2]],
    [SOFT - 10, [0.1, 0.2]],
    [SOFT, [-0.16, 0.14]],
    [SOFT + 16, [-0.16, 0.14]],
    [SOFT + 28, [0.02, 0.02]],
  ];
  const f = step(g, 2);
  for (let i = 1; i < keys.length; i++) {
    if (f <= keys[i][0]) {
      const [f0, a] = keys[i - 1];
      const [f1, b] = keys[i];
      const t = easeInOut(clamp((f - f0) / Math.max(1, f1 - f0)));
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }
  }
  return keys[keys.length - 1][1];
}

export function EyeScene({ g }: { g: number }) {
  const strip = Cut(g, 70, 128, [-1500, STRIP_Y + 30, -4], [STRIP_X, STRIP_Y, -0.6], 12, 3);
  const proj = Cut(g, 4, 34, [2000, -260, 24], [1520, 40, -7], 11, 3);
  const f2 = frameBox(2);
  const f4 = frameBox(4);
  const c2: [number, number] = [f2.x + f2.w / 2 + strip.x - STRIP_X, f2.y + f2.h / 2 + strip.y - STRIP_Y];
  const c4: [number, number] = [f4.x + f4.w / 2 + strip.x - STRIP_X, f4.y + f4.h / 2 + strip.y - STRIP_Y];
  const hissMid = WAVE.x + WAVE.w * (HISS[0] + HISS[1]) / 2;
  const hissHalf = (WAVE.w * (HISS[1] - HISS[0])) / 2 + 30;
  const circles: [Line, number][] = [
    [handCircle(c4[0], c4[1], FW * 0.66, FH * 0.78, 41), DARK],
    [handCircle(hissMid, WAVE.y, hissHalf, 82, 42, 1.1, -0.2), HISSW],
    [handCircle(c2[0], c2[1], FW * 0.66, FH * 0.78, 43, 1.12, 2.4), SOFT],
  ];
  return (
    <>
      <CamPath f={g} keys={[[0, 960, 520, 1.0], [120, 960, 545, 1.03], [240, 960, 570, 1.065]]}>
        <Desk f={g} />
        <Sheet x={240} y={60} w={1440} h={980} rot={-1.1} tex={TEX.white} tint="#f4ebd9" seed={3} lift={1.4} />
        <Tape x={200} y={40} w={170} h={46} rot={-38} seed={2} />
        <Tape x={1560} y={1000} w={170} h={46} rot={-34} seed={5} />
        <InkLayer id="s1" g={g}>
          <Eye f={g} t={prog(g, 0, 72)} cx={960} cy={448} s={258} gaze={gaze(g)} k={30} />
        </InkLayer>
        <On x={proj.x} y={proj.y} w={360} h={404} rot={proj.r} lift={1.6}>
          <Img src={staticFile("objects/projector.png")} style={{ width: 360, height: 404 }} />
        </On>
        {g >= 66 ? (
          <On x={strip.x} y={strip.y} w={6 * (FW + GAP) + GAP} h={FH + BAND * 2} rot={strip.r} lift={1.2}>
            <FilmStrip frames={[0, 1, 2, 3, 4, 5].map((i) => STILL("v1", i))} fw={FW} gap={GAP} />
          </On>
        ) : null}
        <InkLayer id="s1m" g={g}>
          <Waveform f={g} x={WAVE.x} y={WAVE.y} w={WAVE.w} h={WAVE.h} t={prog(g, 96, 138)} hiss={prog(g, 120, 136)} hissFrom={HISS[0]} hissTo={HISS[1]} k={50} />
          {circles.map(([l, at], i) => (
            <Ink key={i} lines={[l]} f={g} t={prog(g, at, at + 11)} color={C.red} size={5.5} k={60 + i} />
          ))}
          {/* the labels, each with its arrow down to the fault */}
          <Hand text="too dark" f={g} t={prog(g, DARK + 3, DARK + 14)} x={1330} y={500} size={84} rot={-5} k={71} />
          <Ink lines={arrow(1450, 520, c4[0] + 30, c4[1] - FH * 0.8, 72, 0.12)} f={g} t={prog(g, DARK + 8, DARK + 16)} color={C.red} size={4.5} k={72} />
          <Hand text="hiss" f={g} t={prog(g, HISSW + 3, HISSW + 12)} x={hissMid + hissHalf + 30} y={WAVE.y + 30} size={84} rot={-3} k={73} />
          <Hand text="too soft" f={g} t={prog(g, SOFT + 2, SOFT + 13)} x={300} y={500} size={84} rot={4} k={74} />
          <Ink lines={arrow(470, 522, c2[0] - 40, c2[1] - FH * 0.8, 75, -0.12)} f={g} t={prog(g, SOFT + 6, SOFT + 14)} color={C.red} size={4.5} k={75} />
        </InkLayer>
      </CamPath>
    </>
  );
}

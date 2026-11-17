// 5. The check (bars 18-23). The AI's cut of the coffee film, with its sound track. A magnifier with your fingerprint
// in its lens clicks along it, frame by frame, and stops on the moment you'd have flagged: a tag, "too dark 0:07"
// (raea fingerprint's own words for the test cut). The frame is fixed, brightening in steps. Then "hiss 0:04":
// the knob turns it down and a torn patch is taped over it, which only hides it, and the stamp says what the
// fingerprint said of that fix: STILL THERE. The patch comes off and the hiss goes for real.
import { Img, staticFile } from "raea";
import { C, Hand, Ink, Print, Wire } from "../draw";
import { type Line, checkMark, clamp, easeInOut, handCircle, handLine, lerp, prog, step } from "../ink";
import { Cut, Desk, On, Sheet, TEX, Tag, Tape } from "../paper";
import { FilmStrip, STILL, Waveform } from "../props";
import { cues } from "../cues";
import { CamPath, InkLayer, Stamp } from "../stage";
import { word } from "../timeline";

const FW = 270;
const GAP = 14;
const BAND = Math.round(FW * 0.1);
const FH = Math.round(FW * 0.5625);
const STRIP = { x: 100, y: 300 };
const frameC = (i: number): [number, number] => [STRIP.x + GAP + i * (FW + GAP) + FW / 2, STRIP.y + BAND + FH / 2];
const WAVE = { x: STRIP.x + GAP, y: 610, w: 6 * (FW + GAP) - GAP, h: 120 };
const atSec = (s: number) => WAVE.x + (WAVE.w * s) / 12;
const HISS = [5.5 / 12, 10 / 12] as const;
const HISS_C: [number, number] = [WAVE.x + WAVE.w * (HISS[0] + HISS[1]) / 2, WAVE.y];

const [R1, R2] = cues("ratchet", 1080, 1440);
const [PIN1, PIN2] = cues("pin", 1080, 1440);
const KNOB = cues("knob", 1080, 1440)[0];
const [RIP1, RIP2] = cues("tape-rip", 1080, 1440);
const PAT = cues("tape-pat", 1080, 1440)[0];
const STILL_THERE = cues("stamp", 1080, 1440)[0];
const BELL = cues("handbell", 1080, 1440)[0];
const AI = word("08", "ai");
const PRINT_W = word("08", "fingerprint");
const FIXES = word("08", "fixes");

// the magnifier: 720 wide, its lens's centre 156,139 from its top left, radius about 140
const MAG = { w: 720, h: 311, lx: 156, ly: 139, r: 140 };

/** where the lens looks: in from the left, clicked frame to frame on the ratchets, held on the flag, then down to
 * the sound track, and away once it's fixed */
function lens(g: number): [number, number] {
  const f = step(g, 2);
  const keys: [number, [number, number]][] = [
    [1072, [-420, frameC(0)[1] - 40]],
    [1090, frameC(0)],
    [R1, frameC(0)],
    [R1 + 6, frameC(1)],
    [R2 - 4, frameC(2)],
    [R2 + 6, frameC(3)],
    [PIN1 - 8, frameC(4)],
    [FIXES + 14, frameC(4)],
    [PIN2 - 4, [HISS_C[0] - 120, HISS_C[1] + 10]],
    [STILL_THERE - 30, [HISS_C[0] + 330, HISS_C[1] + 30]],
    [BELL + 6, [HISS_C[0] + 60, HISS_C[1] - 10]],
    [1446, [2300, 120]],
  ];
  for (let i = 1; i < keys.length; i++) {
    if (f <= keys[i][0]) {
      const [f0, a] = keys[i - 1];
      const [f1, b] = keys[i];
      const t = easeInOut(clamp((f - f0) / Math.max(1, f1 - f0)));
      return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
    }
  }
  return keys[keys.length - 1][1];
}

/** the hiss: full, turned down on the knob (still there), then gone */
function hissAt(g: number) {
  const f = step(g, 2);
  if (f < KNOB) return 1;
  if (f < BELL - 16) return lerp(1, 0.35, clamp((f - KNOB) / 8));
  return lerp(0.35, 0, clamp((f - (BELL - 16)) / 14));
}

function Knob({ g, x, y, r }: { g: number; x: number; y: number; r: number }) {
  const f = step(g, 2);
  const a = lerp(-0.45, -2.5, easeInOut(clamp((f - KNOB) / 8))) - Math.PI / 2 + Math.PI; // from about 2 o'clock to 8
  const ticks: Line[] = Array.from({ length: 9 }, (_, i) => {
    const ta = -Math.PI * 1.25 + (i / 8) * Math.PI * 1.5;
    return handLine(x + Math.cos(ta) * r * 1.2, y + Math.sin(ta) * r * 1.2, x + Math.cos(ta) * r * 1.38, y + Math.sin(ta) * r * 1.38, 120 + i, 0.02);
  });
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="#d8cfbd" />
      <Ink lines={[handCircle(x, y, r, r, 111, 1.05), handCircle(x, y, r * 0.84, r * 0.84, 112, 1.03)]} f={g} size={4} k={111} />
      <Ink lines={[handLine(x + Math.cos(a) * r * 0.15, y + Math.sin(a) * r * 0.15, x + Math.cos(a) * r * 0.78, y + Math.sin(a) * r * 0.78, 113, 0.01)]} f={g} size={7} k={113} color={C.red} />
      <Ink lines={ticks} f={g} size={3.2} k={114} />
    </g>
  );
}

export function CheckScene({ g }: { g: number }) {
  const [lx, ly] = lens(g);
  const tag1 = Cut(g, PIN1 - 6, PIN1, [1450, -300, 30], [1250, 60, 7], 61, 2);
  const tag2 = Cut(g, PIN2 - 6, PIN2, [560, 1300, -20], [540, 790, -5], 62, 2);
  const fixT = clamp(Math.floor((g - FIXES) / 3 + 1) / 3);
  // the patch: down over the hiss, taped, stamped, peeled off
  const patchIn = Cut(g, RIP1 - 6, RIP1 + 2, [880, -400, -20], [880, 525, -2], 63, 2);
  const peel = Cut(g, RIP2, RIP2 + 14, [880, 525, -2], [1400, -500, 28], 64, 2);
  const patch = g >= RIP2 ? peel : patchIn;
  const patchOn = g >= RIP1 - 6 && g < RIP2 + 14;
  const H = hissAt(g);
  const [f4x, f4y] = frameC(4);
  return (
    <CamPath f={g} keys={[[1070, 760, 420, 1.25], [1150, 900, 400, 1.22], [1215, 1180, 345, 1.18], [1255, 1150, 520, 1.12], [1300, 1100, 640, 1.15], [1380, 1050, 620, 1.2], [1440, 1000, 600, 1.15]]}>
      <Desk f={g} tex={TEX.board} />
      <Sheet x={40} y={36} w={1840} h={1010} rot={-0.6} tex={TEX.grey} tint="#efe6d2" seed={12} lift={1} />
      <On x={STRIP.x} y={STRIP.y} w={6 * (FW + GAP) + GAP} h={FH + BAND * 2} lift={1.2}>
        <FilmStrip frames={[0, 1, 2, 3, 4, 5].map((i) => STILL("v1", i))} fw={FW} gap={GAP} labels={["0:00", "0:02", "0:04", "0:06", "0:08", "0:10"]} />
        {/* the fix, frame 4 brightening to the clean take in three steps */}
        {fixT > 0 ? <Img src={STILL("v3", 4)} style={{ position: "absolute", left: GAP + 4 * (FW + GAP), top: BAND, width: FW, height: FH, objectFit: "cover", opacity: fixT }} /> : null}
      </On>
      {g >= AI - 4 ? (
        <Tag x={210} y={160} w={320} h={112} rot={-5} seed={8}>
          <div style={{ position: "absolute", left: 66, top: 22, fontFamily: "Special Elite", fontSize: 60, lineHeight: 1, color: C.ink }}>AI cut</div>
        </Tag>
      ) : null}
      <InkLayer id="s5" g={g}>
        <Waveform f={g} x={WAVE.x} y={WAVE.y} w={WAVE.w} h={WAVE.h} hiss={H} hissFrom={HISS[0]} hissTo={HISS[1]} k={58} />
        <Knob g={g} x={1660} y={860} r={62} />
        <Hand text="hiss" f={g} t={prog(g, KNOB - 30, KNOB - 20)} x={1610} y={990} size={64} color={C.ink} k={115} />
        {g >= PIN1 ? <Wire lines={[handLine(tag1.x + 40, tag1.y + 85, f4x, f4y - FH / 2 - BAND, 131, 0.06)]} f={g} color={C.red} width={2.6} k={131} /> : null}
        {g >= PIN2 ? <Wire lines={[handLine(tag2.x + 40, tag2.y + 85, atSec(4), WAVE.y + 50, 132, -0.06)]} f={g} color={C.red} width={2.6} k={132} /> : null}
      </InkLayer>
      {/* the lens: your fingerprint, faint in blue, under the glass */}
      <InkLayer id="s5l" g={g} scale={1.2}>
        {g >= PRINT_W ? <Print f={g} t={prog(g, PRINT_W, PRINT_W + 16)} cx={lx} cy={ly} s={92} color={C.blue} opacity={0.72} k={9} size={0.018} boilAmp={0.3} /> : null}
      </InkLayer>
      {g >= PIN1 - 6 ? (
        <Tag x={tag1.x} y={tag1.y} w={410} h={170} rot={tag1.r} seed={10}>
          <div style={{ position: "absolute", left: 70, top: 18, fontFamily: "Special Elite", fontSize: 60, lineHeight: 1, color: C.ink, whiteSpace: "nowrap" }}>too dark</div>
          <div style={{ position: "absolute", left: 70, top: 88, fontFamily: "Special Elite", fontSize: 60, lineHeight: 1, color: "#7a1a12" }}>0:07</div>
        </Tag>
      ) : null}
      {g >= PIN2 - 6 ? (
        <Tag x={tag2.x} y={tag2.y} w={300} h={170} rot={tag2.r} seed={11}>
          <div style={{ position: "absolute", left: 70, top: 18, fontFamily: "Special Elite", fontSize: 60, lineHeight: 1, color: C.ink }}>hiss</div>
          <div style={{ position: "absolute", left: 70, top: 88, fontFamily: "Special Elite", fontSize: 60, lineHeight: 1, color: "#7a1a12" }}>0:04</div>
        </Tag>
      ) : null}
      {patchOn ? (
        <>
          <Sheet x={patch.x} y={patch.y} w={680} h={175} rot={patch.r} tex={TEX.white} tint="#f5ecda" torn="trbl" seed={13} lift={g >= RIP2 ? 2.4 : 1.2} />
          {g >= PAT - 2 ? (
            <>
              <Tape x={patch.x - 50} y={patch.y + 60} w={130} h={40} rot={patch.r - 70} seed={14} />
              <Tape x={patch.x + 600} y={patch.y + 60} w={130} h={40} rot={patch.r + 70} seed={15} />
            </>
          ) : null}
          <InkLayer id="s5p" g={g} grain={0.85}>
            <g transform={`rotate(${patch.r + 2} ${patch.x + 340} ${patch.y + 88})`}>
              <Stamp g={g} at={STILL_THERE} x={patch.x + 270} y={patch.y + 92} text="STILL THERE" size={70} rot={-6} grain="s5p-grain" k={7} />
            </g>
          </InkLayer>
        </>
      ) : null}
      <InkLayer id="s5m" g={g}>
        <Hand text="fixed" f={g} t={prog(g, FIXES + 8, FIXES + 18)} x={1690} y={150} size={80} color={C.blue} rot={-6} k={141} />
        <Ink lines={[checkMark(1710, 210, 80, 142)]} f={g} t={prog(g, FIXES + 16, FIXES + 22)} color={C.blue} size={8} k={142} />
        <Hand text="fixed" f={g} t={prog(g, BELL, BELL + 10)} x={880} y={880} size={80} color={C.blue} rot={-4} k={143} />
        <Ink lines={[checkMark(900, 930, 80, 144)]} f={g} t={prog(g, BELL + 8, BELL + 14)} color={C.blue} size={8} k={144} />
      </InkLayer>
      <On x={lx - MAG.lx} y={ly - MAG.ly} w={MAG.w} h={MAG.h} lift={2.6}>
        <Img src={staticFile("objects/magnifier.png")} style={{ width: MAG.w, height: MAG.h }} />
      </On>
    </CamPath>
  );
}

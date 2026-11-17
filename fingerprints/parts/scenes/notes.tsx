// 2. The same notes (bars 4-7). Scissors tagged "AI" hop along the coffee film and snip it into shots on the score's
// snips; the shots drop into a cut, and on every snip after that the AI recuts them. The faults ride along every
// time, so the same sticky notes slap down beside it, again and again, on the score's slaps.
import { Img, staticFile } from "raea";
import { C } from "../draw";
import { clamp, easeInOut, hash, nudge, step } from "../ink";
import { Desk, On, Sticky, TEX, Tag } from "../paper";
import { FilmStrip, STILL } from "../props";
import { cues } from "../cues";
import { CamPath } from "../stage";

const FW = 250;
const GAP = 10;
const BAND = Math.round(FW * 0.1);
const FH = Math.round(FW * 0.5625);
const PW = FW + GAP * 2;
const PH = FH + BAND * 2;
const STRIP = { x: 150, y: 235, pitch: 260 };
const ROW = { x: 150, y: 480, pitch: 268 };

// the score snips nine times in these bars: five cut the film into shots, four recut them
const ALL_SNIPS = cues("snip", 240, 480);
export const SNIPS = ALL_SNIPS.slice(0, 5);
const RECUTS = ALL_SNIPS.slice(5);
const SLAP_AT = cues("slap", 240, 480);
const ARR = [
  [1, 4, 0, 2, 5, 3],
  [4, 2, 1, 5, 0, 3],
  [2, 0, 4, 3, 1, 5],
  [0, 4, 5, 2, 3, 1],
  [5, 2, 4, 1, 0, 3],
];
const NOTES: [string, number, number, number][] = [
  // text, centre x, centre y, rotation
  ["too dark", 330, 790, -6],
  ["too dark", 650, 820, 5],
  ["hiss!", 960, 775, -3],
  ["too dark\n(again)", 1270, 815, 7],
  ["still soft", 1590, 785, -5],
  ["too dark", 470, 950, 9],
  ["hiss", 820, 965, -8],
  ["too dark?!", 1140, 945, 4],
  ["AGAIN", 1460, 960, -10],
];
if (SNIPS.length !== 5 || RECUTS.length !== 4 || SLAP_AT.length !== NOTES.length) throw new Error(`notes: the score has ${ALL_SNIPS.length} snips and ${SLAP_AT.length} slaps here`);
const SLAPS = NOTES.map((n, i) => [SLAP_AT[i], ...n] as [number, string, number, number, number]);

const hop = (a: [number, number, number], b: [number, number, number], t: number, lift = 60): [number, number, number] => {
  const e = easeInOut(t);
  return [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e - Math.sin(Math.PI * t) * lift, a[2] + (b[2] - a[2]) * e];
};

/** shot i's place (x, y, rotation) at frame g: in the strip, cut loose, dropped into the cut, recut */
function piece(i: number, g: number): [number, number, number] {
  const f = step(g, 2);
  const home: [number, number, number] = [STRIP.x + i * STRIP.pitch, STRIP.y, 0];
  const freed = SNIPS[Math.min(i, 4)];
  const loose: [number, number, number] = [home[0] + (i % 2 ? 10 : -8), home[1] + 22 + hash(i, 3) * 14, (hash(i, 4) - 0.5) * 7];
  const slot = (arr: number[], r: number): [number, number, number] => {
    const j = arr.indexOf(i);
    return [ROW.x + j * ROW.pitch, ROW.y + (hash(r, i) - 0.5) * 10, (hash(r, i, 2) - 0.5) * 4];
  };
  if (f < freed) return home;
  let at = hop(home, loose, clamp((f - freed) / 4), 6);
  const drop = 349 + ARR[0].indexOf(i) * 3;
  if (f >= drop) at = hop(loose, slot(ARR[0], 0), clamp((f - drop) / 10), 80);
  for (let r = 0; r < RECUTS.length; r++) {
    const s = RECUTS[r] + 1 + (i % 3);
    if (f >= s) at = hop(slot(ARR[r], r), slot(ARR[r + 1], r + 1), clamp((f - s) / 8), 70);
  }
  return at;
}

/** the scissors' blade tips at frame g, and whether they're closing (a snip) */
function scissors(g: number): { x: number; y: number; snip: boolean } {
  const f = step(g, 2);
  const cutX = (k: number) => STRIP.x + (k + 1) * STRIP.pitch + 5;
  const tipY = STRIP.y + PH + 26;
  const marks: [number, number, number][] = [[226, 2100, -200], ...SNIPS.map((s, k) => [s, cutX(k), tipY] as [number, number, number])];
  RECUTS.forEach((s, r) => {
    const x = ROW.x + ((r * 2 + 1) % 6) * ROW.pitch + PW + 4;
    marks.push([s, x, ROW.y + PH + 26]);
  });
  marks.push([490, 2200, -100]);
  let x = marks[0][1];
  let y = marks[0][2];
  for (let m = 1; m < marks.length; m++) {
    const [f0, x0, y0] = marks[m - 1];
    const [f1, x1, y1] = marks[m];
    if (f >= f1) { x = x1; y = y1; continue; }
    if (f >= f0) {
      // stay through the snip, then hop to the next cut
      const t = clamp((f - (f0 + 4)) / Math.max(1, f1 - f0 - 6));
      const e = easeInOut(t);
      x = x0 + (x1 - x0) * e;
      y = y0 + (y1 - y0) * e - Math.sin(Math.PI * t) * 70;
    }
    break;
  }
  const snip = [...SNIPS, ...RECUTS].some((s) => g >= s && g < s + 3);
  return { x, y, snip };
}

export function NotesScene({ g }: { g: number }) {
  const sc = scissors(g);
  const j = nudge(21, g, 1.2);
  // the image's blades point left; turned -90 they point down, tips 260 px below its centre
  const cx = sc.x + 16 + j.x;
  const cy = sc.y - 260 + (sc.snip ? 10 : 0) + j.y;
  const recut = RECUTS.filter((r) => g >= r).length;
  return (
    <CamPath f={g} keys={[[230, 960, 300, 1.24], [320, 960, 345, 1.18], [372, 960, 590, 1.07], [480, 960, 705, 1.1]]}>
      <Desk f={g} tex={TEX.kraft} />
      {/* the shots, back to front by when they last moved */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const [x, y, r] = piece(i, g);
        const n = nudge(30 + i, g, 0.5);
        return (
          <On key={i} x={x + n.x} y={y + n.y} w={PW} h={PH} rot={r + n.r} lift={g >= SNIPS[Math.min(i, 4)] ? 1.4 : 0.8}>
            <FilmStrip frames={[STILL("v1", i)]} fw={FW} gap={GAP} />
          </On>
        );
      })}
      {g >= 349 ? (
        <Tag x={ROW.x - 40} y={ROW.y - 132} w={300} h={110} rot={-4} seed={6}>
          <div style={{ position: "absolute", left: 66, top: 18, fontFamily: "Special Elite", fontSize: 60, lineHeight: 1, color: C.ink }}>{recut ? `cut ${recut + 1}` : "cut 1"}</div>
        </Tag>
      ) : null}
      {SLAPS.map(([at, text, x, y, rot], i) => {
        const f = step(g, 2);
        if (f < at - 4) return null;
        const t = clamp((f - (at - 4)) / 4);
        const s = 1.3 - 0.3 * t;
        const off = (1 - t) * 90;
        return (
          <div key={i} style={{ position: "absolute", left: 0, top: 0, transformOrigin: `${x}px ${y}px`, transform: `translate(${-off}px, ${-off * 0.6}px) scale(${s})` }}>
            <Sticky x={x - 130} y={y - 130} s={260} rot={rot + nudge(40 + i, g, 0.4).r} seed={i + 2}>
              <div style={{ position: "absolute", left: 0, right: 0, top: text.includes("\n") ? 52 : 86, textAlign: "center", fontFamily: "Caveat", fontWeight: 700, fontSize: 68, lineHeight: 0.95, color: C.ink, whiteSpace: "pre" }}>{text}</div>
            </Sticky>
          </div>
        );
      })}
      {/* the AI's scissors, with its tag */}
      <On x={cx - 260} y={cy - 158} w={520} h={316} rot={-90 + (sc.snip ? 7 : 0) + j.r * 2} lift={2.2}>
        <Img src={staticFile("objects/scissors.png")} style={{ width: 520, height: 316 }} />
      </On>
      <Tag x={cx + 80} y={cy - 110} w={230} h={124} rot={14 + j.r * 3} seed={9}>
        <div style={{ position: "absolute", left: 66, top: 16, fontFamily: "Permanent Marker", fontSize: 84, lineHeight: 1, color: C.ink }}>AI</div>
      </Tag>
    </CamPath>
  );
}

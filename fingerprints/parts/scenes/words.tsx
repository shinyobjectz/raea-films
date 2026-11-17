// 4. Your words (bars 14-17). Close on the print: its ridges are written in your words, tiny, running along each
// ridge. The words are written large in red pencil as the voice says them and pinned to the print with red string;
// a calendar leaf says DAY 1; then a too-dark photo and a scrap of hissing sound track are pinned up: what those
// words look and sound like.
import { C, Hand, PRINT_RIDGES, Print, Wire } from "../draw";
import { type Line, type Pt, boil, handLine, length, nudge, polyline, prog } from "../ink";
import { Cut, Desk, On, Polaroid, Sheet, TEX, Tape } from "../paper";
import { STILL, Waveform } from "../props";
import { CamPath, InkLayer } from "../stage";
import { LINE_AT, word } from "../timeline";

const PX = 960;
const PY = 540;
const PS = 300;
const TOO = word("07", "too");
const HISS = word("07", "hiss");
const SOFT = word("07", "too", 1);
const DAY = word("07", "day");
const LOOK = word("07", "look");
const SOUND = word("07", "sound");

const place = (l: Line): Line => l.map(([x, y]) => [PX + x * PS, PY + y * PS] as Pt);
// the ridges that carry words: the longer ones, every other, core outward
const WORD_RIDGES = PRINT_RIDGES.map((r, i) => ({ line: place(r.line), i }))
  .filter((r) => length(r.line) > 150)
  // inside the frame's safe area for the whole push-in, so no word sits where a player's controls go
  .filter((r) => r.line.every(([x, y]) => y > 195 && y < 860 && x > 270 && x < 1650))
  .filter((_, j) => j % 2 === 0)
  .slice(0, 80);
const PHRASE = "too dark · hiss under the voice · too soft · ".repeat(6);

function Pin({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x + 2} cy={y + 3} r={10} fill="rgba(40,20,10,0.35)" />
      <circle cx={x} cy={y} r={10} fill={C.red} />
      <circle cx={x - 3} cy={y - 3} r={3} fill="#f3c4b8" />
    </g>
  );
}

export function WordsScene({ g }: { g: number }) {
  const shown = Math.round(WORD_RIDGES.length * prog(g, LINE_AT["07"], TOO - 4));
  const leaf = Cut(g, DAY - 8, DAY, [1500, -520, 30], [1345, 600, 6], 41, 2);
  const dark = Cut(g, LOOK - 8, LOOK, [-500, 360, -30], [290, 390, -8], 42, 2);
  const scrap = Cut(g, SOUND - 8, SOUND, [2100, 440, 20], [1255, 470, -3], 43, 2);
  const strings: [Line, number][] = [
    [handLine(625, 345, 790, 400, 51, 0.12), TOO + 12],
    [handLine(1255, 350, 1150, 430, 52, -0.1), HISS + 22],
    [handLine(600, 790, 820, 760, 53, 0.1), SOFT + 12],
    [handLine(400, 400, 420, 350, 54, 0.05), LOOK + 2],
    [handLine(1320, 480, 1315, 425, 55, 0.05), SOUND + 2],
  ];
  return (
    <CamPath f={g} keys={[[830, 960, 530, 1.1, 0], [960, 960, 530, 1.14, -0.6], [1080, 960, 525, 1.2, -1.4]]}>
      <Desk f={g} tex={TEX.board} />
      <Sheet x={50} y={30} w={1820} h={1020} rot={0.5} tex={TEX.crumpled} tint="#f2e9d6" seed={5} lift={1} />
      <InkLayer id="s4" g={g} scale={1.4}>
        <Print f={g} cx={PX} cy={PY} s={PS} k={5} words opacity={0.65} boilAmp={0.4} />
        <defs>
          {WORD_RIDGES.slice(0, shown).map((r) => (
            <path key={r.i} id={`rw-${r.i}`} d={polyline(boil(r.line, g, 700 + r.i, 0.5))} />
          ))}
        </defs>
        {WORD_RIDGES.slice(0, shown).map((r) => (
          <text key={r.i} fontFamily="Special Elite" fontSize={13} fill={C.ink} opacity={0.85}>
            <textPath href={`#rw-${r.i}`} startOffset={(r.i * 37) % 120}>
              {PHRASE}
            </textPath>
          </text>
        ))}
      </InkLayer>
      {g >= LOOK - 8 ? <Polaroid x={dark.x} y={dark.y} w={240} rot={dark.r} src={STILL("v1", 4)} seed={7} /> : null}
      {g >= SOUND - 8 ? (
        <>
          <Sheet x={scrap.x} y={scrap.y} w={400} h={140} rot={scrap.r} tex={TEX.white} tint="#f6eedc" torn="trbl" seed={9} lift={1.2} />
          <InkLayer id="s4w" g={g}>
            <g transform={`rotate(${scrap.r} ${scrap.x + 200} ${scrap.y + 70})`}>
              <Waveform f={g} x={scrap.x + 26} y={scrap.y + 70} w={348} h={80} hiss={0.6} hissFrom={0} hissTo={1} k={57} />
            </g>
          </InkLayer>
        </>
      ) : null}
      {g >= DAY - 8 ? (
        <On x={leaf.x} y={leaf.y} w={290} h={275} rot={leaf.r} lift={1.4}>
          <div style={{ position: "absolute", inset: 0, background: "#f7f2e6" }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 74, background: C.red }} />
          {[75, 200].map((x) => (
            <div key={x} style={{ position: "absolute", left: x, top: 20, width: 18, height: 18, borderRadius: 9, background: "#efe6d2", boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.5)" }} />
          ))}
          <div style={{ position: "absolute", left: 0, right: 0, top: 80, textAlign: "center", fontFamily: "Special Elite", fontSize: 60, color: C.ink, letterSpacing: 6 }}>DAY</div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 122, textAlign: "center", fontFamily: "DM Serif Display", fontSize: 140, lineHeight: 1, color: C.ink }}>1</div>
        </On>
      ) : null}
      {g >= DAY ? <Tape x={leaf.x + 85} y={leaf.y - 20} w={120} h={38} rot={-4} seed={12} /> : null}
      <InkLayer id="s4m" g={g}>
        <Hand text="too dark" f={g} t={prog(g, TOO, TOO + 12)} x={300} y={330} size={110} rot={-6} k={61} />
        <Hand text="hiss under" f={g} t={prog(g, HISS, HISS + 14)} x={1255} y={320} size={100} rot={-3} k={62} />
        <Hand text="the voice" f={g} t={prog(g, HISS + 12, HISS + 24)} x={1280} y={408} size={100} rot={-3} k={63} />
        <Hand text="too soft" f={g} t={prog(g, SOFT, SOFT + 12)} x={300} y={820} size={110} rot={4} k={64} />
        {strings.map(([l, at], i) => (
          <Wire key={i} lines={[l]} f={g} t={prog(g, at, at + 8)} color={C.red} width={2.6} k={70 + i} />
        ))}
      </InkLayer>
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {strings.map(([l, at], i) => (g >= at + 8 ? <Pin key={i} x={l[l.length - 1][0] + nudge(80 + i, g, 0.4).x} y={l[l.length - 1][1]} /> : null))}
      </svg>
    </CamPath>
  );
}

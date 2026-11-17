// 6. Yours (bars 24-28). A laptop is drawn; your fingerprint card and the footage's reels slide into its screen;
// a dotted ring goes round it ("your computer") and a padlock shuts as the voice says the footage never leaves.
// Then the camera pulls back to three teammates' laptops: copies of the card go out to each on dotted blue arrows,
// a reel tries to follow and is crossed out in red, and each copy is redrawn in its owner's own ink.
import { Img } from "raea";
import { C, Hand, Ink, Print, Wire } from "../draw";
import { type Line, arrow, clamp, handCircle, handLine, prog, step } from "../ink";
import { Cut, On, Sheet, TEX, paperOf } from "../paper";
import { Laptop, Padlock, Reel } from "../props";
import { cues } from "../cues";
import { CamPath, InkLayer } from "../stage";
import { LINE_AT, word } from "../timeline";

const COMPUTER = word("10", "computer");
const FOOTAGE = word("10", "footage");
const LEAVES = word("10", "leaves");
const TEAM = word("11", "team");
const SHARE = word("11", "share");
const NEVER = word("11", "never");
const OWN = cues("slap", 1640, 1700); // everyone, keeps, own

const MAIN = { x: 610, y: 150, w: 700 };
const MATES = [
  { x: -190, y: 990, w: 330, ink: C.blue },
  { x: 795, y: 1095, w: 330, ink: C.green },
  { x: 1780, y: 990, w: 330, ink: C.ochre },
];
const screenC = (l: { x: number; y: number; w: number }): [number, number] => [l.x + l.w * 0.5, l.y + l.w * 0.325];
const CARD = { x: 680, y: 215, w: 220, h: 290 };
// the ink layers cover everything the camera sees as it pulls back
const DESK_BOX: [number, number, number, number] = [-520, -260, 2960, 1860];

/** a print on a small white card: the fingerprint as a file you keep */
function PrintCard({ x, y, w, h, rot = 0, children }: { x: number; y: number; w: number; h: number; rot?: number; children?: React.ReactNode }) {
  return (
    <On x={x} y={y} w={w} h={h} rot={rot} lift={1.1}>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", border: "1px solid rgba(60,40,20,0.25)", ...paperOf("card", w * 3, [0, 0]) }}>
        {children}
      </div>
    </On>
  );
}

function BigDesk() {
  return (
    <div style={{ position: "absolute", left: -1200, top: -800, width: 4300, height: 2900 }}>
      <Img src={TEX.board} style={{ position: "absolute", left: 0, top: 0, width: 4300, height: 4300 }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,246,228,0.25) 0%, rgba(255,246,228,0) 45%, rgba(40,22,8,0.18) 100%)" }} />
    </div>
  );
}

export function YoursScene({ g }: { g: number }) {
  const card = Cut(g, LINE_AT["10"] - 8, LINE_AT["10"] + 6, [-700, 260, -20], [CARD.x, CARD.y, -2], 71, 2);
  const lock = clamp((step(g, 2) - (LEAVES - 6)) / 6);
  const [mx, my] = screenC(MAIN);
  const copies = MATES.map((m, i) => {
    const [tx, ty] = screenC(m);
    return Cut(g, SHARE + i * 3, SHARE + 18 + i * 3, [CARD.x + 55, CARD.y + 70, -2], [tx - 55, ty - 70, (i - 1) * 6], 72 + i, 3);
  });
  // a reel that tries to go with them, and is sent back
  const tryGo = Cut(g, SHARE + 10, NEVER - 2, [1160, 420, 0], [1520, 760, 10], 76, 2);
  const back = Cut(g, NEVER + 10, NEVER + 22, [1520, 760, 10], [1160, 420, 0], 77, 2);
  const reel2 = g >= NEVER + 10 ? back : tryGo;
  const routes: Line[][] = MATES.map((m, i) => {
    const [tx, ty] = screenC(m);
    return arrow(mx - 170 + i * 170, my + 330, tx + (i - 1) * -30, ty - 110, 160 + i, (i - 1) * -0.12);
  });
  return (
    <CamPath f={g} keys={[[1430, 960, 520, 1.0], [1545, 960, 535, 1.02], [1590, 960, 640, 0.86], [1650, 960, 725, 0.775], [1740, 960, 738, 0.755]]}>
      <BigDesk />
      <Sheet x={-420} y={-80} w={2760} h={1620} rot={0.3} tex={TEX.white} tint="#f2e9d6" seed={14} lift={0.8} />
      <InkLayer id="s6" g={g} box={DESK_BOX}>
        <Laptop f={g} t={prog(g, 1432, 1474)} x={MAIN.x} y={MAIN.y} w={MAIN.w} k={70} />
        {MATES.map((m, i) => (
          <Laptop key={i} f={g} t={prog(g, TEAM - 26 + i * 6, TEAM + 4 + i * 6)} x={m.x} y={m.y} w={m.w} k={170 + i * 7} />
        ))}
      </InkLayer>
      {g >= LINE_AT["10"] - 8 ? (
        <PrintCard x={card.x} y={card.y} w={CARD.w} h={CARD.h} rot={card.r} />
      ) : null}
      {copies.map((c, i) => (g >= SHARE + i * 3 ? <PrintCard key={i} x={c.x} y={c.y} w={110} h={140} rot={c.r} /> : null))}
      <InkLayer id="s6m" g={g} scale={1.6} box={DESK_BOX}>
        {g >= LINE_AT["10"] - 8 ? <Print f={g} t={prog(g, LINE_AT["10"] + 4, LINE_AT["10"] + 18)} cx={card.x + CARD.w / 2} cy={card.y + CARD.h / 2} s={78} k={5} boilAmp={0.3} /> : null}
        {copies.map((c, i) => (g >= SHARE + i * 3 ? <Print key={i} f={g} cx={c.x + 55} cy={c.y + 70} s={37} k={5} boilAmp={0.25} /> : null))}
        {copies.map((c, i) => (g >= OWN[i] - 2 ? <Print key={`o${i}`} f={g} t={prog(g, OWN[i] - 2, OWN[i] + 6)} cx={c.x + 55} cy={c.y + 70} s={37} k={6 + i} color={MATES[i].ink} boilAmp={0.25} /> : null))}
        <Reel f={g} t={prog(g, FOOTAGE - 12, FOOTAGE)} cx={1040} cy={320} r={68} k={80} />
        <Reel f={g} t={prog(g, FOOTAGE - 8, FOOTAGE + 4)} cx={reel2.x} cy={reel2.y} r={52} k={88} />
        <Hand text="footage" f={g} t={prog(g, FOOTAGE, FOOTAGE + 10)} x={1090} y={552} size={62} color={C.ink} anchor="middle" k={91} />
        <Wire lines={[handCircle(960, 500, 480, 425, 92, 1.0, -1.9)]} f={g} t={prog(g, COMPUTER - 4, COMPUTER + 14)} color={C.blue} width={4} dash="2 14" k={92} />
        <Hand text="your" f={g} t={prog(g, COMPUTER - 2, COMPUTER + 6)} x={455} y={400} size={92} color={C.blue} anchor="end" rot={-5} k={93} />
        <Hand text="computer" f={g} t={prog(g, COMPUTER + 4, COMPUTER + 16)} x={470} y={492} size={92} color={C.blue} anchor="end" rot={-5} k={94} />
        <Padlock f={g} t={prog(g, FOOTAGE + 2, LEAVES - 6)} x={1380} y={340} s={130} k={95} open={1 - lock} />
        <Hand text="team" f={g} t={prog(g, TEAM - 2, TEAM + 10)} x={1430} y={1010} size={140} color={C.blue} rot={-4} k={96} />
        {routes.map((r, i) => (
          <Wire key={i} lines={r} f={g} t={prog(g, SHARE - 6 + i * 2, SHARE + 8 + i * 2)} color={C.blue} width={4.5} dash="3 16" k={97 + i} />
        ))}
        <Ink lines={[handLine(1440, 640, 1640, 860, 101, 0.04), handLine(1640, 640, 1440, 860, 102, -0.04)]} f={g} t={prog(g, NEVER, NEVER + 8)} color={C.red} size={11} k={101} />
      </InkLayer>
    </CamPath>
  );
}

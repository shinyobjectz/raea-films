// 3. The fingerprint (bars 8-13). A fingerprint is stamped on a ruled index card on the downbeat; raea's label and
// the typed word "fingerprint" arrive as the voice says them; "your eye, written down" in blue pencil. Then what it
// learns from lands around the card as the voice lists it (an approved cut, a picked take, a note, its reading of
// the note, checked), each with a blue arrow to the print, and the print's ridges turn blue as it learns.
import { Img, staticFile } from "raea";
import { C, Hand, Ink, Print, typed, writeT } from "../draw";
import { arrow, checkMark, handCircle, handLine, prog } from "../ink";
import { Cut, Desk, On, Polaroid, Sheet, Sticky, TEX, Tape } from "../paper";
import { STILL } from "../props";
import { cues } from "../cues";
import { CamPath, InkLayer, Stamp } from "../stage";
import { LINE_AT, word } from "../timeline";

const [STAMP_AT, APPROVE_AT] = cues("stamp", 470, 840);
const KEYS = cues("key", 500, 560);
const PICK = word("06", "pick");
const NOTES = word("06", "notes");
const CHECKS = word("06", "checks");
const RIGHT = word("06", "right");
const PX = 960;
const PY = 455;
const PS = 128;

/** the print, stamped: lands light and a little big, then pressed */
function Stamped({ g }: { g: number }) {
  if (g < STAMP_AT) return null;
  const s = g < STAMP_AT + 2 ? 1.05 : 1;
  const o = g < STAMP_AT + 2 ? 0.5 : g < STAMP_AT + 4 ? 0.8 : 1;
  return (
    <g filter="url(#s3-grain)" opacity={o} transform={`translate(${PX} ${PY}) scale(${s}) translate(${-PX} ${-PY})`}>
      <Print f={g} cx={PX} cy={PY} s={PS} k={5} size={0.027} boilAmp={0.35} />
    </g>
  );
}

export function PrintScene({ g }: { g: number }) {
  const logo = Cut(g, LINE_AT["05"] - 4, LINE_AT["05"] + 4, [-260, -320, -30], [548, 96, -8], 31, 2);
  const polA = Cut(g, APPROVE_AT - 16, APPROVE_AT - 4, [-520, 40, -25], [120, 110, -6], 32, 2);
  const polB1 = Cut(g, PICK - 18, PICK - 8, [-520, 700, 20], [96, 560, 4], 33, 2);
  const polB2 = Cut(g, PICK - 14, PICK - 4, [-520, 760, -15], [330, 600, -5], 34, 2);
  const slip = Cut(g, CHECKS - 10, CHECKS, [2100, 420, 12], [1390, 440, -2], 35, 2);
  const ruled = Array.from({ length: 18 }, (_, i) => 150 + i * 38);
  const blue = (from: number, range: [number, number]) => (g >= from ? <Print f={g} t={prog(g, from, from + 16)} cx={PX} cy={PY} s={PS} k={5} color={C.blue} range={range} boilAmp={0.35} /> : null);
  return (
    <CamPath f={g} keys={[[470, 960, 470, 1.32], [570, 960, 565, 1.2], [645, 960, 530, 1.04], [760, 960, 525, 1.02], [840, 960, 495, 1.1]]}>
      <Desk f={g} tex={TEX.board} />
      <Sheet x={30} y={24} w={1860} h={1030} rot={-0.4} tex={TEX.tan} torn="tb" seed={8} lift={0.8} />
      {/* the index card: ruled blue, a red head line and margin */}
      <Sheet x={600} y={110} w={720} h={830} rot={1.2} tex={TEX.white} tint="#f7f1e3" seed={4} lift={1.3}>
        {ruled.map((y) => (
          <div key={y} style={{ position: "absolute", left: 0, right: 0, top: y, height: 2, background: "rgba(44,90,160,0.32)" }} />
        ))}
        <div style={{ position: "absolute", left: 0, right: 0, top: 104, height: 3, background: "rgba(196,55,43,0.55)" }} />
        <div style={{ position: "absolute", left: 84, top: 0, bottom: 0, width: 2, background: "rgba(196,55,43,0.4)" }} />
      </Sheet>
      <Tape x={590} y={92} w={150} h={42} rot={-30} seed={3} />
      <Tape x={1220} y={900} w={150} h={42} rot={-24} seed={7} />
      <InkLayer id="s3" g={g} scale={1.6}>
        <Stamped g={g} />
        {blue(APPROVE_AT + 3, [0, 0.25])}
        {blue(PICK + 6, [0.25, 0.5])}
        {blue(NOTES + 4, [0.5, 0.75])}
        {blue(RIGHT + 2, [0.75, 1])}
        <text x={PX} y={762} textAnchor="middle" fontFamily="Special Elite" fontSize={74} fill={C.ink}>
          {typed("fingerprint", g, KEYS[0], KEYS[1] - KEYS[0])}
        </text>
        <Hand text="your eye, written down" f={g} t={writeT(g, word("05", "your"), 22, 1.4)} x={PX} y={840} size={68} color={C.blue} anchor="middle" rot={-1.5} k={81} />
      </InkLayer>
      {/* raea, on its label */}
      {g >= LINE_AT["05"] - 4 ? (
        <On x={logo.x} y={logo.y} w={150} h={206} rot={logo.r} lift={1.4}>
          <div style={{ position: "absolute", inset: 0, background: C.ink, borderRadius: 6 }} />
          <Img src={staticFile("brand/raea-logo.png")} style={{ position: "absolute", left: 22, top: 24, width: 106, height: 154 }} />
        </On>
      ) : null}
      {g >= LINE_AT["05"] ? <Tape x={logo.x + 30} y={logo.y - 18} w={100} h={36} rot={6} seed={11} /> : null}
      {/* what it learns from */}
      {g >= APPROVE_AT - 16 ? <Polaroid x={polA.x} y={polA.y} w={330} rot={polA.r} src={STILL("v3", 4)} seed={2} /> : null}
      {g >= PICK - 18 ? <Polaroid x={polB1.x} y={polB1.y} w={260} rot={polB1.r} src={STILL("v3", 0)} seed={3} /> : null}
      {g >= PICK - 14 ? <Polaroid x={polB2.x} y={polB2.y} w={260} rot={polB2.r} src={STILL("v3", 1)} seed={4} /> : null}
      {g >= NOTES - 4 ? (
        <div style={{ position: "absolute", left: 0, top: 0, transformOrigin: "1555px 245px", transform: `scale(${g < NOTES ? 1.25 : 1})` }}>
          <Sticky x={1430} y={120} s={250} rot={5} seed={5}>
            <div style={{ position: "absolute", left: 0, right: 0, top: 84, textAlign: "center", fontFamily: "Caveat", fontWeight: 700, fontSize: 68, color: C.ink }}>too dark</div>
          </Sticky>
        </div>
      ) : null}
      {g >= CHECKS - 10 ? (
        <Sheet x={slip.x} y={slip.y} w={440} h={210} rot={slip.r} tex={TEX.white} tint="#f7f1e3" torn="lr" seed={6} lift={1.2}>
          <div style={{ position: "absolute", left: 34, top: 30, fontFamily: "Special Elite", fontSize: 60, lineHeight: 1.25, color: C.ink, whiteSpace: "pre" }}>
            {typed("read as:\ntoo dark", g, CHECKS + 2, 2)}
          </div>
        </Sheet>
      ) : null}
      <InkLayer id="s3m" g={g}>
        <Stamp g={g} at={APPROVE_AT} x={282} y={398} text="APPROVED" size={54} rot={-9} grain="s3m-grain" k={3} />
        <Ink lines={[handCircle(460, 770, 150, 168, 91, 1.1, 0.4)]} f={g} t={prog(g, PICK, PICK + 10)} color={C.red} size={5.5} k={91} />
        <Ink lines={[handLine(1700, 556, 1760, 556, 92, 0.02), handLine(1760, 556, 1760, 612, 93, 0.02), handLine(1760, 612, 1700, 612, 94, 0.02), handLine(1700, 612, 1700, 556, 95, 0.02)]} f={g} t={prog(g, CHECKS + 4, CHECKS + 10)} color={C.blue} size={4} k={92} />
        <Ink lines={[checkMark(1712, 590, 62, 96)]} f={g} t={prog(g, RIGHT, RIGHT + 6)} color={C.blue} size={7} k={96} />
        <Ink lines={arrow(470, 300, 790, 390, 101, 0.1)} f={g} t={prog(g, APPROVE_AT + 2, APPROVE_AT + 12)} color={C.blue} size={4.5} k={101} />
        <Ink lines={arrow(610, 690, 820, 560, 102, -0.1)} f={g} t={prog(g, PICK + 4, PICK + 14)} color={C.blue} size={4.5} k={102} />
        <Ink lines={arrow(1420, 300, 1110, 380, 103, 0.12)} f={g} t={prog(g, NOTES + 2, NOTES + 12)} color={C.blue} size={4.5} k={103} />
        <Ink lines={arrow(1390, 560, 1110, 520, 104, -0.08)} f={g} t={prog(g, RIGHT + 2, RIGHT + 12)} color={C.blue} size={4.5} k={104} />
      </InkLayer>
    </CamPath>
  );
}

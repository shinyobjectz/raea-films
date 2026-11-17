// 7. The cut (bars 29-31). The coffee film, clean (the test cut every flag was fixed in), plays in a taped mat. A
// small eye is drawn beside it ("your eye"), the fingerprint is stamped on the mat's corner on the downbeat, and
// "Fingerprint" is set letter by letter, then "in" and raea's own logo on its dark label.
import { Img, Video, staticFile } from "raea";
import { C, Hand, Print } from "../draw";
import { nudge, prog, step } from "../ink";
import { Cut, Desk, On, Sheet, TEX, Tape } from "../paper";
import { Eye } from "../props";
import { cues } from "../cues";
import { CamPath, InkLayer } from "../stage";
import { LINE_AT, SCENES, word } from "../timeline";

const STAMP_AT = cues("stamp", 1740, 1920)[0];
const NAME = word("12", "fingerprint");
const IN = word("12", "in");
const TITLE = "Fingerprint";

export function EndScene({ g }: { g: number }) {
  const logo = Cut(g, IN - 4, IN + 2, [1900, -300, 30], [1262, 680, 4], 91, 2);
  const letters = Math.max(0, Math.min(TITLE.length, Math.floor((step(g, 2) - (NAME - 6)) / 2) + 1));
  const ps = g < STAMP_AT + 2 ? 1.06 : 1;
  const po = g < STAMP_AT + 2 ? 0.5 : g < STAMP_AT + 4 ? 0.8 : 1;
  return (
    <CamPath f={g} keys={[[SCENES.end.from - 10, 960, 520, 1.02], [SCENES.end.to, 990, 545, 1.07]]}>
      <Desk f={g} tex={TEX.board} />
      <Sheet x={40} y={36} w={1840} h={1010} rot={0.4} tex={TEX.kraft} seed={16} lift={0.9} />
      <Sheet x={110} y={200} w={980} h={590} rot={-1.5} tex={TEX.white} tint="#f7f1e3" seed={17} lift={1.6}>
        <div style={{ position: "absolute", left: 30, top: 30, width: 920, height: 518, overflow: "hidden", background: "#000" }}>
          <Video src={staticFile("cuts/cut-v3.mp4")} muted style={{ width: 920, height: 518 }} />
        </div>
      </Sheet>
      <Tape x={70} y={180} w={170} h={46} rot={-40} seed={18} />
      <Tape x={60} y={750} w={170} h={46} rot={38} seed={19} />
      <InkLayer id="s7" g={g}>
        <Eye f={g} t={prog(g, LINE_AT["12"] - 16, LINE_AT["12"] + 28)} cx={1470} cy={345} s={150} gaze={[-0.22, 0.12]} k={130} />
        {g >= STAMP_AT ? (
          <g filter="url(#s7-grain)" opacity={po} transform={`translate(1075 765) scale(${ps}) rotate(-12) translate(-1075 -765)`}>
            <Print f={g} cx={1075} cy={765} s={92} color={C.red} k={5} size={0.026} boilAmp={0.25} />
          </g>
        ) : null}
        <text x={1150} y={620} fontFamily="DM Serif Display" fontSize={126} fill={C.ink}>
          {TITLE.split("").map((ch, i) => {
            const j = nudge(200 + i, g, 0.8);
            return (
              <tspan key={i} dy={i === 0 ? j.y : 0} fillOpacity={i < letters ? 1 : 0}>
                {ch}
              </tspan>
            );
          })}
        </text>
        <Hand text="in" f={g} t={prog(g, IN - 6, IN)} x={1160} y={790} size={104} color={C.blue} k={131} />
      </InkLayer>
      {g >= IN - 4 ? (
        <On x={logo.x} y={logo.y} w={146} h={200} rot={logo.r} lift={1.5}>
          <div style={{ position: "absolute", inset: 0, background: C.ink, borderRadius: 6 }} />
          <Img src={staticFile("brand/raea-logo.png")} style={{ position: "absolute", left: 21, top: 23, width: 104, height: 151 }} />
        </On>
      ) : null}
      {g >= IN + 2 ? <Tape x={logo.x + 22} y={logo.y - 16} w={90} h={34} rot={-5} seed={20} /> : null}
    </CamPath>
  );
}

// A few seconds of the recorded playthrough from any frame, rendered in order (so the traced light has its history), to
// compare looks without rendering the whole film. compositions/segment.json says where, how long, and the look.
import { AbsoluteFill, Composition, registerRoot, useGameState } from "raea";
import { World } from "../game/world";
import { Hud } from "../game/hud";
import { MenuScreen, menuGame } from "../game/menuhud";
import { menuView } from "../game/menu";
import { NO_INPUT, type Input } from "../game/step";
import { SESSION0, sessionStep, type Session } from "../game/session";
import run from "../game/run.gen.json";
import seg from "./segment.json";

const REC = run as { frames: number; bits: string[]; inputs: number[][] };
const SEG = seg as { from: number; frames: number; restir: boolean; bounces: number };
function fromRecord(frame: number): Input {
  const r = REC.inputs[frame];
  if (!r) return NO_INPUT;
  return { keys: REC.bits.filter((_, i) => r[0] & (1 << i)), dx: r[1], dy: r[2], down: !!r[3] };
}
let S0: Session = SESSION0;
for (let k = 0; k < SEG.from; k++) S0 = sessionStep(S0, fromRecord(k));

function Segment() {
  const s = useGameState(S0, (st: Session, _in: unknown, frame: number) => sessionStep(st, fromRecord(SEG.from + frame)));
  const look = { restir: SEG.restir, bounces: SEG.bounces };
  return (
    <AbsoluteFill style={{ background: "#000000" }}>
      {s.at < 0 ? <World s={menuGame(s.m)} view={menuView(s.m.f)} noHand look={look} /> : <World s={s.g} look={look} />}
      {s.at < 0 ? <MenuScreen m={s.m} /> : <Hud s={s.g} />}
    </AbsoluteFill>
  );
}
registerRoot(() => (
  <>
    <Composition id="segment" component={Segment} width={1920} height={1080} fps={60} durationInFrames={SEG.frames} />
    <Composition id="segment-tall" component={Segment} width={1080} height={1920} fps={60} durationInFrames={SEG.frames} />
  </>
));

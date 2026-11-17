// The thermal film's score alone (no voice, no effects), to check each instrument plays: thermal/score.ts.
import { AbsoluteFill, Composition, registerRoot } from "raea";
import "./thermal/score";
import { DURATION } from "./thermal/time";

registerRoot(() => <Composition id="thermal-score-solo" width={320} height={180} fps={30} durationInFrames={DURATION} component={() => <AbsoluteFill style={{ background: "#000" }} />} />);

// The v3 bed alone (score and effects, no narration, no master), to measure what sits under the voice.
// Run: raea render fingerprint3-bed.tsx -o out/fp3-bed.wav
import { AbsoluteFill, Composition, registerRoot } from "raea";
import "./v3/score";
import { DURATION, FPS } from "./v3/time";
registerRoot(() => <Composition id="fingerprint3-bed" width={320} height={180} fps={FPS} durationInFrames={DURATION} component={() => <AbsoluteFill style={{ background: "#000" }} />} />);

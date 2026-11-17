// The thumb's ridges as a picture the hand's shader lays on the pad: white ink on black, 2048 square.
// Run: raea render ridges.tsx --frame 0 -o media/hand/maps/ridges.png
import { AbsoluteFill, Composition, registerRoot } from "raea";
import { Print } from "./parts/draw";
const R = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <svg width={2048} height={2048} style={{ position: "absolute", left: 0, top: 0 }}>
      <Print f={0} t={1} cx={1024} cy={960} s={640} color="#ffffff" size={0.02} boilAmp={0} />
    </svg>
  </AbsoluteFill>
);
registerRoot(() => <Composition id="ridges" width={2048} height={2048} fps={24} durationInFrames={1} component={R} />);

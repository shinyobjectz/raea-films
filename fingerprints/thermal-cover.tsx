// The cover for the tall thermal film (TikTok, Reels): heat type over the thumbs (shot 13, the hands low in the frame).
// Each Heat pass draws its own whole frame, so these are two stills, joined by tools/thermal-cover.sh with a screen
// blend: the type and its caption keep to the networks' safe box, the hands fill the bottom.
import { AbsoluteFill, Composition, registerRoot } from "raea";
import { shotFrames } from "./thermal/film";
import { ClipShotT, TypeShotT } from "./thermal/tall/shots";

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => { const k = clamp01(x); return k * k * (3 - 2 * k); };
const scan = (f: number, a: number, b: number) => (f < a ? 2 : 1.05 - 1.2 * ease((f - a) / (b - a)));
const SHOT = 13, FRAMES = shotFrames(SHOT).frames;

registerRoot(() => (
  <>
    <Composition id="cover-type" width={1080} height={1920} fps={30} durationInFrames={300}
      component={() => <AbsoluteFill style={{ background: "#000" }}><TypeShotT lines={["AI that", "learns your", "editing style"]} id="cover" size={0.48} span={300} caption={"fingerprint · in raea\non your own computer"} /></AbsoluteFill>} />
    <Composition id="cover-clip" width={1080} height={1920} fps={30} durationInFrames={FRAMES}
      component={() => (
        <AbsoluteFill style={{ background: "#000" }}>
          <ClipShotT name="thumbs" palette="ember" span={FRAMES / 30} view={() => [0.46, 0.65, 2]}
            trace={(f) => { const k = clamp01((f - 40) / 60); return { contours: 0.3, outline: 0.85, density: 10, scan: scan(f, 0, 24), ripple: [0.46, 0.72, 0.03 + 1.3 * ease(k), 1.2 * (1 - k)] }; }} />
        </AbsoluteFill>
      )} />
  </>
));

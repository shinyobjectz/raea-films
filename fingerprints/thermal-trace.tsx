// Look test for v2's scene trace (the director, 11-13: "for every stock footage we also have something tracing the scene
// with da3 or moge and then interacts somehow with the physical objects"): the sunset hand with its DA3 depth
// (tools/depth.py -> media/thermal/depth/sunset), a scan sweeping from the hand back to the hills, contours and the
// hand's outline left behind it, then a ring spreading from a fingertip across the hand.
import { AbsoluteFill, Composition, registerRoot, staticFile, useCurrentFrame } from "raea";
import { Plate, ToneMapping } from "raea/3d";
import { Camera3d } from "raea/camera";
import { Transform } from "raea/transform";
import cams from "./media/thermal/depth/sunset/cams.json";
import { Heat } from "./thermal/heat";

const N = cams.frames;
const LAYERS = Array.from({ length: N }, (_, i) => staticFile(`thermal/depth/sunset/d${String(i).padStart(4, "0")}.png`));
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => { const k = clamp01(x); return k * k * (3 - 2 * k); };

function Shot() {
  const f = useCurrentFrame();
  const scan = 1.05 - 1.15 * ease((f - 6) / 54);
  const ring = clamp01((f - 84) / 70);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Camera3d transform={Transform.fromXyz(0, 0, 5).lookingAt([0, 0, 0])} />
      <Plate src={staticFile("thermal/stock/silhouette-of-a-hand-being-held-up-in-front-of-46762.mp4")} time={6 + f / 30} name="plate-sunset" />
      <Heat
        frame={f}
        recipe={{ inv: 1.0, gamma: 1.8 }}
        floor={0.1}
        trace={{ layers: LAYERS, frame: f, inv: cams.near_far_inv as [number, number], scan, contours: 0.55, outline: 0.9, density: 28, ripple: [0.52, 0.12, 0.05 + ring * 0.9, (1 - ring) * 1.2 * (ring > 0 ? 1 : 0)] }}
      />
      <ToneMapping mode="none" />
    </AbsoluteFill>
  );
}

registerRoot(() => <Composition id="thermal-trace" width={1920} height={1080} fps={30} durationInFrames={N} component={Shot} />);

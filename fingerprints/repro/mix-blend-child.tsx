// Repro: raea draws mix-blend-mode on a child element in misaligned rectangles. A texture multiplied over a card
// (A: larger than the card and offset; B: exactly the card's box) keeps an unblended rim, and rotated (as the Tag is)
// the blend covers only some rectangles, which move as the card moves: the blocks the director noted in the Fingerprint
// explainer's tags and sticky note (v1, 0:32, 0:47, 0:52). C, background-blend-mode on the card itself, renders clean.
// Workaround in parts/paper.tsx: each card's colour baked into its texture (tools/bake.sh), no blend at all.
// Render: raea render repro/mix-blend-child.tsx --at 0,2 -o out/repro
import { AbsoluteFill, Composition, Img, registerRoot, useCurrentFrame } from "raea";
import { C } from "../parts/draw";
import { On, TEX } from "../parts/paper";

const BOX = { position: "absolute", width: 410, height: 150, overflow: "hidden", background: "#d9b77e" } as const;
const T = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      {/* A: as now, the texture larger than the card, offset */}
      <div style={{ ...BOX, left: 100, top: 100 }}><Img src={TEX.tan} style={{ position: "absolute", left: -132, top: -84, width: 600, height: 600, mixBlendMode: "multiply" }} /></div>
      {/* B: the texture exactly the card's box, cover */}
      <div style={{ ...BOX, left: 600, top: 100 }}><Img src={TEX.tan} style={{ position: "absolute", left: 0, top: 0, width: 410, height: 150, objectFit: "cover", objectPosition: "30% 40%", mixBlendMode: "multiply" }} /></div>
      {/* C: background-blend-mode on the card itself */}
      <div style={{ ...BOX, left: 1100, top: 100, backgroundImage: `url(${TEX.tan})`, backgroundSize: "600px 600px", backgroundPosition: "-132px -84px", backgroundBlendMode: "multiply" }} />
      {/* B rotated in an On with a clip-path, as the Tag is */}
      <On x={100} y={400} w={410} h={150} rot={-4 + f}>
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#d9b77e", clipPath: "polygon(14% 0%, 100% 0%, 100% 100%, 14% 100%, 0% 78%, 0% 22%)" }}>
          <Img src={TEX.tan} style={{ position: "absolute", left: 0, top: 0, width: 410, height: 150, objectFit: "cover", objectPosition: "30% 40%", mixBlendMode: "multiply" }} />
        </div>
      </On>
      {/* A rotated, for comparison */}
      <On x={700} y={400} w={410} h={150} rot={-4 + f}>
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#d9b77e", clipPath: "polygon(14% 0%, 100% 0%, 100% 100%, 14% 100%, 0% 78%, 0% 22%)" }}>
          <Img src={TEX.tan} style={{ position: "absolute", left: -132, top: -84, width: 600, height: 600, mixBlendMode: "multiply" }} />
        </div>
      </On>
      {/* the grade's way: a full-frame multiply larger than the frame, offset */}
      <Img src={TEX.white} style={{ position: "absolute", left: -37, top: -23, width: 2200, height: 2200, mixBlendMode: "multiply", opacity: 0.16 }} />
    </AbsoluteFill>
  );
};
registerRoot(() => <Composition id="t" width={1920} height={1080} fps={24} durationInFrames={4} component={T} />);

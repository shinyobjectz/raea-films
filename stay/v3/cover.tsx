// The cover for the upright Stay film (TikTok, Reels): the red door half repainted, the change running out from where
// the cursor points (out/v3t/film.mp4 at 30.9 s), the hook in the sky above it in Geist, raea's lockup on the path.
// The words keep to the middle 3:4, which the profile grid and search show, and to the networks' safe box.
//   raea render v3/cover.tsx --composition stay-cover --at 0 -o DIR/
import { AbsoluteFill, Composition, Img, registerRoot, staticFile } from "raea";
import { FACE, FONT } from "../parts/type";

const FULL = { position: "absolute", left: 0, top: 0, width: 1080, height: 1920 } as const;
const LOCK_W = 380, LOCK_H = (LOCK_W * 596) / 1664;

function Cover() {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <style>{FACE}</style>
      <Img src={staticFile("covers/door.png")} style={FULL} />
      <div style={{ ...FULL, height: 900, background: "linear-gradient(180deg, rgba(6,12,28,0.55) 0%, rgba(6,12,28,0.4) 50%, rgba(6,12,28,0) 100%)" }} />
      <div style={{ position: "absolute", left: 84, top: 300, width: 900, fontFamily: FONT, fontWeight: 700, fontSize: 112, lineHeight: 1.0, letterSpacing: -3, color: "#ffffff", textShadow: "0 2px 0 rgba(0,0,0,0.3), 0 0 34px rgba(4,10,30,0.7)", whiteSpace: "pre" }}>{"AI that only\nchanges what\nyou point at."}</div>
      <div style={{ ...FULL, top: 1300, height: 620, background: "linear-gradient(0deg, rgba(0,0,0,0.6), rgba(0,0,0,0.35) 50%, rgba(0,0,0,0))" }} />
      <Img src={staticFile("brand/raea-lockup.png")} style={{ position: "absolute", left: (1080 - LOCK_W) / 2, top: 1480, width: LOCK_W, height: LOCK_H }} />
    </AbsoluteFill>
  );
}

registerRoot(() => <Composition id="stay-cover" component={Cover} width={1080} height={1920} fps={30} durationInFrames={1} />);

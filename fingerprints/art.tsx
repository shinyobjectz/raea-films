// The flat things on the desk, as pictures the set lays on them: three sticky notes in the artist's hand (and one
// blank), three prints of takes, a contact strip of a cut (as shot, and with its dark frame fixed) and the thumb's
// print in red paint. Run: tools/art.sh (one still of each composition into media/v2/).
import { AbsoluteFill, Composition, Img, registerRoot, staticFile } from "raea";
import { Print } from "./parts/draw";

const FONTS = `
@font-face { font-family: 'Reenie Beanie'; src: url(${staticFile("fonts/ReenieBeanie.ttf")}); }
@font-face { font-family: 'IBM Plex Mono'; src: url(${staticFile("fonts/IBMPlexMono-Medium.ttf")}); }
`;
const YELLOW = "#f1dc6e";
const Note = ({ text }: { text?: string }) => (
  <AbsoluteFill style={{ background: YELLOW }}>
    <style>{FONTS}</style>
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 70, background: "rgba(120,90,10,0.08)" }} />
    {text ? <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", fontFamily: "Reenie Beanie", fontSize: 150, color: "#2a2a30", transform: "rotate(-3deg)" }}>{text}</div> : null}
  </AbsoluteFill>
);
const Photo = ({ src }: { src: string }) => (
  <AbsoluteFill style={{ background: "#f4f1ea" }}>
    <Img src={staticFile(src)} style={{ position: "absolute", left: 28, top: 28, width: 744, height: 478, objectFit: "cover" }} />
  </AbsoluteFill>
);
const FRAMES = [0, 1, 2, 3, 4, 5];
const Strip = ({ fixed }: { fixed?: boolean }) => (
  <AbsoluteFill style={{ background: "#f2efe7" }}>
    <style>{FONTS}</style>
    {FRAMES.map((i) => (
      <div key={i} style={{ position: "absolute", left: 40 + i * 396, top: 44, width: 372, height: 250 }}>
        <Img src={staticFile(`stills/${fixed && i === 4 ? "v3" : "v1"}-${i}.jpg`)} style={{ width: 372, height: 209, objectFit: "cover" }} />
        <div style={{ position: "absolute", left: 0, top: 218, fontFamily: "IBM Plex Mono", fontSize: 24, color: "#3a3833" }}>{`0:${String(i * 2).padStart(2, "0")}`}</div>
      </div>
    ))}
  </AbsoluteFill>
);
const Thumb = () => (
  <AbsoluteFill>
    <svg width={1024} height={1024} style={{ position: "absolute", left: 0, top: 0 }}>
      <Print f={0} t={1} cx={512} cy={470} s={330} color="#b3261c" size={0.023} boilAmp={0} />
    </svg>
  </AbsoluteFill>
);

registerRoot(() => (
  <>
    <Composition id="note-0" width={512} height={512} fps={24} durationInFrames={1} component={() => <Note text="too dark" />} />
    <Composition id="note-1" width={512} height={512} fps={24} durationInFrames={1} component={() => <Note text="hiss" />} />
    <Composition id="note-2" width={512} height={512} fps={24} durationInFrames={1} component={() => <Note text="too soft" />} />
    <Composition id="note-blank" width={512} height={512} fps={24} durationInFrames={1} component={() => <Note />} />
    <Composition id="print-0" width={800} height={534} fps={24} durationInFrames={1} component={() => <Photo src="stills/v3-1.jpg" />} />
    <Composition id="print-1" width={800} height={534} fps={24} durationInFrames={1} component={() => <Photo src="stills/v3-4.jpg" />} />
    <Composition id="print-2" width={800} height={534} fps={24} durationInFrames={1} component={() => <Photo src="stills/v3-5.jpg" />} />
    <Composition id="strip" width={2440} height={320} fps={24} durationInFrames={1} component={() => <Strip />} />
    <Composition id="strip-fixed" width={2440} height={320} fps={24} durationInFrames={1} component={() => <Strip fixed />} />
    <Composition id="thumb" width={1024} height={1024} fps={24} durationInFrames={1} component={Thumb} />
  </>
));

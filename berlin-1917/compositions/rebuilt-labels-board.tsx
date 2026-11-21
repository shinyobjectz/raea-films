// The Berlin film's new labels (components/rebuilt/labels.tsx) on a board, for judging on stills: on the paper desk with
// the plate of Ritterstraße 120, over dark footage (the dusk street), and the chapter card over the stair.
import { AbsoluteFill, Composition, Img, Sequence, Video, registerRoot, staticFile, useCurrentFrame } from "raea";
import { Caption, ChapterCard, Corner, Fonts, Leader, PAPER, Source, Stat, Tag } from "../components/rebuilt/labels";

const FPS = 24, W = 1920, H = 1080;

function DeskGround() {
  const lines = [];
  for (let x = 0; x <= W; x += 120) lines.push(<div key={`v${x}`} style={{ position: "absolute", left: x, top: 0, width: 1, height: H, background: "rgba(29,27,24,0.045)" }} />);
  for (let y = 0; y <= H; y += 120) lines.push(<div key={`h${y}`} style={{ position: "absolute", left: 0, top: y, width: W, height: 1, background: "rgba(29,27,24,0.045)" }} />);
  return <AbsoluteFill style={{ background: PAPER }}>{lines}</AbsoluteFill>;
}

function Desk() {
  const t = useCurrentFrame() / FPS;
  const pw = 1000, ph = 1000 * (1391 / 1800), px = 820, py = 560;
  return (
    <AbsoluteFill>
      <Fonts />
      <DeskGround />
      <div style={{ position: "absolute", left: px - pw / 2 - 12, top: py - ph / 2 - 12, padding: 12, background: "#fbfaf6", boxShadow: "0 16px 40px rgba(40,28,12,0.32)", transform: "rotate(-1deg)" }}>
        <Img src={staticFile("rebuilt/src4/p0075.jpg")} style={{ width: pw, height: ph, display: "block" }} />
      </div>
      <Tag x={1050} y={250} text="Ritterstraße 120: right side wing, 1 flight up" t={t} at={0.3} size={40} anchor="left" />
      <Tag x={1180} y={330} text="over a horse stable" t={t} at={0.8} size={40} red />
      <Leader from={[1060, 290]} to={[640, 420]} t={t} at={1.2} />
      <Stat t={t} items={[{ at: 1.0, n: "4,519", label: "new homes finished in Berlin, 1913" }, { at: 1.7, n: "13", label: "in 1918", red: true }]} />
      <Source t={t} at={0.5} text="Unsere Wohnungsuntersuchungen, 1917, plate z2_1917_MP_0075 · Heinr. Lichte & Co. (ZLB, public domain)" />
    </AbsoluteFill>
  );
}

function Footage() {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Fonts />
      <Video src={staticFile("rebuilt/real/rb-dusk.mp4")} muted style={{ width: W, height: H }} />
      <Caption place="Leipziger Straße, dusk" source="our 3D city, from Straube's plan of 1910" ref="Geoportal Berlin · Straube 1910, sheet IV C" t={t} at={0.3} />
      <Stat t={t} items={[{ at: 0.9, n: "160,000-170,000", label: "portions a day, December 1917" }]} />
      <Corner text="Our 3D city, finished by AI video" o={Math.min(1, t * 3)} />
    </AbsoluteFill>
  );
}

function Chapter() {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Fonts />
      <Video src={staticFile("rebuilt/real/rb-stair.mp4")} muted style={{ width: W, height: H }} />
      <AbsoluteFill style={{ background: "rgba(0,0,0,0.35)" }} />
      <ChapterCard n="CHAPTER TWO" title="Finding the house" t={t} at={0.3} />
      <Caption place="The stable, Ritterstraße 120" source="our set, from the plates' captions" ref="ZLB · plates z2_1917_MP_0075, 0077" t={t} at={1.9} />
      <Corner text="Our 3D model, built from the record" o={1} />
      <Source light t={t} at={0.6} out={1.5} text="Hobrecht, Die Canalisation von Berlin, 1884, Blatt 16 · Denkmaldatenbank Berlin 09031091" />
    </AbsoluteFill>
  );
}

registerRoot(() => (
  <>
    <Composition id="labels-desk" width={W} height={H} fps={FPS} durationInFrames={8 * FPS} component={Desk} />
    <Composition id="labels-footage" width={W} height={H} fps={FPS} durationInFrames={8 * FPS} component={Footage} />
    <Composition id="labels-chapter" width={W} height={H} fps={FPS} durationInFrames={8 * FPS} component={Chapter} />
  </>
));

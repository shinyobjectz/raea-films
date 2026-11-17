// Swamp-Side Mayor v9, the 16:9 cut, with its words to sing along at the bottom (the director 11-16: "can i get the 16:9
// version with sing along lyrics at the bottom not counting the ones that are already on screen"). The picture is the
// finished v9 (out/goose-v9.mp4, linked as assets/singalong/goose-v9.mp4), untouched; over it, one line at a time, each
// word filling with the lettering's yellow as it's sung. A word the film already paints in the frame as it's sung
// (components/singalong/lines.ts) is a blank in the line, filled by the painting. The sound is v9's own, put back on
// by tools/singalong.sh, so this renders picture only.
//
//   raea render compositions/singalong.tsx --composition singalong -o out/goose-v9-singalong-picture.mp4 --kbps 25000
import { AbsoluteFill, Composition, registerRoot, staticFile, useCurrentFrame } from "raea";
import { Video } from "raea/video";
import { LINES, type Tok } from "../components/singalong/lines";

const W = 2160, H = 1080, FPS = 30, FRAMES = 2696;
const YELLOW = "#f7c45e", CREAM = "#fff8ea", INK = "#1d1f2a", FONT = "Archivo Black", SIZE = 58;
const clamp = (x: number) => Math.max(0, Math.min(1, x));
// the ink ring the film's 2D text wears (components/tut/v9.tsx), and a soft shadow to lift it off a bright sky
const ring = (w: number) => [[-w, -w], [w, -w], [-w, w], [w, w], [0, -w], [0, w], [-w, 0], [w, 0]].map(([x, y]) => `${x}px ${y}px 0 ${INK}`).join(", ") + ", 0 6px 12px rgba(0,0,0,0.4)";
const TEXT = { font: `400 ${SIZE}px/1.3 "${FONT}"`, whiteSpace: "nowrap" as const, textShadow: ring(4) };

function Word({ k, t, first }: { k: Tok; t: number; first: boolean }) {
  const p = clamp((t - k.t) / k.dur);
  const gap = first || k.join ? 0 : SIZE * 0.3;
  // a painted word: its room kept, a bar where it would sit, filling as it's sung
  if (k.painted) return (
    <div style={{ position: "relative", marginLeft: gap }}>
      <div style={{ ...TEXT, color: "transparent", textShadow: "none" }}>{k.w}</div>
      <div style={{ position: "absolute", left: 2, right: 2, bottom: 14, height: 9, borderRadius: 5, background: CREAM, boxShadow: `0 0 0 4px ${INK}` }} />
      <div style={{ position: "absolute", left: 2, bottom: 14, height: 9, width: `${(p * 100).toFixed(2)}%`, borderRadius: 5, background: YELLOW }} />
    </div>
  );
  return (
    <div style={{ position: "relative", marginLeft: gap }}>
      <div style={{ ...TEXT, color: CREAM }}>{k.w}</div>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(p * 100).toFixed(2)}%`, overflow: "hidden" }}>
        <div style={{ ...TEXT, color: YELLOW }}>{k.w}</div>
      </div>
    </div>
  );
}

export function SingAlong({ t }: { t: number }) {
  const l = LINES.find((x) => t >= x.show && t < x.hide);
  if (!l) return null;
  const a = clamp((t - l.show) / 0.15) * clamp((l.hide - t) / 0.2);
  return (
    // its foot 128 px up: the bottom 120 px is where a player's controls sit (raea check's safe area)
    <div style={{ position: "absolute", left: 120, right: 120, bottom: 128, display: "flex", flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "flex-end", opacity: a }}>
      {l.toks.map((k, j) => <Word key={j} k={k} t={t} first={j === 0} />)}
    </div>
  );
}

function Film() {
  const frame = useCurrentFrame(), t = frame / FPS;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <style>{`@font-face { font-family: "${FONT}"; src: url("${staticFile("fonts/ArchivoBlack-Regular.ttf")}"); }`}</style>
      <Video src={staticFile("singalong/goose-v9.mp4")} muted style={{ position: "absolute", left: 0, top: 0, width: W, height: H }} />
      <SingAlong t={t} />
    </AbsoluteFill>
  );
}

registerRoot(() => <Composition id="singalong" width={W} height={H} fps={FPS} durationInFrames={FRAMES} component={Film} />);

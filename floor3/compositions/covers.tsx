// Covers for the two upright FLOOR3 films (TikTok, Reels): a frame of the run, the title screen's type (Inter, the
// cream and sand of game/menuhud.tsx) and the hook. The words keep to the middle 3:4, which the profile grid and search
// show, and inside the networks' safe box (x 65..940, y 269..1248), except the line under the wordmark.
//   cover-tall: floor3-9x16, the run held upright      cover-turn: floor3-turn-vertical, the film on its side
// Rendered by tools/covers.sh.
import { AbsoluteFill, Composition, Img, registerRoot, staticFile } from "raea";

const FONT = "Inter";
const SHADOW = "0 2px 0 #000, 0 0 18px #000";
const CREAM = "#ebe6d4", SAND = "#a39d86", STONE = "#bdb7a2";
const FULL = { position: "absolute", left: 0, top: 0, width: 1080, height: 1920 } as const;

function Back({ src, top = 0.84 }: { src: string; top?: number }) {
  return (
    <>
      <Img src={staticFile(src)} style={FULL} />
      <div style={{ ...FULL, background: `linear-gradient(180deg, rgba(0,0,0,${top}) 0%, rgba(0,0,0,${top * 0.7}) 28%, rgba(0,0,0,0) 44%)` }} />
    </>
  );
}

/** the title screen's wordmark and chapter line, centred */
function Wordmark({ top, size = 120 }: { top: number; size?: number }) {
  return (
    <div style={{ position: "absolute", left: 0, width: 1080, top, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: size, letterSpacing: 20, paddingLeft: 20, color: CREAM, textShadow: SHADOW, lineHeight: 1 }}>FLOOR3</div>
      <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 30, letterSpacing: 9, paddingLeft: 9, color: SAND, textShadow: SHADOW, marginTop: 22 }}>CHAPTER ONE  ·  AFK</div>
    </div>
  );
}

function Hook({ kicker, text, top = 300 }: { kicker: string; text: string; top?: number }) {
  return (
    <div style={{ position: "absolute", left: 88, top, width: 860 }}>
      <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 52, letterSpacing: 10, color: SAND, textShadow: SHADOW, lineHeight: 1.1 }}>{kicker}</div>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 104, letterSpacing: 3, lineHeight: 1.04, color: CREAM, textShadow: SHADOW, marginTop: 18, whiteSpace: "pre" }}>{text}</div>
    </div>
  );
}

function CoverTall() {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Back src="covers/office.png" />
      <Hook kicker="POV:" text={"YOUR HANDS\nARE CURSORS"} />
      <Wordmark top={1110} />
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1290, textAlign: "center", fontFamily: FONT, fontWeight: 600, fontSize: 28, letterSpacing: 7, paddingLeft: 7, color: STONE, textShadow: SHADOW }}>A HORROR GAME MADE IN RAEA</div>
    </AbsoluteFill>
  );
}

/** the title screen's drawn phone on its side, the turn's arrow over its corner (game/menuhud.tsx TurnUpright) */
function Phone({ cx, cy, size }: { cx: number; cy: number; size: number }) {
  const pw = 112, ph = 196;
  return (
    <svg style={{ position: "absolute", left: cx - size / 2, top: cy - size / 2 }} width={size} height={size} viewBox="-150 -150 300 300">
      <path d="M 40 -128 A 135 135 0 0 1 128 -40" fill="none" stroke={SAND} strokeWidth={6} strokeLinecap="round" />
      <path d="M 128 -40 L 108 -58 M 128 -40 L 136 -66" fill="none" stroke={SAND} strokeWidth={6} strokeLinecap="round" />
      <g transform="rotate(90)">
        <rect x={-pw / 2} y={-ph / 2} width={pw} height={ph} rx={18} fill="rgba(0,0,0,0.4)" stroke={CREAM} strokeWidth={7} />
        <rect x={-14} y={-ph / 2 + 13} width={28} height={6} rx={3} fill={CREAM} />
      </g>
    </svg>
  );
}

function CoverTurn() {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Back src="covers/corridor.png" top={0.88} />
      <Hook kicker="FLOOR3  ·  CHAPTER ONE" text={"LIMINAL\nHORROR GAME"} />
      <div style={{ ...FULL, background: "radial-gradient(ellipse 520px 300px at 540px 1180px, rgba(0,0,0,0.7), rgba(0,0,0,0.45) 55%, rgba(0,0,0,0))" }} />
      <Phone cx={540} cy={1090} size={250} />
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1210, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 52, letterSpacing: 10, paddingLeft: 10, color: CREAM, textShadow: SHADOW, lineHeight: 1.1 }}>TURN YOUR PHONE</span>
        <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 38, letterSpacing: 10, paddingLeft: 10, color: STONE, textShadow: SHADOW, lineHeight: 1.1 }}>TO WATCH</span>
      </div>
    </AbsoluteFill>
  );
}

registerRoot(() => (
  <>
    <Composition id="cover-tall" component={CoverTall} width={1080} height={1920} fps={30} durationInFrames={1} />
    <Composition id="cover-turn" component={CoverTurn} width={1080} height={1920} fps={30} durationInFrames={1} />
  </>
));

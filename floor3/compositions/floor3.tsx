// FLOOR3: the game. Played live, it reads the player's keys and mouse (mouse look from the pointer's motion); with nobody
// at the keys it plays the recorded session (game/run.gen.json: the input a player's devices produced, title screen
// and all, written by tools/record.ts), so `raea render` of this file is that playthrough.
import { AbsoluteFill, Composition, registerRoot, useGameState, type FrameInput } from "raea";
import { World } from "../game/world";
import { Hud } from "../game/hud";
import { MenuScreen, TurnUpright, menuGame } from "../game/menuhud";
import { menuView } from "../game/menu";
import { NO_INPUT, type Input } from "../game/step";
import { SESSION0, sessionStep, type Session } from "../game/session";
import run from "../game/run.gen.json";

const REC = run as { frames: number; bits: string[]; inputs: number[][] };
const BITS = REC.bits;

interface Live { s: Session; px: number | null; py: number | null }
const START: Live = { s: SESSION0, px: null, py: null };

function fromRecord(frame: number): Input {
  const r = REC.inputs[frame];
  if (!r) return NO_INPUT;
  const keys: string[] = [];
  BITS.forEach((k, i) => { if (r[0] & (1 << i)) keys.push(k); });
  return { keys, dx: r[1], dy: r[2], down: !!r[3] };
}

function liveStep(l: Live, input: FrameInput, frame: number): Live {
  const p = input.pointer;
  const moved = !!p && l.px !== null && (p.x !== l.px || p.y !== l.py);
  const live = input.keys.length > 0 || !!p?.down || moved;
  if (!live) return { s: sessionStep(l.s, fromRecord(frame)), px: p?.x ?? l.px, py: p?.y ?? l.py };
  const keys = input.keys.map((k) => (k.length === 1 ? k.toLowerCase() : k));
  const dx = (p && l.px !== null ? p.x - l.px : 0) + (keys.includes("ArrowLeft") ? -18 : 0) + (keys.includes("ArrowRight") ? 18 : 0);
  const dy = p && l.py !== null ? p.y - l.py : 0;
  return { s: sessionStep(l.s, { keys, dx: Math.round(dx), dy: Math.round(dy), down: !!p?.down }), px: p?.x ?? null, py: p?.y ?? null };
}

function Floor3() {
  const { s } = useGameState(START, liveStep);
  const onMenu = s.at < 0;
  return (
    <AbsoluteFill style={{ background: "#000000" }}>
      {onMenu ? <World s={menuGame(s.m)} view={menuView(s.m.f)} noHand /> : <World s={s.g} />}
      {onMenu ? <MenuScreen m={s.m} /> : <Hud s={s.g} />}
    </AbsoluteFill>
  );
}

/** the vertical turn film's upright prompt alone, on clear (rendered --alpha and laid over the wide film turned on its
 *  side by tools/turn.sh): it follows the same run, so it goes as the menu fades */
function TurnPrompt() {
  const { s } = useGameState(START, liveStep);
  return <AbsoluteFill>{s.at < 0 ? <TurnUpright m={s.m} /> : null}</AbsoluteFill>;
}

// The same game, the same run, three pictures: wide; tall, for a phone held upright (game/frame.ts); and wide with the
// title screen asking a phone to turn (the vertical turn film is the wide one on its side with floor3-turn-prompt over it)
const FRAMES = Math.max(60, REC.frames);
/** the title screen's length: the first frame of the game (the menu's click, its fade and hold) */
const MENU_FRAMES = 504;
registerRoot(() => (
  <>
    <Composition id="floor3" component={Floor3} width={1920} height={1080} fps={60} durationInFrames={FRAMES} />
    <Composition id="floor3-tall" component={Floor3} width={1080} height={1920} fps={60} durationInFrames={FRAMES} />
    <Composition id="floor3-turn" component={Floor3} width={1920} height={1080} fps={60} durationInFrames={FRAMES} />
    <Composition id="floor3-turn-prompt" component={TurnPrompt} width={1080} height={1920} fps={60} durationInFrames={MENU_FRAMES} />
  </>
));

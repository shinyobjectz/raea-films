// Fixed views of the level for checking props, doorways and materials: each view held HOLD frames (so the traced
// light has a history), with the game's state as it was at that moment of the recorded session. compositions/
// inspect.json lists them: { name, f (session frame), at (camera), to (looked at), fov? (degrees) }.
import { AbsoluteFill, Composition, registerRoot } from "raea";
import { World } from "../game/world";
import { NO_INPUT, type Game, type Input } from "../game/step";
import { SESSION0, sessionStep, type Session } from "../game/session";
import run from "../game/run.gen.json";
import views from "./inspect.json";

const HOLD = 24;
const REC = run as { frames: number; bits: string[]; inputs: number[][] };
interface View { name: string; f: number; at: [number, number, number]; to: [number, number, number]; fov?: number }
const V = views as View[];
const fromRecord = (k: number): Input => {
  const r = REC.inputs[k];
  return r ? { keys: REC.bits.filter((_, i) => r[0] & (1 << i)), dx: r[1], dy: r[2], down: !!r[3] } : NO_INPUT;
};
// the game's state at each view's frame, folded once
const order = V.map((v, i) => [v.f, i] as const).sort((a, b) => a[0] - b[0]);
const STATES: Game[] = new Array(V.length);
let s: Session = SESSION0, k = 0;
for (const [f, i] of order) { while (k < f) s = sessionStep(s, fromRecord(k++)); STATES[i] = s.g; }

function Inspect({ frame }: { frame: number }) {
  const v = V[Math.min(V.length - 1, Math.floor(frame / HOLD))];
  const g = STATES[V.indexOf(v)];
  const d = [v.to[0] - v.at[0], v.to[1] - v.at[1], v.to[2] - v.at[2]];
  const view = { pos: v.at, yaw: Math.atan2(-d[0], -d[2]), pitch: Math.atan2(d[1], Math.hypot(d[0], d[2])), fov: ((v.fov ?? 70) * Math.PI) / 180 };
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <World s={{ ...g, f: g.f }} view={view} noHand />
    </AbsoluteFill>
  );
}
import { useCurrentFrame } from "raea";
function Root() { return <Inspect frame={useCurrentFrame()} />; }
registerRoot(() => <Composition id="inspect" component={Root} width={1920} height={1080} fps={60} durationInFrames={V.length * HOLD} />);

// The whole session a player's devices drive: the title screen first, then the game. One pure fold over one input
// stream, so the composition, the recorder and the sound all agree on which frame is which.
import { BOOT, MENU_INITIAL, menuDone, menuStep, type Menu } from "./menu";
import { INITIAL, NO_INPUT, step, type Game, type Input } from "./step";

export interface Session { m: Menu; g: Game; /** the session frame the game began on (its state 0), -1 on the menu */ at: number }
export const SESSION0: Session = { m: MENU_INITIAL, g: INITIAL, at: -1 };

export function sessionStep(s: Session, inp: Input): Session {
  if (s.at < 0) {
    const m = menuStep(s.m, inp);
    return { m, g: s.g, at: menuDone(m) ? m.f : -1 };
  }
  return { ...s, g: step(s.g, inp) };
}

/** a person at the title screen: a moment with the title, a reach for New Game (a little past it and back), a beat on
 * it, a click. The input their mouse made, frame by frame, until the game starts. */
export function menuInputs(seed = 11): Input[] {
  let r = seed >>> 0;
  const rand = () => { r = (r + 0x6d2b79f5) >>> 0; let t = r; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const out: Input[] = [];
  let s = SESSION0, cx = 0, cy = 0; // carried fractions of a count
  const push = (dx: number, dy: number, down: boolean) => {
    cx += dx; cy += dy;
    const ix = Math.round(cx), iy = Math.round(cy);
    cx -= ix; cy -= iy;
    const inp: Input = { keys: [], dx: ix, dy: iy, down };
    out.push(inp);
    s = sessionStep(s, inp);
  };
  const wait = (frames: number, down = false) => { for (let i = 0; i < frames; i++) push((rand() - 0.5) * 0.25, (rand() - 0.5) * 0.25, down); };
  const reach = (tx: number, ty: number, frames: number) => {
    const x0 = s.m.x, y0 = s.m.y;
    let px = x0, py = y0;
    for (let i = 1; i <= frames; i++) {
      const u = i / frames, e = u * u * u * (10 - 15 * u + 6 * u * u);
      const bow = Math.sin(u * Math.PI) * 26; // a hand's arc, not a ruler's line
      const nx = x0 + (tx - x0) * e, ny = y0 + (ty - y0) * e - bow;
      push(nx - px, ny - py, false);
      px = nx; py = ny;
    }
  };
  // the engine's splash: the mouse does nothing yet, and the hand on it barely moves
  wait(BOOT);
  wait(Math.round(0.85 * 60)); // the title comes up
  // the hand on the mouse, before it means anything: a small drift and a rest
  reach(1236, 790, 36);
  wait(Math.round(0.65 * 60));
  reach(262 + rand() * 14, 598 + rand() * 6, 50); // onto New Game, a little past where it settles
  wait(7);
  reach(286, 619, 16); // settle on it
  wait(Math.round(0.42 * 60));
  wait(6, true); // the click
  while (s.at < 0) wait(1);
  return out;
}
export { NO_INPUT };

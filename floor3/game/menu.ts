// The title screen, before the game: an ordinary pointer (the same mouse counts the game turns into a look move it here
// across the screen), four items, and New Game, which fades to black and starts the game. Engine-free and pure, like
// the game's step; the session folds this first and the game after it.
import type { Input } from "./step";

export type MenuItem = "new" | "continue" | "options" | "quit";
export interface Item { id: MenuItem; label: string; x: number; y: number; w: number; h: number; enabled: boolean }
export const ITEMS: Item[] = [
  { id: "new", label: "NEW GAME", x: 150, y: 590, w: 380, h: 56, enabled: true },
  { id: "continue", label: "CONTINUE", x: 150, y: 656, w: 380, h: 56, enabled: false },
  { id: "options", label: "OPTIONS", x: 150, y: 722, w: 380, h: 56, enabled: true },
  { id: "quit", label: "QUIT", x: 150, y: 788, w: 380, h: 56, enabled: true },
];
export const SCREEN = { w: 1920, h: 1080 };
/** after New Game: the fade to black, then a held black before the game's first frame */
export const MENU_FADE = 66, MENU_HOLD = 34;
/** the title comes up over the corridor in this many frames */
export const TITLE_IN = 70;
/** the engine's splash before the title, as a game boots: the mark strikes like a tube, holds, and fades; the mouse
 * does nothing until the title is up */
export const BOOT = 180;
export const SPLASH = { strike: 10, textIn: 34, out: 144, gone: 174 };

export interface Menu { f: number; x: number; y: number; down: boolean; hover: MenuItem | null; click: number; ev: string[] }
export const MENU_INITIAL: Menu = { f: 0, x: 1290, y: 820, down: false, hover: null, click: -1, ev: [] };

export const itemAt = (x: number, y: number): Item | null => ITEMS.find((i) => x >= i.x && x < i.x + i.w && y >= i.y && y < i.y + i.h) ?? null;
export const menuDone = (m: Menu) => m.click >= 0 && m.f >= m.click + MENU_FADE + MENU_HOLD;

export function menuStep(m: Menu, inp: Input): Menu {
  const f = m.f + 1;
  if (f <= BOOT) return { ...m, f, down: inp.down, ev: [] };
  const ev: string[] = [];
  const clicked = m.click >= 0;
  const x = clicked ? m.x : Math.max(0, Math.min(SCREEN.w - 1, m.x + inp.dx));
  const y = clicked ? m.y : Math.max(0, Math.min(SCREEN.h - 1, m.y + inp.dy));
  const it = f - BOOT > TITLE_IN * 0.6 ? itemAt(x, y) : null;
  const hover = it && it.enabled ? it.id : null;
  if (hover && hover !== m.hover && !clicked) ev.push("menu:hover");
  let click = m.click;
  if (!clicked && inp.down && !m.down) {
    ev.push("menu:press");
    if (hover === "new") { click = f; ev.push("menu:new"); }
  }
  return { f, x, y, down: inp.down, hover: clicked ? m.hover : hover, click, ev };
}

/** the menu's camera: down the corridor from its dark west end, pushing in slowly, breathing */
export function menuView(f: number): { pos: [number, number, number]; yaw: number; pitch: number; roll: number } {
  const t = f / 60;
  return { pos: [1.7 + 0.11 * t, 1.6 + 0.004 * Math.sin(t * 0.9), -1.32 + 0.01 * Math.sin(t * 0.37)], yaw: -Math.PI / 2 + 0.012 * Math.sin(t * 0.31), pitch: -0.025 + 0.004 * Math.sin(t * 0.53), roll: 0 };
}

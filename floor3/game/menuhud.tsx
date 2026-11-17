// The title screen as the player sees it (the corridor behind it is the World, drawn from menu.ts's view): the engine's
// splash first, then the title, the four items, the pointer, and the fade to black after New Game. The menu's logic
// stays on its 1920x1080 screen (menu.ts), so one recorded run plays every shape; a tall picture draws that screen
// through `place`, a uniform scale and shift that keeps the pointer's path and the items it lands on together.
// The wide film made for phones ("floor3-turn") also asks the viewer to turn their phone.
import { Img, staticFile } from "raea";
import { BOOT, ITEMS, MENU_FADE, SPLASH, TITLE_IN, type Menu } from "./menu";
import { INITIAL, type Game } from "./step";
import { useShape, type Shape } from "./frame";

const FONT = "Inter";
const shadow = "0 2px 0 #000, 0 0 10px #000";
const smooth = (u: number) => { const t = Math.max(0, Math.min(1, u)); return t * t * (3 - 2 * t); };

/** the world behind the menu: the floor awake, its tubes as they are at night */
export const menuGame = (m: Menu): Game => ({ ...INITIAL, f: 3000 + m.f });

/** the menu's screen point (1920x1080) on this picture: wide, itself; tall, scaled by 0.8 and moved so the items stand
 * at the left margin above the phone's lower band, and the pointer's resting place (x 1290) stays inside the frame */
const TALL = { k: 0.8, x: -50, y: 588 };
const place = (sh: Shape, x: number, y: number) => (sh.tall ? { x: TALL.x + TALL.k * x, y: TALL.y + TALL.k * y } : { x, y });

export function Pointer({ x, y, u = 1 }: { x: number; y: number; u?: number }) {
  return (
    <svg style={{ position: "absolute", left: x - 1, top: y - 1 }} width={26 * u} height={40 * u} viewBox="0 0 22 34">
      <path d="M1 1 L1 27 L7.2 21.2 L11.6 31.5 L15.4 29.8 L11.1 19.8 L19.6 19.8 Z" fill="#ffffff" stroke="#000000" strokeWidth={1.6} strokeLinejoin="round" />
    </svg>
  );
}

/** how lit the engine's mark is: it strikes the way the floor's tubes do (a stutter, a beat dark, then on), holds, fades */
export function splashLight(f: number): number {
  const { strike, out, gone } = SPLASH;
  if (f < strike) return 0;
  if (f < strike + 3) return 0.55;
  if (f < strike + 8) return 0.06;
  const on = smooth((f - strike - 8) / 10);
  return on * (1 - smooth((f - out) / (gone - out)));
}

/** the engine's splash on black: raea's mark, and the line under it */
function Splash({ f, sh }: { f: number; sh: Shape }) {
  const lit = splashLight(f);
  const words = smooth((f - SPLASH.textIn) / 24) * (1 - smooth((f - SPLASH.out) / (SPLASH.gone - SPLASH.out)));
  const op = (v: number) => (v > 0.999 ? 1 : v);
  // wide: the mark's top at 404 of 1080; tall, the same distance above the middle
  const top = sh.h / 2 - 136;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: sh.w, height: sh.h, background: "#000000" }}>
      <Img src={staticFile("brand/raea-lockup.png")} style={{ position: "absolute", left: (sh.w - 520) / 2, top, width: 520, height: 186.5, opacity: op(lit) }} />
      <div style={{ position: "absolute", left: 0, top: top + 236, width: sh.w, display: "flex", justifyContent: "center", opacity: op(words) }}>
        <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 26, letterSpacing: 12, paddingLeft: 12, color: "#a7a291" }}>MADE IN RAEA ENGINE</span>
      </div>
    </div>
  );
}

/** a phone outline turning from upright to its side and back, and the line under it: on the wide film's title screen,
 * for whoever is watching it on a phone held upright. Sized to read at a fifth of its size (the film on an upright
 * phone): the line's letters are 9 points there */
function TurnPhone({ tf, sh }: { tf: number; sh: Shape }) {
  const a = smooth((tf - TITLE_IN * 0.4) / 24);
  if (a <= 0) return null;
  // a turn every 2.4 s: upright 0.7 s, a 0.5 s turn, on its side 0.7 s, a 0.5 s turn back
  const T = 144, p = ((tf - TITLE_IN * 0.4) % T + T) % T;
  const ease = (u: number) => { const t = Math.max(0, Math.min(1, u)); return t * t * t * (10 - 15 * t + 6 * t * t); };
  const turn = p < 42 ? 0 : p < 72 ? ease((p - 42) / 30) : p < 114 ? 1 : 1 - ease((p - 114) / 30);
  const cx = 1470, cy = 470, pw = 112, ph = 196;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: sh.w, height: sh.h, opacity: a > 0.999 ? 1 : a }}>
      {/* the right wall darkened behind it, as the left band does for the title */}
      <div style={{ position: "absolute", right: 0, top: 0, width: 960, height: sh.h, background: "linear-gradient(270deg, rgba(0,0,0,0.6), rgba(0,0,0,0.42) 45%, rgba(0,0,0,0))" }} />
      <svg style={{ position: "absolute", left: cx - 150, top: cy - 150 }} width={300} height={300} viewBox="-150 -150 300 300">
        {/* the turn's arrow, a quarter round the phone's top right */}
        <path d="M 40 -128 A 135 135 0 0 1 128 -40" fill="none" stroke="#a39d86" strokeWidth={6} strokeLinecap="round" opacity={0.9} />
        <path d="M 128 -40 L 108 -58 M 128 -40 L 136 -66" fill="none" stroke="#a39d86" strokeWidth={6} strokeLinecap="round" opacity={0.9} />
        <g transform={`rotate(${90 * turn})`}>
          <rect x={-pw / 2} y={-ph / 2} width={pw} height={ph} rx={18} fill="rgba(0,0,0,0.35)" stroke="#ebe6d4" strokeWidth={7} />
          <rect x={-14} y={-ph / 2 + 13} width={28} height={6} rx={3} fill="#ebe6d4" />
        </g>
      </svg>
      <div style={{ position: "absolute", left: cx - 400, width: 800, top: cy + 170, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 46, letterSpacing: 8, paddingLeft: 8, color: "#ebe6d4", textShadow: shadow }}>TURN YOUR PHONE</span>
        <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 34, letterSpacing: 8, paddingLeft: 8, color: "#bdb7a2", textShadow: shadow }}>TO WATCH</span>
      </div>
    </div>
  );
}

/** The vertical turn film's prompt (compositions/floor3.tsx floor3-turn-prompt): the wide film is laid on its side in a
 *  1080x1920 frame (tools/turn.sh), and this is the one thing upright on it, over the title screen, so a phone held
 *  upright reads it and turns (clockwise, as the drawn phone does) to watch. It comes up as the film starts, not with
 *  the title, so the ask is there in the first second, and goes as the menu fades into the game. Clear around it. */
export function TurnUpright({ m }: { m: Menu }) {
  const f = m.f, IN = 10;
  const fade = m.click >= 0 ? Math.min(1, (f - m.click) / MENU_FADE) : 0;
  const a = smooth((f - IN) / 18) * (1 - smooth(fade * 1.4));
  if (a <= 0.001) return null;
  // the drawn phone: upright 0.7 s, a 0.5 s turn, on its side 0.7 s, a 0.5 s turn back
  const T = 144, p = ((f - IN) % T + T) % T;
  const ease = (u: number) => { const t = Math.max(0, Math.min(1, u)); return t * t * t * (10 - 15 * t + 6 * t * t); };
  const turn = p < 42 ? 0 : p < 72 ? ease((p - 42) / 30) : p < 114 ? 1 : 1 - ease((p - 114) / 30);
  // (in the clear band above the middle: the splash's logo, on its side, stands from 690 px down; the bottom 500 px and
  // the right 150 px are under the apps' own buttons, the top 250 under their tabs)
  const cx = 540, cy = 395, pw = 112, ph = 196, k = 340 / 300;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, opacity: a > 0.999 ? 1 : a }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, background: `radial-gradient(ellipse 600px 420px at ${cx}px ${cy + 120}px, rgba(0,0,0,0.62), rgba(0,0,0,0.4) 55%, rgba(0,0,0,0))` }} />
      <svg style={{ position: "absolute", left: cx - 170, top: cy - 170 }} width={340} height={340} viewBox="-150 -150 300 300">
        <path d="M 40 -128 A 135 135 0 0 1 128 -40" fill="none" stroke="#a39d86" strokeWidth={6} strokeLinecap="round" opacity={0.9} />
        <path d="M 128 -40 L 108 -58 M 128 -40 L 136 -66" fill="none" stroke="#a39d86" strokeWidth={6} strokeLinecap="round" opacity={0.9} />
        <g transform={`rotate(${90 * turn})`}>
          <rect x={-pw / 2} y={-ph / 2} width={pw} height={ph} rx={18} fill="rgba(0,0,0,0.35)" stroke="#ebe6d4" strokeWidth={7} />
          <rect x={-14} y={-ph / 2 + 13} width={28} height={6} rx={3} fill="#ebe6d4" />
        </g>
      </svg>
      <div style={{ position: "absolute", left: 90, width: 900, top: cy + Math.round((ph / 2) * k) + 44, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 56, letterSpacing: 10, paddingLeft: 10, color: "#ebe6d4", textShadow: shadow, lineHeight: 1.1 }}>TURN YOUR PHONE</span>
        <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 40, letterSpacing: 10, paddingLeft: 10, color: "#bdb7a2", textShadow: shadow, lineHeight: 1.1 }}>TO WATCH</span>
      </div>
    </div>
  );
}

export function MenuScreen({ m }: { m: Menu }) {
  const sh = useShape();
  if (m.f < BOOT) return <Splash f={m.f} sh={sh} />;
  const tf = m.f - BOOT; // frames since the title began
  const a = Math.min(1, tf / TITLE_IN);
  const ta = a * a * (3 - 2 * a);
  const fade = m.click >= 0 ? Math.min(1, (m.f - m.click) / MENU_FADE) : 0;
  const t = sh.tall;
  const title = place(sh, 150, 300), pointer = place(sh, m.x, m.y);
  return (
    <>
      {/* a dark band behind the type, so it reads over the corridor */}
      <div style={{ position: "absolute", left: 0, top: 0, width: t ? sh.w : 900, height: sh.h, background: t ? "linear-gradient(90deg, rgba(0,0,0,0.72), rgba(0,0,0,0.46) 50%, rgba(0,0,0,0) 92%)" : "linear-gradient(90deg, rgba(0,0,0,0.74), rgba(0,0,0,0.5) 55%, rgba(0,0,0,0))" }} />
      <div style={{ position: "absolute", left: title.x, top: t ? 470 : title.y, opacity: ta > 0.999 ? 1 : ta }}>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: t ? 140 : 132, letterSpacing: 20, color: "#ebe6d4", textShadow: shadow, lineHeight: 1 }}>FLOOR3</div>
        <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: t ? 26 : 24, letterSpacing: 9, color: "#a39d86", textShadow: shadow, marginTop: 24 }}>CHAPTER ONE  ·  AFK</div>
      </div>
      {ITEMS.map((it) => {
        const on = m.hover === it.id;
        const ia = Math.max(0, Math.min(1, (tf - TITLE_IN * 0.45 - ITEMS.indexOf(it) * 5) / 18));
        const at = place(sh, it.x, it.y), k = t ? TALL.k : 1;
        return (
          <div key={it.id} style={{ position: "absolute", left: at.x, top: at.y, width: it.w * k, height: it.h * k, display: "flex", alignItems: "center", opacity: ia > 0.999 ? 1 : ia }}>
            {/* the hovered item's mark: a bar, not a glyph */}
            <span style={{ width: 5, height: t ? 28 : 30, marginRight: t ? 22 : 29, background: on ? "#ebe6d4" : "transparent", boxShadow: on ? "0 0 6px #000" : "none" }} />
            <span style={{ fontFamily: FONT, fontWeight: on ? 700 : 600, fontSize: t ? 34 : 32, letterSpacing: t ? 4 : 5, color: !it.enabled ? "#78746a" : on ? "#ffffff" : "#bdb7a2", textShadow: shadow }}>{it.label}</span>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: title.x, ...(t ? { top: place(sh, 0, 844).y + 52 } : { bottom: 150 }), fontFamily: FONT, fontWeight: 500, fontSize: 20, letterSpacing: 2, color: "#6f6b5e", opacity: ta }}>v0.9.4</div>
      {sh.id === "floor3-turn" ? <TurnPhone tf={tf} sh={sh} /> : null}
      {tf > TITLE_IN * 0.5 && fade < 1 ? <Pointer x={pointer.x} y={pointer.y} u={t ? 1.15 : 1} /> : null}
      {/* the corridor comes up from the splash's black */}
      {tf < 40 ? <div style={{ position: "absolute", left: 0, top: 0, width: sh.w, height: sh.h, background: "#000", opacity: 1 - smooth(tf / 40) }} /> : null}
      {fade > 0 ? <div style={{ position: "absolute", left: 0, top: 0, width: sh.w, height: sh.h, background: "#000", opacity: fade > 0.999 ? 1 : fade }} /> : null}
    </>
  );
}

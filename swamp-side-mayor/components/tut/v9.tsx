// v9's new pictures (tutorial-v9.script.ts, after the director's notes on v8, a feed post: the glass powering on in the
// cold open, "This is Goose" lettered on the frame with an arrow to him, a Mac's desktop and Dock to open raea from, the
// AIs' logos in a ring over his head, the community's card, the fingerprint drawn (the notes gathering into it, then it
// checking a cut), and the end card. Each is a function of the seconds into its own moment, so the film places it on
// the words (components/tut/shots.ts).
import type { ReactNode } from "react";
import { AbsoluteFill, Img, staticFile } from "raea";
import { Cuboid, Mesh3d } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Transform } from "raea/transform";
import { GLASS, TMON, type V3 } from "./machine-dims";
import { project } from "./reviewers";

const lin = (v: number) => Math.min(1, Math.max(0, v));
const sm = (v: number) => { const c = lin(v); return c * c * (3 - 2 * c); };
const outCubic = (v: number) => 1 - (1 - lin(v)) ** 3;
const outBack = (v: number) => { const c = lin(v) - 1, s = 1.6; return 1 + (s + 1) * c ** 3 + s * c ** 2; };
const S = (n: string) => `tutorial-app/states/${n}.png`;

export const HAND = "Permanent Marker", NOTE = "Gochi Hand";
/** the project's own lettering faces (assets/fonts, OFL), for the words drawn on the frame */
export function Fonts() {
  return (
    <style>{`@font-face { font-family: "${HAND}"; src: url("${staticFile("fonts/PermanentMarker-Regular.ttf")}"); }
@font-face { font-family: "${NOTE}"; src: url("${staticFile("fonts/GochiHand-Regular.ttf")}"); }`}</style>
  );
}
const INK = "#1d2b1f", CREAM = "#fffaf0", YELLOW = "#ffd64a";
const outline = (c = INK, w = 3) => [[-w, -w], [w, -w], [-w, w], [w, w], [0, -w], [0, w], [-w, 0], [w, 0]].map(([x, y]) => `${x}px ${y}px 0 ${c}`).join(", ") + ", 0 8px 14px rgba(0,0,0,0.35)";

/** the Mac's pointer: white, a black edge, a soft shadow, its tip on (x, y) */
export function Pointer({ x, y, h = 22, held = false }: { x: number; y: number; h?: number; held?: boolean }) {
  const s = (h / 19) * (held ? 0.88 : 1);
  return (
    <svg width={14 * s} height={21 * s} viewBox="-1 -1 14 21" style={{ position: "absolute", left: x - s, top: y - s, overflow: "visible", filter: "drop-shadow(0px 2px 3px rgba(0,0,0,0.45))" }}>
      <path d="M0 0 L0 16.2 L3.9 12.5 L6.6 18.6 L9.2 17.5 L6.6 11.6 L11.6 11.6 Z" fill="#fff" stroke="#000" strokeWidth={1.1} strokeLinejoin="round" />
    </svg>
  );
}
/** the ring where a click lands, `u` 0 to 1 through it */
export function ClickRing({ x, y, u }: { x: number; y: number; u: number }) {
  if (u < 0 || u >= 1) return null;
  const r = 34 * u + 8;
  return <div style={{ position: "absolute", left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: "50%", border: `${(4 * (1 - u) + 1).toFixed(2)}px solid rgba(255, 214, 74, ${(0.9 * (1 - u)).toFixed(3)})` }} />;
}

// ---- 00.01: the glass powering on ---------------------------------------------------------------------------------
/** The glass powering on (the director on v8, a note: "animate the screen in during this opening"): black over the
 * screen, a line of light across its middle, then the picture opening up and down from it, as an old set warms up.
 * `u`: seconds since it began (black before). Unit boxes sized by their transforms: a shape remade each frame stays at
 * its first in a video render. */
export function PowerOn({ u }: { u: number }) {
  if (u > 1.1) return null;
  const [W, H] = TMON.screen, z = GLASS[2] + 0.012;
  const grow = outCubic(u / 0.24);                       // the line, out from the middle
  const open = sm((u - 0.3) / 0.55);                     // the picture, opening from it
  const cover = (H * (1 - open)) / 2 + 0.002;
  const lineH = 0.05 * (1 - sm((u - 0.32) / 0.5)), glowH = 0.3 * (1 - sm((u - 0.3) / 0.6));
  const box = (name: string, x: number, y: number, zz: number, w: number, h: number, color: string) =>
    w > 0.002 && h > 0.002 ? (
      <Mesh3d key={name} pass="ui" name={name} allowOverlap shadow={false} transform={Transform.fromXyz(x, y, zz).withScale([w, h, 1])}>
        <Cuboid half_size={[0.5, 0.5, 0.004]} />
        <StandardMaterial base_color={color} unlit />
      </Mesh3d>
    ) : null;
  return (
    <>
      {box("power-top", GLASS[0], GLASS[1] + H / 2 - cover / 2, z, W + 0.02, cover, "#030405")}
      {box("power-bottom", GLASS[0], GLASS[1] - H / 2 + cover / 2, z, W + 0.02, cover, "#030405")}
      {u > 0 && box("power-glow", GLASS[0], GLASS[1], z + 0.004, W * grow, glowH, "#3d6f8f")}
      {u > 0 && box("power-line", GLASS[0], GLASS[1], z + 0.008, W * grow, lineH, "#f4fbff")}
    </>
  );
}

// ---- 00.01: "This is Goose" ---------------------------------------------------------------------------------------
/** "This is Goose" (the director on v8, a note: "add some text and an arrow for this is goose"), lettered on the frame
 * as it's said, and an arrow drawn curving down to him. (x, y): where on the frame he is (his neck); `u`: seconds since
 * "This is Goose"; `left`: seconds until it goes. The words sit to his left (side -1) or right (1). */
export function GooseLabel({ x, y, u, left, side = -1 }: { x: number; y: number; u: number; left: number; side?: -1 | 1 }) {
  if (u < 0 || left <= 0) return null;
  const o = left >= 0.35 ? 1 : sm(left / 0.35);
  const words = "This is Goose", n = Math.ceil(words.length * lin(u / 0.5));
  const tx = x + side * 470 - (side < 0 ? 330 : 0), ty = y - 330;   // the words' left edge and top
  // the arrow: from under the words, down and round to him, stopping short of him
  const A: [number, number] = side < 0 ? [tx + 470, ty + 120] : [tx + 120, ty + 120];
  const B: [number, number] = [x + side * 60, y - 10];
  const C: [number, number] = [A[0] + side * -20, B[1] - 40];
  const pts: [number, number][] = [];
  const reveal = outCubic((u - 0.42) / 0.5);
  for (let i = 0; i <= 40 * reveal; i++) { const k = i / 40; pts.push([(1 - k) ** 2 * A[0] + 2 * (1 - k) * k * C[0] + k * k * B[0], (1 - k) ** 2 * A[1] + 2 * (1 - k) * k * C[1] + k * k * B[1]]); }
  const d = pts.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)}`).join(" ");
  const ang = Math.atan2(B[1] - C[1], B[0] - C[0]), hs = 34 * outBack((u - 0.9) / 0.2);
  const head = `M${(B[0] - hs * Math.cos(ang - 0.5)).toFixed(1)} ${(B[1] - hs * Math.sin(ang - 0.5)).toFixed(1)} L${B[0]} ${B[1]} L${(B[0] - hs * Math.cos(ang + 0.5)).toFixed(1)} ${(B[1] - hs * Math.sin(ang + 0.5)).toFixed(1)}`;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: o }}>
      <div style={{ position: "absolute", left: tx, top: ty, font: `400 104px/1 "${HAND}"`, color: CREAM, whiteSpace: "nowrap", textShadow: outline(INK, 4), transform: "rotate(-5deg)", transformOrigin: "0 50%" }}>{words.slice(0, n)}</div>
      {pts.length > 1 && (
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <path d={d} fill="none" stroke={INK} strokeWidth={17} strokeLinecap="round" strokeLinejoin="round" />
          {hs > 1 && <path d={head} fill="none" stroke={INK} strokeWidth={17} strokeLinecap="round" strokeLinejoin="round" />}
          <path d={d} fill="none" stroke={CREAM} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
          {hs > 1 && <path d={head} fill="none" stroke={CREAM} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />}
        </svg>
      )}
    </AbsoluteFill>
  );
}

// ---- 01.01: the Mac's desktop ---------------------------------------------------------------------------------------
/** where the app's window sits on the desktop once open (the capture at 1:1), before the camera pushes in to it */
const WIN = { x: 160, y: 52 };
const DOCK = { y: 962, size: 92, gap: 16 };
const DOCK_APPS = ["files", "mail", "notes", "music", "raea", "settings", "|", "trash"] as const;
const dockX = (() => { const n = DOCK_APPS.filter((a) => a !== "|").length, w = n * DOCK.size + (n - 1) * DOCK.gap + 18; let x = 960 - w / 2; return DOCK_APPS.map((a) => { const at = x; x += a === "|" ? 18 : DOCK.size + DOCK.gap; return at; }); })();
const RAEA_IN_DOCK = { x: dockX[DOCK_APPS.indexOf("raea")] + DOCK.size / 2, y: DOCK.y + DOCK.size / 2 };
/** a plain icon of our own for the Dock (no other maker's art): a tile and a glyph */
function DockIcon({ kind, size }: { kind: string; size: number }) {
  const tile = (bg: string, glyph: ReactNode) => (
    <div style={{ width: size, height: size, borderRadius: size * 0.225, background: bg, boxShadow: "0 3px 8px rgba(0,0,0,0.28)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24">{glyph}</svg>
    </div>
  );
  switch (kind) {
    case "files": return tile("linear-gradient(180deg, #6ec3ff, #2f8cf0)", <path d="M3 6.5a1.5 1.5 0 0 1 1.5-1.5h5l2 2h8a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z" fill="#fff" />);
    case "mail": return tile("linear-gradient(180deg, #59b6ff, #1f6fe0)", <><rect x="3" y="6" width="18" height="12" rx="2" fill="#fff" /><path d="M3.5 7 L12 13 L20.5 7" fill="none" stroke="#2f7fe8" strokeWidth="1.6" /></>);
    case "notes": return tile("linear-gradient(180deg, #fff6c9 0%, #fff6c9 30%, #ffffff 30%)", <g stroke="#c9b67a" strokeWidth="1.4"><path d="M4 12h16M4 16h16M4 20h11" /></g>);
    case "music": return tile("linear-gradient(180deg, #ff6d86, #f2264f)", <path d="M9 18.5a2.5 2.5 0 1 1-1-2V6l11-2.5v11a2.5 2.5 0 1 1-1-2V7.4L9 9.3z" fill="#fff" />);
    case "settings": return tile("linear-gradient(180deg, #b9bec6, #7b818b)", <><circle cx="12" cy="12" r="6.5" fill="none" stroke="#fff" strokeWidth="3" strokeDasharray="2.6 2" /><circle cx="12" cy="12" r="3" fill="#fff" /></>);
    case "trash": return tile("linear-gradient(180deg, rgba(255,255,255,0.55), rgba(220,224,230,0.45))", <><path d="M6 7h12l-1 13H7z" fill="none" stroke="#5d636c" strokeWidth="1.6" /><path d="M4.5 7h15M10 4h4" stroke="#5d636c" strokeWidth="1.6" /></>);
    default: return <Img src={staticFile("tut-desktop/raea-icon.png")} style={{ width: size, height: size, filter: "drop-shadow(0px 3px 6px rgba(0,0,0,0.3))" }} />;
  }
}
/** The Mac's desktop (the director on v8, a note: "a quick fake mac os and clicking on the raea app icon"): the swamp as
 * the wallpaper, a menu bar, the Dock; the pointer goes to raea's icon and clicks, the icon bounces, the window opens out
 * of it, and the camera pushes in until the window fills the frame exactly as the app's own shots hold it (the next
 * shot, the whole app). `local`: seconds into the shot; `click`, `open`, `fill`: when each happens; `end`: where the
 * pointer goes at the end (the capture's pixels, the next shot's first) */
export function Desktop({ local, click = 1.7, open = 2.45, fill = 3.3, end = [800, 450] }: { local: number; click?: number; open?: number; fill?: number; end?: [number, number] }) {
  // the camera: the desktop at 1:1, then pushed in so the window (1600 x 900 at WIN) fills the frame at 1.2
  const f = sm((local - fill) / 0.9), s = 1 + 0.2 * f, cx = -WIN.x * 1.2 * f, cy = -WIN.y * 1.2 * f;
  const cam = (x: number, y: number) => [cx + x * s, cy + y * s] as const;
  // the icon's bounce, twice, after the click
  const b = local - (click + 0.12), bounce = b > 0 && b < 1.1 ? Math.abs(Math.sin((b / 0.55) * Math.PI)) * 34 * (1 - b / 1.6) : 0;
  // the window, out of the icon: from its size at the icon to the whole capture at WIN
  const w = outCubic((local - open) / 0.5), ws = 0.05 + 0.95 * w;
  const wx = RAEA_IN_DOCK.x + (WIN.x + 800 - RAEA_IN_DOCK.x) * w - 800 * ws, wy = RAEA_IN_DOCK.y + (WIN.y + 450 - RAEA_IN_DOCK.y) * w - 450 * ws;
  // the pointer, on the desktop: in from the right to the icon, then on to where the next shot has it
  const start: [number, number] = [1260, 560];
  const toIcon = sm((local - 0.3) / (click - 0.45)), toEnd = sm((local - (open + 0.3)) / 1.0);
  let px = start[0] + (RAEA_IN_DOCK.x + 6 - start[0]) * toIcon, py = start[1] + (RAEA_IN_DOCK.y - 4 - start[1]) * toIcon;
  px += (WIN.x + end[0] - px) * toEnd; py += (WIN.y + end[1] - py) * toEnd;
  const [fx, fy] = cam(px, py), down = local >= click && local < click + 0.14;
  const app = local >= open ? "raea" : "Finder";
  return (
    <AbsoluteFill style={{ background: "#0b0b0c", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transform: `translate(${cx.toFixed(2)}px, ${cy.toFixed(2)}px) scale(${s.toFixed(4)})`, transformOrigin: "0 0" }}>
        <Img src={staticFile("tut-desktop/wall.png")} style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080 }} />
        {/* the menu bar: no maker's mark, the app in front, the date and time */}
        <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 32, background: "rgba(246, 246, 250, 0.62)", display: "flex", alignItems: "center", font: "500 18px/1 Inter, sans-serif", color: "#16161a" }}>
          <div style={{ marginLeft: 22, fontWeight: 700 }}>{app}</div>
          {["File", "Edit", "View", "Window", "Help"].map((m) => <div key={m} style={{ marginLeft: 26 }}>{m}</div>)}
          <div style={{ position: "absolute", right: 22 }}>Mon 16 Nov  9:41</div>
        </div>
        {/* the Dock */}
        <div style={{ position: "absolute", left: dockX[0] - 12, top: DOCK.y - 12, width: dockX[dockX.length - 1] + DOCK.size + 12 - (dockX[0] - 12), height: DOCK.size + 24, borderRadius: 26, background: "rgba(245, 246, 250, 0.42)", border: "1px solid rgba(255,255,255,0.5)" }} />
        {DOCK_APPS.map((a, i) => a === "|" ? (
          <div key={i} style={{ position: "absolute", left: dockX[i] + 8, top: DOCK.y + 6, width: 1.5, height: DOCK.size - 12, background: "rgba(40,40,50,0.25)" }} />
        ) : (
          <div key={i} style={{ position: "absolute", left: dockX[i], top: DOCK.y - (a === "raea" ? bounce : 0), width: DOCK.size, height: DOCK.size, filter: a === "raea" && down ? "brightness(0.6)" : undefined }}>
            <DockIcon kind={a} size={DOCK.size} />
          </div>
        ))}
        {local >= click + 0.15 && <div style={{ position: "absolute", left: RAEA_IN_DOCK.x - 3, top: DOCK.y + DOCK.size + 4, width: 6, height: 6, borderRadius: 3, background: "rgba(30,30,36,0.75)" }} />}
        {/* the app's window, opening out of its icon */}
        {w > 0 && (
          <div style={{ position: "absolute", left: wx, top: wy, width: 1600, height: 900, transform: `scale(${ws.toFixed(4)})`, transformOrigin: "0 0", opacity: lin((local - open) / 0.12), borderRadius: 14 * (1 - f), overflow: "hidden", boxShadow: `0 ${30 * (1 - f)}px ${70 * (1 - f)}px rgba(0,0,0,${(0.45 * (1 - f)).toFixed(2)})` }}>
            <Img src={staticFile(S("300-v16-everything"))} style={{ width: 1600, height: 900 }} />
          </div>
        )}
      </div>
      <ClickRing x={fx} y={fy} u={(local - click + 0.02) / 0.47} />
      <Pointer x={fx} y={fy} held={down} />
    </AbsoluteFill>
  );
}

// ---- 02.01: the AIs in a ring over Goose -----------------------------------------------------------------------------
export const AIS = [
  { id: "claude", name: "Claude" },
  { id: "openai", name: "ChatGPT" },
  { id: "gemini", name: "Gemini" },
  { id: "kimi", name: "Kimi" },
] as const;
const RING = { ahead: 0.9, up: 0.55, r: 1.15, squash: 0.5, from: (150 * Math.PI) / 180, to: (30 * Math.PI) / 180 };
const ringAngle = (i: number) => RING.from + ((RING.to - RING.from) * i) / (AIS.length - 1);
/** where logo i hangs: an arc in front of Goose and over his head, from his left to his right (`head`: his head,
 * `yaw`: the way he faces) */
export function ringPoint(i: number, head: V3, yaw: number): V3 {
  const f: V3 = [Math.sin(yaw), 0, Math.cos(yaw)], r: V3 = [-Math.cos(yaw), 0, Math.sin(yaw)], a = ringAngle(i);
  const side = RING.r * Math.cos(a), up = RING.up + RING.r * RING.squash * Math.sin(a);
  return [head[0] + f[0] * RING.ahead + r[0] * side, head[1] + up, head[2] + f[2] * RING.ahead + r[2] * side];
}
/** how far Goose turns his head (+ his left) to look at logo i: for his lookround's marks */
export const ringYaw = (i: number) => Math.atan2(-RING.r * Math.cos(ringAngle(i)), RING.ahead);
/** The AIs named in 02.01 (the director on v8, a note: "a shot back of the goose and it looks around at the headroom circle
 * of logos as the narrator says them"): their logos on dark tiles in an arc over his head, coming up one after another
 * as the line begins, each lit (bigger, bright, ringed) on its name while the rest wait dimmer. `u`: seconds since the
 * ring came up; `named`: when each is named (seconds into the shot, as u); `head`, `yaw`: Goose's head and facing; the
 * camera to project them. */
export function LogoRing({ u, named, head, yaw, eye, at, fov }: { u: number; named: number[]; head: V3; yaw: number; eye: V3; at: V3; fov: number }) {
  if (u < 0) return null;
  const lit = named.reduce((k, n, i) => (u >= n - 0.1 ? i : k), -1);
  const tiles = AIS.map((ai, i) => {
    const q = project(ringPoint(i, head, yaw), eye, at, fov);
    if (!q) return null;
    const pop = outBack((u - 0.12 * i) / 0.4), on = i === lit, was = named[i] != null && u >= named[i] - 0.1;
    const glow = on ? sm((u - (named[i] - 0.1)) / 0.2) : 0;
    const size = Math.min(170, Math.max(80, 0.5 * q.ppm)) * pop * (1 + 0.22 * glow);
    const bob = 6 * Math.sin(u * 1.7 + i * 1.3);
    return (
      <div key={ai.id} style={{ position: "absolute", left: q.x - size / 2, top: q.y - size / 2 + bob, width: size, height: size, borderRadius: size * 0.24, background: "#17181c", opacity: lit < 0 || on ? 1 : was ? 0.8 : 0.62,
        border: `${on ? 4 : 2}px solid ${on ? `rgba(255, 214, 74, ${(0.4 + 0.6 * glow).toFixed(2)})` : "rgba(255,255,255,0.16)"}`, boxShadow: on ? `0 0 ${(40 * glow).toFixed(1)}px rgba(255, 214, 74, ${(0.55 * glow).toFixed(2)}), 0 10px 24px rgba(0,0,0,0.35)` : "0 10px 24px rgba(0,0,0,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Img src={staticFile(`tut-logos/${ai.id}.png`)} style={{ width: size * 0.56, height: size * 0.56 }} />
      </div>
    );
  });
  return <AbsoluteFill style={{ pointerEvents: "none" }}>{tiles}</AbsoluteFill>;
}

// ---- 04.05: the community -------------------------------------------------------------------------------------------
export const DISCORD = "discord.gg/ZCfeKDPgXX";
/** raea's community on Discord (the director on v8, a note: "plugs the discord community"): a card up on the right of the
 * frame while the line says where to ask. `u`: seconds since it came up; `left`: seconds until it goes */
export function DiscordCard({ u, left }: { u: number; left: number }) {
  if (u < 0 || left <= 0) return null;
  const k = outCubic(u / 0.5), o = Math.min(lin(u / 0.25), left >= 0.4 ? 1 : sm(left / 0.4));
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 1130, top: 300 + 60 * (1 - k), width: 640, opacity: o, borderRadius: 30, background: "#1d1e23", boxShadow: "0 24px 60px rgba(0,0,0,0.45)", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ height: 14, background: "#5865f2" }} />
        <div style={{ padding: "34px 44px 40px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <Img src={staticFile("tut-desktop/raea-icon.png")} style={{ width: 72, height: 72 }} />
            <div style={{ font: "700 44px/1.1 Inter, sans-serif", color: "#fff" }}>raea's community</div>
          </div>
          <div style={{ font: "500 30px/1.35 Inter, sans-serif", color: "rgba(255,255,255,0.72)" }}>Questions, help, and what people are making with it.</div>
          <div style={{ marginTop: 6, alignSelf: "flex-start", padding: "16px 24px", borderRadius: 16, background: "#5865f2", font: "700 36px/1 Inter, sans-serif", color: "#fff", letterSpacing: 0.3 }}>{DISCORD}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ---- 10.01 and 10.02: the fingerprint ------------------------------------------------------------------------------
/** the fingerprint's whorl: a spiral, stretched tall and broken into ridges, as points; `k` 0 to 1 how much is drawn */
function whorl(cx: number, cy: number, k: number, scale = 1): string {
  const TURNS = 10, STEP = 0.045, total = TURNS * 2 * Math.PI, upto = total * k;
  let d = "", pen = false;
  for (let a = 0.6; a <= upto; a += STEP) {
    const r = (8 + (15 * a) / (2 * Math.PI)) * scale;
    const gap = Math.sin(a * 2.3 + Math.sin(a * 0.45) * 3) > 0.9;   // a ridge's break
    const x = cx + r * Math.cos(a) * (1 + 0.06 * Math.sin(a * 0.5)), y = cy + r * 1.3 * Math.sin(a) - 0.1 * r;
    if (gap) { pen = false; continue; }
    d += `${pen ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)} `; pen = true;
  }
  return d;
}
function Whorl({ cx, cy, k, scale = 1, color = YELLOW, width = 5 }: { cx: number; cy: number; k: number; scale?: number; color?: string; width?: number }) {
  if (k <= 0) return null;
  const d = whorl(cx, cy, k, scale);
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <path d={d} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth={width + 6} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
/** a note, as the feed shows one: a card with the words in the person's hand */
function NoteChip({ text, x, y, scale, o, tilt }: { text: string; x: number; y: number; scale: number; o: number; tilt: number }) {
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${scale.toFixed(3)}) rotate(${tilt}deg)`, opacity: o, padding: "18px 28px", borderRadius: 18, background: CREAM, boxShadow: "0 12px 28px rgba(0,0,0,0.35)", display: "flex", alignItems: "center", gap: 16, whiteSpace: "nowrap" }}>
      <div style={{ width: 18, height: 18, borderRadius: 9, background: YELLOW, border: `3px solid ${INK}` }} />
      <div style={{ font: `400 44px/1 "${NOTE}"`, color: INK }}>{text}</div>
    </div>
  );
}
/** 10.01 (the director on v8, a note: "we have to actually explain it"): the notes left in this film drift in round the
 * frame (Goose's "my wings look like planks", the heron's "!", the deer's heart), and on "flag" and "approve" fly into the
 * middle, where they become a fingerprint's ridges, drawn round and round; "your fingerprint" lettered under it. `u`:
 * seconds into the shot; `flag`, `approve`, `print`: when those words are said. Over the swamp, dimmed. */
export function FingerprintGather({ u, flag, approve, print, left }: { u: number; flag: number; approve: number; print: number; left: number }) {
  const o = left >= 0.4 ? 1 : sm(left / 0.4), CX = 960, CY = 470;
  const notes = [
    { kind: "note", text: "my wings look like planks", at: [520, 250], tilt: -4, go: flag },
    { kind: "bang", at: [1450, 300], tilt: 6, go: flag + 0.3 },
    { kind: "note", text: "can't see me here", at: [1400, 790], tilt: 3, go: flag + 0.6 },
    { kind: "heart", at: [470, 760], tilt: -6, go: approve },
  ];
  const k = sm((u - flag - 0.2) / Math.max(1, print - flag + 0.2));
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: o }}>
      <div style={{ position: "absolute", inset: 0, background: `rgba(10, 16, 14, ${(0.5 * sm(u / 0.5)).toFixed(3)})` }} />
      <Whorl cx={CX} cy={CY} k={k} scale={1.15} />
      {notes.map((n, i) => {
        const inn = outBack((u - 0.15 - 0.25 * i) / 0.5), fly = sm((u - n.go) / 0.7);
        const x = n.at[0] + (CX - n.at[0]) * fly, y = n.at[1] + (CY - n.at[1]) * fly + 8 * Math.sin(u * 2 + i);
        const s = inn * (1 - 0.85 * fly), op = lin((u - 0.15 - 0.25 * i) / 0.2) * (1 - sm((u - n.go - 0.45) / 0.3));
        if (op <= 0.01) return null;
        if (n.kind === "note") return <NoteChip key={i} text={n.text!} x={x} y={y} scale={s} o={op} tilt={n.tilt} />;
        const SIZE = n.kind === "bang" ? [132, 319] : [551, 508], h = 170, w = (h * SIZE[0]) / SIZE[1];
        return <img key={i} src={staticFile(`ink/${n.kind}-${Math.floor(u * 8) % 3}.png`)} style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, opacity: op, transform: `scale(${s.toFixed(3)}) rotate(${n.tilt}deg)` }} />;
      })}
      <div style={{ position: "absolute", left: 0, width: 1920, top: CY + 290, textAlign: "center", font: `400 76px/1 "${HAND}"`, color: CREAM, textShadow: outline(INK, 3), opacity: sm((u - print + 0.1) / 0.35), transform: `scale(${(0.9 + 0.1 * outBack((u - print + 0.1) / 0.4)).toFixed(3)})` }}>your fingerprint</div>
    </AbsoluteFill>
  );
}
/** the frames of a cut for 10.02, from the music video and the take's two versions (assets/tut-fp): two flagged, each
 * with what fixed it (the planks by v3's feathers; Goose tiny in the summoning circle by the closer shot of it) */
const STRIP = [
  { src: "tut-fp/f0.png" }, { src: "tut-fp/planks.png", fixed: "tut-fp/feathers.png", note: "wings look like planks" },
  { src: "tut-fp/f2.png" }, { src: "tut-fp/small.png", fixed: "tut-fp/big.png", note: "can't see me here" },
  { src: "tut-fp/f4.png" },
];
/** 10.02: what an agent does with it. A new cut's frames in a strip; the fingerprint passes along it and stops on two,
 * each marked with the note it expects, in that note's own words; they're fixed (the frame changes, the mark goes
 * green), and the cut is clean. `u`: seconds into the shot; `scan`: when the pass starts; `fix`: when the
 * fixes come; `left`: seconds until it goes */
export function FingerprintCheck({ u, scan, fix, left }: { u: number; scan: number; fix: number; left: number }) {
  const o = left >= 0.4 ? 1 : sm(left / 0.4);
  const FW = 320, FH = 160, GAP = 18, N = STRIP.length, W = N * FW + (N - 1) * GAP, X0 = 960 - W / 2, Y = 470;
  const inK = outCubic(u / 0.6), lean = 1 + 0.04 * sm((u - fix) / 3);
  const sx = X0 - 80 + (W + 160) * sm((u - scan) / 3.2);   // the pass, left to right
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: o }}>
      <div style={{ position: "absolute", inset: 0, background: `rgba(10, 16, 14, ${(0.55 * sm(u / 0.5)).toFixed(3)})` }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transform: `translate(${(-1400 * (1 - inK)).toFixed(1)}px, 0px) scale(${lean.toFixed(4)})`, transformOrigin: "960px 550px" }}>
        <div style={{ position: "absolute", left: X0 - 26, top: Y - 34, width: W + 52, height: FH + 68, borderRadius: 18, background: "#111214", boxShadow: "0 18px 40px rgba(0,0,0,0.45)" }} />
        {STRIP.map((f, i) => {
          const x = X0 + i * (FW + GAP), hit = f.note != null && sx >= x + FW / 2, fixedK = f.fixed ? sm((u - fix - 0.35 * (i > 2 ? 1 : 0)) / 0.4) : 0;
          return (
            <div key={i}>
              <Img src={staticFile(f.src)} style={{ position: "absolute", left: x, top: Y, width: FW, height: FH, borderRadius: 6 }} />
              {f.fixed && <Img src={staticFile(f.fixed)} style={{ position: "absolute", left: x, top: Y, width: FW, height: FH, borderRadius: 6, opacity: fixedK }} />}
              {hit && (() => {
                const pop = outBack((sx - (x + FW / 2)) / 120), green = fixedK > 0.5, c = green ? "#5fdc7a" : YELLOW;
                return (
                  <>
                    <div style={{ position: "absolute", left: x - 8, top: Y - 8, width: FW + 16, height: FH + 16, borderRadius: 10, border: `5px solid ${c}`, transform: `scale(${(0.9 + 0.1 * pop).toFixed(3)})` }} />
                    <div style={{ position: "absolute", left: x + FW / 2, top: Y - 70, transform: `translate(-50%, 0) scale(${pop.toFixed(3)})`, whiteSpace: "nowrap", font: `400 46px/1 "${NOTE}"`, color: c, textShadow: outline(INK, 2) }}>{green ? "fixed" : `"${f.note}"`}</div>
                  </>
                );
              })()}
            </div>
          );
        })}
        {/* the fingerprint passing along it */}
        {u >= scan && u < scan + 3.4 && (
          <>
            <div style={{ position: "absolute", left: sx - 2, top: Y - 40, width: 4, height: FH + 80, background: YELLOW, boxShadow: `0 0 24px ${YELLOW}` }} />
            <div style={{ position: "absolute", left: sx - 50, top: Y + FH + 52, width: 100, height: 120, borderRadius: 24, background: "#111214" }} />
            <Whorl cx={sx} cy={Y + FH + 110} k={1} scale={0.27} width={2.5} />
          </>
        )}
      </div>
    </AbsoluteFill>
  );
}

// ---- 10.03 and 10.04 (v10): a standing rule, and where the fingerprint learns ------------------------------------------
/** a line in a chat, as Goose would type it: a dark bubble, his words */
function Bubble({ text, x, y, scale, o }: { text: string; x: number; y: number; scale: number; o: number }) {
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${scale.toFixed(3)})`, opacity: o, padding: "22px 34px", borderRadius: "28px 28px 8px 28px", background: "#1b1c1f", border: "2px solid #3a3c42", boxShadow: "0 14px 30px rgba(0,0,0,0.45)", whiteSpace: "nowrap", font: "500 40px/1 Inter, sans-serif", color: "#f2f2f2" }}>{text}</div>
  );
}
/** 10.03 (the director on v9, a note: "show people ... that you want to make something a standing rule"). Goose's words in
 * a chat, "make it a rule: I'm in every shot", fold into a card of rules under Always; then the same note twice ("can't
 * see me here"), "A standing rule?" over them, and they join the card; "Fingerprint › Rules" under it, where they're
 * kept (0.1.6: rule_add; raea's taste loop asks "A standing rule?"). `ask`, `card`, `twice`, `standing`, `place`: when
 * "make", "Every", "twice", "standing" and "Fingerprint" are said, in seconds into the shot */
export function StandingRule({ u, ask, card, twice, standing, place, left }: { u: number; ask: number; card: number; twice: number; standing: number; place: number; left: number }) {
  const o = left >= 0.4 ? 1 : sm(left / 0.4);
  const CX = 1290, CY = 470, CW = 720;
  const bIn = outBack((u - ask + 0.35) / 0.45), fly = sm((u - card + 0.1) / 0.55);
  const cardIn = outBack((u - card + 0.35) / 0.5);
  const row1 = sm((u - card - 0.25) / 0.35), row2 = sm((u - standing - 0.9) / 0.4);
  const n1 = outBack((u - twice + 0.5) / 0.45), n2 = outBack((u - twice + 0.15) / 0.45), tag = outBack((u - standing + 0.2) / 0.45);
  const into = sm((u - standing - 0.55) / 0.5);
  const placeK = sm((u - place + 0.1) / 0.4);
  const Row = ({ text, k, y }: { text: string; k: number; y: number }) => (
    <div style={{ position: "absolute", left: 44, top: y, opacity: k, transform: `translateX(${((1 - k) * -24).toFixed(1)}px)`, display: "flex", alignItems: "center", gap: 18, font: `400 44px/1 "${NOTE}"`, color: INK }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: "#5fdc7a", border: `3px solid ${INK}`, display: "flex", alignItems: "center", justifyContent: "center", font: "900 22px/1 Inter, sans-serif", color: INK }}>✓</div>
      {text}
    </div>
  );
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: o }}>
      <div style={{ position: "absolute", inset: 0, background: `rgba(10, 16, 14, ${(0.55 * sm(u / 0.5)).toFixed(3)})` }} />
      {/* Goose's line in the chat, flying into the card */}
      {fly < 1 && <Bubble text="make it a rule: I'm in every shot" x={560 + (CX - 560) * fly} y={330 + (CY - 40 - 330) * fly} scale={bIn * (1 - 0.7 * fly)} o={lin((u - ask + 0.35) / 0.2) * (1 - fly)} />}
      {/* the same note, twice; "A standing rule?" over them; then into the card */}
      {[{ k: n1, x: 520, y: 640, tilt: -4 }, { k: n2, x: 590, y: 760, tilt: 3 }].map((n, i) => n.k > 0.01 && into < 1 && (
        <NoteChip key={i} text="can't see me here" x={n.x + (CX - n.x) * into} y={n.y + (CY + 60 - n.y) * into} scale={n.k * (1 - 0.7 * into)} o={1 - into} tilt={n.tilt} />
      ))}
      {tag > 0.01 && into < 1 && (
        <div style={{ position: "absolute", left: 560, top: 548, transform: `translate(-50%, -50%) scale(${(tag * (1 - 0.7 * into)).toFixed(3)}) rotate(-3deg)`, opacity: 1 - into, whiteSpace: "nowrap", font: `400 62px/1 "${HAND}"`, color: YELLOW, textShadow: outline(INK, 3) }}>A standing rule?</div>
      )}
      {/* the card of rules */}
      {cardIn > 0.01 && (
        <div style={{ position: "absolute", left: CX - CW / 2, top: CY - 150, width: CW, height: 300, borderRadius: 22, background: CREAM, boxShadow: "0 18px 40px rgba(0,0,0,0.45)", transform: `scale(${cardIn.toFixed(3)})`, transformOrigin: "50% 50%" }}>
          <div style={{ position: "absolute", left: 44, top: 34, font: `400 54px/1 "${HAND}"`, color: INK }}>Rules</div>
          <div style={{ position: "absolute", left: 46, top: 104, font: "700 24px/1 Inter, sans-serif", letterSpacing: 2, color: "#6b6f5e" }}>ALWAYS</div>
          <Row text="Goose is in every shot." k={row1} y={150} />
          <Row text="Goose is never tiny in the frame." k={row2} y={222} />
        </div>
      )}
      <div style={{ position: "absolute", left: CX - 400, width: 800, top: CY + 190, textAlign: "center", font: `400 64px/1 "${HAND}"`, color: CREAM, textShadow: outline(INK, 3), opacity: placeK, transform: `scale(${(0.9 + 0.1 * outBack((u - place + 0.1) / 0.4)).toFixed(3)})` }}>Fingerprint › Rules</div>
    </AbsoluteFill>
  );
}
/** 10.04 a note: "how to ... train your model on your computer and maybe some general computer requirements"):
 * the swamp's own computer is the one it runs on. Its glass goes dark and the fingerprint's whorl draws on it; "8 GB
 * memory" and "2 GB free on disk" are pinned beside it as they're said (0.1.6's Fingerprint page: NEED_MEM_GB 8,
 * NEED_DISK_GB 2); then frames of Goose's finished video fly into the glass and the whorl fills out (a head start from
 * finished renders, asked of the agent). The glass is found from the shot's camera each frame. `here`, `mem`, `disk`,
 * `learn`: when "computer", "Eight", "two" and "learn" are said */
export function LearnHere({ u, here, mem, disk, learn, left, eye, at, fov }: { u: number; here: number; mem: number; disk: number; learn: number; left: number; eye: V3; at: V3; fov: number }) {
  const o = left >= 0.4 ? 1 : sm(left / 0.4);
  const [gw, gh] = TMON.screen;
  const tl = project([GLASS[0] - gw / 2, GLASS[1] + gh / 2, GLASS[2] + 0.02], eye, at, fov), br = project([GLASS[0] + gw / 2, GLASS[1] - gh / 2, GLASS[2] + 0.02], eye, at, fov);
  if (!tl || !br) return null;
  const MX = (tl.x + br.x) / 2, MY = (tl.y + br.y) / 2, MW = br.x - tl.x, MH = br.y - tl.y;
  const dark = sm((u - here + 0.5) / 0.4);
  const k = 0.3 + 0.3 * sm((u - here) / 1.5) + 0.4 * sm((u - learn - 0.3) / 2.2);
  const FRAMES = ["tut-fp/f0.png", "tut-fp/feathers.png", "tut-fp/f2.png", "tut-fp/big.png", "tut-fp/f4.png"];
  const Chip = ({ text, k, y }: { text: string; k: number; y: number }) => k <= 0.01 ? null : (
    <div style={{ position: "absolute", left: br.x + 40, top: y, transform: `translate(0, -50%) scale(${k.toFixed(3)}) rotate(-2deg)`, transformOrigin: "0 50%", padding: "18px 30px", borderRadius: 18, background: CREAM, boxShadow: "0 12px 28px rgba(0,0,0,0.35)", whiteSpace: "nowrap", font: `400 52px/1 "${NOTE}"`, color: INK }}>{text}</div>
  );
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: o }}>
      <div style={{ position: "absolute", inset: 0, background: `rgba(10, 16, 14, ${(0.45 * sm(u / 0.5)).toFixed(3)})` }} />
      {/* the glass, dark, and the whorl on it */}
      <div style={{ position: "absolute", left: tl.x, top: tl.y, width: MW, height: MH, borderRadius: 8, background: "#111214", opacity: dark }} />
      {dark > 0.5 && <Whorl cx={MX} cy={MY + MH * 0.03} k={k} scale={MH / 330} />}
      {/* frames of the finished video, flying into the glass */}
      {FRAMES.map((f, i) => {
        const t = (u - learn - 0.2 * i) / 0.7, a = sm(t);
        if (t <= 0 || t >= 1) return null;
        const x0 = 1760, y0 = 300 + 140 * i, x = x0 + (MX - x0) * a, y = y0 + (MY - y0) * a, w = 300 * (1 - 0.8 * a);
        return <Img key={i} src={staticFile(f)} style={{ position: "absolute", left: x - w / 2, top: y - w / 4, width: w, height: w / 2, borderRadius: 6, opacity: 1 - sm((t - 0.75) / 0.25), boxShadow: "0 8px 18px rgba(0,0,0,0.4)" }} />;
      })}
      <Chip text="8 GB memory" k={outBack((u - mem + 0.1) / 0.45)} y={MY - 60} />
      <Chip text="2 GB free on disk" k={outBack((u - disk + 0.1) / 0.45)} y={MY + 60} />
    </AbsoluteFill>
  );
}

// ---- 11.02: the end card ----------------------------------------------------------------------------------------------
/** the end card on black: raea's mark, the docs and the community (the director on v8, a note: the end cap killed time;
 * this is three things to go to, and out). `u`: seconds into it */
export function EndCard({ u }: { u: number }) {
  const o = sm((u - 0.15) / 0.45);
  return (
    <AbsoluteFill style={{ background: "#000", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 30, opacity: o }}>
      <Img src={staticFile("logo/raea-lockup.png")} style={{ width: 540 }} />
      <div style={{ font: "500 42px/1 Inter, sans-serif", color: "#fff", letterSpacing: 0.5 }}>raea.io/docs</div>
      <div style={{ font: "500 34px/1 Inter, sans-serif", color: "rgba(255,255,255,0.62)", letterSpacing: 0.3 }}>{DISCORD}</div>
    </AbsoluteFill>
  );
}

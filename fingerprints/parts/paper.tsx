// Paper on a desk: CC0 scans (ambientCG) cut to torn or clean edges, taped down, with the shadow a sheet casts in
// window light from the top left. Things on the desk move by stop motion (see `Cut`).
import type { CSSProperties, ReactNode } from "react";
import { Img, staticFile } from "raea";
import { hash, noise1, nudge } from "./ink";
import { C } from "./draw";

export const TEX = {
  white: staticFile("textures/Paper001/Paper001_2K-JPG_Color.jpg"),
  grey: staticFile("textures/Paper002/Paper002_2K-JPG_Color.jpg"),
  crumpled: staticFile("textures/Paper003/Paper003_2K-JPG_Color.jpg"),
  kraft: staticFile("textures/Paper004/Paper004_2K-JPG_Color.jpg"),
  tan: staticFile("textures/Paper005/Paper005_2K-JPG_Color.jpg"),
  board: staticFile("textures/Paper006/Paper006_2K-JPG_Color.jpg"),
  corrugated: staticFile("textures/Cardboard001/Cardboard001_2K-JPG_Color.jpg"),
  card: staticFile("textures/Cardboard004/Cardboard004_2K-JPG_Color.jpg"),
};

// each card's colour baked into its paper (tools/bake.sh): raea draws mix-blend-mode on a child in misaligned
// rectangles (blocks in the tags and the sticky note), so the cards draw a plain image and blend nothing
const BAKED = (name: string) => `url(${staticFile(`textures/baked/${name}.jpg`)})`;
/** a card's paper: the baked texture as the card's own background, `size` px square, shifted by `at` */
export const paperOf = (name: string, size: number, at: [number, number]): CSSProperties => ({ backgroundImage: BAKED(name), backgroundSize: `${size}px ${size}px`, backgroundPosition: `${at[0]}px ${at[1]}px` });

/** a torn (or cut) outline as a CSS polygon; `torn` says which sides are torn: t r b l */
export function tornPolygon(seed: number, torn = "trbl", rough = 1.2, w = 600, h = 400): string {
  const pts: string[] = [];
  const side = (n: number, fx: (i: number) => [number, number], isTorn: boolean, axis: "x" | "y", sign: number) => {
    for (let i = 0; i < n; i++) {
      let [x, y] = fx(i / n);
      if (isTorn) {
        const d = (noise1(i * 0.9, seed) * 0.8 + hash(seed, i) * 0.6) * rough;
        if (axis === "x") x += sign * d * (100 / w) * 6;
        else y += sign * d * (100 / h) * 6;
      }
      pts.push(`${x.toFixed(2)}% ${y.toFixed(2)}%`);
    }
  };
  const nx = Math.max(12, Math.round(w / 14));
  const ny = Math.max(10, Math.round(h / 14));
  side(nx, (t) => [t * 100, 0], torn.includes("t"), "y", 1);
  side(ny, (t) => [100, t * 100], torn.includes("r"), "x", -1);
  side(nx, (t) => [100 - t * 100, 100], torn.includes("b"), "y", -1);
  side(ny, (t) => [0, 100 - t * 100], torn.includes("l"), "x", 1);
  return `polygon(${pts.join(", ")})`;
}

type Box = { x: number; y: number; w: number; h: number; rot?: number };

/** something placed on the desk: positioned, rotated, with its cast shadow */
export function On({ x, y, w, h, rot = 0, lift = 1, children, style, opacity = 1 }: Box & { lift?: number; children?: ReactNode; style?: CSSProperties; opacity?: number }) {
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, transform: `rotate(${rot}deg)`, filter: lift ? `drop-shadow(${3 * lift}px ${5 * lift}px ${5 * lift}px rgba(40,25,10,${0.32 + 0.04 * lift}))` : undefined, opacity, ...style }}>
      {children}
    </div>
  );
}

/** a sheet of paper: a texture, cut to torn or clean edges, its tint multiplied over */
export function Sheet({ x, y, w, h, rot = 0, tex = TEX.white, tint, torn = "", seed = 1, lift = 1, children, opacity = 1 }: Box & { tex?: string; tint?: string; torn?: string; seed?: number; lift?: number; children?: ReactNode; opacity?: number }) {
  const clip = torn ? tornPolygon(seed, torn, 1.2, w, h) : undefined;
  return (
    <On x={x} y={y} w={w} h={h} rot={rot} lift={lift} opacity={opacity}>
      <div style={{ position: "absolute", inset: 0, clipPath: clip, overflow: "hidden", backgroundImage: `url(${tex})`, backgroundSize: `${Math.max(w, h) + 300}px ${Math.max(w, h) + 300}px`, backgroundPosition: `${-(seed * 37) % 300}px ${-(seed * 53) % 300}px`, backgroundColor: tint, backgroundBlendMode: tint ? "multiply" : undefined }}>
        {children}
      </div>
    </On>
  );
}

/** masking tape: translucent, its ends torn in a zigzag */
export function Tape({ x, y, w = 150, h = 42, rot = 0, seed = 1 }: Box & { seed?: number }) {
  const zig = (left: boolean) =>
    Array.from({ length: 7 }, (_, i) => {
      const yy = (i / 6) * 100;
      const xx = (left ? 0 : 100) + (left ? 1 : -1) * (i % 2 ? 3 + hash(seed, i) * 3 : hash(seed, i + 9) * 2);
      return `${xx.toFixed(1)}% ${yy.toFixed(1)}%`;
    });
  const poly = `polygon(${[...zig(true).reverse(), ...zig(false)].join(", ")})`;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, transform: `rotate(${rot}deg)`, filter: "drop-shadow(1px 2px 1.5px rgba(40,25,10,0.18))" }}>
      <div style={{ position: "absolute", inset: 0, clipPath: poly, overflow: "hidden", opacity: 0.82 }}>
        <div style={{ position: "absolute", inset: 0, ...paperOf("tape", 500, [-seed * 40, -seed * 20]) }} />
      </div>
    </div>
  );
}

/** a sticky note: square, yellow, a soft curl in its shadow */
export function Sticky({ x, y, s = 240, rot = 0, seed = 1, children, color = C.sticky }: { x: number; y: number; s?: number; rot?: number; seed?: number; children?: ReactNode; color?: string }) {
  return (
    <On x={x} y={y} w={s} h={s} rot={rot} lift={1.3}>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", ...(color === C.sticky ? paperOf("sticky", 900, [-(seed * 61) % 400, -(seed * 29) % 400]) : { background: color }) }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: s * 0.12, background: "rgba(120,90,20,0.10)" }} />
        {children}
      </div>
    </On>
  );
}

/** an instant print: white border, the picture, a caption strip */
export function Polaroid({ x, y, w = 300, rot = 0, src, seed = 1, children, picStyle }: { x: number; y: number; w?: number; rot?: number; src: string; seed?: number; children?: ReactNode; picStyle?: CSSProperties }) {
  const pw = w - w * 0.12;
  const ph = pw * 0.75;
  const h = ph + w * 0.06 + w * 0.26;
  return (
    <On x={x} y={y} w={w} h={h} rot={rot} lift={1.2}>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", ...paperOf("polaroid", 800, [-(seed * 41) % 300, 0]) }}>
        <div style={{ position: "absolute", left: w * 0.06, top: w * 0.06, width: pw, height: ph, overflow: "hidden", background: "#222" }}>
          <Img src={src} style={{ width: pw, height: ph, objectFit: "cover", ...picStyle }} />
          <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 6px rgba(0,0,0,0.35)" }} />
        </div>
        {children}
      </div>
    </On>
  );
}

/** a manila tag on a string */
export function Tag({ x, y, w = 230, h = 120, rot = 0, children, seed = 4 }: Box & { children?: ReactNode; seed?: number }) {
  const poly = "polygon(14% 0%, 100% 0%, 100% 100%, 14% 100%, 0% 78%, 0% 22%)";
  return (
    <On x={x} y={y} w={w} h={h} rot={rot} lift={1}>
      <div style={{ position: "absolute", inset: 0, clipPath: poly, overflow: "hidden", ...paperOf("tag", 600, [-seed * 33, -seed * 21]) }}>
        <div style={{ position: "absolute", left: w * 0.07, top: h / 2 - 9, width: 18, height: 18, borderRadius: 9, background: "#efe6d2", boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.4)", border: "3px solid #c79d58" }} />
        {children}
      </div>
    </On>
  );
}

/** the desk: board under everything, light falling from the top left, the paper's tooth over the whole frame */
export function Desk({ tex = TEX.board, children, f }: { tex?: string; children?: ReactNode; f: number }) {
  return (
    <div style={{ position: "absolute", left: -240, top: -140, width: 2400, height: 1360 }}>
      <Img src={tex} style={{ position: "absolute", left: 0, top: 0, width: 2400, height: 2400 }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,246,228,0.30) 0%, rgba(255,246,228,0) 45%, rgba(40,22,8,0.18) 100%)" }} />
      {children}
    </div>
  );
}

/** the camera over the desk: drifts through the whole scene without stopping, so cuts join motion to motion */
export function Cam({ f, from, to, dur, children }: { f: number; from: [number, number, number, number?]; to: [number, number, number, number?]; dur: number; children?: ReactNode }) {
  const t = f / dur;
  const [x0, y0, s0, r0 = 0] = from;
  const [x1, y1, s1, r1 = 0] = to;
  const x = x0 + (x1 - x0) * t;
  const y = y0 + (y1 - y0) * t;
  const s = s0 * Math.pow(s1 / s0, t);
  const r = r0 + (r1 - r0) * t;
  // the frame's centre looks at (x, y) on the desk, scaled s
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: "960px 540px", transform: `translate(${960 - x}px, ${540 - y}px) rotate(${r}deg) scale(${s})` }}>
      {children}
    </div>
  );
}

/** the grade over every frame: a little warmth at the edges where the lamp doesn't reach (no glow, no blur) */
export function Vignette() {
  return <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 75% 70% at 45% 42%, rgba(0,0,0,0) 55%, rgba(50,28,10,0.32) 100%)", mixBlendMode: "multiply" }} />;
}

/** stop motion: where a thing is on frame f as it moves from a to b between frames f0 and f1, stepped every n frames,
 * with the animator's ease and a nudge on each step */
export function Cut(f: number, f0: number, f1: number, a: [number, number, number?], b: [number, number, number?], k = 1, n = 2, ease = (t: number) => 1 - Math.pow(1 - t, 2.2)) {
  const sf = Math.floor(f / n) * n;
  const t = Math.max(0, Math.min(1, (sf - f0) / Math.max(1, f1 - f0)));
  const e = ease(t);
  const moving = t > 0 && t < 1;
  const j = nudge(k, f, moving ? 2.5 : 0.6, n);
  return { x: a[0] + (b[0] - a[0]) * e + j.x, y: a[1] + (b[1] - a[1]) * e + j.y, r: (a[2] ?? 0) + ((b[2] ?? 0) - (a[2] ?? 0)) * e + j.r, t };
}

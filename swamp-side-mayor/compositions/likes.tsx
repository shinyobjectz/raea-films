// The posted film's numbers, one curve of the film frame (likes, views, subscribers), and the YouTube mark, shared by
// the screens (compositions/screens.tsx: the video page, the watchers' cards) and the 9:16 cut's likes row
// (film.tsx#goose-9x16), so every place that shows them agrees. Moved out of screens.tsx unchanged for the 9:16 (11-16).
import { staticFile } from "raea";

/** when the post goes up (plan.ts S(116)), and when it's up (S(117.5)) */
// v9: the second "duck" freeze (plan.ts FREEZES, b 115.93-117.1) comes first, so the upload starts as it lets go (b 117.1)
// and the video page at b 118.1
export const UP0 = 2351, UP1 = 2371;
export const likes = (f: number) => Math.round(1180 * Math.pow(1.031, Math.max(0, f - UP1)) + 37 * Math.max(0, f - UP1));
export const views = (f: number) => Math.round(likes(f) * 27.4 + 900);
export const subs = (f: number) => Math.round(9400 + likes(f) * 0.31);
export const short = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e4 ? `${Math.floor(n / 1e3)}K` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : `${n}`);
export const full = (n: number) => n.toLocaleString("en-US");
export const FONT = "Inter, Roboto, sans-serif";

export function Logo({ s = 1 }: { s?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 * s }}>
      <div style={{ width: 30 * s, height: 21 * s, background: "#ff0033", borderRadius: 6 * s, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 0, height: 0, borderTop: `${5.5 * s}px solid transparent`, borderBottom: `${5.5 * s}px solid transparent`, borderLeft: `${9 * s}px solid #fff`, marginLeft: 2 * s }} />
      </div>
      <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 20 * s, letterSpacing: -0.8 * s, color: "#fff" }}>YouTube</div>
    </div>
  );
}

/** 9:16: the watcher's likes and the video's views in one row low in the frame, over the picture, inside a phone's safe
 * zone (bottom 420, left 60, right 140 at 1080 x 1920); on the tall card they met the heart over its head */
export function LikesRow({ frame, on }: { frame: number; on: number }) {
  return (
    <div style={{ position: "absolute", left: 70, right: 150, top: 1330, height: 130, display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: FONT, opacity: on, transform: `scale(${0.85 + 0.15 * on})`, transformOrigin: "50% 50%" }}>
      <div style={{ height: 120, padding: "0 34px 0 26px", borderRadius: 60, background: "rgba(15,15,15,0.86)", display: "flex", alignItems: "center", gap: 16 }}>
        <img src={staticFile("app/thumb-up.png")} style={{ width: 72, height: 72 }} />
        <div style={{ fontSize: 78, fontWeight: 800, color: "#fff", letterSpacing: -2 }}>{full(likes(frame))}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
        <Logo s={1.9} />
        <div style={{ fontSize: 52, fontWeight: 800, color: "#fff", textShadow: "0 4px 0 rgba(0,0,0,0.35)" }}>{short(views(frame))} views</div>
      </div>
    </div>
  );
}

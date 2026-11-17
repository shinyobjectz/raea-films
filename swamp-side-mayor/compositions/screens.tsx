// v8 (the director 11-16 on v7: "have this be it uploading to social, then we see it on YouTube", "maybe on all of these the
// likes go up on YouTube as a sort of overlay background material"): what the computer's screen shows once the film is
// done, a picture per film frame (tools/screens.sh renders them into assets/app/upload, assets/app/yt and
// assets/likes/<watcher>):
//   upload  the app's Publish page (the real capture, assets/app/publish.png) with the film going up to the four
//           networks the page offers, each bar filling and turning to Posted
//   yt      the film on a video page, playing, its likes, views and subscribers climbing
//   likes-* each watcher's hero card (its burst in its colour) with the same likes climbing over it
// The numbers are one curve of the film frame, so the page, the cards and the page again agree.
import { AbsoluteFill, Composition, registerRoot, staticFile, useCurrentFrame } from "raea";
import { FONT, Logo, UP0, UP1, full, likes, short, subs, views } from "./likes";

const FPS = 30, FRAMES = 2697;
// the numbers (UP0, UP1, likes, views, subs) and the YouTube mark are in likes.tsx, shared with the 9:16 cut
// v9: each bar fills over 12 frames, 2 apart (it was 20, 3 apart, over a longer shot)
const FILL = 12, GAP = 2;
const sm = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

const NETS = [{ id: "youtube", name: "YouTube", spec: "18:9 · 1:30" }, { id: "tiktok", name: "TikTok", spec: "9:16 · 1:30" }, { id: "instagram", name: "Instagram", spec: "9:16 · 1:30" }, { id: "x", name: "X", spec: "16:9 · 1:30" }];

function Upload() {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#080809" }}>
      <img src={staticFile("app/publish.png")} style={{ position: "absolute", left: 0, top: 0, width: 1360, height: 940 }} />
      <div style={{ position: "absolute", left: 224, top: 276, width: 976, height: 330, background: "#0f0f11", border: "1px solid #232327", borderRadius: 14, padding: "22px 28px", boxSizing: "border-box", fontFamily: FONT, color: "#ededee" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
          <img src={staticFile("app/thumb.jpg")} style={{ width: 96, height: 48, borderRadius: 6 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 17, fontWeight: 600 }}>Swamp-Side Mayor, the goose cut</div>
            <div style={{ fontSize: 13, color: "#8b8b90" }}>Video · 1:30 · going to 4 places</div>
          </div>
        </div>
        {NETS.map((n, k) => { const p = sm((f - UP0 - k * GAP) / FILL), done = p >= 1;
          return (
            <div key={n.id} style={{ display: "flex", alignItems: "center", gap: 14, height: 52 }}>
              <img src={staticFile(`app/net/${n.id}.png`)} style={{ width: 38, height: 38 }} />
              <div style={{ width: 150, display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{n.name}</div>
                <div style={{ fontSize: 12, color: "#8b8b90" }}>{n.spec}</div>
              </div>
              <div style={{ flex: 1, height: 8, background: "#25252a", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${Math.round(p * 100)}%`, height: 8, background: done ? "#3ecf6e" : "#e9e9ec", borderRadius: 4 }} />
              </div>
              <div style={{ width: 130, fontSize: 14, textAlign: "right", color: done ? "#3ecf6e" : "#c9c9ce", fontWeight: done ? 600 : 400 }}>{done ? "Posted" : p > 0 ? `Uploading ${Math.round(p * 100)}%` : "Waiting"}</div>
            </div>
          ); })}
      </div>
    </AbsoluteFill>
  );
}


const NEXT = ["Swamp-Side Mayor, the duck cut", "Goose Learns raea: the whole tutorial", "How the computer rises out of the pond", "Every sound in Swamp-Side Mayor, frame by frame", "The frog, the deer and the heron: the cast", "Kick: the last shot, made in raea"];
function Yt() {
  const f = useCurrentFrame(), play = Math.min(528, 190 + Math.max(0, f - UP1)), L = likes(f), pos = (play - 190) / 2700;
  return (
    <AbsoluteFill style={{ background: "#0f0f0f", fontFamily: FONT, color: "#f1f1f1" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1360, height: 56, display: "flex", alignItems: "center", padding: "0 20px", boxSizing: "border-box", gap: 18 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>{[0, 1, 2].map((i) => <div key={i} style={{ width: 18, height: 2, background: "#fff" }} />)}</div>
        <Logo />
        <div style={{ marginLeft: 220, width: 480, height: 36, border: "1px solid #303030", borderRadius: 18, background: "#121212", display: "flex", alignItems: "center", padding: "0 16px", boxSizing: "border-box", color: "#888", fontSize: 15 }}>swamp-side mayor</div>
        <div style={{ marginLeft: "auto", width: 32, height: 32, borderRadius: 16, background: "#3a6df0", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15 }}>G</div>
      </div>
      <div style={{ position: "absolute", left: 24, top: 70, width: 880, height: 440, background: "#000", borderRadius: 12, overflow: "hidden" }}>
        <img src={staticFile(`app/ytplay/f${String(play).padStart(4, "0")}.jpg`)} style={{ width: 880, height: 440 }} />
        <div style={{ position: "absolute", left: 12, right: 12, bottom: 12, height: 4, background: "rgba(255,255,255,0.3)" }}>
          <div style={{ width: `${Math.max(1, pos * 100)}%`, height: 4, background: "#ff0033" }} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 24, top: 526, width: 880, fontSize: 21, fontWeight: 700 }}>Swamp-Side Mayor (the goose cut) | made in raea</div>
      <div style={{ position: "absolute", left: 24, top: 568, width: 880, height: 44, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 21, background: "#1c2640", display: "flex", alignItems: "center", justifyContent: "center" }}><img src={staticFile("logo/cat-chrome.png")} style={{ width: 32, height: 32 }} /></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}><div style={{ fontSize: 16, fontWeight: 600 }}>raea</div><div style={{ fontSize: 12.5, color: "#aaa" }}>{short(subs(f))} subscribers</div></div>
        <div style={{ marginLeft: 12, height: 36, padding: "0 16px", borderRadius: 18, background: "#f1f1f1", color: "#0f0f0f", display: "flex", alignItems: "center", fontWeight: 600, fontSize: 14 }}>Subscribe</div>
        <div style={{ marginLeft: "auto", height: 36, borderRadius: 18, background: "#272727", display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 14px 0 12px", borderRight: "1px solid #444", height: 24 }}><img src={staticFile("app/thumb-up.png")} style={{ width: 20, height: 20 }} /><div style={{ fontSize: 14, fontWeight: 600 }}>{short(L)}</div></div>
          <div style={{ padding: "0 14px", display: "flex", alignItems: "center" }}><img src={staticFile("app/thumb-down.png")} style={{ width: 20, height: 20 }} /></div>
        </div>
        <div style={{ height: 36, padding: "0 16px", borderRadius: 18, background: "#272727", display: "flex", alignItems: "center", fontSize: 14, fontWeight: 600 }}>Share</div>
      </div>
      <div style={{ position: "absolute", left: 24, top: 628, width: 880, height: 120, borderRadius: 12, background: "#272727", padding: "12px 14px", boxSizing: "border-box", fontSize: 14, lineHeight: 1.45 }}>
        <div style={{ fontWeight: 600 }}>{full(views(f))} views  ·  {Math.max(1, Math.round((f - UP1) / 6))} minutes ago</div>
        <div style={{ color: "#ddd" }}>A goose sings a computer the size of a house up out of a swamp and has it make this music video. Every frame rendered in raea, the engine for games, films and 3D, made with an AI agent.</div>
      </div>
      <div style={{ position: "absolute", left: 928, top: 70, width: 408, display: "flex", flexDirection: "column", gap: 12 }}>
        {NEXT.map((n, k) => (
          <div key={k} style={{ display: "flex", gap: 10 }}>
            <img src={staticFile(`app/upnext/u${k}.jpg`)} style={{ width: 168, height: 84, borderRadius: 8 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 228 }}>
              <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{n}</div>
              <div style={{ fontSize: 12, color: "#aaa" }}>raea · {short(Math.round(views(f) * (0.08 + 0.05 * k)))} views</div>
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
}

/** a watcher's hero card, its burst in its colour, with the video's likes climbing over it */
// 9:16 (film.tsx#goose-9x16): the same card for a tall frame, its burst cut about its middle and its thumbs rising; the
// likes and views go over the picture instead (likes.tsx LikesRow), low in the frame, clear of the heart over its head
function Likes({ who, tall = false }: { who: "deer" | "heron" | "frog"; tall?: boolean }) {
  const f = useCurrentFrame(), L = likes(f), W = tall ? 1080 : 2160, H = tall ? 1920 : 1080;
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <img src={staticFile(`fx/${who}card.png`)} style={{ position: "absolute", left: tall ? (W - 2 * H) / 2 : 0, top: 0, width: tall ? 2 * H : 2160, height: H }} />
      {Array.from({ length: 16 }, (_, i) => { const r = (k: number) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };
        const life = 1.4 + r(1), age = ((f / FPS + r(2) * life) % life) / life, x = tall ? 90 + r(3) * 900 : 120 + r(3) * 1920, y = H - age * (H + 100), s = 46 + 60 * r(4);
        return <img key={i} src={staticFile("app/thumb-up.png")} style={{ position: "absolute", left: x - s / 2, top: y - s / 2, width: s, height: s, opacity: 0.55 * Math.sin(Math.PI * age) }} />; })}
      {/* (9:16: the likes and views are a row over the picture, likes.tsx LikesRow, drawn by film.tsx: on the card they met the heart) */}
      {!tall && <><div style={{ position: "absolute", left: 170, top: 690, height: 150, padding: "0 46px 0 36px", borderRadius: 75, background: "rgba(15,15,15,0.86)", display: "flex", alignItems: "center", gap: 24 }}>
        <img src={staticFile("app/thumb-up.png")} style={{ width: 96, height: 96 }} />
        <div style={{ fontSize: 104, fontWeight: 800, color: "#fff", letterSpacing: -2 }}>{full(L)}</div>
      </div>
      <div style={{ position: "absolute", right: 170, top: 210, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
        <Logo s={2.6} />
        <div style={{ fontSize: 64, fontWeight: 800, color: "#fff", textShadow: "0 4px 0 rgba(0,0,0,0.35)" }}>{short(views(f))} views</div>
      </div></>}
    </AbsoluteFill>
  );
}

registerRoot(() => (
  <>
    <Composition id="upload" component={Upload} width={1360} height={940} fps={FPS} durationInFrames={FRAMES} />
    <Composition id="yt" component={Yt} width={1360} height={940} fps={FPS} durationInFrames={FRAMES} />
    <Composition id="likes-deer" component={() => <Likes who="deer" />} width={2160} height={1080} fps={FPS} durationInFrames={FRAMES} />
    <Composition id="likes-heron" component={() => <Likes who="heron" />} width={2160} height={1080} fps={FPS} durationInFrames={FRAMES} />
    <Composition id="likes-frog" component={() => <Likes who="frog" />} width={2160} height={1080} fps={FPS} durationInFrames={FRAMES} />
    <Composition id="likes-deer-9x16" component={() => <Likes who="deer" tall />} width={1080} height={1920} fps={FPS} durationInFrames={FRAMES} />
    <Composition id="likes-heron-9x16" component={() => <Likes who="heron" tall />} width={1080} height={1920} fps={FPS} durationInFrames={FRAMES} />
    <Composition id="likes-frog-9x16" component={() => <Likes who="frog" tall />} width={1080} height={1920} fps={FPS} durationInFrames={FRAMES} />
  </>
));

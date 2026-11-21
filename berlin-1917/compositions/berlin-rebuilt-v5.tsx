// Berlin, Winter 1917: Could We Stand in That Room? The long cut (v5: the director on v4, 11-21: no cold-open clips in the body,
// three times the new footage, the room built up in 3D under v04, every label redesigned).
// v4 header follows. The long cut (v4). Narration: out/rebuilt/v4/prose-v2.md, written
// after eight real documentaries were taken apart (out/rebuilt/v4/how-docs-are-written.md); the director on draft 2, 11-21:
// "much better, lets do this". One throughline, one room: the porter's flat at Ritterstraße 120, photographed by the
// Ortskrankenkasse on 18 October 1917, and the question it raises. Five chapters rebuild what the photograph leaves out
// (the house, the neighbours, the pipes, the winter) and the film ends back in the room.
// Voice: Fish voice A (assets/rebuilt/vo4/vNN.wav, word times words.json); timeline: assets/rebuilt/vo4/timeline.json
// (tools: tools/timeline4.py); score: the Count You Too stems (assets/rebuilt/stems/score-v4.wav, arrange4.py).
// Pictures: the survey's plates and Hobrecht's atlas on the desk; our city finished by AI video (tagged so); the
// porter's set and the sewer as our 3D model, tagged so (compositions/rebuilt-v4-shots.tsx).
import { AbsoluteFill, Audio, Composition, Img, Mix, Sequence, Video, registerRoot, staticFile, useCurrentFrame } from "raea";
import * as Tone from "raea/tone";
import type { ReactNode } from "react";
import { Caption, ChapterCard, Corner, Fonts, Source, Stat, Tag } from "../components/rebuilt/labels";
import { chapterLeg, RecordCanvas, type Leg } from "../components/rebuilt/record-canvas";
import WORDS from "../assets/rebuilt/vo4/words.json" with { type: "json" };
import DURS from "../assets/rebuilt/vo4/dur.json" with { type: "json" };
import TL from "../assets/rebuilt/vo4/timeline.json" with { type: "json" };

const FPS = 24, W = 1920, H = 1080;
const PAPER = "#efe9dc", INK = "#1d1b18", HL = "rgba(242, 207, 60, 0.62)", RED = "#c8402f";
const HEAD = "'Old Standard TT', 'Old Standard', Georgia, serif", NUM = "'League Gothic', 'Oswald', sans-serif";

const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const ramp = (t: number, a: number, d = 0.6) => ease((t - a) / d);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
type Cam = { x: number; y: number; z: number; r?: number };
/** a camera through keys [time, cam], eased between them, drifting on after the last so it never stops */
function camAt(t: number, keys: [number, Cam][]): Cam {
  let c = keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, a] = keys[i], [t1, b] = keys[i + 1];
    if (t >= t0 && t <= t1) { const k = ease((t - t0) / Math.max(t1 - t0, 0.01)); return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k), r: lerp(a.r ?? 0, b.r ?? 0, k) }; }
    if (t > t1) c = b;
  }
  const last = keys[keys.length - 1][0];
  return t > last ? { ...c, z: c.z * (1 + (t - last) * 0.006) } : c;
}

const DUR = DURS as Record<string, number>;
const WT = WORDS as Record<string, [string, number][]>;
/** when word i of line l (the scene's line j) is said, in its scene */
const w = (L: number[], j: number, l: string, i: number) => L[j] + WT[l][i][1];

// the shots made real (Kling O3 Pro Edit over our render, keyframe by Nano Banana 2), the rooms set moving, and the
// shots that stay our 3D model (said so on screen)
const REAL_IDS = new Set(["rb-fly", "rb-walk", "rb-shops", "rb-leipziger", "rb-forecourt", "rb-friedrich", "rb-dusk", "rb-dom", "rb-roofs", "rb-rise", "rb-people", "rb-loft", "rb-stair", "rb-stable", "rb-kochraum"]);
const SHOT = (id: string) => (REAL_IDS.has(id) ? `rebuilt/real/${id}.mp4` : `rebuilt/shots/${id}.mp4`);
const ROOM = (id: string) => `rebuilt/real/rooms/${id}.mp4`;
const MODEL = (id: string) => `rebuilt/shots4/${id}.mp4`;
const SRC = (f: string) => `rebuilt/src/${f}`;
const S5 = (id: string) => `rebuilt/shots5/${id}.mp4`;
const BARE = (id: string) => `rebuilt/bare/${id}.mp4`;
// v5's shots that stay our bare model on purpose (out/rebuilt/v5/shots.md); every other shots5 clip is finished by AI
const MODEL5 = new Set(["s5-graybox-aerial", "s5-stream-run", "s5-gallery", "s5-house-cutaway", "s5-sewers3d-crossing", "s5-sewers3d-station", "s5-sewer-shaft", "s5-xray", "xray-sewers"]);
const S4 = (f: string) => `rebuilt/src4/${f}.jpg`;

/** every AI-finished shot says so; every shot of the bare model says that too */
const tagFor = (video: string) => {
  if (video.startsWith("rebuilt/real/")) return "Our 3D city, finished by AI video";
  if (video.endsWith("/build-room.mp4")) return null; // it carries its own badge: model, then the AI finish
  if (video.startsWith("rebuilt/shots5/")) return MODEL5.has(video.slice(15, -4)) ? "Our 3D model, built from the record" : "Our 3D city, finished by AI video";
  return video.startsWith("rebuilt/shots4/") || video.endsWith("rb-plan.mp4") ? "Our 3D model, built from the record" : null;
};


/** the desk: a paper ground and everything on it, seen through a 2D camera (desk px; z 1 shows 1920 x 1080) */
function Desk({ cam, children }: { cam: Cam; children: ReactNode }) {
  const lines = [];
  for (let x = -1800; x <= 3800; x += 120) lines.push(<div key={`v${x}`} style={{ position: "absolute", left: x, top: -1800, width: 1, height: 4800, background: "rgba(29,27,24,0.045)" }} />);
  for (let y = -1800; y <= 3000; y += 120) lines.push(<div key={`h${y}`} style={{ position: "absolute", left: -1800, top: y, width: 5600, height: 1, background: "rgba(29,27,24,0.045)" }} />);
  return (
    <AbsoluteFill style={{ background: PAPER, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: `translate(${W / 2}px, ${H / 2}px) scale(${cam.z}) rotate(${cam.r ?? 0}deg) translate(${-cam.x}px, ${-cam.y}px)` }}>
        {lines}
        {children}
      </div>
    </AbsoluteFill>
  );
}

type PrintP = { src?: string; x: number; y: number; w: number; h: number; rot?: number; t: number; at: number; from?: [number, number]; out?: number; to?: [number, number]; children?: ReactNode; border?: number };
/** a print on the desk: a white-bordered sheet that slides in from `from` (px) at `at`, and out toward `to` */
function Print({ src, x, y, w, h, rot = 0, t, at, from = [0, 500], out, to = [0, -1400], children, border = 12 }: PrintP) {
  const p = ramp(t, at, 0.75), q = out == null ? 0 : ramp(t, out, 0.7);
  if (p <= 0 || q >= 1) return null;
  const dx = (1 - p) * from[0] + q * to[0], dy = (1 - p) * from[1] + q * to[1];
  return (
    <div style={{ position: "absolute", left: x - w / 2 - border + dx, top: y - h / 2 - border + dy, width: w, height: h, padding: border, background: "#fbfaf6", boxShadow: "0 16px 40px rgba(40,28,12,0.32)", transform: `rotate(${rot + (1 - p) * rot * 1.5}deg)` }}>
      <div style={{ position: "relative", width: w, height: h, overflow: "hidden", background: "#ddd" }}>
        {src ? <Img src={staticFile(src)} style={{ position: "absolute", left: 0, top: 0, width: w, height: h }} /> : null}
        {children}
      </div>
    </div>
  );
}

/** a highlighter stroke over a print, in % of the print, drawn left to right (or top to bottom) from `at` */
function Hl({ x, y, w, h, rot = 0, t, at, d = 0.55, down = false }: { x: number; y: number; w: number; h: number; rot?: number; t: number; at: number; d?: number; down?: boolean }) {
  const p = ramp(t, at, d);
  if (p <= 0) return null;
  return <div style={{ position: "absolute", left: `${x}%`, top: `${y}%`, width: `${down ? w : w * p}%`, height: `${down ? h * p : h}%`, background: HL, transformOrigin: "0 50%", transform: `rotate(${rot}deg)` }} />;
}





/** a shot full frame from `at` (s into its scene) to `until`, its video starting when it comes on */
function Clip({ video, from = 0, at = 0, until = 1e9, t, children }: { video: string; from?: number; at?: number; until?: number; t: number; children?: ReactNode }) {
  if (t < at || t >= until) return null;
  const tag = tagFor(video);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Sequence from={Math.round(at * FPS)}><Video src={staticFile(video)} startFrom={Math.round(from * FPS)} muted style={{ width: W, height: H }} /></Sequence>
      {tag ? <Corner text={tag} /> : null}
      {children}
    </AbsoluteFill>
  );
}

/** a finished shot over its bare model, the model shown first, a scan line wiping to the finish from `a` over `d` s */
function Reveal({ id, from = 0, at, until = 1e9, t, a, d = 2.2, children }: { id: string; from?: number; at: number; until?: number; t: number; a: number; d?: number; children?: ReactNode }) {
  if (t < at || t >= until) return null;
  const k = ease((t - a) / d), x = k * W, f0 = Math.round(at * FPS), s0 = Math.round(from * FPS);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Sequence from={f0}><Video src={staticFile(BARE(id))} startFrom={s0} muted style={{ width: W, height: H }} /></Sequence>
      <AbsoluteFill style={{ clipPath: `inset(0 ${W - x}px 0 0)` }}>
        <Sequence from={f0}><Video src={staticFile(SHOT(id))} startFrom={s0} muted style={{ width: W, height: H }} /></Sequence>
      </AbsoluteFill>
      {k > 0 && k < 1 ? <div style={{ position: "absolute", left: x - 2, top: 0, width: 4, height: H, background: "#f2cf3c", boxShadow: "0 0 26px 8px rgba(242,207,60,0.65)" }} /> : null}
      <Corner text={k < 0.5 ? "Our 3D model, built from the record" : "Our 3D city, finished by AI video"} />
      {children}
    </AbsoluteFill>
  );
}

const TITLE = (o: number, o2 = o, line1 = "BERLIN, WINTER 1917", line2 = "REBUILT FROM THE RECORD") => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", opacity: o > 0 ? 1 : 0, background: `rgba(0,0,0,${0.3 * o})` }}>
    <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 118, color: "#fff", letterSpacing: 6, textShadow: "0 4px 30px rgba(0,0,0,0.6)", opacity: o }}>{line1}</div>
    <div style={{ fontFamily: NUM, fontSize: 60, color: "#fff", letterSpacing: 10, marginTop: 10, textShadow: "0 3px 20px rgba(0,0,0,0.65)", opacity: o2 }}>{line2}</div>
  </AbsoluteFill>
);

// ---- the cold open: the song's first verse over the city and its rooms, cut on its downbeats; no title now (it
// comes after the photograph), the song's own stop at 50.0 is black ----
type ShowShot = { video: string; at: number; to: number; from?: number; place?: string; source?: string; fadeIn?: boolean };
const SHOW: ShowShot[] = [
  { video: SHOT("rb-fly"), at: 0, to: 4.27, fadeIn: true },
  { video: SHOT("rb-walk"), at: 4.27, to: 8.21, place: "Leipziger Straße" },
  { video: ROOM("bakery-dawn"), at: 8.21, to: 12.14, place: "A bakery at dawn" },
  { video: SHOT("rb-leipziger"), at: 12.14, to: 16.06, place: "Leipziger Straße" },
  { video: ROOM("cafe"), at: 16.06, to: 19.92, place: "A café" },
  { video: SHOT("rb-friedrich"), at: 19.92, to: 23.82, place: "Friedrichstraße" },
  { video: SHOT("rb-forecourt"), at: 23.82, to: 27.64, place: "Gendarmenmarkt" },
  { video: ROOM("warkitchen"), at: 27.64, to: 31.48, place: "A war kitchen" },
  { video: SHOT("rb-roofs"), at: 31.48, to: 33.41 },
  { video: SHOT("rb-people"), at: 33.41, to: 37.2 },
  { video: SHOT("rb-dusk"), at: 37.2, to: 41.04, place: "Leipziger Straße, dusk" },
  { video: ROOM("pharmacy"), at: 41.04, to: 44.84, place: "A pharmacy" },
  { video: SHOT("rb-dom"), at: 44.84, to: 50.0, from: 1.6 },
];

function ShowcaseShot({ s }: { s: ShowShot }) {
  const f = useCurrentFrame(), t = f / FPS, len = s.to - s.at;
  const fadeIn = s.fadeIn ? ramp(t, 0, 0.8) : 1;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ opacity: fadeIn }}><Video src={staticFile(s.video)} startFrom={Math.round((s.from ?? 0) * FPS)} muted style={{ width: W, height: H }} /></AbsoluteFill>
      {s.place ? <Caption place={s.place} source={s.source} t={t} at={0.35} out={len - 0.45} /> : null}
      <Corner text="Our 3D city, finished by AI video" o={fadeIn} />
    </AbsoluteFill>
  );
}

// ---- the plate of Ritterstraße 120 (1800 x 1391 page) on the desk, at 1300 wide: page fractions to desk px ----
const PG = { x: 960, y: 540, w: 1300, h: 1300 * (1391 / 1800) };
const pgx = (fx: number) => PG.x - PG.w / 2 + fx * PG.w, pgy = (fy: number) => PG.y - PG.h / 2 + fy * PG.h;
const PLATE_CAM: Cam = { x: pgx(0.49), y: pgy(0.44), z: 1.3 };

type Scene = { id: string; fade?: boolean; draw: (t: number, L: number[], len: number) => ReactNode };
type Cut = [number, string, number?];
/** a run of shots cut end to end: [at, video, from?], each until the next, the last until `end` */
const Cuts = ({ t, list, end = 1e9 }: { t: number; list: Cut[]; end?: number }) => (
  <>{list.map(([at, v, from], i) => <Clip key={i} video={v} from={from ?? 0} t={t} at={at} until={i < list.length - 1 ? list[i + 1][0] : end} />)}</>
);
const CHAPTER = (t: number, at: number, n: string, title: string) => <ChapterCard n={n} title={title} t={t} at={at} out={at + 3.2} />;
/** the records canvas (components/rebuilt/record-canvas) over a chapter's first seconds, its card on top: the camera flies
 *  from the whole desk to this chapter's records while the earlier chapters' rows lie finished */
const CANVAS = (t: number, until: number, c: "map" | "book" | "under", legs: Leg[], card: ReactNode) =>
  t < until ? <AbsoluteFill><RecordCanvas t={t} legs={legs} done={chapterLeg(c).done} />{card}</AbsoluteFill> : null;

const SCENES: Record<string, Scene> = {
  // 1. THE PHOTOGRAPH. A side-wing court; up the iron stair; the stable under the rooms; the couple, close; the flash on
  // its word, and back to the whole plate. The caption read aloud, each line lit as it's said (the stair, finished from
  // our model, under "an iron spiral stair"); the fund's other rooms, its cellars, attics and kitchens cut on the words;
  // the room built up in 3D under "Could we stand in that room?"; what the photograph leaves out; the title.
  photo: { id: "photo", fade: false, draw: (t, L, len) => {
    const stair = w(L, 0, "v01", 10) - 0.15, top = w(L, 0, "v01", 23) - 0.1, lived = w(L, 0, "v01", 35), flash = w(L, 0, "v01", 48);
    const printed = w(L, 1, "v02", 15), cap1 = w(L, 1, "v02", 19), above = w(L, 1, "v02", 35) - 0.2, she = w(L, 1, "v02", 45) - 0.3;
    const cap2 = w(L, 1, "v02", 39), cap3 = w(L, 1, "v02", 52), cap4 = w(L, 1, "v02", 55);
    const homes = w(L, 2, "v03", 13) - 0.1, show = w(L, 2, "v03", 25), cellars = w(L, 2, "v03", 40) - 0.2, attics = w(L, 2, "v03", 41) - 0.1, kitchens = w(L, 2, "v03", 43) - 0.1, under = w(L, 2, "v03", 48);
    const back = L[3] - 0.4, could = w(L, 3, "v04", 23) - 0.2, build = w(L, 3, "v04", 17) - 0.1;
    const house = w(L, 4, "v05", 13), people = w(L, 4, "v05", 17), pipes = w(L, 4, "v05", 21), winter = w(L, 4, "v05", 26), first = w(L, 4, "v05", 29);
    const title = L[4] + DUR.v05 + 0.5;
    const P89 = { x: 960, y: 1260 };
    const cam = camAt(t, [[lived, { x: pgx(0.6), y: pgy(0.5), z: 2.2 }], [flash, { x: pgx(0.58), y: pgy(0.49), z: 1.95 }], [L[1], PLATE_CAM], [printed - 0.2, PLATE_CAM], [printed + 1.4, { x: pgx(0.5), y: pgy(0.935), z: 1.75 }], [cap4 + 3.2, { x: pgx(0.5), y: pgy(0.935), z: 1.8 }],
      [L[2] + 0.2, { x: 960, y: 520, z: 0.62 }], [show, { x: 960, y: 540, z: 0.58 }], [under, { x: 960, y: 560, z: 0.6 }], [under + 1.6, { x: P89.x, y: P89.y + 230, z: 1.5 }], [back - 0.3, { x: P89.x, y: P89.y + 240, z: 1.6 }], [back + 1.2, PLATE_CAM], [could, { x: pgx(0.36), y: pgy(0.36), z: 1.75 }],
      [first, { ...PLATE_CAM, z: 1.2 }], [len, { ...PLATE_CAM, z: 1.12 }]]);
    const fl = t < flash ? 0 : Math.max(0, 1 - (t - flash) / 0.9) * ramp(t, flash, 0.12);
    return (
      <AbsoluteFill style={{ background: "#000" }}>
        {t >= lived - 0.5 ? (
          <Desk cam={cam}>
            <Print src={S4("p0093")} x={-260} y={1080} w={760} h={587} rot={2.5} t={t} at={w(L, 2, "v03", 8)} from={[-1600, 300]} out={back} to={[-1800, 0]} />
            <Print src={S4("p0095")} x={2180} y={1080} w={760} h={587} rot={-2} t={t} at={w(L, 2, "v03", 11)} from={[1600, 300]} out={back} to={[1800, 0]} />
            <Print src={S4("p0057")} x={960} y={-240} w={760} h={587} rot={1.5} t={t} at={show - 0.4} from={[0, -1400]} out={back} to={[0, -1500]} />
            <Print src={S4("p0083")} x={-260} y={60} w={760} h={587} rot={-4} t={t} at={show} from={[-1600, 0]} out={back} to={[-1800, 0]} />
            <Print src={S4("p1691")} x={2180} y={60} w={760} h={587} rot={3.5} t={t} at={show + 0.5} from={[1600, 0]} out={back} to={[1800, 0]} />
            <Print src={S4("p0089")} x={P89.x} y={P89.y} w={760} h={587} rot={-1.5} t={t} at={show + 1.0} from={[0, 1400]} out={back} to={[0, 1500]}>
              <Hl x={20} y={92} w={60} h={2.4} t={t} at={under + 1.4} d={1.6} />
            </Print>
            <Print src={S4("p0075")} x={PG.x} y={PG.y} w={PG.w} h={PG.h} t={t} at={lived - 1.2} from={[0, 0]}>
              <Hl x={37.2} y={91.0} w={24.4} h={2.2} t={t} at={printed + 1.2} d={0.8} />
              <Hl x={21.8} y={93.8} w={55.2} h={2.0} t={t} at={cap1} d={cap2 - cap1} />
              <Hl x={21.8} y={95.7} w={55.2} h={2.0} t={t} at={cap2} d={cap3 - cap2} />
              <Hl x={21.8} y={97.6} w={12.6} h={2.0} t={t} at={cap3} d={cap4 - cap3} />
              <Hl x={35.2} y={97.6} w={22.4} h={2.0} t={t} at={cap4} d={5.4} />
            </Print>
          </Desk>
        ) : null}
        {t >= L[1] - 0.5 && t < L[2] ? <Tag x={1830} y={140} anchor="right" text="Ortskrankenkasse · 18 October 1917" t={t} at={w(L, 1, "v02", 5)} out={L[2] - 0.2} size={44} /> : null}
        {t >= L[1] && t < L[2] ? <Source t={t} at={L[1] + 0.3} out={above - 0.1} text="Unsere Wohnungsuntersuchungen, 1917, plate z2_1917_MP_0075 (ZLB, public domain)" /> : null}
        {t >= show && t < back ? <Source t={t} at={show + 1.4} out={cellars - 0.2} text="the Ortskrankenkasse's plates, 1901-1920 (ZLB, public domain)" /> : null}
        {/* v01: the court, the stair, the stable; the couple; the flash */}
        <Clip video={S5("s5-court-dusk")} t={t} at={0} until={stair}>
          <AbsoluteFill style={{ background: "#000", opacity: 1 - ramp(t, 0, 1.2) }} />
        </Clip>
        <Clip video={SHOT("rb-stair")} t={t} at={stair} until={top}>
          <Caption t={t} at={stair + 0.4} out={top - 0.3} place="The iron spiral stair" source="our set, from the plate's caption" />
        </Clip>
        <Clip video={SHOT("rb-stable")} t={t} at={top} until={lived - 0.5}>
          <Caption t={t} at={top + 0.4} out={lived - 0.8} place="Over a horse stable" source="our set, from the plate's caption" />
        </Clip>
        {/* v02: the stair, model to finish, under "reached by an iron spiral stair" */}
        <Reveal id="rb-stair" from={4} t={t} at={above} until={she} a={above + 0.6} d={2.4} />
        {/* v03: homes; the three kinds of room, on their words */}
        <Clip video={S5("s5-room-wing")} from={3} t={t} at={homes} until={show} />
        <Clip video={S5("s5-cellar")} t={t} at={cellars} until={attics} />
        <Clip video={ROOM("attic")} t={t} at={attics} until={kitchens} />
        <Clip video={S5("s5-kitchen-room")} t={t} at={kitchens} until={under} />
        {/* v04-v05: the room built up in 3D, then what the photograph leaves out */}
        <Clip video={S5("build-room")} t={t} at={build} until={house}>
          <Corner text={t < build + 17 ? "Our 3D model, built from the record" : "Our 3D city, finished by AI video"} />
        </Clip>
        <Clip video={S5("s5-facade-windows")} from={3} t={t} at={house} until={people} />
        <Clip video={S5("s5-queue")} t={t} at={people} until={pipes} />
        <Clip video={MODEL("rb-sewer")} from={3} t={t} at={pipes} until={winter} />
        <Clip video={S5("s5-smoke-aerial")} t={t} at={winter} until={first} />
        {CHAPTER(t, 0.6, "CHAPTER ONE", "The photograph")}
        {t >= title ? TITLE(ramp(t, title, 0.8), ramp(t, title + 1.0, 0.8), "BERLIN, WINTER 1917", "COULD WE STAND IN THAT ROOM?") : null}
        <AbsoluteFill style={{ background: "#fff", opacity: fl * 0.85 }} />
      </AbsoluteFill>
    );
  } },

  // 2a. THE MAP. Straube's sheet; the graybox city it drew; the building stop as bars; the plan traced into our model;
  // the city's tiles; the network reading the plan.
  map: { id: "map", draw: (t, L) => {
    const straube = w(L, 0, "v06", 9), drew = w(L, 0, "v06", 13) - 0.1, nearly = w(L, 0, "v06", 31), stopped = w(L, 0, "v06", 51);
    const X = (yr: number) => 160 + (yr - 1905) * 64, AX = 800, K = 0.08;
    const y1913 = w(L, 1, "v07", 1), n4519 = w(L, 1, "v07", 6), y1916 = w(L, 1, "v07", 15), n53 = w(L, 1, "v07", 23), y1918 = w(L, 1, "v07", 26), n13 = w(L, 1, "v07", 29);
    const so = w(L, 1, "v07", 30) - 0.1;
    const chart = stopped - 0.3, net = L[2] - 0.3, needed = w(L, 2, "v08", 11) - 0.1, taught = w(L, 2, "v08", 16) - 0.1, tiles = w(L, 2, "v08", 30), never = w(L, 2, "v08", 38), right = w(L, 2, "v08", 46);
    const wipe = ramp(t, taught + 0.3, 5.0), leg = drew - 0.2;
    const cam = t < chart
      ? camAt(t, [[0, { x: 960, y: 540, z: 1.0 }], [straube + 2, { x: 900, y: 520, z: 1.25 }], [nearly, { x: 980, y: 560, z: 1.5 }], [chart, { x: 1000, y: 580, z: 1.8 }]])
      : t < net ? camAt(t, [[chart, { x: 960, y: 560, z: 1.0 }], [so, { x: 920, y: 590, z: 1.04 }]])
        : camAt(t, [[net, { x: 960, y: 540, z: 1.0 }], [right, { x: 1000, y: 540, z: 1.12 }]]);
    const bar = (yr: number, n: number, at: number, label: string, labelAt: number) => {
      const p = ramp(t, at, 1.0), hpx = Math.max(n * K * p, p > 0 ? 2 : 0);
      return (
        <>
          <div style={{ position: "absolute", left: X(yr) - 22, top: AX - hpx, width: 44, height: hpx, background: INK }} />
          <Tag x={X(yr)} y={AX - Math.max(n * K, 2) - 86} text={label} anchor="center" size={60} t={t} at={labelAt} />
        </>
      );
    };
    return (
      <>

        {t < chart ? (
          <>
            <Desk cam={cam}>
              <Print src={SRC("leip-straube.jpg")} x={960} y={540} w={860} h={860} rot={-1} t={t} at={0} from={[0, 900]} />
            </Desk>
            <Tag x={1830} y={140} anchor="right" text="Übersichtsplan von Berlin · 1:4,000 · 1910" t={t} at={straube} size={44} />
            <Source t={t} at={0.4} text="Straube, Übersichtsplan von Berlin, 1910 (Geoportal Berlin, dl-de/zero-2.0)" />
          </>
        ) : t < net ? (
          <>
            <Desk cam={cam}>
              <div style={{ position: "absolute", left: X(1914), top: 270, width: X(1918) - X(1914), height: AX - 270, background: "rgba(168,50,42,0.08)", opacity: ramp(t, y1916 - 0.4, 0.8) }} />
              <Tag x={X(1916)} y={196} text="The war" anchor="center" t={t} at={y1916 - 0.4} size={40} red />
              <div style={{ position: "absolute", left: X(1905), top: AX, width: (X(1930) - X(1905)) * ramp(t, chart, 1.2), height: 4, background: INK }} />
              {[1905, 1910, 1915, 1920, 1925, 1930].map((yr) => (
                <div key={yr} style={{ position: "absolute", left: X(yr) - 60, top: AX + 18, width: 120, textAlign: "center", fontFamily: NUM, fontSize: 44, color: INK, opacity: ramp(t, chart + (yr - 1905) * 0.04, 0.4) }}>{yr}</div>
              ))}
              {bar(1913, 4519, y1913, "4,519", n4519)}
              {bar(1916, 53, y1916, "53", n53)}
              {bar(1918, 13, y1918, "13", n13)}
              <Tag x={X(1905)} y={230} text="New homes finished in Berlin, by year" t={t} at={y1913 - 0.3} size={44} />
            </Desk>
            <Source t={t} at={y1913} out={so - 0.3} text="Statistisches Jahrbuch der Stadt Berlin, 1913 and 1920, via Kholodilin, DIW 2015" />
          </>
        ) : (
          <>
            <Desk cam={cam}>
              <Print src={SRC("reader-plan.jpg")} x={960} y={540} w={800} h={800} rot={1} t={t} at={net} from={[2400, 0]}>
                <div style={{ position: "absolute", left: 0, top: 0, width: 800 * wipe, height: 800, overflow: "hidden" }}>
                  <Img src={staticFile(SRC("reader-pred.jpg"))} style={{ position: "absolute", left: 0, top: 0, width: 800, height: 800 }} />
                </div>
                <div style={{ position: "absolute", left: 800 * wipe - 3, top: 0, width: 6, height: 800, background: INK, opacity: wipe > 0 && wipe < 1 ? 1 : 0 }} />
              </Print>
            </Desk>
            <Tag x={1830} y={140} anchor="right" text="Traced by the network" t={t} at={w(L, 2, "v08", 22)} size={44} />
            <Stat t={t} items={[{ at: tiles, n: "12", label: "tiles to learn from", out: never - 0.3 }, { at: never, n: "3", label: "it had never seen", out: right - 0.3 }, { at: right, n: "86 in 100", label: "pixels right" }]} />
            <Source t={t} at={taught + 0.6} text="Straube 1910 · the network's tracing, on sheets it never saw (research/map-p0.md)" />
          </>
        )}
        <Clip video={S5("s5-graybox-aerial")} t={t} at={drew} until={nearly}>
          <Caption t={t} at={drew + 0.4} out={nearly - 0.3} place="Every building on the plan" source="our graybox, at each house's 1887 height" />
        </Clip>
        <Clip video={SHOT("rb-plan")} t={t} at={so} until={net}>
          <Caption t={t} at={so + 0.4} out={net - 0.3} place="The plan, in 3D" source="our model, traced from Straube's sheets" />
        </Clip>
        <Clip video={S5("s5-stream-run")} t={t} at={needed} until={taught} />
        {CANVAS(t, leg, "map", [[0, "overview"], [2.2, "straube"], [leg, "straube"]], CHAPTER(t, 0.3, "CHAPTER TWO", "Finding the house"))}
      </>
    );
  } },

  // 2b. THE HOUSE. The dive into the city; a block's courtyards; the tenement's pattern on the desk; each class in its
  // flat, on its words; the cellars and roofs; the right side wing; the stable, model to finish; the court round her.
  house: { id: "house", fade: false, draw: (t, L) => {
    const hob = w(L, 0, "v09", 13) - 0.2, there = w(L, 0, "v09", 30) - 0.3, front = w(L, 0, "v09", 33), wings = w(L, 0, "v09", 39), rear = w(L, 0, "v09", 42), court = w(L, 0, "v09", 46), another = w(L, 0, "v09", 48);
    const best = w(L, 1, "v10", 9) - 0.2, above = w(L, 1, "v10", 23) - 0.2, back = w(L, 1, "v10", 31) - 0.2, poorest = w(L, 1, "v10", 51) - 0.2, roof = w(L, 1, "v10", 58) - 0.2, ours = w(L, 1, "v10", 61) - 0.3, horses = w(L, 1, "v10", 71) - 0.15;
    const around = L[2] - 0.5, who = w(L, 2, "v11", 9) - 0.2;
    const cam = camAt(t, [[there, { x: 960, y: 490, z: 0.88 }], [best, { x: 980, y: 490, z: 0.93 }], [ours, { x: 1000, y: 500, z: 0.98 }], [horses, { x: 1080, y: 520, z: 1.06 }]]);
    const box = (x: number, y: number, ww: number, hh: number, at: number, label: string, size = 34, fill = "rgba(29,27,24,0.16)") => (
      <>
        <div style={{ position: "absolute", left: x, top: y, width: ww, height: hh, background: fill, border: `4px solid ${INK}`, opacity: ramp(t, at, 0.5), boxSizing: "border-box" }} />
        <div style={{ position: "absolute", left: x, top: y + hh / 2 - size * 0.6, width: ww, textAlign: "center", fontFamily: NUM, fontSize: size, color: INK, letterSpacing: 1.5, textTransform: "uppercase", opacity: ramp(t, at + 0.2, 0.4) }}>{label}</div>
      </>
    );
    const X0 = 200, X1 = 900, WW = 90;
    return (
      <>
        {t >= there - 0.5 && t < horses ? (
          <>
            <Desk cam={cam}>
              <div style={{ position: "absolute", left: X0 - 60, top: 800, width: X1 - X0 + 120, height: 60, background: "rgba(29,27,24,0.08)", opacity: ramp(t, there, 0.5) }} />
              <div style={{ position: "absolute", left: X0 - 60, top: 810, width: X1 - X0 + 120, textAlign: "center", fontFamily: NUM, fontSize: 34, letterSpacing: 6, color: INK, opacity: ramp(t, there + 0.2, 0.5) }}>THE STREET</div>
              {box(X0, 680, X1 - X0, 110, front, "Front building")}
              {box(X0, 400, WW, 280, wings, "Wing", 28)}
              {box(X1 - WW, 400, WW, 280, wings, "Wing", 28, ramp(t, ours, 0.5) > 0 ? HL : "rgba(29,27,24,0.16)")}
              {box(X0, 330, X1 - X0, 70, rear, "Rear building", 28)}
              {box(X0 + WW, 400, X1 - X0 - 2 * WW, 280, court, "Courtyard", 34, "rgba(0,0,0,0)")}
              {box(X0, 100, WW, 230, another, "Wing", 28)}
              {box(X1 - WW, 100, WW, 230, another, "Wing", 28)}
              {box(X0 + WW, 100, X1 - X0 - 2 * WW, 230, another, "Courtyard", 34, "rgba(0,0,0,0)")}
              {box(X0, 30, X1 - X0, 70, another + 0.2, "Rear building", 28)}
              <Tag x={X1 + 40} y={690} text="1st floor, front: the best flat, 5 to 8 rooms" t={t} at={best} size={36} />
              <Tag x={X1 + 40} y={745} text="Above: clerks, craftsmen, widows" t={t} at={above} size={36} />
              <Tag x={X1 + 40} y={340} text="Wings and rear: a room and a kitchen, often a lodger" t={t} at={back} size={36} />
              <Tag x={X1 + 40} y={395} text="Cellars and under the roof: the poorest" t={t} at={poorest} size={36} />
              <Tag x={X1 + 40} y={500} text="Ritterstraße 120: right side wing, 1 flight up" t={t} at={ours} size={40} red />
              <Tag x={X1 + 40} y={560} text="over a horse stable" t={t} at={ours + 1.4} size={40} red />
            </Desk>
            <Source t={t} at={there + 0.4} out={best - 0.2} text="the type after Hobrecht's 1862 plan (research/survey.md) · who lived where: research/interiors.md" />
          </>
        ) : null}
        <Clip video={S5("rb-dive")} t={t} at={0} until={hob} />
        <Clip video={S5("s5-blocks-aerial")} t={t} at={hob} until={there}>
          <Caption t={t} at={hob + 0.3} out={there - 0.3} place="Hobrecht's plan, 1862" source="very large blocks, filled with tenements" />
        </Clip>
        <Clip video={S5("s5-room-best")} t={t} at={best} until={above}>
          <Caption t={t} at={best + 0.3} out={above - 0.3} place="The best flat" source="1st floor, front · our model of the type" />
        </Clip>
        <Clip video={S5("s5-room-clerk")} t={t} at={above} until={back}>
          <Caption t={t} at={above + 0.3} out={back - 0.3} place="Above: clerks, craftsmen, widows" source="our model of the type" />
        </Clip>
        <Clip video={S5("s5-room-wing")} t={t} at={back} until={poorest}>
          <Caption t={t} at={back + 0.3} out={poorest - 0.3} place="A room and a kitchen" source="the wings and the rear · often a lodger" />
        </Clip>
        <Clip video={S5("s5-cellar")} from={0.5} t={t} at={poorest} until={roof}>
          <Caption t={t} at={poorest + 0.3} out={roof - 0.2} place="The cellars" source="the poorest · our model of the type" />
        </Clip>
        <Clip video={ROOM("attic")} from={1} t={t} at={roof} until={ours}>
          <Caption t={t} at={roof + 0.2} out={ours - 0.3} place="Under the roof" source="the poorest · our model of the type" />
        </Clip>
        <Reveal id="rb-stable" t={t} at={horses} until={around} a={horses + 0.5} d={2.2}>
          <Caption t={t} at={horses + 0.4} out={around - 0.3} place="The stable, Ritterstraße 120" source="our set, from the plates' captions" />
        </Reveal>
        <Clip video={S5("s5-court-privy")} t={t} at={around} until={who} />
        <Clip video={S5("s5-facade-windows")} t={t} at={who} />
      </>
    );
  } },

  // 3a. THE NEIGHBOURS. The address book; the shops on the ground floor and the flats above; one column read; the
  // library's text closed; Ritterstraße 124 in 1912, its plate and its caption.
  book: { id: "book", draw: (t, L) => {
    const px = (fx: number) => 960 - 380 + fx * 760, py = (fy: number) => 560 - 519 + fy * 1038;
    const shops = w(L, 0, "v12", 15) - 0.1, rented = w(L, 0, "v12", 22) - 0.1, vol = w(L, 0, "v12", 28) - 0.1;
    const cols = w(L, 0, "v12", 37), closed = w(L, 0, "v12", 49), col = w(L, 0, "v12", 70), cents = w(L, 0, "v12", 77);
    const r124 = L[1] - 0.3, num = w(L, 1, "v13", 20), single = w(L, 1, "v13", 40);
    const leg = shops;
    const cam = t < r124
      ? camAt(t, [[0, { x: 960, y: 560, z: 0.98 }], [vol, { x: 960, y: 560, z: 1.05 }], [cols, { x: px(0.52), y: py(0.5), z: 1.6 }], [col, { x: px(0.52), y: py(0.45), z: 2.2 }], [col + 4, { x: px(0.52), y: py(0.7), z: 2.4 }]])
      : camAt(t, [[r124, { x: 960, y: 540, z: 1.0 }], [num, { x: 960, y: 500, z: 1.1 }], [single, { x: pgx(0.5), y: pgy(0.935), z: 1.7 }], [L[1] + DUR.v13 + 1, { x: pgx(0.5), y: pgy(0.94), z: 1.75 }]]);
    return (
      <>

        {t < r124 ? (
          <>
            <Desk cam={cam}>
              <Print src={SRC("adressbuch-4322.jpg")} x={960} y={560} w={760} h={1038} rot={-1.2} t={t} at={0} from={[0, 1000]}>
                <Hl x={45.8} y={8} w={12.2} h={88} t={t} at={col} d={4.0} down />
              </Print>
            </Desk>
            <Tag x={1830} y={140} anchor="right" text="Berliner Adreßbuch, 1917" t={t} at={0.6} size={44} />
            <Tag x={1830} y={210} anchor="right" text="ZLB full text: “access not allowed”" t={t} at={closed} size={40} red />
            <Stat t={t} items={[{ at: cents - 0.4, n: "≈ 5¢", label: "a column, read by Claude" }]} />
            <Source t={t} at={vol + 0.4} text="Berliner Adreßbuch 1917, Part III (ZLB, public domain) · read with tools/addr/transcribe.ts" />
          </>
        ) : (
          <>
            <Desk cam={cam}>
              <Print src={S4("p0057")} x={PG.x} y={PG.y} w={PG.w} h={PG.h} t={t} at={r124} from={[0, 1100]} />
            </Desk>
            <Tag x={1830} y={140} anchor="right" text="Ritterstraße 124 · 1912" t={t} at={num} out={single - 0.6} size={46} />
            <Source t={t} at={num} text="Ortskrankenkasse survey, 1912, plate z4_1912_MP_0057 (ZLB, public domain)" />
          </>
        )}
        <Clip video={S5("s5-shops-corner")} t={t} at={shops} until={rented}>
          <Caption t={t} at={shops + 0.3} out={rented - 0.3} place="The shops on the ground floor" source="our 3D city" />
        </Clip>
        <Clip video={S5("s5-facade-windows")} from={2} t={t} at={rented} until={vol} />
        {CANVAS(t, leg, "book", [[0, "overview"], [1.8, "adressbuch"], [2.8, "adressbuch"], [3.8, "adressbuch-read"], [leg, "adressbuch-read"]], CHAPTER(t, 0.3, "CHAPTER THREE", "The neighbours"))}
      </>
    );
  } },

  // 3b. THE ROOMS. The generated rooms; a plate beside our set of it; the loft, model to finish, "wall by wall"; lace
  // curtains; the kitchens; what hung on the walls; the salon, reasoned; and beneath the houses, the other city.
  rooms: { id: "rooms", fade: false, draw: (t, L) => {
    const read = w(L, 0, "v14", 25) - 0.3, traced = w(L, 0, "v14", 38) - 0.2, lace = w(L, 0, "v14", 47) - 0.2, nine = w(L, 0, "v14", 57) - 0.3;
    const walls = L[1] - 0.3, lass = w(L, 1, "v15", 8), kaiser = w(L, 1, "v15", 15), madonna = w(L, 1, "v15", 26), ribbon = w(L, 1, "v15", 38);
    const rich = w(L, 2, "v16", 2), salon = w(L, 2, "v16", 15) + 0.1, beneath = L[3] - 0.2;
    const cam = t < walls
      ? camAt(t, [[read, { x: 960, y: 420, z: 0.95 }], [traced, { x: 960, y: 420, z: 1.02 }]])
      : camAt(t, [[walls, { x: 960, y: 540, z: 0.78 }], [lass - 0.5, { x: 960, y: 540, z: 0.8 }], [lass + 0.3, { x: 470, y: 330, z: 1.75 }], [kaiser - 0.5, { x: 540, y: 380, z: 1.85 }],
          [kaiser + 0.3, { x: 1500, y: 620, z: 1.8 }], [madonna - 0.5, { x: 1460, y: 660, z: 1.9 }], [madonna + 0.3, { x: 380, y: 300, z: 2.3 }], [ribbon - 0.5, { x: 620, y: 420, z: 2.2 }],
          [ribbon + 0.3, { x: 1640, y: 560, z: 2.3 }], [rich - 0.5, { x: 1360, y: 700, z: 2.1 }], [rich + 0.4, { x: 960, y: 540, z: 0.82 }], [salon, { x: 960, y: 540, z: 0.86 }]]);
    return (
      <>
        {t >= read - 0.5 && t < traced ? (
          <>
            <Desk cam={cam}>
              <Print src={S4("porter-plates")} x={960} y={420} w={1900} h={830} t={t} at={read - 0.6} from={[0, 900]} />
            </Desk>
            <Tag x={90} y={150} text="The plates" t={t} at={read + 0.2} size={44} />
            <Tag x={1830} y={150} anchor="right" text="Our set, wall by wall" t={t} at={read + 1.6} size={44} />
            <Source t={t} at={read + 0.4} text="Plates 0075 and 0077 beside our set (interiors/sets/porter.ts, ZLB)" />
          </>
        ) : t >= walls && t < salon ? (
          <>
            <Desk cam={cam}>
              <Print src={S4("p2081")} x={500} y={360} w={760} h={587} rot={-2.5} t={t} at={walls} from={[-1400, 0]} />
              <Print src={S4("p0083")} x={1500} y={640} w={700} h={541} rot={2} t={t} at={walls + 0.15} from={[1400, 0]} />
            </Desk>
            <Tag x={80} y={640} text="A worker's flat: Lassalle, or Marx" t={t} at={lass} size={38} />
            <Tag x={80} y={692} text="An official's: the Kaiser, a map of the front" t={t} at={kaiser} size={38} />
            <Tag x={80} y={744} text="Polish Catholics: the Black Madonna" t={t} at={madonna} size={38} />
            <Tag x={80} y={796} text="A house at war: a frame with a black ribbon" t={t} at={ribbon} size={38} />
            <Tag x={80} y={848} text="No plate of a salon: the fund never photographed the rich" t={t} at={rich} size={38} red />
            <Source t={t} at={walls + 0.4} text="Weber, 1892 (GHDI 482) · St. Marien-Liebfrauen, 1906 · plates: Dragonerstraße; Höchstestraße 8 (ZLB)" />
          </>
        ) : null}
        <Clip video={S5("s5-gallery")} t={t} at={0} until={read - 0.6}>
          <Caption t={t} at={1.0} out={read - 0.8} place="127 rooms" source="the fund's photographs, our way of furnishing the city" />
        </Clip>
        <Reveal id="rb-loft" t={t} at={traced} until={lace} a={traced + 0.4} d={3.0} />
        <Clip video={S5("s5-kitchen-window")} t={t} at={lace} until={nine}>
          <Caption t={t} at={lace + 0.3} out={nine - 0.3} place="Lace curtains" source="even in the poorest rooms" />
        </Clip>
        <Clip video={S5("s5-kitchen-room")} from={1.5} t={t} at={nine} until={walls}>
          <Stat t={t} items={[{ at: nine + 0.3, n: "9 of 15", label: "kitchens: someone sleeps" }]} />
        </Clip>
        <Clip video={S5("s5-salon")} t={t} at={salon} until={salon + 3.2}>
          <Caption t={t} at={salon + 0.3} place="A salon" source="reasoned, not photographed" />
        </Clip>
        <Clip video={ROOM("salon")} t={t} at={salon + 3.2} until={beneath}>
          <Caption t={t} at={salon + 3.3} out={beneath - 0.4} place="A salon" source="reasoned, not photographed" />
        </Clip>
        <Clip video={S5("s5-xray")} t={t} at={beneath} />
      </>
    );
  } },

  // 4. UNDER THE STREET. Hobrecht's atlas; the system in 3D; the trace; the profiles and the egg; the pumping station in
  // 3D and on its sheet; the courtyard and the privy; the city above going into its fourth winter.
  under: { id: "under", draw: (t, L) => {
    const atlas = w(L, 0, "v18", 19), hob = w(L, 0, "v18", 23), plates = w(L, 0, "v18", 30), only = w(L, 0, "v18", 41) - 0.3;
    const traced = L[1] - 0.2, km = w(L, 1, "v19", 18) - 0.2, brick = w(L, 1, "v19", 31) - 0.6, largest = w(L, 1, "v19", 40) - 0.2, pump = w(L, 1, "v19", 53) - 0.3, hall = w(L, 1, "v19", 59) - 0.3, chimney = w(L, 1, "v19", 64);
    const yard = L[2] - 0.3, even = w(L, 2, "v20", 9) - 0.2, tenants = w(L, 2, "v20", 17), half = w(L, 2, "v20", 22), privy = w(L, 2, "v20", 29) - 0.2;
    const autumn = L[3] - 0.3, fourth = w(L, 3, "v21", 17) - 0.2;
    const leg = plates + 1.0;
    const BW = 700, BH = 700 * (2229 / 1500);
    const cam = t < only
      ? camAt(t, [[0, { x: 960, y: 540, z: 0.78 }], [hob, { x: 960, y: 520, z: 0.95 }], [only, { x: 960, y: 480, z: 1.3 }]])
      : t < largest ? camAt(t, [[traced, { x: 960, y: 480, z: 1.6 }], [brick - 0.1, { x: 2060, y: 540, z: 0.85 }], [brick + 1.2, { x: 2060, y: 230, z: 2.2 }]])
        : t < yard ? camAt(t, [[hall, { x: 960, y: 540, z: 0.82 }], [chimney - 0.4, { x: 960, y: 300, z: 1.7 }], [yard, { x: 960, y: 280, z: 1.8 }]])
          : t < autumn ? camAt(t, [[even, { x: 960, y: 540, z: 1.0 }], [privy, { x: 960, y: 500, z: 1.12 }]])
            : camAt(t, [[autumn, PLATE_CAM], [fourth, { ...PLATE_CAM, z: 1.4 }]]);
    return (
      <>

        {t < largest ? (
          <>
            <Desk cam={cam}>
              <Print src={S4("blatt04")} x={960} y={540} w={BW} h={BH} rot={-1} t={t} at={0} from={[0, 1300]} />
              <Print src={S4("blatt07")} x={2060} y={540} w={BW} h={BH} rot={1.2} t={t} at={brick - 0.8} from={[1600, 0]}>
                <Hl x={8} y={11.5} w={84} h={5.5} t={t} at={brick + 1.0} d={1.2} />
              </Print>
            </Desk>
            <Tag x={1830} y={140} anchor="right" text="Die Canalisation von Berlin · 1884" t={t} at={hob} out={only} size={44} />
            <Stat t={t} items={[{ at: plates, n: "57", label: "plates", out: only - 0.3 }]} />
            <Source t={t} at={atlas} out={only - 0.2} text="James Hobrecht, Die Canalisation von Berlin, 1884, Blatt 4 and 7 (e-rara, ETH Zürich)" />
          </>
        ) : t >= hall && t < yard ? (
          <>
            <Desk cam={cam}>
              <Print src={S4("blatt16")} x={960} y={540} w={BW} h={BH} rot={-0.8} t={t} at={hall - 0.3} from={[0, 1300]} />
            </Desk>
            <Tag x={1830} y={140} anchor="right" text="Pumpwerk III · Hallesches Ufer" t={t} at={hall + 0.3} size={44} />
            <Stat t={t} items={[{ at: chimney, n: "43.1 m", label: "the chimney, still standing" }]} />
            <Source t={t} at={hall + 0.4} text="Hobrecht, 1884, Blatt 16 · Denkmaldatenbank Berlin 09031091" />
          </>
        ) : t >= even && t < privy ? (
          <>
            <Desk cam={cam}>
              <Print src={S4("p0097")} x={960} y={540} w={640} h={828} t={t} at={even - 0.4} from={[0, 1300]} />
            </Desk>
            <Stat t={t} items={[{ at: tenants, n: "9,400", label: "tenants surveyed, 1922" }]} />
            <Source t={t} at={even + 0.4} text="Museum Neukölln, on the sick fund's 1922 survey · plate: Keibelstraße 41 (ZLB)" />
          </>
        ) : t >= autumn && t < fourth ? (
          <Desk cam={cam}>
            <Print src={S4("p0075")} x={PG.x} y={PG.y} w={PG.w} h={PG.h} t={t} at={autumn - 1} from={[0, 0]} />
          </Desk>
        ) : null}
        <Clip video={S5("s5-sewers3d-crossing")} t={t} at={only} until={traced}>
          <Caption t={t} at={only + 0.3} out={traced - 0.3} place="Radial System III" source="the only drawn plan, in 3D" />
        </Clip>
        <Clip video={S5("xray-sewers")} t={t} at={traced} until={km + 1.8} />
        {t >= traced && t < brick ? <Stat t={t} items={[{ at: km, n: "56.4 km", label: "traced by hand, one system", out: brick - 0.5 }]} /> : null}
        <Clip video={MODEL("rb-sewer")} t={t} at={largest} until={pump}>
          <Stat t={t} items={[{ at: largest + 0.6, n: "2.0 m", label: "the largest brick egg" }]} />
        </Clip>
        <Clip video={S5("s5-sewers3d-station")} t={t} at={pump} until={hall}>
          <Caption t={t} at={pump + 0.3} out={hall - 0.3} place="To the pumping station" source="every main of the system" />
        </Clip>
        <Clip video={S5("s5-room-wing")} t={t} at={yard} until={even} />
        <Clip video={S5("s5-court-privy")} from={2} t={t} at={privy} until={autumn}>
          <Stat t={t} items={[{ at: privy + 0.2, label: "more than half: a landing toilet or a privy in the yard" }]} />
        </Clip>
        <Clip video={S5("s5-skyline-dusk")} t={t} at={fourth} />
        {CANVAS(t, leg, "under", [[0, "overview"], [2.6, "hobrecht"], [8.4, "hobrecht"], [10.2, "hobrecht-read"], [leg, "hobrecht-read"]], CHAPTER(t, 0.3, "CHAPTER FOUR", "Under the street"))}
      </>
    );
  } },

  // 5. THE WINTER, AND THE ROOM. Homes at dusk; copper off the roofs; brass from the kitchens; coal in the cellars; the
  // war kitchen; the queue; the second plate and the cooking room, model to finish; up the stair with no voice; the
  // room; the woman in the photograph; the room again: "We can. Just."
  winter: { id: "winter", fade: false, draw: (t, L) => {
    const copper = w(L, 0, "v22", 8), june = w(L, 0, "v22", 16), coal = w(L, 0, "v22", 26), kitchens = w(L, 0, "v22", 33) - 0.2, dec = w(L, 0, "v22", 44);
    const plate = L[1] - 1.3, pushed = w(L, 1, "v23", 24) - 0.1, up = L[1] + DUR.v23 + 0.6;
    const windows = w(L, 2, "v24", 12) - 0.2, woman = w(L, 2, "v24", 27) - 0.2, again = L[3] - 0.5;
    const cam = camAt(t, [[plate, { x: 960, y: 540, z: 1.25 }], [pushed, { x: pgx(0.57), y: pgy(0.5), z: 1.9 }]]);
    const camW = camAt(t, [[woman, { x: pgx(0.6), y: pgy(0.44), z: 1.7 }], [again, { x: pgx(0.65), y: pgy(0.45), z: 2.4 }]]);
    return (
      <>
        {CHAPTER(t, 0.3, "CHAPTER FIVE", "The winter, and the room")}
        {t >= plate && t < pushed ? (
          <>
            <Desk cam={cam}>
              <Print src={S4("p0077")} x={PG.x} y={PG.y} w={PG.w} h={PG.h} t={t} at={plate} from={[0, 1100]} />
            </Desk>
            <Source t={t} at={plate + 0.4} text="Ritterstraße 120, the cooking room: plate z2_1917_MP_0077 (ZLB, public domain)" />
          </>
        ) : null}
        <Cuts t={t} end={plate} list={[[0, S5("s5-court-dusk"), 2.5], [copper, S5("s5-roof-copper")], [june, S5("s5-kitchen-lamp")], [coal, S5("s5-cellar-coal")], [kitchens, S5("s5-warkitchen")], [dec, S5("s5-queue-wide")]]} />
        {t < plate ? (
          <Stat t={t} items={[
            { at: copper + 0.2, label: "March 1917: copper off the roofs", out: june - 0.2 },
            { at: june + 0.2, label: "June 1917: brass and copper from homes", out: coal - 0.2 },
            { at: kitchens + 0.4, label: "public kitchens: mostly swede", out: dec - 0.2 },
            { at: dec + 0.3, n: "160,000-170,000", label: "portions a day, December 1917" },
          ]} />
        ) : null}
        <Reveal id="rb-kochraum" t={t} at={pushed} until={up} a={pushed + 0.4} d={2.6}>
          <Caption t={t} at={pushed + 3.2} place="The cooking room" source="our set, traced from the plate" />
        </Reveal>
        <Clip video={SHOT("rb-stair")} from={2} t={t} at={up} until={windows} />
        <Clip video={SHOT("rb-loft")} t={t} at={windows} until={woman}>
          <Caption t={t} at={windows + 0.4} out={woman - 0.4} place="Ritterstraße 120" source="two windows, each 80 × 50 cm · ceiling 1.80 m" />
        </Clip>
        {t >= woman && t < again ? (
          <Desk cam={camW}>
            <Print src={S4("p0075")} x={PG.x} y={PG.y} w={PG.w} h={PG.h} t={t} at={woman - 1} from={[0, 0]} />
          </Desk>
        ) : null}
        <Clip video={SHOT("rb-loft")} t={t} at={again} />
      </>
    );
  } },

  // THE ENDING, on the song's low section: every record on the desk, landing on its words; then a walk at dusk as the
  // last verse comes back, the title on "We'll count again", its second line on "and count you too".
  end: { id: "end", draw: (t, L) => {
    const street = 15.6, countAgain = 135.2 - 117.98, youToo = 138.4 - 117.98;
    const rooms = w(L, 0, "v26", 13), book = w(L, 0, "v26", 22), backIn = w(L, 0, "v26", 32);
    const cam = camAt(t, [[0, { x: 960, y: 540, z: 1.1 }], [street, { x: 960, y: 540, z: 0.82 }]]);
    const P = (src: string, x: number, y: number, ww: number, hh: number, rot: number, at: number, from: [number, number]) => <Print src={src} x={x} y={y} w={ww} h={hh} rot={rot} t={t} at={at} from={from} />;
    return (
      <AbsoluteFill style={{ background: "#000" }}>
        {t < street ? <RecordCanvas t={t} legs={[[0, "overview"], [0.6, "overview"], [rooms - 1.2, "okk-read"], [book - 1.0, "adressbuch-read"], [backIn - 1.6, "hub"], [backIn + 1.0, "hub"], [street - 0.8, "overview"]]} done="all" /> : null}
        {false ? (
          <Desk cam={cam}>
            {P(S4("blatt04"), 260, 300, 330, 490, -4, 0.1, [-1400, -300])}
            {P(S4("blatt07"), 560, 260, 300, 446, 3, 0.6, [-1400, -500])}
            {P(SRC("leip-straube.jpg"), 1660, 280, 380, 380, 3, 0.4, [1400, -300])}
            {P(S4("blatt16"), 1380, 230, 280, 416, -2, 1.0, [1400, -500])}
            {P(S4("p0083"), 300, 760, 420, 324, -3, rooms - 0.6, [-1400, 300])}
            {P(S4("p0089"), 1620, 780, 420, 324, 2.5, rooms - 0.3, [1400, 300])}
            {P(S4("p0057"), 1250, 860, 400, 309, -2, rooms, [1400, 600])}
            {P(S4("p0097"), 640, 860, 260, 336, 1.5, rooms + 0.3, [-1400, 600])}
            {P(SRC("adressbuch-4322.jpg"), 960, 210, 300, 410, 1.2, book, [0, -1300])}
            {P(S4("p0075"), 960, 560, 760, 587, -1, backIn - 0.6, [0, 900])}
          </Desk>
        ) : null}
        <Clip video={S5("s5-ending-walk")} t={t} at={street}>{TITLE(ramp(t, countAgain - 0.25, 0.8), ramp(t, youToo - 0.2, 0.7))}</Clip>
      </AbsoluteFill>
    );
  } },

  // THE CODA, on the song's last chorus: the release said once, over the city and its rooms cut on the downbeats, and
  // what made the finish, said plainly.
  open: { id: "open", fade: false, draw: (t, L, len) => {
    const open = w(L, 0, "v27", 5), record = w(L, 0, "v27", 15);
    const cuts: Cut[] = [[0, S5("s5-wilhelm")], [3.78, S5("s5-blocks-aerial"), 2.5], [7.52, S5("s5-shops-corner"), 2.5], [11.26, ROOM("attic")], [15.02, S5("s5-skyline-dusk"), 3]];
    const cards = ramp(t, open - 0.1, 0.5) * (1 - ramp(t, 10.9, 0.5)), credit = ramp(t, 11.5, 0.6);
    return (
      <AbsoluteFill style={{ background: "#000" }}>
        <AbsoluteFill style={{ opacity: 1 - ramp(t, len - 1.2, 1.1) }}>
          <Cuts t={t} list={cuts} />
          <AbsoluteFill style={{ background: `rgba(0,0,0,${0.32 * Math.max(cards, credit)})` }} />
          <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", opacity: cards }}>
            <div style={{ fontFamily: NUM, fontSize: 96, color: "#fff", letterSpacing: 8, textShadow: "0 3px 24px rgba(0,0,0,0.65)" }}>EVERY ASSET OPEN SOURCE</div>
            <div style={{ fontFamily: NUM, fontSize: 48, color: "#fff", letterSpacing: 5, marginTop: 8, textShadow: "0 2px 18px rgba(0,0,0,0.65)", opacity: ramp(t, record - 0.2, 0.5) }}>CHECK IT AGAINST THE RECORD</div>
          </AbsoluteFill>
          <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", opacity: credit }}>
            <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 54, color: "#fff", textShadow: "0 3px 20px rgba(0,0,0,0.7)" }}>The city: our 3D model, built from the record</div>
            <div style={{ fontFamily: NUM, fontSize: 40, color: "#fff", letterSpacing: 3, marginTop: 14, textTransform: "uppercase", textShadow: "0 2px 16px rgba(0,0,0,0.7)" }}>Finished by AI video: Kling O3 · Nano Banana 2</div>
            <div style={{ fontFamily: NUM, fontSize: 40, color: "#fff", letterSpacing: 3, marginTop: 8, textTransform: "uppercase", textShadow: "0 2px 16px rgba(0,0,0,0.7)" }}>Narration: Fish Audio · Music: Count You Too</div>
          </AbsoluteFill>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  } },
};

// ---- the timeline (assets/rebuilt/vo4/timeline.json) ----
type TScene = { id: string; start: number; len: number; lines: string[]; L: number[] };
const PLACED = (TL as { scenes: TScene[] }).scenes;
const TOTAL = (TL as { total: number }).total;

// ---- the score: Count You Too, arranged from its stems (score-v4.wav, film time throughout), ducked under the voice
Tone.buses.music.duck(Tone.buses.voice, { amount: -9, attack: 0.08, release: 0.9 });
const Score = () => <Audio src={staticFile("rebuilt/stems/score-v4.wav")} bus="music" />;

function SceneAt({ p }: { p: TScene }) {
  const f = useCurrentFrame(), t = f / FPS, sc = SCENES[p.id];
  // a desk scene comes up over 8 frames out of the bare desk; a scene that opens on a shot cuts straight in
  const inK = sc.fade === false ? 1 : ramp(t, 0, 8 / FPS);
  return <AbsoluteFill style={{ background: sc.fade === false ? "#000" : PAPER }}><AbsoluteFill style={{ opacity: inK }}>{sc.draw(t, p.L, p.len)}</AbsoluteFill></AbsoluteFill>;
}

function Film() {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Fonts />
      {SHOW.map((s) => (
        <Sequence key={s.at} from={Math.round(s.at * FPS)} durationInFrames={Math.round(s.to * FPS) - Math.round(s.at * FPS)}><ShowcaseShot s={s} /></Sequence>
      ))}
      {PLACED.map((p) => (
        <Sequence key={p.id} from={Math.round(p.start * FPS)} durationInFrames={Math.round(p.len * FPS) + 1}><SceneAt p={p} /></Sequence>
      ))}
      {PLACED.flatMap((p) => p.lines.map((l, i) => (
        <Sequence key={l} from={Math.round((p.start + p.L[i]) * FPS)} durationInFrames={Math.ceil(DUR[l] * FPS) + 2}><Audio src={staticFile(`rebuilt/vo4/${l}.wav`)} bus="voice" /></Sequence>
      )))}
      <Score />
      <Mix lufs={-14} ceiling={-1.5} />
    </AbsoluteFill>
  );
}

registerRoot(() => (
  <>
    <Composition id="berlin-rebuilt-v5" width={W} height={H} fps={FPS} durationInFrames={Math.round(TOTAL * FPS)} component={Film} />
  </>
));

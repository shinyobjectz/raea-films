// The records canvas: every record the Berlin film stands on, laid out on one big desk as a graph, the way we organised
// it. the director (11-21): "a big canvas of records and papers and stacks of papers we can parse apart", panned around through
// the film. Four columns, left to right: THE RECORD (the scans, in stacks) -> WHAT WE READ OUT OF IT (typed slips and
// cards holding the fields we actually extracted) -> WHAT IT BUILT (stills of the model and the finished shots) -> ONE
// ROOM (Ritterstraße 120, where every row meets). One row per source. A red thread runs record -> read -> built -> room.
// The graph as prose, with every fact's file: out/rebuilt/v5/records-graph.md. Nothing here is a number we didn't find.
//
// Use: <RecordCanvas t={t} legs={[[0, "overview"], [1.4, "okk"], ...]} done={[...]} />
//   legs   the camera: [seconds, station] keys, eased between; a station repeated holds there. The first time the camera
//          reaches a station is its arrival: that station's stack fans apart, its slips type on and its threads draw,
//          each at a fixed offset after the arrival (CUES below).
//   done   stations already visited earlier in the film: drawn finished from the first frame (all: every station).
// CHAPTER_LEGS gives a ~6 s leg per chapter of berlin-rebuilt-v5 (legs, done, len); TOUR_LEGS the ~60 s tour.
import { AbsoluteFill, Img, staticFile } from "raea";
import type { ReactNode } from "react";
import { CARD, INK, NUM, PAPER, RED, SLIP, TYPE, HEAD, Tag } from "./labels";

export const CW = 8800, CH = 5600;
const W = 1920, H = 1080;
type Cam = { x: number; y: number; z: number };
const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const ramp = (t: number, a: number, d = 0.6) => ease((t - a) / d);
const lin = (t: number, a: number, d: number) => (t <= a ? 0 : t >= a + d ? 1 : (t - a) / d);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

// ---- stations: where the camera stands (desk px, z 1 shows 1920 x 1080) ----
export const STATIONS = {
  overview: { x: 4350, y: 2760, z: 0.18 },
  okk: { x: 1300, y: 1120, z: 0.53 },
  "okk-read": { x: 3750, y: 1180, z: 0.62 },
  "okk-built": { x: 5600, y: 1150, z: 0.62 },
  straube: { x: 1300, y: 2400, z: 0.55 },
  "straube-read": { x: 3650, y: 2420, z: 0.62 },
  jahrbuch: { x: 2600, y: 3020, z: 0.6 },
  "straube-built": { x: 5300, y: 2600, z: 0.62 },
  adressbuch: { x: 1800, y: 3780, z: 0.6 },
  "adressbuch-read": { x: 3650, y: 3800, z: 0.6 },
  "adressbuch-built": { x: 5600, y: 3800, z: 0.62 },
  hobrecht: { x: 1300, y: 4900, z: 0.55 },
  "hobrecht-read": { x: 3750, y: 4900, z: 0.6 },
  "hobrecht-built": { x: 5300, y: 4900, z: 0.62 },
  hub: { x: 7250, y: 2900, z: 0.62 },
} satisfies Record<string, Cam>;
export type Station = keyof typeof STATIONS;
export type Leg = [number, Station];

/** the camera along its legs: eased between keys, pulling back mid-flight in proportion to the distance flown */
export function canvasCam(t: number, legs: Leg[]): Cam {
  const at = (i: number) => STATIONS[legs[i][1]];
  if (t <= legs[0][0]) return at(0);
  for (let i = 0; i < legs.length - 1; i++) {
    const [t0] = legs[i], [t1] = legs[i + 1];
    if (t >= t0 && t <= t1) {
      const a = at(i), b = at(i + 1), k = ease((t - t0) / Math.max(t1 - t0, 0.01));
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      const inv = lerp(1 / a.z, 1 / b.z, k), mid = lerp(1 / a.z, 1 / b.z, 0.5), want = (dist * 1.1) / W;
      const bump = want > mid ? (want - mid) * Math.sin(Math.PI * k) : 0;
      // a hold (same station twice) creeps in a little, so a held frame is never frozen
      const creep = dist < 1 ? 1 + 0.035 * ((t - t0) / Math.max(t1 - t0, 0.01)) : 1;
      return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: (1 / (inv + bump)) * creep };
    }
  }
  const c = at(legs.length - 1), dt = t - legs[legs.length - 1][0];
  return { x: c.x + dt * 6, y: c.y, z: c.z * (1 + dt * 0.012) };
}

/** when each station is first reached; stations in `done` count as reached long before */
function arrivals(legs: Leg[], done: Station[] | "all"): Record<string, number> {
  const out: Record<string, number> = {};
  const all = Object.keys(STATIONS) as Station[];
  for (const s of done === "all" ? all : done) out[s] = -100;
  for (const [t, s] of legs) if (out[s] == null) out[s] = t;
  return out;
}

// ---- pieces ----
function Typed({ text, p }: { text: string; p: number }) {
  const n = Math.round(text.length * Math.max(0, Math.min(1, p)));
  return (
    <>
      {text.slice(0, n)}
      <span style={{ color: "transparent" }}>{text.slice(n)}</span>
    </>
  );
}
const tilt = (s: string, amp = 1) => {
  let h = 11;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9973;
  return ((h % 200) / 100 - 1) * amp;
};
const SHADOW = "0 18px 40px rgba(40,28,12,0.34), 0 2px 5px rgba(40,28,12,0.25)";

/** a print: a white-bordered sheet; it lies at `stack` until `cue`, then slides to `fan` (both centre points) */
function Sheet({ src, w, h, stack, fan, rot, fanRot = 0, t, cue, crop, appear }: { src: string; w: number; h: number; stack: [number, number]; fan: [number, number]; rot: number; fanRot?: number; t: number; cue: number; crop?: ReactNode; appear?: number }) {
  const ap = appear == null ? 1 : ramp(t, appear, 0.55);
  if (ap <= 0) return null;
  const k = ramp(t, cue, 1.1);
  const x = lerp(stack[0], fan[0], k), y = lerp(stack[1], fan[1], k), r = lerp(rot, fanRot, k);
  const lift = Math.sin(Math.PI * k) * 0.05;
  return (
    <div style={{ position: "absolute", left: x - w / 2 - 14, top: y - h / 2 - 14, width: w, height: h, padding: 14, background: "#fbfaf6", boxShadow: SHADOW, transform: `rotate(${r}deg) scale(${(1 + lift) * (1.08 - 0.08 * ap)})`, opacity: Math.min(1, ap * 1.6) }}>
      <div style={{ position: "relative", width: w, height: h, overflow: "hidden", background: "#ddd" }}>
        <Img src={staticFile(src)} style={{ position: "absolute", left: 0, top: 0, width: w, height: h }} />
        {crop}
      </div>
    </div>
  );
}

/** a built thing: a still of the model or the finished shot, dropped onto the desk at `cue`, with a typed label under it */
function Built({ src, x, y, w, label, t, cue, ok }: { src: string; x: number; y: number; w: number; label: string; t: number; cue: number; ok: Ok }) {
  const p = ramp(t, cue, 0.55);
  if (p <= 0) return null;
  const h = Math.round((w * 9) / 16);
  const bare = !ok(x - w / 2, y + h / 2, w, 80, 44);
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, transform: `scale(${1.08 - 0.08 * p}) rotate(${tilt(label, 1.2)}deg)`, opacity: Math.min(1, p * 1.6) }}>
      <div style={{ padding: 12, background: "#fbfaf6", boxShadow: SHADOW }}>
        <div style={{ position: "relative", width: w - 24, height: h - 24, overflow: "hidden", background: "#222" }}>
          <Img src={staticFile(src)} style={{ position: "absolute", left: 0, top: 0, width: w - 24, height: h - 24 }} />
        </div>
        <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 44, height: 50, color: INK, padding: "12px 6px 2px", whiteSpace: "nowrap" }}>
          {bare ? null : <Typed text={label} p={lin(t, cue + 0.3, Math.min(1, label.length / 50))} />}
        </div>
      </div>
    </div>
  );
}

/** an index card of what we read out of a record: a red-ruled head, then the fields typed one line after another */
function Card({ x, y, w, head, lines, t, cue, note, ok }: { x: number; y: number; w: number; head: string; lines: [string, string?][]; t: number; cue: number; note?: string; ok: Ok }) {
  const p = ramp(t, cue, 0.5);
  if (p <= 0) return null;
  const per = 0.22;
  const bare = !ok(x - w / 2, y, w, 200 + lines.length * 64 + (note ? 50 : 0), 46);
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y, width: w, transform: `translateY(${(1 - p) * 60}px) rotate(${tilt(head, 0.7)}deg)`, opacity: Math.min(1, p * 1.5) }}>
      <div style={{ background: CARD, boxShadow: SHADOW, padding: "26px 40px 30px", backgroundImage: "repeating-linear-gradient(to bottom, transparent 0, transparent 62px, rgba(64,100,150,0.22) 62px, rgba(64,100,150,0.22) 64px)", backgroundPosition: "0 92px" }}>
        <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 64, height: 67, color: INK, lineHeight: 1.05 }}>{bare ? <Greek w={Math.min(w - 80, head.length * 34)} h={34} top={18} ink={0.7} /> : head}</div>
        <div style={{ height: 4, background: RED, opacity: 0.85, margin: "12px 0 10px", width: `${ramp(t, cue + 0.25, 0.5) * 100}%` }} />
        {lines.map(([a, b], i) => (
          bare ? <div key={i} style={{ height: 64, position: "relative" }}><Greek w={Math.min(w - 80, a.length * 27.6 * Math.min(1, lin(t, cue + 0.5 + i * per, 0.5) * 1.2))} h={20} top={26} ink={0.42} />{b ? <div style={{ position: "absolute", right: 0, top: 26, width: b.length * 27.6, height: 20, background: RED, opacity: 0.5 }} /> : null}</div> : <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 30, fontFamily: TYPE, fontSize: 46, lineHeight: "64px", color: INK, whiteSpace: "nowrap" }}>
            <span><Typed text={a} p={lin(t, cue + 0.5 + i * per, Math.min(0.9, a.length / 60))} /></span>
            {b ? <span style={{ color: RED, fontWeight: 700 }}><Typed text={b} p={lin(t, cue + 0.7 + i * per, 0.3)} /></span> : null}
          </div>
        ))}
        {note ? <div style={{ fontFamily: TYPE, fontSize: 34, height: 40, color: "rgba(29,27,24,0.75)", marginTop: 14, whiteSpace: "nowrap" }}>{bare ? <Greek w={note.length * 20} h={14} top={14} ink={0.3} /> : <Typed text={note} p={lin(t, cue + 0.6 + lines.length * per, 0.6)} />}</div> : null}
      </div>
    </div>
  );
}

/** a red thread from a to b (desk px), drawn on from `cue`, pinned at both ends */
type Thread = { a: [number, number]; b: [number, number]; cue: number; bend?: number };
function threadPath({ a, b, bend = 0 }: Thread) {
  const dx = b[0] - a[0];
  const c1: [number, number] = [a[0] + dx * 0.45, a[1] + bend], c2: [number, number] = [b[0] - dx * 0.45, b[1] - bend];
  let len = 0, px = a[0], py = a[1];
  for (let i = 1; i <= 24; i++) {
    const s = i / 24, u = 1 - s;
    const x = u * u * u * a[0] + 3 * u * u * s * c1[0] + 3 * u * s * s * c2[0] + s * s * s * b[0];
    const y = u * u * u * a[1] + 3 * u * u * s * c1[1] + 3 * u * s * s * c2[1] + s * s * s * b[1];
    len += Math.hypot(x - px, y - py);
    px = x;
    py = y;
  }
  return { d: `M ${a[0]} ${a[1]} C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${b[0]} ${b[1]}`, len };
}
function Threads({ list, t }: { list: Thread[]; t: number }) {
  return (
    <svg width={CW} height={CH} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {list.map((th, i) => {
        const p = ramp(t, th.cue, 0.9);
        if (p <= 0) return null;
        const { d, len } = threadPath(th);
        return (
          <g key={i}>
            <path d={d} fill="none" stroke="rgba(40,20,10,0.25)" strokeWidth={12} strokeLinecap="round" strokeDasharray={`${len} ${len}`} strokeDashoffset={len * (1 - p)} transform="translate(4 8)" />
            <path d={d} fill="none" stroke={RED} strokeWidth={8} strokeLinecap="round" strokeDasharray={`${len} ${len}`} strokeDashoffset={len * (1 - p)} />
            <circle cx={th.a[0]} cy={th.a[1]} r={16} fill={RED} stroke="#5a1410" strokeWidth={3} />
            {p >= 1 ? <circle cx={th.b[0]} cy={th.b[1]} r={16} fill={RED} stroke="#5a1410" strokeWidth={3} /> : null}
          </g>
        );
      })}
    </svg>
  );
}

/** is a desk box (x, y top-left, w, h) clear of the feed's UI zones (top and bottom 120 px) on screen? Text that isn't
 *  is drawn as blank paper, no letters, until it is: a pan never carries type through the zones */
type Ok = (x: number, y: number, w: number, h: number, fs?: number) => boolean;
const makeOk = (cam: Cam): Ok => (x, y, w, h, fs = 40) => {
  if (fs * cam.z < 24) return false; // too small to read from here: blank paper (raea check misreads thin type under 24 px)
  const sy0 = (y - cam.y) * cam.z + H / 2, sy1 = (y + h - cam.y) * cam.z + H / 2;
  const sx0 = (x - cam.x) * cam.z + W / 2, sx1 = (x + w - cam.x) * cam.z + W / 2;
  return sx0 >= 76 && sx1 <= W - 76 && sy0 >= 138 && sy1 <= H - 138;
};
/** greeked type: a bar where a line of letters will be, drawn while the type is too small or in a UI zone (no text nodes) */
function Greek({ w, h, top, left = 0, ink, red = false }: { w: number; h: number; top: number; left?: number; ink: number; red?: boolean }) {
  return w > 0 ? <div style={{ position: "absolute", left, top, width: w, height: h, borderRadius: h / 3, background: red ? RED : INK, opacity: ink }} /> : null;
}
/** labels.tsx's Tag, or its blank slip while it crosses a UI zone */
function SafeTag(props: { x: number; y: number; text: string; t: number; at: number; size: number; red?: boolean; ok: Ok }) {
  const { x, y, text, size, ok, t, at } = props;
  const fs = Math.round(Math.max(26, size * 0.68)), wide = text.length * fs * 0.6 + 40, high = fs * 1.8 + 14;
  if (ok(x - 10, y - 14, wide + 20, high + 10, fs)) return <Tag x={x} y={y} text={text} t={t} at={at} size={size} red={props.red} />;
  const p = ramp(t, at, 0.32);
  if (p <= 0) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: wide, height: fs * 1.1 + fs * 0.66, background: SLIP, boxShadow: "0 8px 18px rgba(30,20,8,0.30)", borderLeft: `5px solid ${props.red ? RED : "rgba(29,27,24,0.85)"}`, opacity: Math.min(1, p * 1.5) }}>
      <Greek w={(wide - 40) * Math.min(1, lin(t, at + 0.1, 0.5) * 1.2)} h={fs * 0.5} top={fs * 0.6} left={20} ink={props.red ? 0.5 : 0.55} red={props.red} />
    </div>
  );
}

// ---- the graph (every fact: out/rebuilt/v5/records-graph.md) ----
const S4 = (f: string) => `rebuilt/src4/${f}.jpg`, SRC = (f: string) => `rebuilt/src/${f}`, CV = (f: string) => `rebuilt/canvas/${f}.jpg`;
const PL = { w: 470, h: 363 }; // an Ortskrankenkasse plate, 1800 x 1391
const OKK_PLATES = ["p0075", "p0077", "p0057", "p0083", "p0089", "p0093", "p0095", "p0097", "p1691", "p2081"];
const ROW = { okk: 1100, straube: 2400, jahrbuch: 3060, adress: 3800, hobrecht: 4950, hub_y: 3000 };
const COL = { rec: 1300, read: 3600, built: 5450, hub: 7500 };

/** an Adreßbuch page (1800 x 2458): column 4 of p. 474, where Leipziger Straße begins; Leipziger Str. 3 sits low in it */
const PAGE = { w: 600, h: Math.round((600 * 2458) / 1800) };
const STRIP = { fx0: 0.457, fx1: 0.58, fy0: 0.8, fy1: 0.965, k: 4.6 }; // the column's slice, and how much it's enlarged
const H3 = { fy0: 0.845, fy1: 0.934 }; // Leipziger Str. 3's entries in that column

export function RecordCanvas({ t, legs, done = [] }: { t: number; legs: Leg[]; done?: Station[] | "all" }) {
  const arr = arrivals(legs, done);
  const at = (s: Station, d = 0) => (arr[s] == null ? 1e9 : arr[s] + d);
  const cam = canvasCam(t, legs);
  const ok = makeOk(cam);

  // the ruled desk
  const lines: ReactNode[] = [];
  for (let x = 0; x <= CW; x += 160) lines.push(<div key={`v${x}`} style={{ position: "absolute", left: x, top: 0, width: 2, height: CH, background: "rgba(29,27,24,0.05)" }} />);
  for (let y = 0; y <= CH; y += 160) lines.push(<div key={`h${y}`} style={{ position: "absolute", left: 0, top: y, width: CW, height: 2, background: "rgba(29,27,24,0.05)" }} />);

  // OKK: ten plates in a stack, fanned into two rows of five
  const okkFan = (i: number): [number, number] => [COL.rec - 1000 + (i % 5) * 500, ROW.okk - 215 + Math.floor(i / 5) * 430];
  const okk = OKK_PLATES.map((id, i) => {
    const portrait = id === "p0097";
    const w = portrait ? Math.round((PL.h * 1391) / 1800) : PL.w;
    const j = OKK_PLATES.length - 1 - i; // draw the bottom of the stack first
    return { id, w, h: PL.h, i, j };
  });

  // Straube: the sheet, the training tile, the whole plan
  const straube: { src: string; w: number; h: number; fan: [number, number]; rot: number }[] = [
    { src: SRC("city-1917.jpg"), w: 700, h: 600, fan: [COL.rec + 700, ROW.straube], rot: 3 },
    { src: SRC("reader-plan.jpg"), w: 600, h: 600, fan: [COL.rec, ROW.straube], rot: -2 },
    { src: SRC("leip-straube.jpg"), w: 600, h: 600, fan: [COL.rec - 700, ROW.straube], rot: 1.5 },
  ];
  // Hobrecht: Blatt 16, 7, 4 (4 on top)
  const BL = { w: 400, h: Math.round((400 * 2229) / 1500) };
  const blatter = [
    { src: S4("blatt16"), fan: [COL.rec + 600, ROW.hobrecht] as [number, number], rot: 3.5 },
    { src: S4("blatt07"), fan: [COL.rec, ROW.hobrecht] as [number, number], rot: -2.5 },
    { src: S4("blatt04"), fan: [COL.rec - 600, ROW.hobrecht] as [number, number], rot: 1 },
  ];

  // the Adreßbuch column sliding out of its page
  const pageX = COL.rec - 250, pageY = ROW.adress;
  const sk = ramp(t, at("adressbuch", 0.6), 1.2);
  const sw = (STRIP.fx1 - STRIP.fx0) * PAGE.w, sh = (STRIP.fy1 - STRIP.fy0) * PAGE.h;
  const sx0 = pageX - PAGE.w / 2 + STRIP.fx0 * PAGE.w + sw / 2, sy0 = pageY - PAGE.h / 2 + STRIP.fy0 * PAGE.h + sh / 2;
  const sx1 = COL.rec + 820, sy1 = ROW.adress;
  const sScale = lerp(1, STRIP.k, sk), sx = lerp(sx0, sx1, sk), sy = lerp(sy0, sy1, sk);
  const hl = ramp(t, at("adressbuch", 1.9), 0.6);

  const threads: Thread[] = [
    // OKK: the plate -> its caption -> the set -> the shots; the plates -> the 127 rooms
    { a: [COL.rec + 1240, ROW.okk - 215], b: [COL.read - 640, ROW.okk - 120], cue: at("okk-read", 0.1) },
    { a: [COL.read + 640, ROW.okk - 60], b: [COL.built - 330, ROW.okk - 240], cue: at("okk-built", 0.1) },
    { a: [COL.read + 560, ROW.okk + 520], b: [COL.built - 330, ROW.okk + 250], cue: at("okk-built", 0.4) },
    { a: [COL.built + 300, ROW.okk - 240], b: [COL.hub - 520, ROW.hub_y - 120], cue: at("hub", 0.2), bend: 200 },
    // Straube: the plan -> the network's reading -> the graybox
    { a: [COL.rec + 1060, ROW.straube], b: [COL.read - 560, ROW.straube - 40], cue: at("straube-read", 0.1) },
    { a: [COL.read + 900, ROW.straube - 260], b: [COL.built - 330, ROW.straube], cue: at("straube-built", 0.1) },
    { a: [COL.built + 330, ROW.straube], b: [COL.hub - 520, ROW.hub_y + 40], cue: at("hub", 0.5) },
    // Jahrbuch: the figures -> the plan is the city of 1917
    { a: [COL.rec + 380, ROW.jahrbuch + 60], b: [COL.read - 560, ROW.jahrbuch + 60], cue: at("straube-read", 1.4) },
    { a: [COL.read + 560, ROW.jahrbuch + 60], b: [COL.built - 360, ROW.jahrbuch + 60], cue: at("straube-built", 0.6) },
    // Adreßbuch: the column -> the rows -> placed on the fronts -> the shops
    { a: [COL.rec + 1080, ROW.adress - 200], b: [COL.read - 640, ROW.adress - 230], cue: at("adressbuch-read", 0.1) },
    { a: [COL.read + 640, ROW.adress - 230], b: [COL.built - 450, ROW.adress - 230], cue: at("adressbuch-built", 0.1) },
    { a: [COL.built + 450, ROW.adress + 220], b: [COL.hub - 520, ROW.hub_y + 200], cue: at("hub", 0.8), bend: -150 },
    // Hobrecht: the Blätter -> the traced system -> the 3D sewers
    { a: [COL.rec + 800, ROW.hobrecht], b: [COL.read - 760, ROW.hobrecht - 120], cue: at("hobrecht-read", 0.1) },
    { a: [COL.read + 900, ROW.hobrecht - 300], b: [COL.built - 330, ROW.hobrecht - 210], cue: at("hobrecht-built", 0.1) },
    { a: [COL.built + 330, ROW.hobrecht - 210], b: [COL.hub - 520, ROW.hub_y + 360], cue: at("hub", 1.1), bend: -250 },
  ];

  return (
    <AbsoluteFill style={{ background: PAPER, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: CW, height: CH, transformOrigin: "0 0", transform: `translate(${W / 2}px, ${H / 2}px) scale(${cam.z}) translate(${-cam.x}px, ${-cam.y}px)` }}>
        {lines}
        {/* column heads */}
        {([["THE RECORD", COL.rec], ["WHAT WE READ OUT OF IT", COL.read], ["WHAT IT BUILT", COL.built], ["ONE ROOM", COL.hub]] as [string, number][]).map(([s, x]) =>
          ok(x - 900, 480, 1800, 190, 170) ? <div key={s} style={{ position: "absolute", left: x - 1100, top: 470, width: 2200, textAlign: "center", fontFamily: NUM, fontSize: 170, letterSpacing: 10, color: "rgba(29,27,24,0.78)" }}>{s}</div> : null,
        )}

        <Threads list={threads} t={t} />

        {/* ---- row 1: the Ortskrankenkasse's plates ---- */}
        {[...okk].reverse().map(({ id, w, h, i, j }) => (
          <Sheet key={id} src={S4(id)} w={w} h={h} stack={[COL.rec + j * 6 - 20, ROW.okk + j * -5]} rot={tilt(id, 5)} fan={okkFan(i)} fanRot={tilt(id + "f", 1.5)} t={t} cue={at("okk", 0.25 + i * 0.07)} />
        ))}
        <SafeTag ok={ok} x={COL.rec - 1240} y={ROW.okk + 470} text="Ortskrankenkasse, plates 1901-1920 (ZLB)" t={t} at={at("okk", 1.4)} size={70} />
        <Card ok={ok} x={COL.read} y={ROW.okk - 330} w={1280} head="Plate z2_1917_MP_0075" t={t} cue={at("okk-read", 0.2)}
          lines={[["Ritterstraße 120, rechter Seitenflügel", "where"], ["1 Treppe · Stube und Kammer", "rooms"], ["über einem Pferdestall", "below"], ["eiserne Wendeltreppe", "stair"], ["Länge 3,90 · Breite 3,00 · Höhe 1,80 m", "size"], ["Fenster je 80/50 cm", "windows"]]}
          note="the caption, read field by field" />
        <Card ok={ok} x={COL.read} y={ROW.okk + 380} w={1120} head="Plate z2_1917_MP_0077" t={t} cue={at("okk-read", 2.4)}
          lines={[["Kochraum", "room"], ["zerfallener Kochherd, Kanonenofen", "stove"]]} />
        <SafeTag ok={ok} x={COL.built - 560} y={ROW.okk - 640} text="interiors/sets/porter.ts" t={t} at={at("okk-built", 0.2)} size={66} />
        <Built ok={ok} src={CV("loft")} x={COL.built} y={ROW.okk - 230} w={640} label="the Stube, our set" t={t} cue={at("okk-built", 0.3)} />
        <Built ok={ok} src={CV("kochraum")} x={COL.built} y={ROW.okk + 260} w={640} label="the cooking room" t={t} cue={at("okk-built", 0.7)} />
        <Built ok={ok} src={CV("gallery")} x={COL.built + 760} y={ROW.okk + 20} w={560} label="127 rooms" t={t} cue={at("okk-built", 1.1)} />

        {/* ---- row 2: Straube's plan, and the network that read it ---- */}
        {straube.map((s, i) => (
          <Sheet key={s.src} src={s.src} w={s.w} h={s.h} stack={[COL.rec + i * 12, ROW.straube + i * -8]} rot={s.rot} fan={s.fan} fanRot={s.rot * 0.3} t={t} cue={at("straube", 0.25 + (2 - i) * 0.12)} />
        ))}
        <SafeTag ok={ok} x={COL.rec - 1050} y={ROW.straube + 330} text="Straube, Übersichtsplan, 1910 · 1:4,000" t={t} at={at("straube", 1.3)} size={70} />
        <Sheet src={SRC("reader-pred.jpg")} w={560} h={560} stack={[COL.read - 280, ROW.straube - 40]} fan={[COL.read - 280, ROW.straube - 40]} rot={-1.5} fanRot={-1.5} t={t} cue={0} appear={at("straube-read", 0.1)} />
        {([["the network's reading", 0.3], ["12 tiles to learn from", 0.8], ["3 tiles it never saw", 1.2], ["86 in 100 pixels right", 1.6], ["each house at its 1887 height", 2.0]] as [string, number][]).map(([s, d], i) => (
          <SafeTag ok={ok} key={s} x={COL.read + 60} y={ROW.straube - 330 + i * 120} text={s} t={t} at={at("straube-read", d)} size={i === 0 ? 70 : 66} red={i === 0} />
        ))}
        <Built ok={ok} src={CV("graybox")} x={COL.built} y={ROW.straube} w={660} label="the graybox city" t={t} cue={at("straube-built", 0.3)} />

        {/* ---- row 2b: the Statistisches Jahrbuch ---- */}
        <div style={{ position: "absolute", left: COL.rec - 380, top: ROW.jahrbuch - 110, width: 760, padding: "26px 34px 26px 60px", background: CARD, borderLeft: "26px solid #5b3a2a", boxShadow: SHADOW, transform: "rotate(-1.5deg)" }}>
          {ok(COL.rec - 380, ROW.jahrbuch - 110, 760, 260, 44) ? (
            <>
              <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 60, color: INK, lineHeight: 1.1 }}>Statistisches Jahrbuch der Stadt Berlin</div>
              <div style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 44, color: INK, marginTop: 10 }}>1913 and 1920</div>
            </>
          ) : <div style={{ height: 190 }} />}
        </div>
        <Card ok={ok} x={COL.read} y={ROW.jahrbuch - 110} w={1120} head="New homes finished" t={t} cue={at("straube-read", 1.6)}
          lines={[["1913", "4,519"], ["1916", "53"], ["1918", "13"]]} />
        <SafeTag ok={ok} x={COL.built - 330} y={ROW.jahrbuch + 20} text="the plan is, nearly, the city of 1917" t={t} at={at("straube-built", 1.0)} size={62} red />

        {/* ---- row 3: the Adreßbuch, a column read out of its page ---- */}
        <Sheet src={SRC("adressbuch-4322.jpg")} w={PAGE.w} h={PAGE.h} stack={[pageX, pageY]} fan={[pageX, pageY]} rot={-1} fanRot={-1} t={t} cue={0}
          crop={sk > 0 ? <div style={{ position: "absolute", left: STRIP.fx0 * PAGE.w, top: STRIP.fy0 * PAGE.h, width: sw, height: sh, background: "rgba(243,236,220,0.85)", opacity: Math.min(1, sk * 3) }} /> : null} />
        {sk > 0 ? (
          <div style={{ position: "absolute", left: sx - sw / 2, top: sy - sh / 2, width: sw, height: sh, transform: `scale(${sScale}) rotate(${lerp(-1, 0.5, sk)}deg)`, boxShadow: SHADOW, overflow: "hidden", background: "#fff" }}>
            <Img src={staticFile(SRC("adressbuch-4322.jpg"))} style={{ position: "absolute", left: -STRIP.fx0 * PAGE.w, top: -STRIP.fy0 * PAGE.h, width: PAGE.w, height: PAGE.h }} />
            <div style={{ position: "absolute", left: 0, top: (H3.fy0 - STRIP.fy0) * PAGE.h, width: sw * hl, height: (H3.fy1 - H3.fy0) * PAGE.h, background: "rgba(255,206,40,0.42)" }} />
          </div>
        ) : null}
        <SafeTag ok={ok} x={COL.rec - 1100} y={ROW.adress + 470} text="Berliner Adreßbuch 1917, Part III, p. 474" t={t} at={at("adressbuch", 1.0)} size={70} />
        <Card ok={ok} x={COL.read} y={ROW.adress - 340} w={1280} head="Leipziger Straße 3" t={t} cue={at("adressbuch-read", 0.2)}
          lines={[["Herrenhaus. T.", "state"], ["E. Fiskus", "owner"], ["V. David E, Geh Rechn. Rat", "manager"], ["Böhme, O., Hausinspekt T", "resident"], ["Luthe, K, Pförtner.", "resident"], ["Reißner, R, Hauswart. T.", "resident"]]}
          note="read by Claude, a column at a time" />
        <SafeTag ok={ok} x={COL.read - 600} y={ROW.adress + 420} text="7 streets · 647 houses · 7,334 entries" t={t} at={at("adressbuch-read", 2.6)} size={66} red />
        <Sheet src={SRC("leip-businesses.jpg")} w={900} h={375} stack={[COL.built, ROW.adress - 230]} fan={[COL.built, ROW.adress - 230]} rot={1} fanRot={1} t={t} cue={0} appear={at("adressbuch-built", 0.1)} />
        <Built ok={ok} src={CV("shops")} x={COL.built} y={ROW.adress + 250} w={620} label="the shops, on their fronts" t={t} cue={at("adressbuch-built", 0.4)} />

        {/* ---- row 4: Hobrecht's sewer atlas ---- */}
        {blatter.map((b, i) => (
          <Sheet key={b.src} src={b.src} w={BL.w} h={BL.h} stack={[COL.rec + i * 10, ROW.hobrecht - i * 6]} rot={b.rot} fan={b.fan} fanRot={b.rot * 0.3} t={t} cue={at("hobrecht", 0.25 + (2 - i) * 0.12)} />
        ))}
        <SafeTag ok={ok} x={COL.rec - 1000} y={ROW.hobrecht - 470} text="Hobrecht, Die Canalisation von Berlin, 1884" t={t} at={at("hobrecht", 1.2)} size={70} />
        <Built ok={ok} src={CV("network")} x={COL.read - 380} y={ROW.hobrecht - 60} w={760} label="one system, traced by hand" t={t} cue={at("hobrecht-read", 0.2)} />
        {([["57 plates", 0.7], ["56.4 km, mostly clay pipe", 1.1], ["brick egg, the largest 2.0 m", 1.5], ["Pumpwerk III · chimney 43.1 m", 1.9]] as [string, number][]).map(([s, d], i) => (
          <SafeTag ok={ok} key={s} x={COL.read + 80} y={ROW.hobrecht - 330 + i * 125} text={s} t={t} at={at("hobrecht-read", d)} size={66} red={i === 0} />
        ))}
        <Built ok={ok} src={CV("sewer")} x={COL.built} y={ROW.hobrecht - 210} w={640} label="the egg, in 3D" t={t} cue={at("hobrecht-built", 0.3)} />
        <Built ok={ok} src={CV("station")} x={COL.built} y={ROW.hobrecht + 250} w={640} label="to the pumping station" t={t} cue={at("hobrecht-built", 0.7)} />

        {/* ---- the room every row meets in ---- */}
        <div style={{ position: "absolute", left: COL.hub - 560, top: ROW.hub_y - 760, width: 1120, padding: "26px 40px", background: CARD, boxShadow: SHADOW, transform: "rotate(-0.8deg)" }}>
          {ok(COL.hub - 560, ROW.hub_y - 760, 1120, 260, 44) ? (
            <>
              <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 80, color: INK }}>Ritterstraße 120</div>
              <div style={{ height: 4, background: RED, opacity: 0.85, margin: "10px 0" }} />
              <div style={{ fontFamily: TYPE, fontSize: 44, color: INK }}>rechter Seitenflügel, 1 Treppe</div>
              <div style={{ fontFamily: TYPE, fontSize: 44, color: INK }}>18 October 1917</div>
            </>
          ) : <div style={{ height: 212 }} />}
        </div>
        <Built ok={ok} src={CV("loft")} x={COL.hub} y={ROW.hub_y + 120} w={1080} label="the room" t={t} cue={at("hub", 0)} />
        {([["the room itself", -120, 0.4], ["the house around it", 40, 0.7], ["the people next door", 200, 1.0], ["the pipes beneath it", 360, 1.3]] as [string, number, number][]).map(([s, dy, d]) => (
          <SafeTag ok={ok} key={s} x={COL.hub - 1240} y={ROW.hub_y + dy - 40} text={s} t={t} at={at("hub", d)} size={66} />
        ))}
      </div>
    </AbsoluteFill>
  );
}

// ---- legs ----
/** the ~60 s tour: the desk whole, every row record -> read -> built, the room, the desk whole again */
export const TOUR_LEGS: Leg[] = (() => {
  const seq: Station[] = ["okk", "okk-read", "okk-built", "straube", "straube-read", "jahrbuch", "straube-built", "adressbuch", "adressbuch-read", "adressbuch-built", "hobrecht", "hobrecht-read", "hobrecht-built", "hub"];
  const out: Leg[] = [[0, "overview"], [2.6, "overview"]];
  let t = 4.4;
  for (const s of seq) {
    const hold = s.endsWith("-read") || s === "hub" ? 2.4 : 1.5;
    out.push([t, s], [t + hold, s]);
    t += hold + 1.5;
  }
  out.push([t + 0.6, "overview"]);
  return out;
})();
export const TOUR_LEN = TOUR_LEGS[TOUR_LEGS.length - 1][0] + 4;

/** a ~6 s leg per chapter of berlin-rebuilt-v5: from the whole desk down one row; the rows before it already filled */
const ROWS: Station[][] = [
  ["okk", "okk-read", "okk-built"],
  ["straube", "straube-read", "jahrbuch", "straube-built"],
  ["adressbuch", "adressbuch-read", "adressbuch-built"],
  ["hobrecht", "hobrecht-read", "hobrecht-built"],
];
/** one row's leg, over `len` seconds (6.4 by default; longer gives the slips time to finish typing) */
const leg = (row: Station[], len = 6.4): Leg[] => {
  const k = len / 6.4;
  return [[0, "overview"], [1.2 * k, row[0]], [1.9 * k, row[0]], [2.9 * k, row[1]], [3.9 * k, row[1]], [4.8 * k, row[row.length - 1]]];
};
export type Chapter = "photo" | "map" | "book" | "under" | "winter";
/** a chapter's leg for berlin-rebuilt-v5, `len` seconds long, with the rows of the chapters before it already filled */
export function chapterLeg(c: Chapter, len = 6.4): { legs: Leg[]; done: Station[]; len: number } {
  const k = len / 6.4;
  if (c === "photo") return { legs: leg(ROWS[0], len), done: [], len };
  if (c === "map") return { legs: leg([ROWS[1][0], ROWS[1][1], ROWS[1][3]], len), done: ROWS[0], len };
  if (c === "book") return { legs: leg(ROWS[2], len), done: [...ROWS[0], ...ROWS[1]], len };
  if (c === "under") return { legs: leg(ROWS[3], len), done: [...ROWS[0], ...ROWS[1], ...ROWS[2]], len };
  return { legs: [[0, "overview"], [1.4 * k, "hub"], [3.6 * k, "hub"], [5.4 * k, "overview"]], done: ROWS.flat(), len };
}
export const CHAPTER_LEGS: Record<Chapter, { legs: Leg[]; done: Station[]; len: number }> = {
  photo: chapterLeg("photo"),
  map: chapterLeg("map"),
  book: chapterLeg("book"),
  under: chapterLeg("under"),
  winter: chapterLeg("winter"),
};

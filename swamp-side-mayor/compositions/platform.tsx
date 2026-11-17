// Inside the machine: the raea app making this film, one view at a time (plan.ts VIEWS: the prompt, the swamp it
// built, the feed, the film playing, a note on it, posting it). Each view is a capture of the real app (assets/app)
// as a big sticker card on its own flat colour; the goose glides beside it in the wind (plan.ts root, "fall") and
// swoops over to the other side with a roll as the next card rushes in from far off and the last flies past us.
// AppInk (HTML, over the picture) letters what each view is and rings the part it means.
import { staticFile } from "raea";
import { ImagePlane, Instances, ToneMapping, manifold } from "raea/3d";
import { AmbientLight, DirectionalLight } from "raea/light";
import { StandardMaterial } from "raea/pbr";
import { Cuboid, Mesh3d } from "raea/mesh";
import { Quat, Transform } from "raea/transform";
import { G, TRIP, VIEWS, playedBeat, sm, viewAt, type V3 } from "./plan";
import sizes from "./ink.json";

const rnd = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const span = (b: number, a: number, c: number) => Math.min(1, Math.max(0, (b - a) / (c - a)));
// each card: its crop of the capture, at most 4.3 m high and 6.4 m wide, a metre behind TRIP, pushed to its side;
// the lens 7.2 m in front of TRIP (plan.ts S(92))
const CZ = -1, EYE = 7.2, TH = Math.tan((20 * Math.PI) / 180), HALF = (EYE - CZ) * TH * 2;
const GEO = VIEWS.map((v) => { const [c0, r0, c1, r1] = v.crop, a = (c1 - c0) / (r1 - r0), HC = Math.min(4.3, 6.4 / a), WC = HC * a;
  return { HC, WC, x: (v.side === "L" ? -1 : 1) * (HALF - 0.55 - WC / 2), line: manifold.roundedBox(WC + 0.12, HC + 0.12, 0.02, 0.06), halo: manifold.roundedBox(WC + 0.5, HC + 0.5, 0.02, 0.24) }; });
/** a point of the capture (pixels) on view k's card, in the card's own metres from its middle */
const local = (k: number, px: number, py: number): [number, number] => { const [c0, r0, c1, r1] = VIEWS[k].crop, g = GEO[k]; return [((px - c0) / (c1 - c0) - 0.5) * g.WC, (0.5 - (py - r0) / (r1 - r0)) * g.HC]; };
/** the flat colour behind the cards: each view its own, cut hard as it arrives */
export const tripSky = (b: number) => VIEWS[viewAt(b)].bg;

/** Where a card stands at beat b: z (relative to TRIP) and a turn. A view's card rushes in from far off over its first
 * half beat (the first one pulls back from right up at the lens, onto the prompt); it flies past us as the next comes. */
function cardAt(k: number, b: number) {
  const v = VIEWS[k], tilt = (k % 2 ? 1 : -1) * 0.035 + 0.008 * Math.sin(b * 1.1 + k);
  const come = sm(span(b, v.from, v.from + 0.5)), go = sm(span(b, v.to - 0.2, v.to + 0.3));
  let z = k === 0 ? CZ + (1 - sm(span(b, 92, 93.2))) * 6.2 : CZ - (1 - come) * 70, x = GEO[k].x, y = 0.06 + 0.04 * Math.sin(b * 0.9 + k);
  if (k === 0) { const f = 1 - sm(span(b, 92, 93.2)), [rx, ry] = local(0, (v.ring[0] + v.ring[2]) / 2, (v.ring[1] + v.ring[3]) / 2); x = x + (-rx - x) * f; y = y + (-ry - y) * f; }   // from right up on the prompt
  z += go * 11; x += go * (v.side === "L" ? -3 : 3);
  return { x, y, z, tilt, on: b >= v.from - 0.01 && b < v.to + 0.3 };
}

export function Platform({ t, b }: { t: number; b: number }) {
  const i = viewAt(b), v = VIEWS[i], ph = ((b % 1) + 1) % 1, hit = (0.5 + 0.5 * Math.cos(2 * Math.PI * ph)) ** 2;
  // the wind: streaks rushing past toward us, thick as a card changes, a few at the edges while one is read
  const gust = Math.max(...VIEWS.map((w) => Math.exp(-(((b - w.from) / 0.35) ** 2))), Math.exp(-(((b - 121.7) / 0.35) ** 2)));
  const run = t * 34;
  const streaks = Array.from({ length: 160 }, (_, n) => { const a = rnd(n) * Math.PI * 2, edge = n % 4 === 0, r = edge ? 6.4 + 2 * rnd(n * 3) : 2.5 + 6 * rnd(n * 3), show = edge || rnd(n * 9) < gust;
    const zz = 8 - ((rnd(n * 7) * 80 + run * (1 + rnd(n * 5))) % 80);
    return { position: [TRIP[0] + Math.cos(a) * r * 1.6, TRIP[1] + Math.sin(a) * r * 0.8, TRIP[2] + zz] as V3, scale: (show ? [1, 1, 1 + 4 * rnd(n * 11) + 6 * gust] : [0.001, 0.001, 0.001]) as V3 }; });
  const film = Math.round(G(playedBeat(b)) * 30);
  return (
    <>
      <AmbientLight brightness={1400} /><DirectionalLight transform={Transform.fromXyz(TRIP[0] + 2, TRIP[1] + 4, TRIP[2] + 8).lookingAt(TRIP)} illuminance={9000} />
      <ToneMapping mode="none" />   {/* flat colour: the default mapping greyed the goose's white */}
      <Instances name="wind" at={streaks} pass="ui" shadow={false}><Cuboid half_size={[0.018, 0.018, 0.5]} /><StandardMaterial base_color="#fffdf5" unlit /></Instances>
      {VIEWS.map((w, k) => { const c = cardAt(k, b); if (!c.on) return null; const q = Quat.fromAxisAngle([0, 0, 1], c.tilt);
        const P = (x: number, y: number, dz: number) => Transform.fromXyz(TRIP[0] + c.x + x * Math.cos(c.tilt) - y * Math.sin(c.tilt), TRIP[1] + c.y + x * Math.sin(c.tilt) + y * Math.cos(c.tilt), TRIP[2] + c.z + dz).withRotation(q);
        const g = GEO[k], [fx, fy] = local(k, 551, 471), fw = (800 / (w.crop[2] - w.crop[0])) * g.WC, fh = (400 / (w.crop[3] - w.crop[1])) * g.HC;
        return [
          <Mesh3d key={`halo-${k}`} name={`card-halo-${k}`} shape={g.halo} allowOverlap pass="ui" shadow={false} transform={P(0, 0, -0.06)}><StandardMaterial base_color="#fffdf6" unlit /></Mesh3d>,
          <Mesh3d key={`line-${k}`} name={`card-line-${k}`} shape={g.line} allowOverlap pass="ui" shadow={false} transform={P(0, 0, -0.03)}><StandardMaterial base_color="#1c263d" unlit /></Mesh3d>,
          <ImagePlane key={`card-${k}`} name={`card-${k}`} src={staticFile(`app/${w.img}-c.png`)} width={g.WC} height={g.HC} pass="ui" shadow={false} position={[TRIP[0] + c.x, TRIP[1] + c.y, TRIP[2] + c.z]} rotation={[0, 0, c.tilt]} />,
          w.film && <ImagePlane key={`film-${k}`} name={`card-film-${k}`} src={staticFile(`app/film/f${String(film).padStart(4, "0")}.jpg`)} width={fw} height={fh} pass="ui" shadow={false}
            position={[TRIP[0] + c.x + fx * Math.cos(c.tilt) - fy * Math.sin(c.tilt), TRIP[1] + c.y + fx * Math.sin(c.tilt) + fy * Math.cos(c.tilt), TRIP[2] + c.z + 0.005]} rotation={[0, 0, c.tilt]} />,
        ]; })}
      {void hit}{void i}{void v}
    </>
  );
}

/** Where a point of the card at rest lands on the frame, in pixels of the 2160 x 1080 picture. */
function onFrame(k: number, px: number, py: number, w = 2160, h = 1080): [number, number] {
  const [lx, ly] = local(k, px, py), x = GEO[k].x + lx, y = 0.06 + ly, d = EYE - CZ;
  return [w / 2 + (x / (d * TH * 2)) * (w / 2), h / 2 - (y / (d * TH)) * (h / 2)];
}
/** The lettering inside the machine: the view's label at the top of the free side, a ring drawn round the part it
 * means and an arrow from the label to it, all in the lettering's one painted yellow (no outline: the director 11-16). */
export function AppInk({ b, frame, w = 2160, h = 1080 }: { b: number; frame: number; w?: number; h?: number }) {
  const k = viewAt(b), v = VIEWS[k], boil = Math.floor(frame / 4) % 3, settled = b - v.from;
  if (settled < 0.45 || b > v.to - 0.15) return null;
  // the label fits the free side with room to spare, so it never runs into the card's halo
  const free = v.side === "L" ? 1 : -1, cardEdge = w / 2 + (GEO[k].x + free * GEO[k].WC / 2) / HALF * (w / 2), room = free > 0 ? w - cardEdge : cardEdge;
  const [sw, sh] = (sizes as Record<string, number[]>)[v.word], lh = h * 0.24, lw = Math.min((lh * sw) / sh, w * 0.38, room - w * 0.07), lh2 = (lw * sh) / sw;
  const cx = (cardEdge + (free > 0 ? w : 0)) / 2, cy = h * 0.17;
  const pop = 0.4 + 0.6 * (1 - (1 - Math.min(1, (settled - 0.45) / 0.3)) ** 3);
  const [x0, y0] = onFrame(k, v.ring[0], v.ring[1]), [x1, y1] = onFrame(k, v.ring[2], v.ring[3]);
  const rx = Math.abs(x1 - x0) / 2 + 26, ry = Math.abs(y1 - y0) / 2 + 22, ex = (x0 + x1) / 2, ey = (y0 + y1) / 2;
  const draw = Math.min(1, Math.max(0, (settled - 0.8) / 0.6)), arrow = Math.min(1, Math.max(0, (settled - 1.25) / 0.5));
  // the ring: a little more than once round, wobbling, so it reads drawn; the arrow from the label's inner foot
  const ring = Array.from({ length: 49 }, (_, n) => { const a = -Math.PI / 2 + (n / 48) * Math.PI * 2.15, wob = 1 + 0.04 * Math.sin(n * 1.7 + k);
    return `${n ? "L" : "M"}${(ex + Math.cos(a) * rx * wob).toFixed(1)},${(ey + Math.sin(a) * ry * wob).toFixed(1)}`; }).join(" ");
  const ax = cx - free * lw * 0.42, ay = cy + lh2 * 0.5, angle = Math.atan2(ey - ay, ex - ax), bx = ex - Math.cos(angle) * rx * 1.02, by = ey - Math.sin(angle) * ry * 1.02;
  const mx = (ax + bx) / 2 + free * 60, my = Math.min(ay, by) - 40 + (by - ay) * 0.25;
  const tail = Math.atan2(by - my, bx - mx), head = `M${(bx - 46 * Math.cos(tail - 0.5)).toFixed(1)},${(by - 46 * Math.sin(tail - 0.5)).toFixed(1)} L${bx.toFixed(1)},${by.toFixed(1)} L${(bx - 46 * Math.cos(tail + 0.5)).toFixed(1)},${(by - 46 * Math.sin(tail + 0.5)).toFixed(1)}`;
  const strokes = (d: string, len: number) => <path d={d} fill="none" stroke="#f7c45e" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - len} />;
  const jx = (Math.sin(Math.floor(frame / 4) * 78.233) * 43758.5453) % 1;
  return (
    <>
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
        {draw > 0 && strokes(ring, draw)}
        {arrow > 0 && strokes(`M${ax.toFixed(1)},${ay.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${bx.toFixed(1)},${by.toFixed(1)}`, arrow)}
        {arrow >= 1 && strokes(head, 1)}
      </svg>
      <img src={staticFile(`ink/${v.word}-${boil}.png`)} style={{ position: "absolute", left: cx - lw / 2 + jx * 3, top: cy - lh2 / 2, width: lw, height: lh2, transform: `rotate(${free * -3}deg) scale(${pop})` }} />
    </>
  );
}

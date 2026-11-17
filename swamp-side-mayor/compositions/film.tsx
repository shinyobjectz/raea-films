// Swamp-Side Mayor, the goose cut: a goose swims into a painted swamp of old stones, sings a computer the size of a
// house up out of the pond with a circle of light, dances on the mud floor in front of it while the critters watch,
// flies key to key to type what it wants (a trick on every long hop), comes down on ENTER with both feet and dives
// into the pond, and swims round the computer smoking while the screen shows the raea app making this film; the
// animals watch and cheer; it climbs out and stamps the lens. 18:9. Everything is a function of the song's time
// (plan.ts); the goose, the ruins, the critters and the machine are drawn as stickers (sticker.ts), the world under the
// paint look (world2.tsx). v6 (the director's notes on v5, 11-16): no trip into the app; see plan.org t-dylfin*.
// v9 9:16 (the director 11-16: "can i also get a 9:16 version of this"): #goose-9x16 is the same film through tall.ts's lens,
// every shot seen again from its own place through a 1080 x 1920 frame, its 2D laid out for that frame and its safe
// zones; #goose draws exactly what it drew before (W, H and A are the wide frame's unless `tall`).
import { AbsoluteFill, Audio, Composition, Img, registerRoot, staticFile, useCurrentFrame } from "raea";
import { Fog, FramePass, ImagePlane, Instances, Model, Screen } from "raea/3d";
import { Camera3d } from "raea/camera";
import { StandardMaterial } from "raea/pbr";
import { Cylinder, Mesh3d, Sphere } from "raea/mesh";
import { Quat, Transform } from "raea/transform";
import { BEAT, CUE, FACES, FPS, FRAMES, FREEZE, FREEZE2, G, freezeAt, GS, KICK, LIFTS, MON, PANOS, SPLASH, TILES, beatAt, bodyAt, camera, cigDir, eulerOf, lensDrops, orbitH, moveAt, rigAt, rise, root, sm, upOf, worldT, type V3 } from "./plan";
import { SUN, World2 } from "./world2";
import { SurfaceWindow, UNDER_FOG, Under } from "./underwater";
import { WAVE_SPAN } from "./waves";
import { WavePass } from "./wavepass";
import { LensDrops } from "./lensdrops";
import { CLAY } from "./clay";
import { Critters, Magic, Splash, type Ring } from "./ruins";
import { CRITTERS, critterPose, heronPose, heronRig } from "./layout";
import { STICKER, stickerUniforms } from "./sticker";
import { WATER, ground } from "./set";
import { Machine } from "./machine";
import { Ink, CUES, titleCues, tallCue } from "./ink";
import { SAFE, TALL, pan, tallen } from "./tall";
import { LikesRow } from "./likes";
import inkSizes from "./ink.json";
import steps from "./steps.json";

const rnd = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
/** The turn that takes +Y onto a direction. */
function along(u: V3) { const l = Math.hypot(u[2], u[0]); return l < 1e-5 ? Quat.IDENTITY : Quat.fromAxisAngle([u[2] / l, 0, -u[0] / l], Math.acos(Math.max(-1, Math.min(1, u[1])))); }
const WET = new Set(["swim", "swimhome", "climb", "plunge", "circle"]);
const isWet = (t: number) => { const r = root(t); return r.p[1] < WATER - 0.05 || (WET.has(moveAt(beatAt(t)).name) && r.p[1] < WATER + 0.1); };
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], add = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], norm = (a: V3): V3 => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
type Cam = { eye: V3; at: V3; fov: number; up: V3 };
/** the lens's own axes: right, up, forward */
const basis = (c: Cam) => { const f = norm(sub(c.at, c.eye)), r = norm(cross(f, c.up)), u = cross(r, f); return { f, r, u }; };
/** Where a point lands on the frame (0..1 across and down), and how far in front of the lens; null behind it. */
function project(p: V3, c: Cam, aspect = 2, fh = 1080) {
  const { f, r, u } = basis(c), d = sub(p, c.eye), z = dot(d, f);
  if (z < 0.05) return null; const th = Math.tan((c.fov * Math.PI) / 360);
  return { x: 0.5 + dot(d, r) / (z * th * aspect) / 2, y: 0.5 - dot(d, u) / (z * th) / 2, z, px: fh / 2 / (z * th) };   // px: frame pixels a metre there spans
}
/** a quaternion [x, y, z, w] from a turn's columns (where x, y and z go) */
function quatOf(x: V3, y: V3, z: V3): [number, number, number, number] {
  const m00 = x[0], m11 = y[1], m22 = z[2], tr = m00 + m11 + m22;
  if (tr > 0) { const s = Math.sqrt(tr + 1) * 2; return [(y[2] - z[1]) / s, (z[0] - x[2]) / s, (x[1] - y[0]) / s, s / 4]; }
  if (m00 > m11 && m00 > m22) { const s = Math.sqrt(1 + m00 - m11 - m22) * 2; return [s / 4, (y[0] + x[1]) / s, (z[0] + x[2]) / s, (y[2] - z[1]) / s]; }
  if (m11 > m22) { const s = Math.sqrt(1 + m11 - m00 - m22) * 2; return [(y[0] + x[1]) / s, s / 4, (z[1] + y[2]) / s, (z[0] - x[2]) / s]; }
  const s = Math.sqrt(1 + m22 - m00 - m11) * 2; return [(z[0] + x[2]) / s, (z[1] + y[2]) / s, s / 4, (x[1] - y[0]) / s];
}
/** a card standing in the world at the frame point (x, y), `dist` in front of the lens, facing it, h frame-heights tall */
function cardAt(c: Cam, x: number, y: number, dist: number, rotDeg = 0, aspect = 2) {
  const { f, r, u } = basis(c), th = Math.tan((c.fov * Math.PI) / 360), a = (-rotDeg * Math.PI) / 180;
  const p = add(add(add(c.eye, f, dist), r, (2 * x - 1) * th * aspect * dist), u, (1 - 2 * y) * th * dist);
  const rr = add([r[0] * Math.cos(a), r[1] * Math.cos(a), r[2] * Math.cos(a)], u, Math.sin(a)), uu = add([u[0] * Math.cos(a), u[1] * Math.cos(a), u[2] * Math.cos(a)], r, -Math.sin(a));
  return { p, q: quatOf(rr, uu, [-f[0], -f[1], -f[2]]), frameH: 2 * th * dist };
}
const ACC = "#8c9cfb";   // the app's accent, oklch(0.72 0.14 275)
const AX = ["#f0616d", "#58c66b", "#5b9cf5"];   // its move gizmo's axes (Gizmo.tsx)
/** a straight line on the frame between two 0..1 points, `w` px thick, solid or dotted */
function Line({ a, b, color, w = 3, dotted = false, W = 2160, H = 1080 }: { a: [number, number]; b: [number, number]; color: string; w?: number; dotted?: boolean; W?: number; H?: number }) {
  const x0 = a[0] * W, y0 = a[1] * H, dx = b[0] * W - x0, dy = b[1] * H - y0, L = Math.hypot(dx, dy);
  return <div style={{ position: "absolute", left: x0, top: y0 - w / 2, width: L, height: dotted ? 0 : w, background: dotted ? undefined : color, borderTop: dotted ? `${w}px dotted ${color}` : undefined, transform: `rotate(${(Math.atan2(dy, dx) * 180) / Math.PI}deg)`, transformOrigin: "0 50%" }} />;
}
const Dot = ({ p, r, fill, ring = "#ffffff", rw = 3, W = 2160, H = 1080 }: { p: [number, number]; r: number; fill: string; ring?: string; rw?: number; W?: number; H?: number }) =>
  <div style={{ position: "absolute", left: p[0] * W - r, top: p[1] * H - r, width: 2 * r, height: 2 * r, borderRadius: r, background: fill, border: `${rw}px solid ${ring}`, boxSizing: "border-box" }} />;
const Chip = ({ p, text, W = 2160, H = 1080 }: { p: [number, number]; text: string; W?: number; H?: number }) =>
  <div style={{ position: "absolute", left: p[0] * W, top: p[1] * H - 34, background: ACC, color: "#ffffff", font: "600 20px/1 Inter, sans-serif", padding: "6px 10px", borderRadius: 6 }}>{text}</div>;
/** the app's move gizmo at a point: an axis line to each tip (x red, y green, z blue) with a dot there, and the round
 * handle for sliding over the ground at the middle */
function Gizmo({ o, c, len, on, W = 2160, H = 1080 }: { o: V3; c: Cam; len: number; on: number; W?: number; H?: number }) {
  const po = project(o, c, W / H, H); if (!po || on <= 0) return null;
  const tips = [[len, 0, 0], [0, len, 0], [0, 0, len]].map((v) => project(add(o, v as V3), c, W / H, H));
  return <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, opacity: on }}>
    {tips.map((q, i) => q && <Line key={`ax${i}`} a={[po.x, po.y]} b={[q.x, q.y]} color={AX[i]} w={4} W={W} H={H} />)}
    {tips.map((q, i) => q && <Dot key={`tip${i}`} p={[q.x, q.y]} r={11} fill={AX[i]} W={W} H={H} />)}
    <Dot p={[po.x, po.y]} r={13} fill="#1d1f2a" W={W} H={H} />
  </div>;
}
// the rig as the app shows it: bones between joints, the joints as dots
const BONES: [string, string][] = [["Pelvis", "Spine"], ["Spine", "Spine1"], ["Spine1", "Bip01_Neck"], ["Bip01_Neck", "Bip01_Neck1"], ["Bip01_Neck1", "Bip01_Head"], ["Bip01_Head", "Bone02"], ["Spine", "Tail"], ["Tail", "Bip01_Tail1"],
  ...(["L", "R"] as const).flatMap((s) => [["Spine", `${s}_Thigh`], [`${s}_Thigh`, `Bip01_${s}_Calf`], [`Bip01_${s}_Calf`, `Bip01_${s}_HorseLink`], [`Bip01_${s}_HorseLink`, `Bip01_${s}_Foot`], [`Bip01_${s}_Foot`, `Bip01_${s}_Toe1Nub`]] as [string, string][])];

type Tile = "frog" | "heron";
/** the cutaway's lenses: close on the frog and on the heron, each turning its head after the goose, pushing in */
function tileCam(which: Tile, t: number, b: number, look: V3): Cam {
  const u = clamp((b - TILES[0]) / (TILES[1] - TILES[0]));
  if (which === "frog") { const p = critterPose(1, t, b, look), h = add(p.head, [0, -0.06, 0]), d = norm(sub([0, 1.0, 0.3], h)), a = 0.95, side: V3 = [d[0] * Math.cos(a) + d[2] * Math.sin(a), 0, -d[0] * Math.sin(a) + d[2] * Math.cos(a)];
    return { eye: add(add(h, side, 0.62), [0, 0.1, 0]), at: add(h, d, 0.12), fov: 34 - 6 * sm(u), up: [0, 1, 0] }; }
  // v7: the whole heron, from in front of it, so it's seen whip round to the screen (the director 11-16: "reframe this so the
  // heron is in frame"; its head had gone out of the tile following the goose)
  const hp = heronPose(b, look);
  return { eye: [hp.at[0] + 2.3, hp.at[1] + 1.15, hp.at[2] + 0.5], at: [hp.at[0], hp.at[1] + 1.0, hp.at[2] - 0.1], fov: 40 - 5 * sm(u), up: [0, 1, 0] };
}

function Film({ labels = false, tile, clay = false, tall = false }: { labels?: boolean; tile?: Tile; clay?: boolean; tall?: boolean }) {
  // bare: the 3D alone, no 2D over it (the tiles, and v8's clay animatic for the app's player)
  const bare = !!tile || clay;
  // the frame: the wide one (18:9), or tall.ts's 9:16
  const W = tall ? TALL.w : 2160, H = tall ? TALL.h : 1080, A = W / H;
  const frame = useCurrentFrame(), t0 = frame / FPS, bReal = beatAt(t0), t = worldT(t0), b = beatAt(t), shot = camera(t0), r = root(t);
  const fz = freezeAt(bReal), frozen = !!fz;
  const ph = ((b % 1) + 1) % 1, hit = (0.5 + 0.5 * Math.cos(2 * Math.PI * ph)) ** 2, mv = moveAt(b).name, boil = Math.floor(frame / 4) % 3;
  const look = bodyAt(Math.max(0, t - 0.2), "head");   // what the watchers follow: its head a moment ago
  // ---- v7: a watcher's own shot after the film's posted: it alone, in front of a burst card in its colour, crashed in on;
  // the lens follows its head (the frog's leap took it out of a fixed frame)
  const hero = !tile ? shot.shot.hero : undefined, heroU = beatAt(t0) - shot.shot.b;
  const heroHead: V3 | null = hero ? (hero === "heron" ? heronRig(b, look).head : critterPose(hero === "deer" ? 3 : 2, t, b, look).head) : null;
  // v8 (the director 11-16: "these shots are weird framing", "they should be more on their heads"): a hero's lens comes in
  // close on its head from the shot's side, a little under it (each watcher is looking up at the screen), the head a
  // touch under the middle so its heart or "!" has room over it
  const HERO_D = { deer: 1.05, heron: 0.95, frog: 0.6 } as const;
  // (the lens stands where the head is half a beat in, and turns to follow it: locked to a head banging on the beat,
  // the whole frame swung with it)
  // (the frog: from where its head sits on the pad as the shot starts, and the lens rises with its hop, so it stays
  // on its head; v8 stills: anchored at the top of its hop, the lens looked down on the pad and lost it mid-hop)
  // (v9: the lens rises with the frog's body, how high its hop has it, not with its head: the jump clip throws the
  // head's mark 0.44 m up while the frog drawn rises 0.18, and the lens went over it and lost it for five frames)
  const frogRest0 = hero === "frog" ? critterPose(2, G(shot.shot.b), shot.shot.b, look) : null, frogRest: V3 | null = frogRest0?.head ?? null;
  // (and 30% of the head's own climb on top, so the head stays in at the top of the leap)
  const frogLift = frogRest0 ? (() => { const now = critterPose(2, t, b, look), body = now.at[1] - frogRest0.at[1]; return body + 0.3 * (now.head[1] - frogRest0.head[1] - body); })() : 0;
  const heroEye: V3 | null = heroHead && hero ? (() => { const hb = hero === "frog" ? shot.shot.b : shot.shot.b + 0.5, h0 = hero === "heron" ? heronRig(hb, look).head : critterPose(hero === "deer" ? 3 : 2, G(hb), hb, look).head;
    const d = norm(sub(shot.eye, h0)), flat = norm([d[0], 0, d[2]]), k = HERO_D[hero as keyof typeof HERO_D];
    return [h0[0] + flat[0] * k, hero === "frog" ? h0[1] + 0.05 + 0.8 * frogLift : h0[1] - 0.18 * k, h0[2] + flat[2] * k]; })() : null;
  const cam0: Cam = tile ? tileCam(tile, t, b, look) : { eye: heroEye ?? shot.eye, at: frogRest && heroHead ? [frogRest[0], frogRest[1] + 0.06 + frogLift, frogRest[2]] : heroHead ? [heroHead[0], heroHead[1] + 0.08, heroHead[2]] : shot.at, fov: shot.fov, up: upOf(shot) };
  // 9:16: the same lens turned across onto its subject (a watcher's hero shot is already on its head), taller
  const tl = tall && !tile ? tallen(cam0, shot.shot.b, ...(hero ? [0.5, 0.5] as [number, number] : pan(frame))) : null, cam: Cam = tl ?? cam0;
  const pr0 = (p: V3) => project(p, cam, A, H);
  const under = !tile && shot.under;
  // the cigarette: in its bill from the swim to the wet shake (flung off at 18.2), round the computer, and at the end;
  // its filter in the corner of the bill (on the lower half, so it rides it as it sings), drooping out to its right
  // (v9: at the second freeze it falls out of the bill (cigFall) and is gone until the end)
  const smoking = b < 18.2 || (b >= 96 && bReal < FREEZE2[0]) || b >= 131.4;   // (bReal: the held beat sits a hair under the freeze's start)
  const lip = bodyAt(t, "lip", r), cd = cigDir(t, r) ?? norm(sub(bodyAt(t, "tip", r), bodyAt(t, "jaw", r)));
  const drag = (() => { const per = b >= 96 && b < 124 ? 8 : 6, k = ((((b - (b >= 96 ? 96.5 : 0.5)) % per) + per) % per); return Math.exp(-(((k - 0.15) / 0.35) ** 2)); })();
  const ash = 0.004 + 0.022 * (((t * 0.11) % 1 + 1) % 1), S = GS / 1.7;
  const cigAt = (k: number): V3 => add(lip, cd, k * S);
  // v9: the second freeze: the world holds, but the cigarette drops out of its open bill, tumbling, slow (it's a held
  // frame), and plops into the water. From where it was in the frozen frame, on real time.
  const cigFall = (() => { const dt = t0 - G(FREEZE2[0]); if (dt < 0 || bReal >= FREEZE2[1] + 1.5) return null;
    const tf = G(FREEZE2[0]), lip0 = bodyAt(tf, "lip", root(tf)), cd0 = cigDir(tf, root(tf)) ?? norm(sub(bodyAt(tf, "tip", root(tf)), bodyAt(tf, "jaw", root(tf)))), c0 = add(lip0, cd0, 0.1 * S);
    const g = 1.3, v: V3 = [0.1 * cd0[0], 0.2, 0.1 * cd0[2]], y = c0[1] + v[1] * dt - 0.5 * g * dt * dt;
    const land = (v[1] + Math.sqrt(v[1] * v[1] + 2 * g * (c0[1] - WATER))) / g;
    const spin = 5.5 * Math.min(dt, land), cs = Math.cos(spin);
    const dir = norm([cd0[0] * cs, cd0[1] * cs - Math.sin(spin), cd0[2] * cs]);
    return { at: [c0[0] + v[0] * dt, y, c0[2] + v[2] * dt] as V3, dir, land, dt, x: c0[0] + v[0] * land, z: c0[2] + v[2] * land }; })();
  // rings on the water: one each half beat from wherever the goose has been swimming
  const rings: Ring[] = [];
  for (let k = 0; k < 6; k++) { const be = Math.floor(b * 2) / 2 - k * 0.5, te = G(be); if (te < 0 || !isWet(te)) continue; const p = root(te).p; rings.push({ x: p[0], z: p[2], age: t - te, size: 2.2, dur: 1.9 }); }
  // (v9: the rise's canned rings are gone: the pond's waves are simulated now, waves.ts)
  if (b >= CUE.dive && b < CUE.dive + 3.5) for (let k = 0; k < 3; k++) rings.push({ x: SPLASH[0], z: SPLASH[2], age: t - G(CUE.dive + k * 0.45), size: 3.6, dur: 2.2 });
  if (cigFall && cigFall.dt >= cigFall.land) rings.push({ x: cigFall.x, z: cigFall.z, age: cigFall.dt - cigFall.land, size: 0.6, dur: 1.2 });
  const magicOn = b >= CUE.light - 0.4 && b < CUE.app + 1 ? sm((b - CUE.light) / 2.6) * (1 - sm((b - CUE.boot + 0.6) / 3)) : 0;
  const keysMagic = sm((b - CUE.keys + 0.3) / 0.5) * (1 - sm((b - 74.0) / 0.6));
  const card = sm((b - 132.2) / 0.5), stamp = b >= KICK.hit;
  const pr = (p: V3) => project(p, cam, A, H);
  const headP = pr(bodyAt(t, "head", r));
  // ---- the "DUCK?" freeze: a crash in on its face with speed lines, then the frame holds on a card, intro style
  const zIn = bReal >= 115.45 && bReal < FREEZE2[0] ? [115.45, FREEZE2[0]] : [63.62, FREEZE[0]];   // v9: the second one's crash in
  const zoomU = clamp((bReal - zIn[0]) / (zIn[1] - zIn[0])), zooming = !tile && bReal >= zIn[0] && bReal < zIn[1];
  const freezeCard = !tile && frozen ? (() => { const hd = bodyAt(t, "head", r), dist = Math.hypot(...sub(hd, cam.eye)) + 0.9, c = cardAt(cam, 0.5, 0.5, dist, 0, A), grow = (fz![0] === FREEZE2[0] ? 1 : sm((bReal - fz![0]) / 0.12)) * (1 + 0.06 * Math.sin(Math.min(1, (bReal - fz![0]) / 0.25) * Math.PI));   // (v9: the second card is there at once: grown in, it flashed the plain sky behind it, light then dark)
    return { ...c, s: Math.max(0.001, c.frameH * 1.25 * grow) }; })() : null;
  const heroCard = hero && heroHead ? (() => { const dist = Math.hypot(...sub(heroHead, cam.eye)) + 1.4, c = cardAt(cam, 0.5, 0.5, dist, 0, A), grow = sm(heroU / 0.1) * (1 + 0.06 * Math.sin(Math.min(1, heroU / 0.25) * Math.PI));
    return { ...c, s: Math.max(0.001, c.frameH * 1.25 * grow), src: `${tall ? "likes-9x16" : "likes"}/${hero}/f${String(frame).padStart(5, "0")}.png` }; })() : null;
  const heroP = heroHead ? pr0(heroHead) : null;
  // ---- the cutaway's tiles: drawn from their own renders (compositions film.tsx#tile-frog, #tile-heron)
  const tiles = !tile && bReal >= TILES[0] && bReal < TILES[1];
  // ---- the rig at the stomps, and the app's cursor picking the goose up at the slide
  const rigOn0 = !bare && shot.shot.b === 39.6 ? sm((bReal - 39.7) / 0.25) * (1 - sm((bReal - 41.75) / 0.15)) : 0;
  // v8: and whenever the lens is under the water, over the clay and wireframe goose
  const rigOn = rigOn0, rig = rigOn > 0 ? rigAt(t, r) : null;
  const grabShot = !bare && shot.shot.b === 55.9, grabOn = grabShot ? sm((bReal - 56.15) / 0.2) * (1 - sm((bReal - 59.4) / 0.1)) : 0;
  const lifting = LIFTS.slice(0, 2).find((l) => b >= l.up - 0.15 && b < l.down + 0.2);
  // the goose's box on the frame, now: its head, back and feet, padded
  const box = (() => { let x0 = 9, y0 = 9, x1 = -9, y1 = -9; for (const [p, e] of [[bodyAt(t, "head", r), 0.2], [bodyAt(t, "tip", r), 0.06], [bodyAt(t, "back", r), 0.62], [r.p, 0.22]] as [V3, number][])
    for (const o of [[0, 0, 0], [e, 0, 0], [-e, 0, 0], [0, 0, e], [0, 0, -e], [0, e, 0]] as V3[]) { const q = pr(add(p, o)); if (!q) continue; x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); }
    return x1 < x0 ? null : [x0, y0, x1, y1]; })();
  // where its box was a frame ago, through this frame's lens (for the speed lines: how fast it crosses the frame)
  const airborne = mv === "fly" || mv === "dive" || (mv === "enter" && b > CUE.enter + 0.18) || (mv === "stamp" && b >= KICK.from && b < KICK.back);
  const prevBox = airborne ? (() => { const tq = t - 1 / FPS, rq = root(tq); let x0 = 9, y0 = 9, x1 = -9, y1 = -9; for (const [p, e] of [[bodyAt(tq, "head", rq), 0.2], [bodyAt(tq, "back", rq), 0.62], [rq.p, 0.22]] as [V3, number][])
    for (const o of [[0, 0, 0], [e, 0, 0], [-e, 0, 0], [0, e, 0]] as V3[]) { const q = pr(add(p, o)); if (!q) continue; x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); }
    return x1 < x0 ? null : [x0, y0, x1, y1] as number[]; })() : null;
  return (
    <AbsoluteFill style={{ background: under ? "#1d7b8a" : "#3896d4" }}>
      <Camera3d transform={Transform.fromXyz(...cam.eye).lookingAt(cam.at, cam.up)} projection={{ Perspective: { fov: (cam.fov * Math.PI) / 180, far: 900 } }}>
        {under && <Fog color={UNDER_FOG.color} near={UNDER_FOG.near} far={UNDER_FOG.far} />}
      </Camera3d>
      {heroCard && <Critters t={t} b={b} look={look} hop={0.2} only={hero === "heron" ? "heron" : hero === "deer" ? 3 : 2} />}
      {heroCard && !tall && <ImagePlane name="hero-card" src={staticFile(heroCard.src)} width={2} height={1} position={heroCard.p} quaternion={heroCard.q} scale={[heroCard.s, heroCard.s, 1]} pass="ui" shadow={false} />}
      {/* 9:16: the card as a flat page standing behind the watcher, turned to the lens (an <Img> waits for its picture;
          the ImagePlane's, new every frame, came out missing in the tall stills), grown in as the wide one is */}
      {heroCard && tall && (() => { const yaw = Math.atan2(cam.eye[0] - heroCard.p[0], cam.eye[2] - heroCard.p[2]), s = (heroCard.s / 1.25) * 1.2;   // (a fifth over the frame: the lens looks up at the head, and a card turned only across shows its edges unless it's bigger than the frame; screens.tsx lays the tall card's words out for that)
        // (a unit card grown by its scale: a Screen's size is fixed at the frame it first appears, and this one grows in from nothing)
        return <Screen name="hero-card" crt={false} resolution={[W, H]} size={[A, 1]} scale={[s, s, 1]} position={heroCard.p} rotation={[0, yaw, 0]} background="#3896d4" pass="ui">
          <Img src={staticFile(heroCard.src)} style={{ position: "absolute", left: 0, top: 0, width: W, height: H }} /></Screen>; })()}
      {!(freezeCard || heroCard) && <>
      {under ? <Under t={t} eye={cam.eye} goose={r.p} /> : <World2 t={t} wind={0.1 + 0.25 * rise(b).shake / 4 + (mv === "fly" ? 0.08 : 0)} rings={rings} motes={magicOn} waves={t >= WAVE_SPAN[0]} />}
      <Machine t={t} b={b} eye={cam.eye} page={tall} />
      <Critters t={t} b={b} look={look} hop={b >= 20 && b < 72 ? 1 : 0.2} jump={b >= CUE.boil && b < CUE.boil + 6 ? sm((b - CUE.boil) / 1) * (1 - sm((b - CUE.boil - 5) / 1)) : 0} />
      <Magic on={Math.max(magicOn, keysMagic * 0.8)} spin={b * 0.06} pulse={hit * Math.max(magicOn, keysMagic)} />
      {/* footprints in the mud where it has stepped (steps.json from the bake); the stomps leave deep ones */}
      {(steps.prints as { f: number; foot: string; x: number; z: number; yaw: number; stomp?: number }[]).filter((p) => p.f <= frame && frame - p.f < 900 && ground(p.x, p.z) === 1).map((p, i) => (
        <ImagePlane key={`print-${i}`} name={`print-${i}`} src={staticFile("fx/foot.png")} width={p.stomp ? 0.42 : 0.3} height={p.stomp ? 0.42 : 0.3} position={[p.x, 0.012 + 0.0004 * (i % 9), p.z]} rotation={[-Math.PI / 2, 0, p.yaw]} shadow={false} />
      ))}
      {/* splashes: the monitor breaking the pond, the goose diving in off ENTER, climbing out */}
      {[0, 1, 2, 3].map((k) => <Splash key={`ms-${k}`} name={`mon-splash-${k}`} at={[MON.c[0] + (k - 1.5) * 2.6, WATER, MON.c[2] + 2.2]} age={(b - CUE.boil - 0.2 - k * 0.6) * BEAT} size={4.5} eye={cam.eye} dur={1.3} />)}
      {!under && <Splash name="dive-splash" at={[SPLASH[0], WATER, SPLASH[2]]} age={(b - CUE.dive) * BEAT} size={2.9} eye={cam.eye} dur={0.9} />}
      <Splash name="climb-splash" at={[0, WATER, -6.3]} age={(b - 12.6) * BEAT} size={1.2} eye={cam.eye} dur={0.7} />
      <Splash name="climb-splash-2" at={[0, WATER, -6.3]} age={(b - 127.0) * BEAT} size={1.2} eye={cam.eye} dur={0.7} />
      </>}
      {/* the wet shake: drops flung off it, streaks along their flight */}
      {b >= 17.6 && b < 19.6 && <Instances name="drops" pass="hero" shadow={false} at={Array.from({ length: 36 }, (_, i) => { const tq = G(17.7 + (i / 36) * 1.4), u = t - tq, a = rnd(i) * Math.PI * 2, v = 1.6 + 1.6 * rnd(i * 3), vy = 1.2 + 1.8 * rnd(i * 5), c = bodyAt(tq, "back");
        const y = c[1] + vy * u - 4.9 * u * u, vx = Math.cos(a) * v, vz = Math.sin(a) * v, vyy = vy - 9.8 * u, hide = u < 0 || y < 0;
        return { position: [c[0] + vx * u, Math.max(-1, y), c[2] + vz * u] as V3, rotation: [Math.atan2(-vyy, Math.hypot(vx, vz) * Math.sign(vz || 1)), Math.asin(clamp(vx / (Math.hypot(vx, vyy, vz) || 1), -1, 1)), 0] as V3, scale: (hide ? [0.001, 0.001, 0.001] : [0.6, 0.6, 2.4]) as V3 }; })}>
        <Sphere radius={0.016} /><StandardMaterial base_color="#e8f6ff" unlit /></Instances>}
      {/* v9: the cigarette falling out of its bill at the second freeze */}
      {cigFall && cigFall.dt < cigFall.land && !heroCard && (() => { const c = cigFall, at = (k: number): V3 => add(c.at, c.dir, (k - 0.1) * S);
        return <>
          <Mesh3d name="cig-filter" allowOverlap pass="hero" transform={Transform.fromXyz(...at(0.022)).withRotation(along(c.dir))}><Cylinder radius={0.0125 * S} half_height={0.024 * S} /><StandardMaterial base_color="#d9a35a" unlit /></Mesh3d>
          <Mesh3d name="cig" allowOverlap pass="hero" transform={Transform.fromXyz(...at(0.106)).withRotation(along(c.dir))}><Cylinder radius={0.012 * S} half_height={0.06 * S} /><StandardMaterial base_color="#fbf7ee" unlit /></Mesh3d>
          <Mesh3d name="cig-ember" allowOverlap transform={Transform.fromXyz(...at(0.172)).withRotation(along(c.dir))}><Cylinder radius={0.0122 * S} half_height={0.006 * S} /><StandardMaterial base_color="#ff5a1f" unlit /></Mesh3d>
        </>; })()}
      {/* the cigarette it flings away in the shake */}
      {b >= 18.2 && b < 19.4 && (() => { const tq = G(18.2), u = t - tq, p0 = bodyAt(tq, "tip"); const p: V3 = [p0[0] + 1.6 * u, p0[1] + 2.2 * u - 4.9 * u * u, p0[2] + 0.5 * u];
        return p[1] > 0.02 ? <Mesh3d name="cig-flung" allowOverlap pass="hero" transform={Transform.fromXyz(...p).withRotation(Quat.fromAxisAngle([0, 0, 1], u * 14))}><Cylinder radius={0.012} half_height={0.09} /><StandardMaterial base_color="#fbf7ee" unlit /></Mesh3d> : null; })()}
      {/* under the water: bubbles off it as it kicks, a burst where it went in */}
      {under && <Instances name="bubbles" pass="hero" shadow={false} at={Array.from({ length: 70 }, (_, i) => {
        const burst = i < 30, per = burst ? 0 : 0.07, te = burst ? G(CUE.dive) + rnd(i) * 0.25 : G(Math.floor((b - rnd(i) * 3) / 0.1) * 0.1) - (i % 7) * per, age = t - te;
        const o = burst ? [SPLASH[0] + (rnd(i * 3) - 0.5) * 0.8, SPLASH[2] + (rnd(i * 5) - 0.5) * 0.8] : (() => { const p = root(Math.max(0, te)).p; return [p[0] + (rnd(i * 7) - 0.5) * 0.4, p[2] + (rnd(i * 9) - 0.5) * 0.4]; })();
        const y = (burst ? WATER - 0.7 * rnd(i + 2) : SWIM_LOW) + age * (0.45 + 0.3 * rnd(i + 11));
        const s = (burst ? 0.6 + rnd(i) * 1.4 : 0.4 + rnd(i) * 0.7) * (age < 0 || y > WATER - 0.02 || age > 3 ? 0.001 : 1);
        return { position: [o[0] + 0.05 * Math.sin(age * 9 + i), y, o[1] + 0.05 * Math.cos(age * 7 + i)] as V3, scale: s }; })}>
        <Sphere radius={0.03} /><StandardMaterial base_color="#e6fbff" unlit /></Instances>}
      {!clay && !under && t >= WAVE_SPAN[0] && t <= WAVE_SPAN[1] && <WavePass t={t} eye={cam.eye} at={cam.at} up={cam.up} fov={cam.fov} aspect={A} />}
      {!clay && <FramePass wesl={STICKER} prepass={{ depth: true, normal: true }} uniforms={stickerUniforms(SUN, tall ? { ink: (3.6 * 1.15 * 1080) / H, halo: (4.6 * 1.15 * 1080) / H } : {})} />}
      {under && <SurfaceWindow t={t} eye={cam.eye} at={cam.at} up={cam.up} fov={cam.fov} aspect={A} goose={r.p} splash={[SPLASH[0], SPLASH[2], (b - CUE.dive) * BEAT]} />}
      {(() => { const d = lensDrops(t), q = d.kick ? pr(KICK.at) : null;   // v7: water on the lens, only over the surface (plan.ts lensDrops)
        const at: [number, number] = q ? [Math.max(0.3, Math.min(0.7, q.x)), Math.max(0.3, Math.min(0.7, q.y))] : [0.5, 0.5];
        return clay ? null : <LensDrops amount={under ? 0 : d.amount} age={d.age} spread={d.spread} seed={d.seed} at={at} reach={d.kick ? 0.42 : 0} drip={d.drip} aspect={A} />; })()}
      {/* v8 (the director 11-16: "when we go under we see the goose body below the water as a clay wireframe and gizmos"):
          under the surface, the goose as a model being made (blender/goose_build.py: a clay copy with a wireframe over
          it, on the same rig and action), its rig drawn over it */}
      {!heroCard && <Model name="goose" pass="hero" flat src={staticFile("glb/goose.glb")} position={r.p} rotation={eulerOf(r)} scale={r.s} graph={{ blend: [{ clip: "show", time: t, weight: 1 }] }} />}
      {smoking && !heroCard && (
        <>
          <Mesh3d name="cig-filter" allowOverlap pass="hero" transform={Transform.fromXyz(...cigAt(0.022)).withRotation(along(cd))}><Cylinder radius={0.0125 * S} half_height={0.024 * S} /><StandardMaterial base_color="#e2a04a" unlit /></Mesh3d>
          <Mesh3d name="cig" allowOverlap pass="hero" transform={Transform.fromXyz(...cigAt(0.046 + 0.06)).withRotation(along(cd))}><Cylinder radius={0.012 * S} half_height={0.06 * S} /><StandardMaterial base_color="#fbf7ee" unlit /></Mesh3d>
          <Mesh3d name="cig-ash" allowOverlap pass="hero" transform={Transform.fromXyz(...cigAt(0.166 + ash / 2)).withRotation(along(cd))}><Cylinder radius={0.0118 * S} half_height={(ash / 2) * S} /><StandardMaterial base_color="#9a968e" unlit /></Mesh3d>
          <Mesh3d name="cig-ember" allowOverlap transform={Transform.fromXyz(...cigAt(0.168 + ash)).withRotation(along(cd))}><Cylinder radius={0.0122 * S * (1 + 0.15 * drag)} half_height={0.006 * S} /><StandardMaterial base_color={drag > 0.3 ? "#ffd24a" : "#ff5a1f"} emissive={drag > 0.3 ? "#ffb000" : "#ff3b00"} unlit /></Mesh3d>
          {/* the ash let go: each time it's grown long it drops off and falls */}
          {(() => { const k = (((t * 0.11) % 1) + 1) % 1, since = k / 0.11; if (since > 0.6) return null; const p0 = add(cigAt(0.18), [0, -4.9 * since * since, 0]);
            return p0[1] > WATER ? <Mesh3d name="ash-drop" allowOverlap pass="hero" transform={Transform.fromXyz(...p0).withRotation(Quat.fromAxisAngle([1, 0, 0], since * 9))}><Cylinder radius={0.011 * S} half_height={0.012 * S} /><StandardMaterial base_color="#a8a49b" unlit /></Mesh3d> : null; })()}
          {/* smoke, drawn: a wisp off the tip, puffs let go on the half beat that swell and thin as they rise; after each
              drag a bigger cloud let out of the bill (fx/wisp.png, fx/smoke.png), each a card turned to the lens */}
          {(() => { const e = cigAt(0.19), yaw = Math.atan2(cam.eye[0] - e[0], cam.eye[2] - e[2]);
            return <ImagePlane name="wisp" src={staticFile("fx/wisp.png")} grid={[4, 4]} frame={Math.floor(t * 12) % 16} width={0.3} height={0.3} pass="ui" shadow={false} position={[e[0], e[1] + 0.15, e[2]]} rotation={[0, yaw, 0]} />; })()}
          {Array.from({ length: 4 }, (_, k) => { const age = ((((b * 2 + k * 1.75) % 7) + 7) % 7) / 2, e = cigAt(0.19); if (age > 2.6) return null;
            const c: V3 = [e[0] + age * 0.12 + 0.05 * Math.sin(age * 3 + k), e[1] + 0.1 + age * 0.17, e[2] + 0.05 * Math.cos(age * 2.5 + k)];
            return <ImagePlane key={`puff-${k}`} name={`puff-${k}`} src={staticFile("fx/smoke.png")} grid={[4, 4]} frame={Math.min(15, Math.floor((age / 2.6) * 16))} width={0.42} height={0.42} pass="ui" shadow={false} position={c} rotation={[0, Math.atan2(cam.eye[0] - c[0], cam.eye[2] - c[2]), 0]} />; })}
          {(() => { const per = b >= 96 && b < 124 ? 8 : 6, since = ((((b - (b >= 96 ? 96.5 : 0.5) - 0.9) % per) + per) % per) * BEAT; if (since > 2.2) return null;
            const tip = bodyAt(t, "tip", r), bill = norm(sub(tip, bodyAt(t, "jaw", r))), c: V3 = add(add(tip, bill, 0.12 + since * 0.3), [0, 1, 0], -0.05 + since * 0.16);
            return <ImagePlane name="exhale" src={staticFile("fx/smoke.png")} grid={[4, 4]} frame={Math.min(15, Math.floor((since / 2.2) * 16))} width={0.5} height={0.5} pass="ui" shadow={false} position={c} rotation={[0, Math.atan2(cam.eye[0] - c[0], cam.eye[2] - c[2]), 0]} />; })()}
        </>
      )}
      {clay && <FramePass wesl={CLAY} prepass={{ depth: true, normal: true }} />}
      {/* the freeze's card, behind it: pinks in a burst, standing in the world so the goose stays in front */}
      {freezeCard && <ImagePlane name="duck-card" src={staticFile(fz && fz[0] === FREEZE2[0] ? "fx/duckcard-water.png" : "fx/duckcard.png")} width={2} height={1} position={freezeCard.p} quaternion={freezeCard.q} scale={[freezeCard.s, freezeCard.s, 1]} pass="ui" shadow={false} />}
      {/* the title, behind it as it climbs out: the same painted cards, standing just behind the goose */}
      {!bare && titleCues(bReal).map(({ c, k }) => { const [sw, sh] = (inkSizes as Record<string, number[]>)[c.n], d = Math.hypot(...sub(r.p, cam.eye)) + (c.behind ? 2.5 : 0.7), off = sm((c.to - bReal) / 0.25) * (c.behind ? 0.2 + 0.8 * sm((bReal - c.from) / 0.12) : 1), pulse = 1 + (c.pulse ?? 0) * 0.07 * hit;
        const tc = tall ? tallCue(c, k) : { x: c.x, y: c.y, h: c.h, wmax: 0.94 }, cd2 = cardAt(cam, tc.x, tc.y, d, c.rot ?? 0, A), h = tc.h * cd2.frameH * pulse * (0.6 + 0.4 * off), w = (h * sw) / sh, fit = Math.min(1, (cd2.frameH * A * tc.wmax) / w);
        return off > 0.03 ? <ImagePlane key={`title-${k}-${boil}`} name={`title3d-${k}`} src={staticFile(`ink/${c.n}-${boil}.png`)} width={1} height={1} position={cd2.p} quaternion={cd2.q} scale={[Math.max(0.001, w * fit), Math.max(0.001, h * fit), 1]} pass="ui" shadow={false} /> : null; })}
      {!bare && <Ink t={t0} b={bReal} frame={frame} head={headP ? [headP.x, headP.y] : null} tall={tall} />}
      {/* v7: the orbit's lens through the surface. A lens can't sit half in the water, and in the few frames it is just
          under, the goose (drawn over the window) showed whole and side-on in the murk: so as it goes through, the frame
          is washed over with water and foam, a bright waterline sweeping across it (up the frame going in, down coming
          out), clear again 20 cm either side of the surface */}
      {!bare && shot.shot.orbit && (() => { const o = shot.shot.orbit, h = orbitH(o, (bReal - shot.shot.b) / (o.beats ?? 2.5)) - WATER, d = h / 0.2; if (Math.abs(d) >= 1) return null;
        const cover = 1 - sm((Math.abs(d) - 0.3) / 0.7), y = ((d + 1) / 2) * H;
        return <>
          {/* one even teal, a soft line and faint bubbles: a lighter top, a white line and bright rings swung light and
              dark too often in that second and failed raea check's flash test (WCAG 2.3.1) */}
          <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, opacity: cover, background: "linear-gradient(180deg, #2f8f9c 0%, #27858f 50%, #1d7b8a 100%)" }} />
          <div style={{ position: "absolute", left: 0, top: y - 160, width: W, height: 320, opacity: 0.45 * cover, background: "linear-gradient(180deg, rgba(120,200,215,0) 0%, rgba(150,215,225,0.6) 50%, rgba(120,200,215,0) 100%)" }} />
          {Array.from({ length: 26 }, (_, i) => { const r = (k: number) => (Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1, rr = (k: number) => Math.abs(r(k));
            const x = rr(1) * W, yy = y + (rr(2) - 0.5) * 520 - (1 - Math.abs(d)) * 140 * rr(3), sz = 10 + 46 * rr(4) ** 2;
            return <div key={i} style={{ position: "absolute", left: x - sz / 2, top: yy - sz / 2, width: sz, height: sz, borderRadius: "50%", opacity: cover, border: "3px solid rgba(190,235,240,0.4)", background: "rgba(190,235,240,0.08)" }} />; })}
        </>; })()}
      {/* 9:16: the watcher's likes and the video's views, a row low over the picture (likes.tsx) */}
      {tall && heroCard && <LikesRow frame={frame} on={sm(heroU / 0.12)} />}
      {/* v7: the watcher's crash-in: speed lines rushing in on its face as its shot cuts in */}
      {heroP && heroU < 0.3 && (() => { const zh = H * 1.3, zw = Math.max(W * 1.3, 2 * zh); return <img src={staticFile(`fx/zoom-${boil}.png`)} style={{ position: "absolute", left: heroP.x * W - zw / 2, top: heroP.y * H - zh / 2, width: zw, height: zh, opacity: 1 - heroU / 0.3 }} />; })()}
      {/* v7: speed lines behind it as it's thrown key to key, off ENTER and at the lens (the director 11-16: "woosh lines to make
          it feel like this goose is wacky and fast") */}
      {!bare && !heroCard && box && <SpeedLines box={box} prev={prevBox} boil={boil} W={W} H={H} />}
      {/* the crash zoom's speed lines, rushing in on its face */}
      {zooming && headP && (() => { const zs = 1.1 + 0.5 * zoomU, zh = H * zs, zw = Math.max(W * zs, 2 * zh); return <img src={staticFile(`fx/zoom-${zIn[1] === FREEZE2[0] ? 0 : boil}.png`)} style={{ position: "absolute", left: headP.x * W - zw / 2, top: headP.y * H - zh / 2, width: zw, height: zh, opacity: 0.4 + 0.6 * zoomU }} />; })()}
      {/* the crown, drawn over the title and floating above its head, from "MAYOR": its base a hand clear of the highest
          of the crown of its head and its bill tip, so it never covers either (the director 11-16: "above the head not over it") */}
      {!bare && b >= 68.9 && b < 71.6 && (() => { const hc = bodyAt(t, "head", r), crownOf = pr(add(hc, [0, 0.1 * GS / 1.7, 0])), tip = pr(bodyAt(t, "tip", r)), head = pr(hc); if (!crownOf || !head) return null;
        const wpx = Math.max(140, 0.42 * crownOf.px), pop = sm((b - 68.9) / 0.18) * (1 + 0.15 * Math.sin(Math.min(1, (b - 68.9) / 0.3) * Math.PI)) * (1 - sm((b - 71.35) / 0.25)), bob = 1 + 0.05 * hit;
        const base = Math.min(crownOf.y, tip ? tip.y : 9) * H - 0.07 * crownOf.px, tilt = Math.max(-12, Math.min(12, Math.atan2(crownOf.x * W - head.x * W, head.y * H - crownOf.y * H) * 57));
        return <img src={staticFile(`ink/crown-${boil}.png`)} style={{ position: "absolute", left: crownOf.x * W - wpx / 2, top: base - wpx * 0.687, width: wpx, height: wpx * 0.687, transform: `rotate(${tilt - 4}deg) scale(${pop * bob})`, transformOrigin: "50% 100%" }} />; })()}
      {/* the watchers' marks: a "!" when something startles them, a heart when they love it */}
      {!bare && [...CRITTERS.map((_, k) => critterPose(k, t, b, look)), (() => { const h = heronRig(b, look); return { head: [h.head[0], h.head[1] + 0.06, h.head[2]] as V3, emote: h.emote }; })()].map((p, k) => {
        if (!p.emote || p.emote.u < 0 || p.emote.u >= 1) return null; const q = pr(add(p.head, [0, 0.22, 0])); if (!q) return null;
        const hpx = Math.min(220, Math.max(70, 0.32 * q.px)), pop = sm(p.emote.u / 0.1) * (1 + 0.2 * Math.sin(Math.min(1, p.emote.u / 0.18) * Math.PI)) * (1 - sm((p.emote.u - 0.85) / 0.15)), n = p.emote.n, [sw, sh] = (inkSizes as Record<string, number[]>)[n];
        return <img key={`emote-${k}`} src={staticFile(`ink/${n}-${boil}.png`)} style={{ position: "absolute", left: q.x * W - (hpx * sw) / sh / 2, top: q.y * H - hpx, width: (hpx * sw) / sh, height: hpx, transform: `scale(${pop}) rotate(${(k % 2 ? 6 : -6) + 4 * Math.sin(b * 6)}deg)`, transformOrigin: "50% 100%" }} />; })}
      {/* the rig at the stomps: the bones and joints as the app shows them, the lifted foot selected with its gizmo,
          the app's cursor dragging it, its path dotted */}
      {rig && <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, opacity: rigOn }}>
        {BONES.map(([a, c], i) => { const p = pr(rig[a]), q = pr(rig[c]); return p && q ? <Line key={`bone-${i}`} a={[p.x, p.y]} b={[q.x, q.y]} color={ACC} w={5} W={W} H={H} /> : null; })}
        {Object.entries(rig).filter(([n]) => !n.endsWith("Nub") && n !== "Bone02").map(([n, v]) => { const p = pr(v); return p ? <Dot key={`j-${n}`} p={[p.x, p.y]} r={10} fill="#ffffff" ring={ACC} rw={4} W={W} H={H} /> : null; })}
        {lifting && (() => { const n = `Bip01_${lifting.foot}_Foot`, f = rig[n], p = pr(f); if (!p) return null;
          const path = Array.from({ length: 16 }, (_, k) => { const tb = lifting.up + ((lifting.down - lifting.up) * k) / 15, rr = rigAt(G(tb)); return rr ? pr(rr[n]) : null; }).filter(Boolean) as NonNullable<ReturnType<typeof pr>>[];
          const yTip = pr(add(f, [0, 0.16, 0]));
          return <>
            {path.slice(1).map((q, k) => <Line key={`path-${k}`} a={[path[k].x, path[k].y]} b={[q.x, q.y]} color={ACC} w={4} dotted W={W} H={H} />)}
            <Dot p={[p.x, p.y]} r={14} fill={ACC} rw={4} W={W} H={H} />
            <Chip p={[p.x + 0.012 * 2160 / W, p.y - 0.02 * 1080 / H]} text={`${lifting.foot}_Foot`} W={W} H={H} />
            <Gizmo o={f} c={cam} len={0.16} on={1} W={W} H={H} />
            {yTip && <img src={staticFile("fx/grab.png")} style={{ position: "absolute", left: yTip.x * W - 10, top: yTip.y * H - 14, width: 46, height: 46 }} />}
          </>; })()}
        {/* v8: under the water, the root selected with its move gizmo and its name, as the app shows a rig being worked on */}
      </div>}
      {/* the slide: the app's cursor comes in, the goose lights up under it (hover ring, its name), it's clicked
          (selected, the gizmo), grabbed by the handle and slid right, the path dotted behind */}
      {grabOn > 0 && box && (() => { const sel = bReal >= 57.6, drag = bReal >= 57.95 && bReal < 59.45, handle = pr(r.p); if (!handle) return null;
        const start = pr(root(G(57.95)).p), come = sm((bReal - 56.2) / 1.3), cur: [number, number] = bReal < 57.6 ? [lerp2(0.92, handle.x + 0.012, come), lerp2(0.82, handle.y + 0.01, come)] : [handle.x - 0.004, handle.y - 0.004];
        return <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, opacity: grabOn }}>
          <div style={{ position: "absolute", left: box[0] * W, top: box[1] * H, width: (box[2] - box[0]) * W, height: (box[3] - box[1]) * H, border: sel ? `4px solid ${ACC}` : `2px solid rgba(140,156,251,0.7)`, borderRadius: 5, boxSizing: "border-box" }} />
          <Chip p={[box[0], box[1]]} text="goose" W={W} H={H} />
          {sel && start && bReal >= 57.95 && <Line a={[start.x, start.y]} b={[handle.x, handle.y]} color={ACC} w={4} dotted W={W} H={H} />}
          {sel && <Gizmo o={r.p} c={cam} len={0.55} on={1} W={W} H={H} />}
          <img src={staticFile(drag || (sel && bReal < 57.95) ? "fx/grab.png" : "fx/cursor.png")} style={{ position: "absolute", left: cur[0] * W - 8, top: cur[1] * H - 6, width: drag ? 50 : 40, height: drag ? 50 : 54 }} />
        </div>; })()}
      {/* the cutaway: the frog and the heron, side by side, each in its own tile sliding in */}
      {tiles && tall && (() => { const f = frame, inU = sm((bReal - TILES[0]) / 0.3), th = (H - 16) / 2, src = (w: string) => staticFile(`tiles/${w}/f${String(f).padStart(5, "0")}.png`);
        // 9:16: the two tiles one over the other, the frog's from the left, the heron's from the right; each tile's own
        // square render (1072 x 1080) set 1080 across and cut to the slot's height about its middle
        const slot = (w: string, top: number, from: number) => <div style={{ position: "absolute", left: from * W * (1 - inU), top, width: W, height: th, overflow: "hidden" }}>
          <img src={src(w)} style={{ position: "absolute", left: 0, top: (th - (W * 1080) / 1072) / 2, width: W, height: (W * 1080) / 1072 }} /></div>;
        return <>
        <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, background: "#fff6e4" }} />
        {slot("frog", 0, -1)}{slot("heron", th + 16, 1)}
      </>; })()}
      {tiles && !tall && (() => { const f = frame, inU = sm((bReal - TILES[0]) / 0.3); return <>
        <div style={{ position: "absolute", left: 0, top: 0, width: 2160, height: 1080, background: "#fff6e4" }} />
        <img src={staticFile(`tiles/frog/f${String(f).padStart(5, "0")}.png`)} style={{ position: "absolute", left: -1072 * (1 - inU), top: 0, width: 1072, height: 1080 }} />
        <img src={staticFile(`tiles/heron/f${String(f).padStart(5, "0")}.png`)} style={{ position: "absolute", left: 1088 + 1072 * (1 - inU), top: 0, width: 1072, height: 1080 }} />
      </>; })()}
      {/* made in raea: the mark as a sticker over the opening aerial */}
      {!bare && b < 4.4 && (() => { const on = sm(b / 0.5) * (1 - sm((b - 3.9) / 0.5)), bounce = 1 + 0.06 * Math.sin(Math.min(1, b / 0.7) * Math.PI) * (1 - Math.min(1, b / 0.7));
        return <div style={{ position: "absolute", left: tall ? SAFE.left : 0, right: tall ? SAFE.right : 0, top: tall ? 640 : 300, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, opacity: on, transform: `scale(${bounce}) rotate(-2deg)` }}>
          <img src={staticFile("ink/made-0.png")} style={{ height: 120, marginRight: 260 }} /><img src={staticFile("logo/raea-sticker.png")} style={{ width: 760 }} /></div>; })()}
      {/* the stamp: the muddy foot comes down on the lens and stays, through the card */}
      {!bare && stamp && (() => { const q = pr(KICK.at), x = q ? Math.max(0.3, Math.min(0.7, q.x)) * W : W / 2, y = q ? Math.max(0.3, Math.min(0.7, q.y)) * H : (580 * H) / 1080;   // v7: where its own foot met the glass
        return <img src={staticFile("fx/stamp.png")} style={{ position: "absolute", left: x - 480, top: y - 480, width: 960, height: 960, transform: `scale(${1 + 0.3 * (1 - sm((b - KICK.hit) / 0.2))}) rotate(-12deg)`, opacity: 0.94 }} />; })()}
      {labels && <div style={{ position: "absolute", left: 28, bottom: 40, color: "#fff", font: "600 26px/1.2 Inter, sans-serif", textShadow: "0 2px 0 #0008" }}>{shot.i + 1} · {shot.shot.name} · {mv} · beat {bReal.toFixed(1)} · {t0.toFixed(2)} s</div>}
      {!bare && card > 0 && (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: card, background: "#3896d4" }}>
          <img src={staticFile("logo/raea-sticker.png")} style={{ width: tall ? 800 : 860, marginRight: tall ? SAFE.right - SAFE.left : 0, transform: `scale(${0.9 + 0.1 * card})` }} />
        </AbsoluteFill>
      )}
      {/* (v6's fade through black at frame 1128 is out: the director 11-16, "remove this fade to black, makes no sense") */}
      {!bare && <Audio src={staticFile("music/swamp-side-mayor-90.wav")} />}
    </AbsoluteFill>
  );
}
const lerp2 = (a: number, b: number, u: number) => a + (b - a) * u;
/** anime speed lines behind a thing thrown across the frame: thin cream streaks off its trailing side, along the way it
 * moves, longer the faster it goes, redrawn on the 4-frame boil like the lettering. `box` now and a frame ago (0..1) */
function SpeedLines({ box, prev, boil, W = 2160, H = 1080 }: { box: number[]; prev: number[] | null; boil: number; W?: number; H?: number }) {
  if (!prev) return null;
  const cx = (box[0] + box[2]) / 2 * W, cy = (box[1] + box[3]) / 2 * H, vx = cx - (prev[0] + prev[2]) / 2 * W, vy = cy - (prev[1] + prev[3]) / 2 * H, sp = Math.hypot(vx, vy);
  if (sp < 14) return null;
  const on = Math.min(1, (sp - 14) / 16), ux = vx / sp, uy = vy / sp, nx = -uy, ny = ux, w = (box[2] - box[0]) * W, h = (box[3] - box[1]) * H, R = 0.5 * Math.hypot(w * ux, h * uy) + 10, span = 0.5 * Math.hypot(w * nx, h * ny);
  return <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, opacity: 0.9 * on }}>
    {Array.from({ length: 7 }, (_, i) => { const k = (i + 0.5) / 7 - 0.5, j = rnd(i * 7 + boil * 13), L = Math.min(380, sp * (3 + 3 * j)) * (1 - 1.2 * k * k), off = R + 14 + 40 * rnd(i * 3 + boil * 5);
      const x0 = cx - ux * off + nx * k * span * 1.5, y0 = cy - uy * off + ny * k * span * 1.5;
      return <div key={i} style={{ position: "absolute", left: x0 - L, top: y0 - 3, width: L, height: 6 - 3 * Math.abs(k), borderRadius: 4, background: "linear-gradient(90deg, rgba(255,250,236,0), rgba(255,250,236,0.95))", boxShadow: "0 0 0 2px rgba(38,48,74,0.35)", transform: `rotate(${(Math.atan2(uy, ux) * 180) / Math.PI}deg)`, transformOrigin: "100% 50%" }} />; })}
  </div>;
}
const SWIM_LOW = WATER - 0.55;
void CUES;
/** The swamp above the water from one of plan.ts's PANOS, one 90-degree face a frame (five a pano: four sides and
 * straight up), for the view up through the surface; tools/dome.py folds them into a dome. No goose: it is in the water. */
function Pano() {
  const frame = useCurrentFrame(), k = Math.min(PANOS.length - 1, Math.floor(frame / 5)), [f, u] = FACES[frame % 5], { at: P, b } = PANOS[k], t = G(b);
  return (
    <AbsoluteFill style={{ background: "#3896d4" }}>
      <Camera3d transform={Transform.fromXyz(...P).lookingAt([P[0] + f[0], P[1] + f[1], P[2] + f[2]], u)} projection={{ Perspective: { fov: Math.PI / 2, far: 900 } }} />
      <World2 t={t} rings={[]} />
      <Machine t={t} b={b} eye={P} />
      <Critters t={t} b={b} look={bodyAt(t, "head")} hop={0.2} />
      <FramePass wesl={STICKER} prepass={{ depth: true, normal: true }} uniforms={stickerUniforms(SUN, {})} />
    </AbsoluteFill>
  );
}

registerRoot(() => (
  <>
    <Composition id="goose" component={Film} width={2160} height={1080} fps={FPS} durationInFrames={FRAMES} />
    <Composition id="goose-9x16" component={() => <Film tall />} width={TALL.w} height={TALL.h} fps={FPS} durationInFrames={FRAMES} />
    <Composition id="goose-labels" component={() => <Film labels />} width={2160} height={1080} fps={FPS} durationInFrames={FRAMES} />
    <Composition id="goose-clay" component={() => <Film clay />} width={2160} height={1080} fps={FPS} durationInFrames={FRAMES} />
    <Composition id="tile-frog" component={() => <Film tile="frog" />} width={1072} height={1080} fps={FPS} durationInFrames={FRAMES} />
    <Composition id="tile-heron" component={() => <Film tile="heron" />} width={1072} height={1080} fps={FPS} durationInFrames={FRAMES} />
    <Composition id="pano" component={Pano} width={1024} height={1024} fps={FPS} durationInFrames={PANOS.length * 5} />
  </>
));

// v3: the film. The idea: a place is a drawing until the cursor touches it. A composition a shot (v3-ID), on the plan's cuts.
import type React from "react";
import { AbsoluteFill, Composition, registerRoot, useCurrentFrame } from "raea";
import { EndCard } from "./card";
import { WALK, Walk, takeCam } from "./walk";
import { spot } from "../sets/canyon";
import type { V3 } from "../v2/math";
import type { Cam } from "./cam";
import { CANYON_DOOR } from "./canyon-door";
import { WORLDS, World, viewFor } from "./worlds";
import { PORTAL_FRAMES, moved, shotOf } from "./kit";
import { OUTRO, Outro } from "./outro";
import { MAKES, Place, Sea, gardenStill, placeCam } from "./places";
import { FPS, H, PAD, SHOTS, W, tailOf, type Shot } from "./plan";
import { INTRO_FRAMES } from "./intro";
import { FernShot, FloorShot, WideShot } from "./glade";

// The glade's way out (the director, 11-12: "we truck left and then cross a tree in the foregorund that masks a transiton to
// truck left into the dock scene"): a trunk close to the lens, far out of focus, a dark soft-edged column the full height
// of the frame, sweeping left to right across it as the lens trucks left, covering the frame at the cut to the dock.
const norm3 = (a: V3): V3 => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const WIPE = 0.34;                                  // seconds each side of the cut that the trunk is in frame
const DOCK_TRUCK_S = 1.4, DOCK_TRUCK_M = 0.9;      // the dock's truck: seconds it eases out over, metres it slides
function TreeWipe({ abs }: { abs: number }) {
  const cut = shotOf("harbour").f0 / FPS, u = (abs - (cut - WIPE)) / (2 * WIPE);
  if (u <= 0 || u >= 1) return null;
  const bw = 2.2 * W, x = -bw + u * (W + bw);      // (its solid middle, 24-76%, is 1.14 frames wide: the frame is covered at the cut)      // (its left edge, the band bw wide with its soft edges, from off the left to off the right)
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: x, top: 0, width: bw, height: H, background: "linear-gradient(90deg, rgba(9,11,9,0) 0%, rgba(9,11,9,0.85) 14%, rgba(12,13,10,1) 24%, rgba(16,15,12,1) 50%, rgba(12,13,10,1) 76%, rgba(9,11,9,0.85) 86%, rgba(9,11,9,0) 100%)" }} />
    </AbsoluteFill>
  );
}
function Play({ s }: { s: Shot }) {
  const t = s.f0 / FPS + useCurrentFrame() / FPS;
  if (WORLDS.includes(s.id)) return <World s={s} t={t - s.from} />;
  if (WALK.includes(s.id)) return <Walk s={s} t={t - s.from} />;
  if (OUTRO.includes(s.id)) return <Outro s={s} t={t - s.from} />;
  if (s.id === "sea" || s.id === "wave") return <Sea s={s} t={t - s.from} />;
  // the only words in the film: the card
  if (s.id === "card") return <EndCard t={t} from={s.from} />;
  // the glade (v3/glade.tsx), in the road's old slot
  if (s.id === "fern") return <FernShot t={t - s.from} />;
  if (s.id === "floor") return <FloorShot t={t - s.from} />;
  if (s.id === "wide") return <><WideShot t={t - s.from} /><TreeWipe abs={t} /></>;
  // (the dock comes out from behind the tree the wide trucks past, trucking left itself, slowing to its own move)
  if (s.id === "harbour") {
    const x = t - s.from, cam = placeCam(s, x), hand = MAKES[s.id](x, s.seconds).hand;
    const fw = norm3([cam.look[0] - cam.eye[0], 0, cam.look[2] - cam.eye[2]]), r: V3 = [-fw[2], 0, fw[0]];
    const q = Math.min(1, x / DOCK_TRUCK_S), off = DOCK_TRUCK_M * (1 - q) ** 2;   // (at the wipe's speed at the cut, eased out to the dock's own lens)
    const m = (p: V3): V3 => [p[0] + r[0] * off, p[1], p[2] + r[2] * off];
    return <><Place s={s} t={x} override={{ cam: { ...cam, eye: m(cam.eye), look: m(cam.look) }, hand }} /><TreeWipe abs={t} /></>;
  }
  if (MAKES[s.id]) return <Place s={s} t={t - s.from} />;
  return <AbsoluteFill style={{ background: "#000" }} />;
}
/** a world's last second and a half seen from the last world's lens, for that world's doorway (v3/kit.tsx Portal,
 *  tools/portals.sh): v3p-ID. The take's last door (the painting's) opens on the canyon. */
const PORTAL_IDS = [...WALK.slice(1), "canyon"];
/** the painting's lens at `abs` moved into the canyon: the point where the take crosses the painting's door is the
 *  canyon's door (v3/canyon-door.ts, where the canyon's own lens starts), and the take's way on is the slot's, turned
 *  with its set. The canyon's own first lens leans toward its cursor a little differently from the take's (under a
 *  degree), so over the doorway's second and a half the picture turns onto it, and the cut lands on the same picture. */
function intoCanyon(abs: number): Cam {
  const n = shotOf("canyon"), prev = shotOf(WALK[WALK.length - 1]);
  const end = takeCam(prev.id, n.from).eye;
  const m = (p: V3): V3 => spot([CANYON_DOOR[0] + p[0] - end[0], CANYON_DOOR[1] + p[1] - end[1], CANYON_DOOR[2] + p[2] - end[2]]);
  const into = (x: number): Cam => { const c = viewFor(prev, x - prev.from).cam; return { ...c, eye: m(c.eye), look: m(c.look) }; };
  const c = into(abs), at = into(n.f0 / FPS), own = placeCam(n, n.f0 / FPS - n.from);
  const q = Math.min(1, Math.max(0, (abs - (n.f0 - PORTAL_FRAMES) / FPS) / ((PORTAL_FRAMES - 1) / FPS))), k = q * q * (3 - 2 * q);
  const to = (a: V3, b: V3, o: V3): V3 => [a[0] + (o[0] - b[0]) * k, a[1] + (o[1] - b[1]) * k, a[2] + (o[2] - b[2]) * k];
  return { ...c, eye: to(c.eye, at.eye, own.eye), look: to(c.look, at.look, own.look), fov: c.fov + (own.fov - at.fov) * k };
}
function PortalPlay({ n }: { n: Shot }) {
  const abs = (n.f0 - PORTAL_FRAMES + useCurrentFrame()) / FPS;
  const prev = shotOf(n.id === "canyon" ? WALK[WALK.length - 1] : WALK[WALK.indexOf(n.id) - 1]);
  if (n.id === "canyon") {
    // (no cursor in the doorway's picture: the painting's own cursor is drawn over it, and a second one in the doorway
    // doubled it as the door filled the frame, the director, 11-12: "34 seconds the cursors get mixed up and doubled up")
    return <Place s={n} t={abs - n.from} override={{ cam: intoCanyon(abs), hand: null }} />;
  }
  const v = moved(viewFor(prev, abs - prev.from), prev.id, n.id);
  if (WORLDS.includes(n.id)) return <World s={n} t={abs - n.from} override={v} />;
  return <Walk s={n} t={abs - n.from} override={{ cam: v.cam, hand: v.hand }} />;
}
// (a hook called inside registerRoot's own function makes raea take the whole root for a component and find no
// compositions in it: each composition's frame is read in a component of its own)
// (the intro is the threshold itself before the song, t from -PAD: one scene with the hallway's own frames, no cut; the
// copier's pass is over it, v3/worlds.tsx Copier. v3/intro.tsx, the copier seen under its glass, is no longer used)
const IntroPlay = () => <World s={shotOf("hallway")} t={useCurrentFrame() / FPS - PAD} />;
const Full = ({ children }: { children: React.ReactNode }) => <AbsoluteFill style={{ width: W, height: H, transform: "scale(2)", transformOrigin: "0 0" }}>{children}</AbsoluteFill>;
registerRoot(() => (
  <>
    {SHOTS.map((s) => <Composition key={s.id} id={`v3-${s.id}`} component={() => <Play s={s} />} width={W} height={H} fps={FPS} durationInFrames={s.frames + tailOf(s.id)} />)}
    {PORTAL_IDS.map((id) => <Composition key={`p-${id}`} id={`v3p-${id}`} component={() => <PortalPlay n={shotOf(id)} />} width={W} height={H} fps={FPS} durationInFrames={PORTAL_FRAMES} />)}
    {SHOTS.map((s) => <Composition key={`x-${s.id}`} id={`v3x-${s.id}`} component={() => <Full><Play s={s} /></Full>} width={W * 2} height={H * 2} fps={FPS} durationInFrames={s.frames + tailOf(s.id)} />)}
    {/* before the song: the empty frame and the words, photocopied (v3/intro.tsx); tools/join.ts lays it ahead of the hallway */}
    <Composition id="v3-intro" component={IntroPlay} width={W} height={H} fps={FPS} durationInFrames={INTRO_FRAMES} />
    <Composition id="v3x-intro" component={() => <Full><IntroPlay /></Full>} width={W * 2} height={H * 2} fps={FPS} durationInFrames={INTRO_FRAMES} />
    {/* the garden's last frame as a still, at full size, without grain or vignette: the picture on the canvas of the
        painting it turns out to be (v3/painting.tsx; tools/painting.sh writes it to media/painting/garden.png) */}
    <Composition id="v3s-garden" component={() => { const g = gardenStill(); return <Full><Place s={shotOf("garden")} t={g.t} override={{ cam: g.cam, hand: null }} still /></Full>; }} width={W * 2} height={H * 2} fps={FPS} durationInFrames={1} />
  </>
));

// The tutorial's copy of the music video as it stands (compositions/film.tsx, v5: no ga~), with Goose's v3 plank wings
// (assets/glb/goose-planks.glb, blender/tut_goose_build.py --planks): the cut the tutorial's sample project posts as
// its versions before the note (tutorial.script.ts 05), so nothing on the glass carries the lettering the director cut for
// good on 11-16. Only the goose's file differs from film.tsx; the v5 session keeps film.tsx.
// Swamp-Side Mayor, the goose cut: a goose swims into a painted swamp of old stones, sings a computer the size of a
// house up out of the pond with a circle of light, dances on the mud floor in front of it while the critters watch,
// flies key to key to type what it wants, dives into the screen and through the raea app making this film, bursts
// back out of the screen into the pond and stamps the lens. 18:9. Everything is a function of the song's time (plan.ts); the goose, the ruins,
// the critters and the machine are drawn as stickers (sticker.ts), the world under the paint look (world2.tsx).
import { AbsoluteFill, Audio, Composition, registerRoot, staticFile, useCurrentFrame } from "raea";
import { FramePass, ImagePlane, Instances, Model } from "raea/3d";
import { Camera3d } from "raea/camera";
import { StandardMaterial } from "raea/pbr";
import { Cylinder, Mesh3d, Sphere } from "raea/mesh";
import { Quat, Transform } from "raea/transform";
import { BEAT, CUE, FPS, FRAMES, G, MON, SEC, SPLASH, beatAt, bodyAt, camera, moveAt, rise, root, sectionAt, sm, type V3 } from "./plan";
import { SUN, World2 } from "./world2";
import { Critters, Magic, Splash, type Ring } from "./ruins";
import { STICKER, stickerUniforms } from "./sticker";
import { WATER, ground } from "./set";
import { Machine } from "./machine";
import { Ink } from "./ink";
import { AppInk, Platform, tripSky } from "./platform";
import steps from "./steps.json";

const rnd = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const tOf = G;   // the time of a beat
/** The turn that takes +Y onto a direction. */
function along(u: V3) { const l = Math.hypot(u[2], u[0]); return l < 1e-5 ? Quat.IDENTITY : Quat.fromAxisAngle([u[2] / l, 0, -u[0] / l], Math.acos(Math.max(-1, Math.min(1, u[1])))); }
const WET = new Set(["swim", "swimhome", "splash", "climb"]);
const isWet = (t: number) => { const r = root(t); return r.p[1] < WATER - 0.05 || (WET.has(moveAt(beatAt(t)).name) && r.p[1] < WATER + 0.1); };
/** Where a point lands on the frame (0..1 across and down), through the film's own lens; null behind it. */
function project(p: V3, cam: ReturnType<typeof camera>, up: V3, aspect = 2) {
  const f = norm(sub(cam.at, cam.eye)), r = norm(cross(f, up)), u = cross(r, f), d = sub(p, cam.eye), z = dot(d, f);
  if (z < 0.05) return null; const th = Math.tan((cam.fov * Math.PI) / 360);
  return [0.5 + dot(d, r) / (z * th * aspect) / 2, 0.5 - dot(d, u) / (z * th) / 2] as [number, number];
}
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], norm = (a: V3): V3 => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

function Film({ labels = false }: { labels?: boolean }) {
  const frame = useCurrentFrame(), t = frame / FPS, b = beatAt(t), sec = sectionAt(b), cam = camera(t), r = root(t), trip = sec === "trip";
  const ph = ((b % 1) + 1) % 1, hit = (0.5 + 0.5 * Math.cos(2 * Math.PI * ph)) ** 2, mv = moveAt(b).name;
  const up: V3 = [Math.sin((cam.roll * Math.PI) / 180), Math.cos((cam.roll * Math.PI) / 180), 0];
  // the cigarette: in its bill from the swim to the wet shake (flung off at 18.2), and again at the end
  const smoking = b < 18.2 || b >= 131.4, tip = bodyAt(t, "tip", r), jaw = bodyAt(t, "jaw", r);
  const dir: V3 = (() => { const d: V3 = [tip[0] - jaw[0], tip[1] - jaw[1], tip[2] - jaw[2]], l = Math.hypot(...d) || 1, side: V3 = [Math.cos(r.yaw), 0, -Math.sin(r.yaw)]; const v: V3 = [d[0] / l * 0.75 + side[0] * 0.6, d[1] / l * 0.75 + 0.12, d[2] / l * 0.75 + side[2] * 0.6]; return norm(v); })();
  const cigAt = (k: number): V3 => [tip[0] - (tip[0] - jaw[0]) * 0.25 + dir[0] * k, tip[1] - (tip[1] - jaw[1]) * 0.25 - 0.012 + dir[1] * k, tip[2] - (tip[2] - jaw[2]) * 0.25 + dir[2] * k];
  // rings on the water: one each half beat from wherever the goose has been swimming
  const rings: Ring[] = [];
  for (let k = 0; k < 6; k++) { const be = Math.floor(b * 2) / 2 - k * 0.5, te = tOf(be); if (te < 0 || !isWet(te)) continue; const p = root(te).p; rings.push({ x: p[0], z: p[2], age: t - te, size: 2.2, dur: 1.9 }); }
  // the machine breaking the water: rings round the monitor's foot as it comes up
  if (b >= CUE.boil && b < CUE.boil + 12) for (let k = 0; k < 5; k++) rings.push({ x: MON.c[0] + (k - 2) * 2.2, z: MON.c[2] + 2.0 + 0.4 * (k % 2), age: (b - CUE.boil + k * 0.37) % 1.5 * BEAT, size: 6, dur: 1.5 * BEAT });
  if (b >= 124.75 && b < 128) for (let k = 0; k < 3; k++) rings.push({ x: SPLASH[0], z: SPLASH[2], age: tOf(b) - tOf(CUE.splash + k * 0.45), size: 3.6, dur: 2.2 });
  const head = bodyAt(t, "head", r), headOnScreen = trip ? null : project(head, cam, up);
  const magicOn = b >= CUE.light - 0.4 && b < CUE.app + 1 ? sm((b - CUE.light) / 2.6) * (1 - sm((b - CUE.boot + 0.6) / 3)) : 0;
  const card = sm((b - 132.2) / 0.5), stamp = b >= 130.4;
  return (
    <AbsoluteFill style={{ background: trip ? tripSky(b) : "#3896d4" }}>
      <Camera3d transform={Transform.fromXyz(...cam.eye).lookingAt(cam.at, up)} projection={{ Perspective: { fov: (cam.fov * Math.PI) / 180, far: 900 } }} />
      {trip ? <Platform t={t} b={b} /> : (
        <>
          <World2 t={t} wind={0.1 + 0.25 * rise(b).shake / 4 + (sec === "type" ? 0.08 : 0)} rings={rings} motes={magicOn} />
          <Machine t={t} b={b} />
          <Critters t={t} b={b} look={r.p} hop={b >= 20 && b < 72 ? 1 : b >= 124 ? 1 : 0.2} jump={b >= CUE.boil && b < CUE.boil + 6 ? sm((b - CUE.boil) / 1) * (1 - sm((b - CUE.boil - 5) / 1)) : 0} />
          <Magic on={magicOn} spin={b * 0.06} pulse={hit * magicOn} />
          {/* footprints in the mud where it has stepped (steps.json from the bake); the stomps leave deep ones */}
          {(steps.prints as { f: number; foot: string; x: number; z: number; yaw: number; stomp?: number }[]).filter((p) => p.f <= frame && frame - p.f < 900 && ground(p.x, p.z) === 1).map((p, i) => (
            <ImagePlane key={`print-${i}`} name={`print-${i}`} src={staticFile("fx/foot.png")} width={p.stomp ? 0.42 : 0.3} height={p.stomp ? 0.42 : 0.3} position={[p.x, 0.012 + 0.0004 * (i % 9), p.z]} rotation={[-Math.PI / 2, 0, p.yaw]} shadow={false} />
          ))}
          {/* splashes: the monitor breaking the pond, the goose coming down in it, out of it */}
          {[0, 1, 2, 3].map((k) => <Splash key={`ms-${k}`} name={`mon-splash-${k}`} at={[MON.c[0] + (k - 1.5) * 2.6, WATER, MON.c[2] + 2.2]} age={(b - CUE.boil - 0.2 - k * 0.6) * BEAT} size={4.5} eye={cam.eye} dur={1.3} />)}
          <Splash name="dive-splash" at={[SPLASH[0], WATER, SPLASH[2]]} age={(b - CUE.splash) * BEAT} size={2.6} eye={cam.eye} dur={0.9} />
          <Splash name="climb-splash" at={[0, WATER, -6.3]} age={(b - 12.6) * BEAT} size={1.2} eye={cam.eye} dur={0.7} />
          <Splash name="climb-splash-2" at={[0, WATER, -6.3]} age={(b - 127.0) * BEAT} size={1.2} eye={cam.eye} dur={0.7} />
          {/* the wet shake: drops flung off it, drawn as stickers */}
          {b >= 17.6 && b < 19.6 && <Instances name="drops" pass="hero" shadow={false} at={Array.from({ length: 36 }, (_, i) => { const t0 = tOf(17.7 + (i / 36) * 1.4), u = t - t0, a = rnd(i) * Math.PI * 2, v = 1.6 + 1.6 * rnd(i * 3), vy = 1.2 + 1.8 * rnd(i * 5), c = bodyAt(t0, "back");
            const y = c[1] + vy * u - 4.9 * u * u, vx = Math.cos(a) * v, vz = Math.sin(a) * v, vyy = vy - 9.8 * u, hide = u < 0 || y < 0;   // each drop drawn long along its flight, a streak more than a bead
            return { position: [c[0] + vx * u, Math.max(-1, y), c[2] + vz * u] as V3, rotation: [-Math.atan2(vyy, Math.hypot(vx, vz)), Math.atan2(vx, vz), 0] as V3, scale: (hide ? [0.001, 0.001, 0.001] : [0.6, 0.6, 2.4]) as V3 }; })}>
            <Sphere radius={0.016} /><StandardMaterial base_color="#e8f6ff" unlit /></Instances>}
          {/* the cigarette it flings away in the shake */}
          {b >= 18.2 && b < 19.4 && (() => { const t0 = tOf(18.2), u = t - t0, p0 = bodyAt(t0, "tip"); const p: V3 = [p0[0] + 1.6 * u, p0[1] + 2.2 * u - 4.9 * u * u, p0[2] + 0.5 * u];
            return p[1] > 0.02 ? <Mesh3d name="cig-flung" allowOverlap pass="hero" transform={Transform.fromXyz(...p).withRotation(Quat.fromAxisAngle([0, 0, 1], u * 14))}><Cylinder radius={0.012} half_height={0.09} /><StandardMaterial base_color="#fbf7ee" unlit /></Mesh3d> : null; })()}
        </>
      )}
      <FramePass wesl={STICKER} prepass={{ depth: true, normal: true }} uniforms={stickerUniforms(SUN, trip ? { shade: "#dcd4ff" } : {})} />   {/* in the trip it tumbles through every light: keep its shade side pale */}
      <Model name="goose" pass="hero" flat src={staticFile("glb/goose-planks.glb")} position={r.p} rotation={[r.pitch, r.yaw, r.roll]} scale={r.s} graph={{ blend: [{ clip: "show", time: t, weight: 1 }] }} />
      {smoking && !trip && (
        <>
          <Mesh3d name="cig" allowOverlap pass="hero" transform={Transform.fromXyz(...cigAt(0.09)).withRotation(along(dir))}><Cylinder radius={0.012} half_height={0.09} /><StandardMaterial base_color="#fbf7ee" unlit /></Mesh3d>
          <Mesh3d name="cig-filter" allowOverlap pass="hero" transform={Transform.fromXyz(...cigAt(0.02)).withRotation(along(dir))}><Cylinder radius={0.0125} half_height={0.025} /><StandardMaterial base_color="#e2a04a" unlit /></Mesh3d>
          <Mesh3d name="cig-ember" allowOverlap transform={Transform.fromXyz(...cigAt(0.185)).withRotation(along(dir))}><Cylinder radius={0.0125} half_height={0.008} /><StandardMaterial base_color="#ff5a1f" emissive="#ff3b00" unlit /></Mesh3d>
          {/* smoke, drawn: a wisp waving up off the tip, and a puff let go on the half beat that swells, turns and thins as
              it rises on the wind (fx/wisp.png, fx/smoke.png), each a card turned to the lens */}
          {(() => { const e = cigAt(0.2), yaw = Math.atan2(cam.eye[0] - e[0], cam.eye[2] - e[2]);
            return <ImagePlane name="wisp" src={staticFile("fx/wisp.png")} grid={[4, 4]} frame={Math.floor(t * 12) % 16} width={0.3} height={0.3} pass="ui" shadow={false} position={[e[0], e[1] + 0.15, e[2]]} rotation={[0, yaw, 0]} />; })()}
          {Array.from({ length: 4 }, (_, k) => { const age = ((((b * 2 + k * 1.75) % 7) + 7) % 7) / 2, e = cigAt(0.2); if (age > 2.6) return null;   // b is below 0 before the first beat
            const c: V3 = [e[0] + age * 0.12 + 0.05 * Math.sin(age * 3 + k), e[1] + 0.1 + age * 0.17, e[2] + 0.05 * Math.cos(age * 2.5 + k)];
            return <ImagePlane key={`puff-${k}`} name={`puff-${k}`} src={staticFile("fx/smoke.png")} grid={[4, 4]} frame={Math.min(15, Math.floor((age / 2.6) * 16))} width={0.42} height={0.42} pass="ui" shadow={false} position={c} rotation={[0, Math.atan2(cam.eye[0] - c[0], cam.eye[2] - c[2]), 0]} />; })}
        </>
      )}
      <Ink t={t} b={b} frame={frame} head={headOnScreen} />
      {trip && <AppInk b={b} frame={frame} />}
      {/* out through the screen: white as it dives at us, still white as the monitor's screen flashes outside */}
      {((trip && b > 121.55) || (b >= SEC.trip[1] && b < SEC.trip[1] + 0.2)) && <AbsoluteFill style={{ background: "#fffdf6", opacity: trip ? sm((b - 121.55) / 0.4) : 1 - (b - SEC.trip[1]) / 0.2 }} />}
      {/* made in raea: the mark as a sticker over the opening aerial */}
      {b < 4.4 && (() => { const on = sm(b / 0.5) * (1 - sm((b - 3.9) / 0.5)), bounce = 1 + 0.06 * Math.sin(Math.min(1, b / 0.7) * Math.PI) * (1 - Math.min(1, b / 0.7));
        return <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, opacity: on, transform: `scale(${bounce}) rotate(-2deg)` }}>
          <img src={staticFile("ink/made-0.png")} style={{ height: 120, marginRight: 260 }} /><img src={staticFile("logo/raea-sticker.png")} style={{ width: 760 }} /></div>; })()}
      {/* the stamp: the muddy foot comes down on the lens and stays, through the card */}
      {stamp && <img src={staticFile("fx/stamp.png")} style={{ position: "absolute", left: 1080 - 480, top: 540 - 480 + 40, width: 960, height: 960, transform: `scale(${1 + 0.25 * (1 - sm((b - 130.4) / 0.25))}) rotate(-12deg)`, opacity: 0.94 }} />}
      {labels && <div style={{ position: "absolute", left: 28, bottom: 40, color: "#fff", font: "600 26px/1.2 Inter, sans-serif", textShadow: "0 2px 0 #0008" }}>{cam.i + 1} · {cam.shot.name} · {mv} · beat {b.toFixed(1)} · {t.toFixed(2)} s</div>}
      {card > 0 && (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 26, opacity: card, background: "#3896d4" }}>
          <img src={staticFile("logo/raea-sticker.png")} style={{ width: 760, transform: `scale(${0.9 + 0.1 * card})` }} />
          <img src={staticFile(`ink/v015-${Math.floor(frame / 4) % 3}.png`)} style={{ height: 200, transform: `rotate(-3deg) scale(${0.85 + 0.15 * sm((b - 132.5) / 0.4)})` }} />
        </AbsoluteFill>
      )}
      <Audio src={staticFile("music/swamp-side-mayor-90.wav")} />
    </AbsoluteFill>
  );
}
registerRoot(() => (
  <>
    <Composition id="goose-planks" component={Film} width={2160} height={1080} fps={FPS} durationInFrames={FRAMES} />
    <Composition id="goose-planks-labels" component={() => <Film labels />} width={2160} height={1080} fps={FPS} durationInFrames={FRAMES} />
  </>
));

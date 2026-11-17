// The trip: down the wire. A square tunnel of coloured frames rushing past, the app's own screens flying by, wind
// streaks, and sprite-stacked things tumbling through, around the goose at TRIP. Everything moves toward the lens.
import { staticFile } from "raea";
import { ImagePlane, Instances, Model, ToneMapping } from "raea/3d";
import { AmbientLight, DirectionalLight } from "raea/light";
import { StandardMaterial } from "raea/pbr";
import { Cuboid, Mesh3d, Sphere } from "raea/mesh";
import { Quat, Transform } from "raea/transform";
import { SEC, TRIP, type V3 } from "./plan";
import { Stack } from "./stack";
const COL = ["#ffd166", "#ff5a3c", "#b6f24a", "#fffdf5", "#ff8fc7", "#2f8fd6", "#8a5cff"];
// the void cuts to a new colour every two beats, hard, on the beat (a blend through the middle went to mud and sage)
const SKY = ["#ff1f8f", "#ffc400", "#00b8ff", "#8a2bff", "#2fe05a", "#ff5a00", "#00e0c8", "#ff3df5"];
export const skyAt = (k: number) => SKY[Math.floor(k / 2) % SKY.length];
const FLYERS = [{ src: "frog", clip: "FrogArmature|Frog_Jump", s: 0.3 }, { src: "raccoon", clip: "AnimalArmature|AnimalArmature|AnimalArmature|Idle", s: 0.22 }, { src: "snake", clip: "SnakeArmature|Snake_Idle", s: 0.35 }, { src: "rat", clip: "RatArmature|Rat_Run", s: 0.12 }, { src: "frog2", clip: "CharacterArmature|Wave", s: 0.45 }];
const WORDS = ["duck", "soup", "quack", "pop", "mudfeet", "quackw"];
const SHOTS = ["screen/type22", "screen/vid0", "screen/vid1", "screen/type10", "screen/vid2", "screen/vid3", "screen/boot1", "screen/vid4", "screen/vid5", "screen/type16"];
const rnd = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const LEN = 96, NEAR = 14;
export function Tunnel({ t, b }: { t: number; b: number }) {
  const k = b - SEC.trip[0], speed = 26 + 10 * Math.sin(k * 0.4), run = t * speed, ph = ((b % 1) + 1) % 1, hit = (0.5 + 0.5 * Math.cos(2 * Math.PI * ph)) ** 2;
  const z = (i: number, gap: number, n: number) => TRIP[2] + NEAR - ((((i * gap - run) % (n * gap)) + n * gap) % (n * gap));
  const streaks = Array.from({ length: 220 }, (_, i) => { const a = rnd(i) * Math.PI * 2, r = 2.2 + 5 * rnd(i * 3); return { position: [TRIP[0] + Math.cos(a) * r, TRIP[1] + Math.sin(a) * r, TRIP[2] + NEAR - ((rnd(i * 7) * LEN + run * (1.4 + rnd(i * 5))) % LEN)] as V3, scale: [1, 1, 1.5 + 5 * rnd(i * 11)] as V3 }; });
  return (
    <>
      <AmbientLight brightness={1400} /><DirectionalLight transform={Transform.fromXyz(TRIP[0] + 2, TRIP[1] + 4, TRIP[2] + 8).lookingAt(TRIP)} illuminance={9000} />
      <ToneMapping mode="none" />   {/* flat colour: the default mapping greyed the goose's white and muddied the bars */}
      {/* the void is the page behind the canvas (film.tsx), so its colours reach the frame untouched by the tone mapping */}
      {/* the far end: a sunburst turning round a white-hot core, lighter rays of the void's own colour */}
      <ImagePlane name="burst" src={staticFile("fx/burst.png")} width={1} height={1} pass="ui" shadow={false} position={[TRIP[0], TRIP[1], TRIP[2] - 110]} rotation={[0, 0, k * 0.35]} scale={[260 * (1 + 0.04 * hit), 260 * (1 + 0.04 * hit), 1]} />
      {/* the frames: four bars each, turning as they come */}
      {Array.from({ length: 16 }, (_, i) => { const zz = z(i, 6, 16), tw = zz * 0.05 + k * 0.25, R = 6.2 + 0.5 * hit;
        return [0, 1, 2, 3].map((s) => { const a = tw + (s * Math.PI) / 2; return (
          <Mesh3d key={`f${i}-${s}`} name={`frame-${i}-${s}`} allowOverlap pass="ui" shadow={false} transform={Transform.fromXyz(TRIP[0] + Math.cos(a) * R, TRIP[1] + Math.sin(a) * R, zz).withRotation(Quat.fromAxisAngle([0, 0, 1], a + Math.PI / 2))}>
            <Cuboid half_size={[R + 0.25, 0.25, 0.25]} /><StandardMaterial base_color={COL[(i + Math.floor(k / 2) * 3) % COL.length]} unlit /></Mesh3d>); }); })}
      <Instances name="wind" at={streaks} pass="ui" shadow={false}><Cuboid half_size={[0.02, 0.02, 0.5]} /><StandardMaterial base_color="#fffdf5" unlit /></Instances>
      {/* what the machine is doing: the app's screens flying past */}
      {SHOTS.map((s, i) => { const zz = z(i, 9.6, SHOTS.length), a = i * 2.4 + k * 0.15, r = 3.6;
        const at: V3 = [TRIP[0] + Math.cos(a) * r, TRIP[1] + Math.sin(a) * r * 0.7, zz], rot: V3 = [0, -Math.cos(a) * 0.35, Math.sin(k * 0.7 + i) * 0.25];
        return [<ImagePlane key={s} name={`shot-${i}`} src={staticFile(`${s}.png`)} width={4.2} height={2.9} pass="ui" shadow={false} position={at} rotation={rot} />,
          // a cream card behind each screen with the navy edge, so they fly past as stickers and not as holes
          <Mesh3d key={`${s}-card`} name={`shot-card-${i}`} allowOverlap pass="ui" shadow={false} transform={Transform.fromXyz(at[0], at[1], at[2] - 0.03).withRotation(Quat.fromEuler("XYZ", ...rot))}><Cuboid half_size={[2.28, 1.62, 0.02]} /><StandardMaterial base_color="#fffdf6" unlit /></Mesh3d>,
          <Mesh3d key={`${s}-edge`} name={`shot-edge-${i}`} allowOverlap pass="ui" shadow={false} transform={Transform.fromXyz(at[0], at[1], at[2] - 0.06).withRotation(Quat.fromEuler("XYZ", ...rot))}><Cuboid half_size={[2.36, 1.7, 0.02]} /><StandardMaterial base_color="#1c263d" unlit /></Mesh3d>]; })}
      {/* the summoning circle, turned to face us, coming down the tunnel like a gate every few frames of it */}
      {[0, 1, 2].map((i) => { const zz = z(i, 32, 3), sc = 9 + 0.6 * hit;
        return <ImagePlane key={`gate-${i}`} name={`gate-${i}`} src={staticFile("fx/gate.png")} width={1} height={1} pass="ui" cutout shadow={false} position={[TRIP[0], TRIP[1], zz]} rotation={[0, 0, k * 0.5 + i * 2]} scale={[sc, sc, 1]} />; })}
      {/* the watchers, tumbling through with it, as stickers */}
      {FLYERS.map((c, i) => { const zz = z(i, 19, FLYERS.length), a = i * 1.27 + k * 0.2, rr = 2.4 + 0.6 * Math.sin(i * 3.1);
        return <Model key={`fly-${c.src}-${i}`} name={`flyer-${i}`} pass="hero" flat src={staticFile(`glb/critter-${c.src}.glb`)} position={[TRIP[0] + Math.cos(a) * rr, TRIP[1] + Math.sin(a) * rr, zz]} rotation={[k * 0.9 + i, k * 0.7 + i * 2, k * 0.5]} scale={c.s} graph={{ blend: [{ clip: c.clip, time: (t * 1.2) % 1, weight: 1 }] }} />; })}
      {/* the hook's words on the walls, rushing past */}
      {WORDS.map((w, i) => { const zz = z(i, 15, WORDS.length), a = i * 2.1 + 0.6, rr = 4.2;
        return <ImagePlane key={`word-${i}`} name={`word-${i}`} src={staticFile(`ink/${w}-${Math.floor(t * 7.5) % 3}.png`)} width={3.2} height={1.4} cutout shadow={false} pass="ui" position={[TRIP[0] + Math.cos(a) * rr, TRIP[1] + Math.sin(a) * rr, zz]} rotation={[0, 0, a - Math.PI / 2 + 0.3 * Math.sin(k + i)]} />; })}
      {(["disk", "mushroom", "boombox", "lotus"] as const).map((n, i) => { const zz = z(i, 24, 4) , a = i * 1.9 + 1;
        return <Stack key={i} id={`fly-${i}`} name={n} at={[TRIP[0] + Math.cos(a) * 2.6, TRIP[1] + Math.sin(a) * 2.2, zz]} size={1.5} tall={n === "disk" ? 0.12 : 0.8} turn={k * 1.3 + i} tip={0.9 + 0.5 * Math.sin(k + i)} />; })}
    </>
  );
}

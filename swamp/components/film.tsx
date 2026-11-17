// The film's frame: camera and lens, ray-traced light, clouds, mist, the paint finish, and the set, at one frame of the
// film's clock.
import type { ReactNode } from "react";
import { AbsoluteFill } from "raea";
import { Atmosphere, Look, Outline, Screen, Shadows } from "raea/3d";
import { Camera3d } from "raea/camera";
import { DirectionalLight, SolariLighting } from "raea/light";
import { VolumetricFog } from "raea/pbr";
import { DepthOfField, Grade, ToneMapping } from "raea/post_process";
import { Transform } from "raea/transform";
import { Cloud } from "./cloud";
import { BankGrass, Fireflies, Ground, Keyboard, Mist, Monitor, Robot, Trees, type World } from "./set";
import { GLASS_Z, PH, PW, SH, SW, T, type V3, camAt, duskAt, growAt, hex, lerp, noseAt, powerAt, robotAt, robotPath, spinAt, sunAt, waterAt } from "./timeline";

export const worldAt = (f: number): World => ({ f, power: powerAt(f), sun: sunAt(f), water: waterAt(f), grow: growAt(f), dusk: duskAt(f) });

/** the sun: low and veiled while the world is dead, up behind the trees with the slider, low and red by dusk */
export const sunPlace = (w: World): V3 => {
  const elev = (lerp(lerp(9, 44, w.sun), 4.5, w.dusk) * Math.PI) / 180;
  const az = lerp(lerp(-1.9, -0.95, w.sun), -2.05, w.dusk); // up over the left shoulder by day, so every form has a lit side and a shade side; behind the monitor at dusk
  const r = 60;
  return [Math.sin(az) * Math.cos(elev) * r, Math.sin(elev) * r, Math.cos(az) * Math.cos(elev) * r];
};
/** the camera's exposure, in stops from the default: open in the grey, closed down in daylight */
export const EXPOSURE = { dead: -0.4, day: -1.7, dusk: -0.3 };
export const exposureAt = (w: World) => lerp(lerp(EXPOSURE.dead, EXPOSURE.day, w.sun), EXPOSURE.dusk, w.dusk);
/** how bright the glass is to the room at the default exposure */
export const SPILL = 260;
/** how alive the world is, 0 to 1: what the grade's saturation follows */
export const lifeAt = (w: World) => Math.max(w.sun * 0.45 + w.water * 0.2 + w.grow * 0.35, w.dusk);

export type Lens = { pos: V3; look: V3; fov: number; focus?: number; stop?: number };

export function Film({ frame, first, page, emit = [0.93, 0.96, 1], still, debug = "" }: { frame: number; /** the shot's first frame: the paint's tones are one painting a shot */ first?: number; page?: ReactNode; emit?: [number, number, number]; still?: Lens; debug?: string }) {
  const f = frame;
  const w = worldAt(f);
  const w0 = worldAt(first ?? f);
  const cam: Lens = still ?? camAt(f);
  const exposure = exposureAt(w);
  const path = robotPath();
  const r = robotAt(f, path);
  const ahead = robotAt(f + 2, path);
  const nose = noseAt(f);
  // the robot leans into where it's going
  const lean: [number, number] = [Math.max(-0.5, Math.min(0.5, (ahead[0] - r[0]) * 4)), Math.max(-0.4, Math.min(0.4, -(ahead[1] - r[1]) * 3))];
  const k = SPILL * Math.pow(2, -exposure);
  const sky = hex(hex("#59625f", "#b7c7c0", w.sun), "#5a4a5c", w.dusk);
  const life = lifeAt(w);
  // the paint's tones, fixed at the shot's first frame: grey on grey while dead, blue shade and warm light alive, violet and peach at dusk
  const shade = hex(hex("#7d8086", "#5568a8", w0.sun), "#5a4f8c", w0.dusk);
  const mid = hex(hex("#b3b3ae", "#a9c4a4", w0.sun), "#dd9f80", w0.dusk);
  const haze = hex(hex("#8a908e", "#a9c4cf", w0.sun), "#c78a86", w0.dusk);
  const skyTop = hex(hex("#565d5c", "#3f86c8", w0.sun), "#3b3a6a", w0.dusk);
  const skyLow = hex(hex("#7a807c", "#bfe2f0", w0.sun), "#f0955a", w0.dusk);
  const t = f / 30;
  return (
    <AbsoluteFill style={{ background: sky }}>
      <Camera3d transform={Transform.fromXyz(...cam.pos).lookingAt(cam.look)} projection={{ Perspective: { fov: cam.fov } }}>
        <SolariLighting bounces={2} />
        {cam.stop !== undefined && !debug.includes("nodof") && <DepthOfField focal_distance={cam.focus ?? 6} aperture_f_stops={cam.stop} />}
      </Camera3d>
      <ToneMapping exposure={exposure} />
      <Atmosphere light />
      <DirectionalLight volumetric transform={Transform.fromXyz(...sunPlace(w)).lookingAt([0, 1, 1])} illuminance={40000} color="#ffe2b8" shadow_maps_enabled soft_shadow_size={1.5} />
      <Shadows distance={60} firstCascade={14} cascades={3} mapSize={4096} />
      {!debug.includes("nofog") && <VolumetricFog ambient={0.05} ambientColor="#c8d6cc" />}
      {!debug.includes("nofog") && <Mist w={w} />}
      {!debug.includes("noclouds") && (
        <>
          <Cloud name="cloud-a" position={[-44 + t * 0.25, 16, -80]} size={[46, 30, 18]} count={11} seed={1} time={t + 40} resolution={56} shadow={false} />
          <Cloud name="cloud-b" position={[-4 + t * 0.2, 14, -70]} size={[80, 50, 24]} count={12} seed={5} time={t + 55} resolution={56} shadow={false} />
          <Cloud name="cloud-c" position={[62 + t * 0.2, 16, -70]} size={[34, 22, 14]} count={8} seed={8} time={t + 30} resolution={48} shadow={false} />
        </>
      )}
      {!debug.includes("nolook") && (
        <Look mode="paint" saturate={1.2} sky={[skyTop, skyLow]} bands={5} shadow={shade} mid={mid} grain={0.34} rag={1.7} ragScale={30} stroke={debug.includes("nostroke") ? 0 : 0.9} strokeScale={0.3} edge={0.3} edgeScale={1.2} water={0} foam={0.03} foamColor="#dfe8dc" cloudShadows={debug.includes("nodapple") ? 0 : 0.5} cloudShadowSize={3} cloudShadowDrift={[t * 0.15, t * 0.05]} haze={haze} hazeStart={14} hazeDensity={0.016} hazeHeight={6} hazeMost={0.5} hazeSun="#ffe9c0" skip={["ui"]} />
      )}
      <Outline color="#3b3229" width={1.4} far={26} skip={["ui", "grass"]} />
            {!debug.includes("nograde") && <Grade saturation={lerp(0.1, 1.12, life)} temperature={lerp(-0.02, 0.012, life)} vignette={{ intensity: 0.34, radius: 0.8, smoothness: 4 }} shadows={{ contrast: 1.05 }} skip={["ui"]} />}

      {!debug.includes("noground") && <Ground w={w} />}
      {!debug.includes("notrees") && <Trees w={w} />}
      <Monitor w={w} emit={[emit[0] * k, emit[1] * k, emit[2] * k]}>
        {!debug.includes("noscreen") && (
          <Screen name="glass" pass="ui" position={[0, 0, GLASS_Z]} size={[SW, SH]} resolution={[PW, PH]} crt={false} brightness={1} background="#0a0c0b">
            {page}
          </Screen>
        )}
      </Monitor>
      {!debug.includes("nokb") && <Keyboard w={w} />}
      {!debug.includes("nograss") && <BankGrass w={w} />}
      {!debug.includes("norobot") && <Robot at={r} tilt={Math.PI * nose} spin={spinAt(f)} f={f} lean={lean} />}
      {!debug.includes("noflies") && <Fireflies f={f} from={T.scrubTo - 6} />}
    </AbsoluteFill>
  );
}

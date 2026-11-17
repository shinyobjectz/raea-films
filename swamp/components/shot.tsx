// The film's frame, photoreal: a real sky (HDRI), a ray-traced sun, mist, a film lens and grade, and the scanned swamp
// with the monitor, keyboard and robot in it, at one frame of the film's clock.
import type { ReactNode } from "react";
import { AbsoluteFill, interpolate, staticFile, useVideoConfig } from "raea";
import { Environment, Screen, Shadows } from "raea/3d";
import { Camera3d } from "raea/camera";
import { DirectionalLight, SolariLighting } from "raea/light";
import { VolumetricFog } from "raea/pbr";
import { DepthOfField, Grade, MotionBlur, ToneMapping } from "raea/post_process";
import { Transform } from "raea/transform";
import { Robot } from "./robot";
import { Keyboard, Monitor, type World } from "./set";
import { RISE, camAt2, noseAt2, robotAt2, shotAt2 } from "./take";
import { LensWater } from "./lenswater";
import { GooseBones } from "./goose";
import { flareAt } from "./pulse";
import { GLASS_Z, PH, PW, SH, SW, T, type V3, clamp, duskAt, growAt, lerp, mistAt, faceAt, irisAt, powerAt, settleAt, spinAt, sunAt, waterAt } from "./timeline";
import { Fireflies, Ground, Mist, MonitorGrowth, Trees } from "./world";
import { GroundBeam, beamFoot, beamHigh } from "./groundbeam";
import { BEAM_LOOK, BeamVolume } from "./beamvol";
import { Fish } from "./fish";
import { Birds } from "./birds";
import { LeafBurst } from "./leafburst";
import { Opening } from "./opening";

export const worldAt = (f: number): World => ({ f, power: powerAt(f), sun: sunAt(f), water: waterAt(f), grow: growAt(f), dusk: duskAt(f), mist: mistAt(f) });

const SKY_DAY = staticFile("hdri/kloofendal_48d_partly_cloudy_puresky.hdr");
const SKY_DUSK = staticFile("hdri/belfast_sunset_puresky.hdr");
/** the turn that puts both skies' suns behind the monitor, to its left */
/** the sun's azimuth, radians from -z toward -x: behind the monitor to its left, so light comes toward the lens */
const AZ = 1.0;
/** the turn that puts both skies' suns there (each sky's sun is 0.594 rad off its centre) */
export const SKY_TURN = AZ + 0.594;
export const sunPlace = (w: World): V3 => {
  // under the trees' tops while the world is dead, up at the day sky's own height, down to the sunset's
  const elev = (lerp(lerp(5, 46, w.sun), 3.5, w.dusk) * Math.PI) / 180;
  const r = 80;
  return [-Math.sin(AZ) * Math.cos(elev) * r, Math.sin(elev) * r, -Math.cos(AZ) * Math.cos(elev) * r];
};
/** the camera's exposure, in stops from the default */
export const EXPOSURE = { dead: 1.2, day: 0.8, dusk: 1.1 };
export const exposureAt = (w: World) => lerp(lerp(EXPOSURE.dead, EXPOSURE.day, w.sun), EXPOSURE.dusk, w.dusk);
/** the sky's light on the scene, as a multiple of its picture: fill under the canopy */
export const FILL = 3;
/** how bright the glass is to the room at the default exposure */
export const SPILL = 220;
/** how alive the world is, 0 to 1: what the grade's saturation follows */
export const lifeAt = (w: World) => Math.max(w.sun * 0.5 + w.water * 0.15 + w.grow * 0.35, w.dusk);

export type Lens = { pos: V3; look: V3; fov: number; focus?: number; stop?: number; /** the camera's up (default +y) */ up?: V3; near?: number };

export function Shot({ frame, page, emit = [0.2, 0.22, 0.25], still, debug = "" }: { frame: number; page?: ReactNode; emit?: [number, number, number]; still?: Lens; debug?: string }) {
  const f = frame;
  const w = worldAt(f);
  const cam: Lens = still ?? camAt2(f);
  // the camera as the shutter opens, half a frame before (within its own shot): the beam's pass blurs between them
  const cam0: Lens = still ?? camAt2(Math.max(shotAt2(f).from, f - 0.5));
  const { width, height } = useVideoConfig();
  const aloft = cam.pos[1] > 20;
  const exposure = exposureAt(w);
  // v4: rising up the beam out of the canopy into the open sky, the lens stops down as a camera would, so the sky
  // deepens and the beam's glow shows against it (and its air glows wider: up there it's all there is)
  const clear = interpolate(cam.pos[1], [8, 26], [0, 1], clamp);
  const lensExposure = exposure - 1.4 * clear;
  const r = robotAt2(f);
  const ahead = robotAt2(f + 2);
  const nose = noseAt2(f);
  const lean: [number, number] = [Math.max(-0.5, Math.min(0.5, (ahead[0] - r[0]) * 4)), Math.max(-0.4, Math.min(0.4, -(ahead[1] - r[1]) * 3))];
  // (v4: the screen flares as the pulse leaves it)
  const k = SPILL * Math.pow(2, -exposure) * (1 + 5 * flareAt(f));
  const life = lifeAt(w);
  const dusk = w.dusk > 0.5;
  const sky = dusk ? lerp(0.6, 1.0, w.dusk) : lerp(lerp(0.22, 1, w.sun), 0.6, w.dusk);
  return (
    <AbsoluteFill style={{ background: "#000000" }}>
      <Camera3d transform={Transform.fromXyz(...cam.pos).lookingAt(cam.look)} projection={{ Perspective: { fov: cam.fov, near: cam.near ?? 0.1, far: 1000, near_clip_plane: [0, 0, -1, -(cam.near ?? 0.1)] } }}>
        <SolariLighting bounces={2} />
        {cam.stop !== undefined && !debug.includes("nodof") && <DepthOfField focal_distance={cam.focus ?? 6} aperture_f_stops={cam.stop} />}
      </Camera3d>
      <ToneMapping exposure={lensExposure} />
      {/* v4: from the blast to the orbit, a film camera's shutter: the blocks thrown out, the camera rising (shorter while
          the ground shakes, or the shake smears the whole frame) */}
      {f >= T.blast && f < T.orbit && !debug.includes("noblur") && <MotionBlur shutterAngle={f < T.rise ? 0.35 : 0.5} samples={4} />}
      <Environment src={dusk ? SKY_DUSK : SKY_DAY} intensity={FILL * sky} backgroundIntensity={sky} background rotation={SKY_TURN} />
      <DirectionalLight volumetric transform={Transform.fromXyz(...sunPlace(w)).lookingAt([0, 1, 1])} illuminance={24000} color="#fff1df" shadow_maps_enabled />
      <Shadows distance={70} firstCascade={12} cascades={3} mapSize={4096} />
      {/* (high over the trees, up the beam, the fog goes: Bevy's volumetric fog draws the frame black from out there) */}
      {!debug.includes("nofog") && !aloft && <VolumetricFog ambient={lerp(0.03, lerp(0.6, 0.16, w.dusk), (w.mist ?? 0) * lerp(1, 0.4, settleAt(w.f)))} ambientColor={w.dusk > 0.5 ? "#f2c9a8" : "#dfe9ee"} />}
      {!debug.includes("nofog") && !aloft && <Mist w={w} />}
      {!debug.includes("nograde") && <Grade saturation={lerp(0.12, 1.06, life)} temperature={lerp(-0.03, 0.01, life)} vignette={{ intensity: 0.3, radius: 0.8, smoothness: 4 }} midtones={{ contrast: 1.08 }} skip={["ui"]} />}

      <Ground w={w} />
      {!debug.includes("notrees") && <Trees w={w} />}
      <Monitor real w={w} emit={[emit[0] * k, emit[1] * k, emit[2] * k]}>
        <Screen name="glass" pass="ui" position={[0, 0, GLASS_Z + 0.012]} size={[SW, SH]} resolution={[PW, PH]} crt={false} brightness={1.5 * (1 + 1.4 * flareAt(f))} background="#0a0c0b">
          {page}
        </Screen>
      </Monitor>
      <MonitorGrowth w={w} />
      <Keyboard w={w} />
      {/* v5: the easter egg, a goose's bones in the shallows at the keyboard's right end */}
      {!debug.includes("nogoose") && <GooseBones />}
      {!debug.includes("plate") && <Robot at={r} tilt={Math.PI * nose} spin={spinAt(f) + faceAt(f)} f={f} lean={lean} iris={irisAt(f)} />}
      <Fireflies f={f} from={T.scrubTo - 6} cam={cam.pos} />
      <GroundBeam f={f} />
      {/* v4: the beam's body, its glowing air, as a volume over the frame */}
      {beamHigh(f) > 0 && !debug.includes("novol") && <BeamVolume cam={cam} cam0={cam0} foot={beamFoot()} axis={[0, 1, 0]} h={beamHigh(f)} h0={beamHigh(f - 0.5)} t={(f - 0.25) / 30} exposure={lensExposure} aspect={width / height} look={{ ...BEAM_LOOK, halo: BEAM_LOOK.halo * (1 + 0.8 * clear), air: BEAM_LOOK.air * (1 + 2 * clear), energy: BEAM_LOOK.energy * (1 + 0.6 * clear) }} />}
      {/* v5: 01-water comes up out of the water, and the water is on the lens */}
      {f < 90 && !debug.includes("dry") && <LensWater t={f} under={RISE.under} out={RISE.out} aspect={width / height} />}
      <Opening f={f} />
      {/* v5 (note 9): the leaves the blast throws up, mounted from 25-crack's first frame */}
      {f >= T.tremor - 2 && f < T.orbit && !debug.includes("noleaves") && <LeafBurst f={f} />}
      {f >= 822 && f < 864 && <Fish f={f} />}
      {f >= 896 && f < 940 && <Birds f={f} />}
    </AbsoluteFill>
  );
}

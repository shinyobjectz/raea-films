// Look development for the hype film: one small swamp set, three ways of drawing it, to find out how the paint and the
// pencil line can sit over ray-traced light. Not the film.
import { AbsoluteFill, Composition, registerRoot } from "raea";
import { Atmosphere, Entity, Look, Outline, ToneMapping, grow, sdf } from "raea/3d";
import { Camera3d } from "raea/camera";
import { AmbientLight, DirectionalLight, SolariLighting } from "raea/light";
import { Cuboid, Mesh3d } from "raea/mesh";
import { FogVolume, StandardMaterial, VolumetricFog } from "raea/pbr";
import { LinearRgba } from "raea/color";
import { Quat, Transform } from "raea/transform";

const WOOD = [0, 1, 2].map((s) => grow.tree({ height: 11, trunk: 0.45, width: 1.1, base: 0.42, crown: "dome", points: 700, leaves: 0, seed: 11 + s }, "wood"));
// foliage as painted masses: a few lumpy blobs round the crown
const LEAVES = [0, 1, 2].map((s) => sdf.smoothUnion(0.6, sdf.ellipsoid(3.2, 1.5, 2.8).move(0, 8.6, 0), sdf.ellipsoid(2.2, 1.2, 2.0).move(2.4, 7.4, 0.8), sdf.ellipsoid(2.0, 1.1, 2.2).move(-2.2, 7.6, -0.9), sdf.ellipsoid(1.8, 1.0, 1.8).move(0.4, 9.8, -0.6)).displace(0.35, 0.9, 3, 20 + s).solid(0.22));
const ROCK = grow.boulder({ size: 0.5, squash: 0.6, rough: 0.5, seed: 3 });
const BANK = sdf.ellipsoid(2.6, 0.22, 1.2).displace(0.05, 2.2, 3, 5).solid();
const TREES: [number, number, number][] = [[-5, -5, 0], [-2.5, -8, 1], [3, -6.5, 2], [6.5, -3.5, 0], [-8, 0, 1], [8, 1.5, 2], [0.5, -11, 0]];

import { BankGrass, Fireflies, Ground, Keyboard, Monitor, Robot, Trees } from "../components/set";
import { Screen } from "raea/3d";
const W = { f: 0, power: 1, sun: 1, water: 1, grow: 1, dusk: 0 };
function Set({ variant, probe = "" }: { variant: "paint" | "solari" | "both"; probe?: string }) {
  const traced = variant !== "paint";
  const painted = variant !== "solari";
  return (
    <AbsoluteFill style={{ background: "#b9c2b4" }}>
      <Camera3d transform={Transform.fromXyz(-2.6, 0.7, 7.6).lookingAt([0.3, 1.5, 0])} projection={{ Perspective: { fov: (44 * Math.PI) / 180 } }}>
        {traced && <SolariLighting bounces={2} />}
      </Camera3d>
      <ToneMapping exposure={traced ? 0.16 : 1} />
      {traced && <Atmosphere light />}
      {!traced && <AmbientLight brightness={220} />}
      <DirectionalLight volumetric transform={Transform.fromXyz(-7, 6, -9).lookingAt([0, 1, 2])} illuminance={traced ? 40000 : 9000} color="#ffe0b0" shadow_maps_enabled />
      <VolumetricFog ambient={0.06} ambientColor="#c8d6cc" />
      <FogVolume name="mist" position={[0, 2, -2]} scale={[40, 6, 40]} density={0.03} color="#dfe8dc" scattering={0.6} anisotropy={0.85} falloff={0.6} />
      {painted && <Look mode="paint" bands={variant === "both" ? 8 : 4} shadow="#8f9aa6" mid="#d9cfc0" grain={0.35} rag={1.6} stroke={0.35} strokeScale={0.12} edge={0.25} sky={["#8fb0aa", "#e9dfc0"]} haze="#cdd8cf" hazeDensity={0.03} hazeSun="#ffe6b8" water={0} foam={0.03} foamColor="#dfe6d6" skip={["ui"]} />}
      <Outline color="#3a352e" width={1.5} far={30} skip={["ui"]} />

      {/* water: a plain mirror-ish surface so Solari traces its reflections, with a traced bed under it */}
      <Mesh3d name="water" transform={Transform.fromXyz(0, -0.02, 0)}><Cuboid half_size={[40, 0.02, 40]} /><StandardMaterial base_color="#27413d" perceptual_roughness={0.12} reflectance={0.5} /></Mesh3d>
      <Mesh3d name="bed" transform={Transform.fromXyz(0, -0.6, 0)}><Cuboid half_size={[40, 0.3, 40]} /><StandardMaterial base_color="#1c2622" perceptual_roughness={1} /></Mesh3d>
      <Mesh3d name="bank" shape={BANK} transform={Transform.fromXyz(0.2, 0.0, 3.5)}><StandardMaterial base_color="#5d6a4a" perceptual_roughness={0.95} /></Mesh3d>

      {/* the monitor: a thick traced body, the glass an emitter */}
      <Entity transform={Transform.fromXyz(0, 1.45, 0).withRotation(Quat.fromEuler("XYZ", -0.04, 0, 0.03))}>
        <Mesh3d name="body"><Cuboid half_size={[2.16, 1.29, 0.18]} /><StandardMaterial base_color="#3c423e" perceptual_roughness={0.7} /></Mesh3d>
        <Mesh3d name="glass" pass="ui" allowOverlap transform={Transform.fromXyz(0, 0, 0.185)}><Cuboid half_size={[2.0, 1.125, 0.005]} /><StandardMaterial base_color="#ffffff" emissive={new LinearRgba(900, 950, 1000, 1)} /></Mesh3d>
      </Entity>

      {probe.includes("mon") && <Entity transform={Transform.fromXyz(5, 0, 2)}><Monitor w={{ f: 0, power: 1, sun: 1, water: 1, grow: 1, dusk: 0 }} emit={[900, 900, 900]} /></Entity>}
      {probe.includes("ms") && <Entity transform={Transform.fromXyz(5, 0, 2)}><Monitor w={W} emit={[900, 900, 900]}><Screen name="glass2" pass="ui" position={[0, 0, 0.14]} size={[4, 2.25]} resolution={[1600, 900]} crt={false} brightness={1} background="#0a0c0b"><AbsoluteFill style={{ background: "#eef0f2" }} /></Screen></Monitor></Entity>}
      {probe.includes("kb") && <Keyboard w={W} />}
      {probe.includes("ground") && <Ground w={W} />}
      {probe.includes("trees") && <Trees w={W} />}
      {probe.includes("grass") && <BankGrass w={W} />}
      {probe.includes("flies") && <Fireflies f={500} from={0} />}
      {probe.includes("screen") && <Screen name="glass" pass="ui" position={[-4, 2, 2]} size={[2, 1.1]} resolution={[1600, 900]} crt={false} brightness={1} background="#0a0c0b"><AbsoluteFill style={{ background: "#eef0f2" }} /></Screen>}
      {probe.includes("rob") && <Robot at={[-1, 1.2, 2]} tilt={0} spin={0} f={0} lean={[0, 0]} />}
      {TREES.map(([x, z, k], i) => (
        <Entity key={i} transform={Transform.fromXyz(x, -0.1, z).withRotation(Quat.fromEuler("XYZ", 0, i * 1.3, 0))}>
          <Mesh3d name={`wood-${i}`} shape={WOOD[k]}><StandardMaterial base_color="#5a4a3c" perceptual_roughness={0.9} /></Mesh3d>
          <Mesh3d name={`leaves-${i}`} allowOverlap shape={LEAVES[k]}><StandardMaterial base_color="#6f9a52" perceptual_roughness={0.8} /></Mesh3d>
        </Entity>
      ))}
      {[[-1.4, 3.9], [1.9, 3.3], [0.9, 4.3]].map(([x, z], i) => (
        <Mesh3d key={i} name={`rock-${i}`} allowOverlap shape={ROCK} transform={Transform.fromXyz(x, 0.1, z).withRotation(Quat.fromEuler("XYZ", 0, i * 2.1, 0))}><StandardMaterial base_color="#8d8a80" perceptual_roughness={0.9} /></Mesh3d>
      ))}
    </AbsoluteFill>
  );
}

registerRoot(() => (
  <>
    <Composition id="paint" component={() => <Set variant="paint" />} width={1280} height={720} fps={30} durationInFrames={30} />
    <Composition id="solari" component={() => <Set variant="solari" />} width={1280} height={720} fps={30} durationInFrames={30} />
    <Composition id="p-mon" component={() => <Set variant="both" probe="mon" />} width={1280} height={720} fps={30} durationInFrames={30} />
    <Composition id="p-rob" component={() => <Set variant="both" probe="rob" />} width={1280} height={720} fps={30} durationInFrames={30} />
    <Composition id="p-kb" component={() => <Set variant="both" probe="kb" />} width={1280} height={720} fps={30} durationInFrames={30} />
    <Composition id="p-ground" component={() => <Set variant="both" probe="ground" />} width={1280} height={720} fps={30} durationInFrames={30} />
    <Composition id="p-trees" component={() => <Set variant="both" probe="trees" />} width={1280} height={720} fps={30} durationInFrames={30} />
    <Composition id="p-grass" component={() => <Set variant="both" probe="grass" />} width={1280} height={720} fps={30} durationInFrames={30} />
    <Composition id="p-flies" component={() => <Set variant="both" probe="flies" />} width={1280} height={720} fps={30} durationInFrames={30} />
    <Composition id="p-screen" component={() => <Set variant="both" probe="screen" />} width={1280} height={720} fps={30} durationInFrames={30} />
    <Composition id="p-ms" component={() => <Set variant="both" probe="ms" />} width={1280} height={720} fps={30} durationInFrames={30} />
    <Composition id="p-all" component={() => <Set variant="both" probe="ms kb ground trees grass flies rob" />} width={1280} height={720} fps={30} durationInFrames={30} />
    <Composition id="both" component={() => <Set variant="both" />} width={1280} height={720} fps={30} durationInFrames={30} />
  </>
));

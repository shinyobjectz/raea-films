// Study: the open sea and a boat on it. The sea is a real spectrum: Blender's FFT ocean baked a mesh a frame
// (blender/studies/ocean.py), so the swell rises against the sky, the crests are pulled sharp, and foam sits where the
// surface folds. The boat rides the same waves: its heave, pitch and roll are read off the sea under its hull. The
// light is a sky panorama and one sun (or a moon): storm by day, clear day, night.
//   raea render studies/ocean.tsx --composition ocean-storm --at 0 -o out/studies/ocean/
import { AbsoluteFill, Composition, registerRoot, staticFile, useCurrentFrame } from "raea";
import { Canvas3D, Environment, Fog, MeshSequence, Model, ToneMapping } from "raea/3d";
import { Camera3d } from "raea/camera";
import { LinearRgba } from "raea/color";
import { DirectionalLight, PointLight } from "raea/light";
import { Cuboid, Mesh3d, Plane3d } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Transform } from "raea/transform";
import storm from "../media/ocean/storm.boat.json";

type Ride = { frames: number; y: number[]; pitch: number[]; roll: number[] };
type Sky = { haze: string; hdri: string; sky: number; turn: number; sun: number; from: [number, number, number]; ev: number; lamp: number };
const SKIES: Record<string, Sky> = {
  storm: { haze: "#7d8288", hdri: "kloofendal_overcast_puresky", sky: 0.5, turn: 0.6, sun: 2500, from: [-60, 40, -80], ev: -0.5, lamp: 0 },
  day: { haze: "#aab6c4", hdri: "kloofendal_48d_partly_cloudy_puresky", sky: 0.6, turn: 2.2, sun: 60000, from: [-70, 55, -60], ev: -1.2, lamp: 0 },
  night: { haze: "#0f171f", hdri: "qwantani_moonrise_puresky", sky: 0.035, turn: 2.6, sun: 1400, from: [40, 30, -90], ev: 0.6, lamp: 1 },
};

function Ocean({ sea, ride, sky, top }: { sea: string; ride: Ride; sky: Sky; top?: boolean }) {
  const f = useCurrentFrame();
  const i = Math.min(ride.frames - 1, f);
  const t = f / 30;
  // a slow arc round the boat, low over the water, rising and falling a little with its own swell
  const a = 0.95 + 0.12 * t;
  // `top`: from high astern, to see the wake the hull leaves
  const eye: [number, number, number] = top ? [9, 15, -24] : [17 * Math.sin(a), 2.6 + 0.5 * Math.sin(t * 0.9), 17 * Math.cos(a)];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Canvas3D>
        <Camera3d transform={Transform.fromXyz(...eye).lookingAt([0, 1.4 + ride.y[i] * 0.6, 0])} projection={{ Perspective: { fov: (38 * Math.PI) / 180, near: 0.1, far: 6000 } }} />
        <ToneMapping exposure={sky.ev} />
        {/* the far sea fades into the sky's own horizon colour, so the baked patch has no edge */}
        <Fog color={sky.haze} near={120} far={1500} />
        <Environment src={staticFile(`hdri/${sky.hdri}.hdr`)} intensity={sky.sky} rotation={sky.turn} background />
        <DirectionalLight illuminance={sky.sun} shadow_maps_enabled transform={Transform.fromXyz(...sky.from).lookingAt([0, 0, 0])} />
        <MeshSequence name="sea" src={staticFile(`ocean/${sea}.rseq`)} frame={i} color="#ffffff" roughness={0.14} reflectance={0.35} metalness={0} clearcoat={0} />
        {/* spray off the breaking crests and the bow: droplets on ballistic paths, baked with the sea */}
        <MeshSequence name="spray" src={staticFile(`ocean/${sea}-spray.rseq`)} frame={i} color="#ffffff" roughness={0.9} metalness={0} clearcoat={0} opacity={0.75} />
        {/* the sea beyond the baked patch, to the horizon, and a floor under it all so no light comes up through */}
        <Mesh3d name="far-sea" transform={Transform.fromXyz(0, -4.2, 0)}>
          <Cuboid half_size={[5000, 0.5, 5000]} />
          <StandardMaterial base_color="#03131a" perceptual_roughness={0.2} reflectance={0.35} />
        </Mesh3d>
        <Model name="boat" src={staticFile("models/sea/boat.glb")} position={[0, ride.y[i] - 0.85, 0]} rotation={[-ride.pitch[i], 0, ride.roll[i]]} />
        {sky.lamp > 0 && <PointLight intensity={220000} color="#ffb060" range={30} transform={Transform.fromXyz(0.9, ride.y[i] + 3.4, 1.2)} />}
        {sky.lamp > 0 && (
          <Mesh3d name="lamp" transform={Transform.fromXyz(0, ride.y[i] + 3.2, 0.5)}>
            <Cuboid half_size={[0.08, 0.08, 0.08]} />
            <StandardMaterial base_color="#ffffff" emissive={new LinearRgba(40, 24, 8, 1)} />
          </Mesh3d>
        )}
      </Canvas3D>
    </AbsoluteFill>
  );
}

registerRoot(() => (
  <>
    <Composition id="ocean-storm" component={() => <Ocean sea="storm" ride={storm as Ride} sky={SKIES.storm} />} width={1350} height={1080} fps={30} durationInFrames={(storm as Ride).frames} />
    <Composition id="ocean-wake" component={() => <Ocean sea="storm" ride={storm as Ride} sky={SKIES.day} top />} width={1350} height={1080} fps={30} durationInFrames={(storm as Ride).frames} />
    <Composition id="ocean-day" component={() => <Ocean sea="storm" ride={storm as Ride} sky={SKIES.day} />} width={1350} height={1080} fps={30} durationInFrames={(storm as Ride).frames} />
    <Composition id="ocean-night" component={() => <Ocean sea="storm" ride={storm as Ride} sky={SKIES.night} />} width={1350} height={1080} fps={30} durationInFrames={(storm as Ride).frames} />
  </>
));

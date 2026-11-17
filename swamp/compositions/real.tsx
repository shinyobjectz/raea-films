// First look at the photoreal direction: scanned assets under ray-traced light. Not the film.
import { AbsoluteFill, Composition, registerRoot, staticFile } from "raea";
import { Environment, Model } from "raea/3d";
import { Camera3d } from "raea/camera";
import { DirectionalLight, SolariLighting } from "raea/light";
import { Cuboid, Mesh3d } from "raea/mesh";
import { FogVolume, StandardMaterial, VolumetricFog } from "raea/pbr";
import { ToneMapping } from "raea/post_process";
import { Transform } from "raea/transform";

const m = (id: string, part = "cut") => staticFile(`models/${id}/${id}.${part}.gltf`);
function Test() {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Camera3d transform={Transform.fromXyz(-2.5, 0.8, 7.5).lookingAt([0.3, 1.8, 0])} projection={{ Perspective: { fov: (42 * Math.PI) / 180 } }}>
        <SolariLighting bounces={2} />
      </Camera3d>
      <ToneMapping exposure={-1.2} />
      <Environment src={staticFile("hdri/kloofendal_48d_partly_cloudy_puresky.hdr")} intensity={1} background rotation={2.2} />
      <DirectionalLight volumetric transform={Transform.fromXyz(-30, 28, -18).lookingAt([0, 1, 1])} illuminance={60000} color="#fff0dc" shadow_maps_enabled />
      <VolumetricFog ambient={0.04} />
      <FogVolume name="mist" position={[0, 3, 0]} scale={[80, 8, 80]} density={0.012} scattering={0.6} anisotropy={0.8} falloff={0.7} />
      <Mesh3d name="water" transform={Transform.fromXyz(0, -0.02, 0)}><Cuboid half_size={[60, 0.02, 60]} /><StandardMaterial base_color="#0d1512" perceptual_roughness={0.04} reflectance={0.5} /></Mesh3d>
      <Mesh3d name="bed" transform={Transform.fromXyz(0, -0.6, 0)}><Cuboid half_size={[60, 0.3, 60]} /><StandardMaterial base_color="#1c2622" perceptual_roughness={1} /></Mesh3d>
      <Model name="tree-a-wood" src={m("island_tree_02", "wood")} position={[-4, -0.1, -3]} scale={3.2} />
      <Model name="tree-a-leaves" src={m("island_tree_02", "leaves")} position={[-4, -0.1, -3]} scale={3.2} />
      <Model name="tree-b-wood" src={m("island_tree_01", "wood")} position={[5, -0.1, -5]} rotation={[0, 1.2, 0]} scale={2.6} />
      <Model name="tree-b-leaves" src={m("island_tree_01", "leaves")} position={[5, -0.1, -5]} rotation={[0, 1.2, 0]} scale={2.6} />
      <Model name="roots" src={m("root_cluster_01")} position={[0.3, -0.35, 2.5]} scale={1.2} />
      <Model name="trunk" src={m("dead_tree_trunk_02")} position={[2.5, 0.1, 3.5]} rotation={[0, 0.5, 0.1]} />
      <Model name="boulder" src={m("boulder_01")} position={[-2.2, 0, 3.4]} />
      <Model name="fern" src={m("fern_02", "0")} position={[-1.2, 0.2, 3.6]} scale={1.3} />
      <Model name="shrub" src={m("shrub_02")} position={[2.2, 0.1, 1.5]} scale={0.6} />
      <Model name="grass" src={m("grass_medium_02", "4")} position={[0.4, 0.35, 3.4]} />
      <Model name="calathea" src={m("calathea_orbifolia_01", "0")} position={[1.0, 0.3, 3.9]} />
    </AbsoluteFill>
  );
}
registerRoot(() => <Composition id="real" component={Test} width={1280} height={720} fps={30} durationInFrames={30} />);

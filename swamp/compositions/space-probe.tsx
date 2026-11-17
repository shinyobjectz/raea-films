// A minimal frame to find what stops the space stills settling: the ship's model alone, with and without Solari,
// and the stand-in box with one emissive light.
import { AbsoluteFill, Composition, registerRoot, staticFile } from "raea";
import { Environment, Model, Shadows, manifold } from "raea/3d";
import { Camera3d } from "raea/camera";
import { LinearRgba } from "raea/color";
import { DirectionalLight, SolariLighting } from "raea/light";
import { Mesh3d, Sphere } from "raea/mesh";
import { StandardMaterial, VolumetricFog } from "raea/pbr";
import { ToneMapping } from "raea/post_process";
import { Transform } from "raea/transform";

function P({ solari, what, env = false, k = 9000, near = false, rig = "" }: { solari: boolean; what: string; env?: boolean; k?: number; near?: boolean; rig?: string }) {
  return (
    <AbsoluteFill style={{ background: "#000000" }}>
      <Camera3d transform={near ? Transform.fromXyz(-100, 150, 380).lookingAt([-180, 30, 300]) : Transform.fromXyz(465, -90, 750).lookingAt([-185, -10, 300])} projection={{ Perspective: { fov: 0.61, far: 4000 } }}>
        {solari && <SolariLighting bounces={2} />}
      </Camera3d>
      <ToneMapping exposure={0.8} />
      {rig.includes("shadows") && <Shadows distance={70} firstCascade={12} cascades={3} mapSize={4096} />}
      {rig.includes("sky") && <Environment src={staticFile("hdri/belfast_sunset_puresky.hdr")} intensity={1} backgroundIntensity={1} background />}
      {rig.includes("fog") && <VolumetricFog ambient={0.05} ambientColor="#dfe9ee" />}
      {env && <Environment src={staticFile("hdri/belfast_sunset_puresky.hdr")} intensity={0.02} backgroundIntensity={0} />}
      <DirectionalLight transform={Transform.fromXyz(-400, 300, 800).lookingAt([0, 0, 0])} illuminance={24000} shadow_maps_enabled />
      {what === "model" && <Model name="ship" src={staticFile("models/mothership/mothership.glb")} />}
      {what === "box" && (
        <Mesh3d name="box" shape={manifold.box(300, 60, 500).move(-180, 0, 300)}>
          <StandardMaterial base_color="#777777" />
        </Mesh3d>
      )}
      {what === "sphere" && (
        <>
          <Mesh3d name="box" shape={manifold.box(300, 60, 500).move(-180, 0, 300)}>
            <StandardMaterial base_color="#777777" />
          </Mesh3d>
          <Mesh3d name="ball" transform={Transform.fromXyz(-180, 40, 300)}>
            <Sphere radius={4} />
            <StandardMaterial base_color="#ffffff" />
          </Mesh3d>
        </>
      )}
      {what === "glow" && (
        <>
          <Mesh3d name="box" shape={manifold.box(300, 60, 500).move(-180, 0, 300)}>
            <StandardMaterial base_color="#777777" />
          </Mesh3d>
          <Mesh3d name="lamp" transform={Transform.fromXyz(-180, 40, 300)}>
            <Sphere radius={4} />
            <StandardMaterial base_color="#ffffff" emissive={new LinearRgba(k, k, k, 1)} />
          </Mesh3d>
        </>
      )}
    </AbsoluteFill>
  );
}
registerRoot(() => (
  <>
    <Composition id="model-raster" component={() => <P solari={false} what="model" />} width={480} height={270} fps={30} durationInFrames={30} />
    <Composition id="model-solari" component={() => <P solari what="model" />} width={480} height={270} fps={30} durationInFrames={30} />
    <Composition id="glow-solari-env" component={() => <P solari env what="glow" />} width={480} height={270} fps={30} durationInFrames={30} />
    <Composition id="model-solari-env" component={() => <P solari env what="model" />} width={480} height={270} fps={30} durationInFrames={30} />
    <Composition id="glow200-solari" component={() => <P solari what="glow" k={200} />} width={480} height={270} fps={30} durationInFrames={30} />
    <Composition id="glow200-near" component={() => <P solari what="glow" k={200} near />} width={480} height={270} fps={30} durationInFrames={30} />
    <Composition id="box-solari" component={() => <P solari what="box" />} width={480} height={270} fps={30} durationInFrames={30} />
    <Composition id="sphere-solari" component={() => <P solari what="sphere" />} width={480} height={270} fps={30} durationInFrames={30} />
    <Composition id="glow50-solari" component={() => <P solari what="glow" k={50} />} width={480} height={270} fps={30} durationInFrames={30} />
    <Composition id="glow5-solari" component={() => <P solari what="glow" k={5} />} width={480} height={270} fps={30} durationInFrames={30} />
    <Composition id="glow5-shadows" component={() => <P solari what="glow" k={5} rig="shadows" />} width={480} height={270} fps={30} durationInFrames={30} />
    <Composition id="glow5-sky" component={() => <P solari what="glow" k={5} rig="sky" />} width={480} height={270} fps={30} durationInFrames={30} />
    <Composition id="glow5-fog" component={() => <P solari what="glow" k={5} rig="fog" />} width={480} height={270} fps={30} durationInFrames={30} />
    <Composition id="glow-solari" component={() => <P solari what="glow" />} width={480} height={270} fps={30} durationInFrames={30} />
  </>
));

// Study 1: flat 2D type that lives between the back wall and the furniture. The word is an ordinary page (Geist,
// rising a letter at a time) on a clear, flat <Screen> standing just off the wall, square to it: the chair, the
// monitor and the plant cut into it by real depth, and it slides behind them as the camera drifts. (Two layered
// canvases don't give two layers: the engine draws every Canvas3D as one scene, 11-11.)
//   raea render studies/occlusion.tsx --composition study-occlusion --at 0,20,50 -o out/studies/occlusion/
import { AbsoluteFill, Composition, registerRoot, staticFile, useCurrentFrame, interpolate } from "raea";
import { Canvas3D, Model, Screen, ToneMapping } from "raea/3d";
import { Camera3d } from "raea/camera";
import { DirectionalLight } from "raea/light";
import { Cuboid, Mesh3d } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Transform } from "raea/transform";

const W = 1350, H = 1080;
const FACE = `@font-face { font-family: GeistStay; src: url(${staticFile("fonts/Geist.ttf")}); font-weight: 100 900; }`;
const part = (file: string, at: [number, number, number], yaw = 0, clip?: string, t = 0) => (
  <Model key={file} name={file} src={staticFile(`models/office/${file}.glb`)} position={at} rotation={[0, yaw, 0]} {...(clip ? { animation: clip, time: t, loop: false } : {})} />
);

function Study() {
  const f = useCurrentFrame();
  const t = f / 30;
  // a slow push and drift, so the word's occlusion changes as the furniture slides across it
  const x = interpolate(f, [0, 90], [1.6, -0.4], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cam = <Camera3d transform={Transform.fromXyz(x, 1.5, 5.4).lookingAt([0.1, 1.15, -0.8])} projection={{ Perspective: { fov: (36 * Math.PI) / 180, near: 0.05, far: 100 } }} />;
  const sun = <DirectionalLight illuminance={9000} shadow_maps_enabled transform={Transform.fromXyz(-4, 5, 5).lookingAt([0, 0.6, -0.5])} />;
  const TEXT = "MORNING.";
  return (
    <AbsoluteFill style={{ background: "#0b0b0d" }}>
      <style>{FACE}</style>
      <Canvas3D>
        {cam}{sun}<ToneMapping exposure={0} />
        <Mesh3d name="floor" transform={Transform.fromXyz(0, -0.05, 0)}><Cuboid half_size={[8, 0.05, 8]} /><StandardMaterial base_color="#5f6064" perceptual_roughness={0.85} /></Mesh3d>
        <Mesh3d name="wall" transform={Transform.fromXyz(0, 3, -2.5)}><Cuboid half_size={[8, 3, 0.1]} /><StandardMaterial base_color="#8d8d88" perceptual_roughness={0.9} /></Mesh3d>
        {part("whiteboard", [2.6, 1.55, -2.39])}
        {part("wall-clock", [-2.6, 2.3, -2.39], 0, "hands", t / 3)}
        <Screen name="word" crt={false} background="transparent" resolution={[2200, 520]} size={[6.2]} position={[0.1, 1.75, -2.15]}>
          <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ display: "flex", fontFamily: "GeistStay, sans-serif", fontWeight: 900, fontSize: 400, letterSpacing: -12, color: "#ffffff", whiteSpace: "pre" }}>
          {[...TEXT].map((ch, i) => {
            const k = interpolate(f - 4 - i * 2, [0, 9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const e = 1 - (1 - k) ** 3;
            return <span key={i} style={{ display: "inline-block", transform: `translateY(${((1 - e) * 420).toFixed(1)}px)`, opacity: k > 0 ? 1 : 0 }}>{ch}</span>;
          })}
        </div>
          </AbsoluteFill>
        </Screen>
          {part("desk", [0, 0, 0])}
          {part("chair", [0.2, 0, 0.95], Math.PI * 0.85 + t * 0.5)}
          {part("monitor", [0, 0.788, -0.43], 0, "swing", Math.min(0.999, t / 2.5))}
          {part("keyboard", [0, 0.788, 0.18])}
          {part("mug", [-0.5, 0.788, 0.05])}
          {part("desk-lamp", [-0.82, 0.788, -0.3], 0.6)}
          {part("plant", [-1.6, 0, -0.4])}
          {part("filing-cabinet", [1.7, 0, -0.5])}
      </Canvas3D>
    </AbsoluteFill>
  );
}
registerRoot(() => <Composition id="study-occlusion" component={Study} width={W} height={H} fps={30} durationInFrames={91} />);

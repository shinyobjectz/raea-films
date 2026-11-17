// The photograph on the intro's collage (tools/copy-page.sh, v3/intro.tsx): the threshold's archway and its great
// studded door, the first thing the film shows after the intro, seen whole and real, by the hallway's own lens at its
// first frame, the torch burning, no cursor. Photocopied onto the sheet under the copier's glass, it cuts to the same door
// drawn, in the same place.
//   raea render v3/arch-still.tsx --composition arch --frame 0 -o media/title/arch.png
import { AbsoluteFill, Composition, registerRoot, staticFile } from "raea";
import { AntiAliasing, Bloom, Canvas3D, Environment, Model, Shadows, ToneMapping } from "raea/3d";
import { Camera3d } from "raea/camera";
import { Transform } from "raea/transform";
import { RZ } from "../sets/rooms";
import { Flame } from "./fire";
import { FilmLook } from "./look";
import { FPS, INTRO_OVER } from "./plan";
import { shotOf } from "./kit";
import { TORCH, TORCH_FLAME, thresholdView } from "./worlds";

function Arch() {
  const s = shotOf("hallway"), t = INTRO_OVER / FPS;
  const { cam: c } = thresholdView(s, t);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Canvas3D>
        <Camera3d transform={Transform.fromXyz(...c.eye).lookingAt(c.look)} projection={{ Perspective: { fov: (c.fov * Math.PI) / 180, near: 0.03, far: 6000 } }} />
        <AntiAliasing mode="smaa" />
        <ToneMapping mode="agx" exposure={0.9} />
        <Bloom intensity={0.2} threshold={0.8} />
        <Shadows mapSize={4096} distance={40} firstCascade={10} cascades={3} />
        <Environment src={staticFile("hdri/qwantani_moonrise_puresky.hdr")} intensity={0.05} rotation={1.2} />
        <Model name="wall" src={staticFile("models/threshold/wall.glb")} position={[0, 0, -RZ]} />
        <Model name="floor" src={staticFile("models/threshold/floor.glb")} position={[0, 0, -RZ]} />
        <Model name="castle-door" src={staticFile("models/cathedral/door.glb")} position={[0, 0, -RZ]} animation="open" time={0} loop={false} />
        <Model name="torch" src={staticFile("models/threshold/torch.glb")} position={TORCH} />
        <Flame name="torch-flame" at={TORCH_FLAME} h={0.34} cam={c} t={s.from + t} gutter={0} light={5200} seed={1} />
        {/* (all of it real: no drawing, no grain or vignette, which the copy has its own of) */}
        <FilmLook look={{ base: 0, warm: 0.2, contrast: 0.7, halation: 0.4, grain: 0 }} seed={s.f0} cam={c} lines={false} />
      </Canvas3D>
    </AbsoluteFill>
  );
}
registerRoot(() => <Composition id="arch" component={Arch} width={2700} height={2160} fps={FPS} durationInFrames={1} />);

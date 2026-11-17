// Look test: type through the heat pass, after the director's "blu" reference (white-hot letters, an orange smear where the
// heat sits, a blue fringe, grain on black). The letters are white (the hottest thing on screen); a warm patch drifts
// behind them, so the heat pools in a few letters and moves through the line.
import { AbsoluteFill, Composition, Sequence, registerRoot, staticFile, useCurrentFrame } from "raea";
import { ToneMapping } from "raea/3d";
import { Camera3d } from "raea/camera";
import { Cuboid, Mesh3d } from "raea/mesh";
import { Text3D } from "raea/text";
import { StandardMaterial } from "raea/pbr";
import { Quat, Transform } from "raea/transform";
import { heat } from "./thermal/temp";
import { Heat } from "./thermal/heat";

const FPS = 30;
const EACH = 90;
const LINES = ["Every editor has a touch.", "Fingerprint"];

function Line({ text, i }: { text: string; i: number }) {
  const f = useCurrentFrame();
  const u = f / EACH;
  // the warm patch: drifts left to right through the line, slowly breathing
  const x = -3.2 + 6.4 * u;
  const r = 0.9 + 0.15 * Math.sin(f * 0.21);
  return (
    <>
      <Camera3d transform={Transform.fromXyz(0, 0, 9).lookingAt([0, 0, 0])} />
      <Mesh3d name={`line-${i}`} transform={Transform.fromXyz(0, 0, 0)}>
        <Text3D size={i === 0 ? 0.95 : 1.9} depth={0.05} weight={800}>{text}</Text3D>
        <StandardMaterial base_color={heat(1)} unlit />
      </Mesh3d>
      <Mesh3d name={`warm-${i}`} transform={Transform.fromXyz(x, 0.1 * Math.sin(f * 0.07), -1.2).withRotation(Quat.fromRotationX(Math.PI / 2)).withScale([r, 1, r * 0.55])}>
        <Cuboid half_size={[2.4, 0.001, 2.4]} />
        <StandardMaterial base_color={heat(0.36)} base_color_texture={staticFile("thermal/blob.png")} unlit alpha_mode="Blend" />
      </Mesh3d>
      <Heat frame={f + i * 50} recipe={{ lum: 1, gamma: 1 }} floor={0.02} gain={1.05} />
      <ToneMapping mode="none" />
    </>
  );
}

function Board() {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {LINES.map((t, i) => (
        <Sequence key={i} from={i * EACH} durationInFrames={EACH}>
          <Line text={t} i={i} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}

registerRoot(() => <Composition id="thermal-type" width={1920} height={1080} fps={FPS} durationInFrames={LINES.length * EACH} component={Board} />);

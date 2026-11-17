// Where the HDRI's sun sits in the world at rotation 0: four views, toward -z, +x, +z, -x.
import { AbsoluteFill, Composition, registerRoot, staticFile } from "raea";
import { Environment } from "raea/3d";
import { Camera3d } from "raea/camera";
import { ToneMapping } from "raea/post_process";
import { Transform } from "raea/transform";
const DIRS: Record<string, [number, number, number]> = { nz: [0, 0.6, -1], px: [1, 0.6, 0], pz: [0, 0.6, 1], nx: [-1, 0.6, 0] };
const V = (d: string) => () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Camera3d transform={Transform.fromXyz(0, 1, 0).lookingAt([DIRS[d][0], 1 + DIRS[d][1], DIRS[d][2]])} projection={{ Perspective: { fov: (90 * Math.PI) / 180 } }} />
    <ToneMapping exposure={-3} />
    <Environment src={staticFile("hdri/kloofendal_48d_partly_cloudy_puresky.hdr")} intensity={1} background rotation={1.24} />
  </AbsoluteFill>
);
registerRoot(() => <>{Object.keys(DIRS).map((d) => <Composition key={d} id={d} component={V(d)} width={480} height={270} fps={30} durationInFrames={2} />)}</>);

// Probes for the Earth's placement (delete when the Earth renders).
import { Composition, registerRoot } from "raea";
import { manifold } from "raea/3d";
import { Mesh3d, Sphere } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Transform } from "raea/transform";
import { SpaceShot, orbitOver } from "../components/space";

const deg = (d: number) => (d * Math.PI) / 180;
const orbit = orbitOver({ lat: 30, lon: -90.5, alt: 200e3, up: [0, 1, 0], north: [0, 0, -1], sun: { elev: 30, bearing: 270 } });
const P: Record<string, { look: [number, number, number]; up?: [number, number, number]; at: [number, number, number]; r: number }> = {
  down: { look: [0, -1, 0], up: [0, 0, -1], at: [0, -50, 0], r: 5 },
  ahead: { look: [0, 0, -1], at: [0, 0, -50], r: 5 },
  big: { look: [0, 0, -1], at: [0, 0, -3e6], r: 1e6 },
  huge: { look: [0, 0, -1], at: [0, 0, -2e7], r: 6.371e6 },
};
registerRoot(() => (
  <>
    {Object.entries(P).map(([k, p]) => (
      <Composition key={k} id={k} width={480} height={270} fps={30} durationInFrames={30} component={() => (
        <SpaceShot cam={{ pos: [0, 0, 0], look: p.look, up: p.up, fov: deg(50) }} orbit={orbit} exposure={1.4} debug="noearth-nosolari">
          <Mesh3d name="probe" transform={Transform.fromXyz(...p.at)}>
            <Sphere radius={p.r} ico={20} />
            <StandardMaterial base_color="#ffffff" />
          </Mesh3d>
        </SpaceShot>
      )} />
    ))}
  </>
));

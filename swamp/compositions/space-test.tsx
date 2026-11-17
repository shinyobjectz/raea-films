// Stills of the mothership in orbit, to judge the model, its plating and the light before the shots use it.
import { Composition, registerRoot } from "raea";
import { Mothership, PORT } from "../components/mothership";
import { shipPoint } from "../components/ship-plan";
import { Beam, type Backdrop, SpaceShot, type Sun, onPlate } from "../components/space";
import type { Lens } from "../components/shot";

const deg = (d: number) => (d * Math.PI) / 180;
const VIEWS: Record<string, { cam: Lens; back: Backdrop; sun: Sun; beam?: boolean; exposure?: number }> = {
  far: { cam: { pos: [465, -90, 750], look: [-185, -10, 300], fov: deg(35) }, back: { plate: "night", yaw: 55, pitch: -9, k: 500 }, sun: { yaw: 280, pitch: -4 }, beam: true, exposure: 2.4 },
  under: { cam: { pos: [-90, -200, 390], look: PORT, fov: deg(40) }, back: { plate: "night", yaw: 20, pitch: -30, k: 500 }, sun: { yaw: 260, pitch: -10 }, beam: true, exposure: 2.4 },
  deck: { cam: { pos: [-40, 75, 120], look: [-250, 25, 430], fov: deg(40) }, back: { plate: "night", yaw: 146, pitch: -14, k: 500 }, sun: { yaw: 20, pitch: 14 }, exposure: 2.4 },
};

function Still({ view, debug = "" }: { view: string; debug?: string }) {
  const v = VIEWS[view];
  const ground = onPlate(v.back, 0.42, 0.78);
  return (
    <SpaceShot cam={v.cam} back={v.back} sun={v.sun} exposure={v.exposure} debug={debug}>
      {!debug.includes("noship") && <Mothership f={12} beam={v.beam ? 1 : 0} debug={debug} />}
      {v.beam && !debug.includes("nobeam") && <Beam from={ground} to={PORT} eye={v.cam.pos} />}
    </SpaceShot>
  );
}

registerRoot(() => (
  <>
    {Object.keys(VIEWS).map((k) => (
      <Composition key={k} id={k} component={() => <Still view={k} />} width={960} height={540} fps={30} durationInFrames={30} />
    ))}
    {["noearth", "nobeam", "noearth-nobeam", "noearth-nobeam-nolights", "noearth-nobeam-nomodel", "noearth-noship", "noearth-noship-nograde", "noearth-nobeam-nomodel-nograde"].map((d) => (
      <Composition key={d} id={`far-${d}`} component={() => <Still view="far" debug={d} />} width={960} height={540} fps={30} durationInFrames={30} />
    ))}
  </>
));

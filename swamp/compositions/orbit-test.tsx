// Key stills for the orbit, shot as Abrams or Spielberg would: low orbit with the Earth's limb curving across the
// frame, the sun going down over it behind the ship, the flare off the sun and the beam's port, the ship's dark
// underside and its lights over the night side, and the beam rising off the Gulf coast's lights into it.
import { Composition, registerRoot } from "raea";
import { LensDistortion } from "raea/post_process";
import { Mothership, PORT } from "../components/mothership";
import { Beam, SpaceShot, frameOrbit } from "../components/space";
import type { Lens } from "../components/shot";

const deg = (d: number) => (d * Math.PI) / 180;
const W = 960, H = 540, A = W / H;
type View = { cam: Lens; alt: number; limb: number; roll?: number; sun: [number, number]; foot: [number, number]; exposure: number; flare: number };
const VIEWS: Record<string, View> = {
  // the ship over the limb, the sun just above it right of the ship, the beam from the lower left
  sunset: { cam: { pos: [520, -160, 820], look: [-185, -10, 300], fov: deg(34) }, alt: 600e3, limb: 8, roll: -4, sun: [0.7, 0.7], foot: [0.2, 0.93], exposure: 2.4, flare: 30 },
  // closer and lower: the hull looms over the frame and runs out of it, the sun low under its edge
  loom: { cam: { pos: [200, -230, 640], look: [-170, 10, 330], fov: deg(42) }, alt: 600e3, limb: 13, roll: -7, sun: [0.87, 0.705], foot: [0.3, 0.97], exposure: 2.4, flare: 30 },
  // under the port looking up the beam into the ship, the limb low across the frame's foot
  belly: { cam: { pos: [-40, -380, 520], look: [-170, -40, 260], fov: deg(46) }, alt: 600e3, limb: 21, roll: 6, sun: [0.93, 0.36], foot: [0.62, 1.3], exposure: 2.4, flare: 30 },
};

function Still({ v, debug = "" }: { v: View; debug?: string }) {
  const orbit = frameOrbit({ cam: v.cam, aspect: A, alt: v.alt, limb: v.limb, roll: v.roll, sun: v.sun, foot: v.foot, lat: 30.0, lon: -90.5 });
  return (
    <SpaceShot cam={v.cam} orbit={orbit} exposure={v.exposure} aspect={A} flare={{ sun: v.flare }} debug={debug}>
      {!debug.includes("noship") && <Mothership f={12} beam={1} debug={debug} />}
      {!debug.includes("nobeam") && <Beam from={orbit.foot} to={PORT} eye={v.cam.pos} glowK={debug.includes("noglow") ? 0 : undefined} k={debug.includes("nocore") ? 0 : undefined} />}
      {!debug.includes("nolens") && <LensDistortion k1={0.025} />}
    </SpaceShot>
  );
}

registerRoot(() => (
  <>
    {Object.entries(VIEWS).map(([k, v]) => (
      <Composition key={k} id={k} component={() => <Still v={v} />} width={W} height={H} fps={30} durationInFrames={30} />
    ))}
    {["noflare-noglow"].map((d) => <Composition key={d} id={`sunset-${d}`} component={() => <Still v={VIEWS.sunset} debug={d} />} width={W} height={H} fps={30} durationInFrames={30} />)}
    {Object.entries(VIEWS).map(([k, v]) => (
      <Composition key={`${k}-hd`} id={`${k}-hd`} component={() => <Still v={v} />} width={1920} height={1080} fps={30} durationInFrames={30} />
    ))}
    <Composition id="sunset-noflare" component={() => <Still v={VIEWS.sunset} debug="noflare" />} width={W} height={H} fps={30} durationInFrames={30} />
  </>
));

// Stills of the Earth alone (components/earth.tsx), to judge it against NASA's photographs from orbit before the shots
// use it: the whole globe from 15,000 km at dusk over Louisiana, the limb at an orbital sunset from 400 km, and the
// night side's cities from 3,000 km.
import { Composition, registerRoot } from "raea";
import { SpaceShot, orbitOver, type Orbit } from "../components/space";
import type { EarthLook } from "../components/earth";
import type { Lens } from "../components/shot";

const deg = (d: number) => (d * Math.PI) / 180;
const dir = (headingDeg: number, pitchDeg: number): [number, number, number] => {
  // heading from north (world -z) toward east (+x)
  const h = deg(headingDeg), p = deg(pitchDeg);
  return [Math.sin(h) * Math.cos(p), Math.sin(p), -Math.cos(h) * Math.cos(p)];
};
const far = (d: [number, number, number], k = 1e6): [number, number, number] => [d[0] * k, d[1] * k, d[2] * k];

// the world: the ground below the camera, its up +y and its north -z (east +x)
const over = (lat: number, lon: number, alt: number, elev: number, bearing: number) =>
  orbitOver({ lat, lon, alt, up: [0, 1, 0], north: [0, 0, -1], sun: { elev, bearing } });

const VIEWS: Record<string, { cam: Lens; orbit: Orbit; exposure: number; look?: Partial<EarthLook> }> = {
  // straight down on Louisiana from 15,000 km, north up, the sun 5 degrees under its western horizon
  globe: { cam: { pos: [0, 0, 0], look: [0, -1, 0], up: [0, 0, -1], fov: deg(42) }, orbit: over(30, -90.5, 15e6, -5, 270), exposure: 1.4 },
  // 400 km up over the Pacific, looking west along the horizon as the sun sets behind it
  limb: { cam: { pos: [0, 0, 0], look: far(dir(270, -17)), fov: deg(55) }, orbit: over(18, -150, 400e3, -21.5, 268), exposure: 1.4 },
  // 3,000 km over the Gulf after dark, looking north-east across the lit cities to the dusk band
  night: { cam: { pos: [0, 0, 0], look: far(dir(20, -38)), fov: deg(50) }, orbit: over(24, -92, 3000e3, -12, 290), exposure: 1.4 },
};

registerRoot(() => (
  <>
    {Object.entries(VIEWS).map(([k, v]) => (
      <Composition key={k} id={k} component={() => <SpaceShot cam={v.cam} orbit={v.orbit} exposure={v.exposure} look={v.look} />} width={960} height={540} fps={30} durationInFrames={30} />
    ))}
    {["plain-noair", "noair", "plain-noair-nosolari", "noair-nosolari", "nosolari"].map((d) => (
      <Composition key={d} id={`globe-${d}`} component={() => <SpaceShot cam={VIEWS.globe.cam} orbit={VIEWS.globe.orbit} exposure={1.4} debug={d} />} width={960} height={540} fps={30} durationInFrames={30} />
    ))}
    <Composition id="low-plain" component={() => <SpaceShot cam={VIEWS.globe.cam} orbit={over(30, -90.5, 200e3, 30, 270)} exposure={1.4} debug={"plain-noair-nosolari-white"} />} width={960} height={540} fps={30} durationInFrames={30} />
  </>
));

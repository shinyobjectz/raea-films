// The forest road at night (blender/blockout.py road, a: directed, b: its reroll) and the car (blockout.py car). In the
// hold the asphalt is only damp; on the hit it soaks (a dark mirror laid over it, puddles opening), and the car comes
// down the lane through the puddle in front of the camera on PASS, its headlights the light. The word "wetter" lies on
// the road from the soak. The paint shot: the car stopped, its paint deepened on the stop's hits.
import { staticFile } from "raea";
import { Environment, ImagePlane, Refinish } from "raea/3d";
import { Mesh3d, Plane3d, Sphere } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Transform } from "raea/transform";
import { Glb, Glow, type V3 } from "./kit";
import { PAINT_STEPS, PASS, SOAK } from "./plan";

/** the car's lane (its centre across) and speed; it reaches the camera's puddle (z -2) on PASS */
export const LANE = -1.6, SPEED = 24, PUDDLE_Z = -2;
export const carZ = (t: number) => PUDDLE_Z - SPEED * (PASS - t);
/** the moon: dim and blue-white, from high on the left (the film's light at night is the car's) */
export const MOON = { from: [-20, 30, -30] as V3, to: [0, 0, -10] as V3 };
/** the moon over the paint: on the camera's side, high and from ahead of the slide, so it grazes along the panel the
 *  100 mm sees (the road's moon lights the car's far side) */
export const PAINT_MOON = { from: [14, 22, -26] as V3, to: [0.9, 0.7, 0] as V3 };

function Car({ z, lit = true }: { z: number; lit?: boolean }) {
  return (
    <>
      <Glb file="gb-car-a" name="car" at={[LANE, 0, z]} />
      {lit && [-0.6, 0.6].map((dx, k) => <Glow key={k} name={`headlight-${k}`} at={[LANE + dx, 0.68, z + 2.28]} half={[0.17, 0.05, 0.02]} lum={9000} rgb={[1, 0.95, 0.85]} />)}
      {lit && [-0.7, 0.7].map((dx, k) => <Glow key={k} name={`taillight-${k}`} at={[LANE + dx, 0.8, z - 2.27]} half={[0.14, 0.04, 0.02]} lum={1200} rgb={[1, 0.08, 0.04]} />)}
    </>
  );
}

const PUDDLES: { x: number; z: number; rx: number; rz: number }[] = [
  { x: -1.4, z: PUDDLE_Z, rx: 1.4, rz: 1.1 }, { x: 1.2, z: -7, rx: 0.9, rz: 1.3 }, { x: -2.2, z: -13, rx: 0.8, rz: 1.6 }, { x: 0.6, z: -21, rx: 1.0, rz: 1.2 },
];

export function Road({ t, v, reroll = false, montage = false }: { t: number; v: string; reroll?: boolean; montage?: boolean }) {
  const wet = !reroll && (montage || t >= SOAK);
  const z = montage ? -9 + 14 * Math.max(0, t - 74.12) : carZ(t);
  return (
    <>
      <Environment src={staticFile("hdri/sunset_forest.hdr")} intensity={0.03} rotation={1.2} background />
      <Glb file={`gb-road-${v}`} />
      {wet && (
        <>
          <Mesh3d name="wet" castShadow={false} transform={Transform.fromXyz(0, 0.004, -60)}>
            <Plane3d half_size={[3.5, 72]} />
            <StandardMaterial base_color="#0d0e10" perceptual_roughness={0.07} reflectance={0.55} />
          </Mesh3d>
          {PUDDLES.map((p, k) => (
            <Mesh3d key={k} name={`puddle-${k}`} castShadow={false} transform={Transform.fromXyz(p.x, 0.008, p.z).withScale([p.rx, 1, p.rz])}>
              <Plane3d half_size={[1, 1]} />
              <StandardMaterial base_color="#050607" perceptual_roughness={0.02} reflectance={0.7} />
            </Mesh3d>
          ))}
        </>
      )}
      {/* in the scene for the whole shot (a picture made mid-render keeps its first state), all but nothing until the soak */}
      {!montage && !reroll && <ImagePlane name="word-wetter" src={staticFile("words/wetter.png")} width={3.2} scale={wet ? 1 : 1e-4} position={[-0.3, 0.012, -7.5]} rotation={[-Math.PI / 2, 0, 0]} shadow={false} />}
      <Car z={z} />
    </>
  );
}

/** the paint at `t`: dull, then deeper on each of the stop's hits */
const PAINTS = ["#5a2320", "#7a0f12", "#8c0710"];
export const paintAt = (t: number, montage: boolean) => (montage ? PAINTS[2] : PAINTS[PAINT_STEPS.filter((s) => t >= s).length]);
const BEADS = Array.from({ length: 70 }, (_, i) => {
  const r = (k: number) => { const x = Math.sin(i * 91.7 + k * 47.3) * 43758.5453; return x - Math.floor(x); };
  return { y: 0.36 + 0.55 * r(1), z: -2.1 + 4.2 * r(2), s: 0.003 + 0.005 * r(3) };
});

export function Paint({ t, montage = false }: { t: number; montage?: boolean }) {
  const color = paintAt(t, montage);
  return (
    <>
      <Environment src={staticFile("hdri/sunset_forest.hdr")} intensity={0.35} rotation={2.6} background />
      {/* the road set's trees shade the panel from any moon: the 100 mm sees only the car, the forest is in its clearcoat */}
      {/* a new Refinish (and model name) per colour: an engine render can keep a material's first values */}
      <Refinish key={color} materials={[{ material: "paint", color, roughness: 0.18, metalness: 0.0 }]}>
        <Glb file="gb-car-a" name={`car-${color.slice(1)}`} at={[0, 0, 0]} />
      </Refinish>
      {BEADS.map((b, i) => (
        <Mesh3d key={i} name={`bead-${i}`} castShadow={false} transform={Transform.fromXyz(0.905 + b.s * 0.5, b.y, b.z)}>
          <Sphere radius={b.s} />
          <StandardMaterial base_color="#c8d2d8" perceptual_roughness={0.02} reflectance={0.6} />
        </Mesh3d>
      ))}
    </>
  );
}

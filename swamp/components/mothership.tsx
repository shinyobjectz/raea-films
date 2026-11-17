// The mothership: the robot's own pointer arrow at the scale of a city, 600 m tip to tail (components/ship-plan.ts).
// Its hull is the Blender-fitted model (solids/mothership.ts, then blender/mothership.py: bevelled, plated, crowded
// with machinery); what moves or glows is here: lit windows in the trench round its sides, running lights on the
// decks' edges, two beacons, the lens's dark glass and its iris, which takes the beam, and the engines burning.
import { staticFile } from "raea";
import { Entity, Instances, Model, crossSection, manifold } from "raea/3d";
import { LinearRgba, Srgba } from "raea/color";
import { Mesh3d, Sphere } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Quat, Transform } from "raea/transform";
import { ANT, BEACON, DECKS, ENGINE, ENGINES, EYE, GLASS_H, GLASS_R, PTS, STEM, TOWER, TRENCH, type P2, type V3, shipPoint } from "./ship-plan";
import { rnd } from "./timeline";

const glow = (c: string, k: number) => LinearRgba.from(Srgba.hex(c)).mul(k);
const SRC = staticFile("models/mothership/mothership.glb");
const OUT = crossSection.polygon(PTS);
const ring = (inset: number) => OUT.offset(-inset, { join: "miter" }).polygons as P2[][];

type Inst = { position: V3; rotation?: V3; scale?: V3 };
/** points every `step` m along each contour's edges, `margin` m clear of the corners, with the edge's turn */
function along(contours: P2[][], step: number, margin: number) {
  const out: { p: P2; yaw: number; e: number; s: number }[] = [];
  contours.forEach((c, ci) => {
    for (let e = 0; e < c.length; e++) {
      const [ax, ay] = c[e], [bx, by] = c[(e + 1) % c.length];
      const len = Math.hypot(bx - ax, by - ay);
      // the edge's direction in the ship's space (top view mirrored: x and y both negated)
      const yaw = Math.atan2(by - ay, -(bx - ax));
      for (let s = margin; s < len - margin; s += step) out.push({ p: [ax + ((bx - ax) * s) / len, ay + ((by - ay) * s) / len], yaw, e: e + ci * 100, s });
    }
  });
  return out;
}

// the windows: three rows on the trench's back wall, lit in bands as a building's floors are, some dark
const WINDOWS: Inst[] = [];
const WINDOWS_WARM: Inst[] = [];
for (const { p, yaw, e, s } of along(ring(TRENCH.depth), 3.2, 4)) {
  [-2.3, 0, 2.3].forEach((h, row) => {
    const k = e * 7919 + row * 131 + Math.round(s * 10);
    if (rnd(k, 31) < 0.38 || Math.sin(s * 0.045 + e * 2.1 + row * 0.7) < -0.5) return;
    (rnd(k, 32) < 0.2 ? WINDOWS_WARM : WINDOWS).push({ position: shipPoint(p[0], p[1], h), rotation: [0, yaw, 0], scale: [1.7, 1.15, 0.5] });
  });
}
// running lights along each deck's top edge
const DECK_LIGHTS: Inst[] = DECKS.flatMap((d) => along(ring(d.inset + 1.2), 11, 3).map(({ p }) => ({ position: shipPoint(p[0], p[1], d.z[1] + 0.35), scale: [0.7, 0.5, 0.7] as V3 })));
// the bridge's windows: a band round each of the tower's tiers
const BRIDGE: Inst[] = TOWER.tiers.flatMap(([w, dd, , z1]) => {
  const out: Inst[] = [];
  for (let x = -w / 2 + 2; x <= w / 2 - 2; x += 2.4) for (const y of [-dd / 2 - 0.15, dd / 2 + 0.15]) out.push({ position: shipPoint(TOWER.at[0] + x, TOWER.at[1] + y, z1 - 3), scale: [1.6, 1.2, 0.4] });
  for (let y = -dd / 2 + 2; y <= dd / 2 - 2; y += 2.4) for (const x of [-w / 2 - 0.15, w / 2 + 0.15]) out.push({ position: shipPoint(TOWER.at[0] + x, TOWER.at[1] + y, z1 - 3), rotation: [0, Math.PI / 2, 0], scale: [1.6, 1.2, 0.4] });
  return out;
});
const UNIT = manifold.box(1, 1, 1);

/** where the lens's iris is, in the ship's space: where the beam ends */
export const PORT: V3 = shipPoint(EYE[0], EYE[1], GLASS_H - 2);
export { shipPoint };

export function Mothership({ f, at = [0, 0, 0], turn = 0, beam = 0, lights = 1, debug = "" }: { debug?: string; f: number; at?: V3; /** its yaw, radians */ turn?: number; /** 0..1: the lens takes the beam */ beam?: number; /** the windows and running lights, 0..1 */ lights?: number }) {
  const beacon = f % 40 < 5 ? 1 : 0.03;
  const beacon2 = (f + 20) % 40 < 5 ? 1 : 0.03;
  const thrust = 0.8 + 0.2 * Math.sin(f * 0.7);
  return (
    <Entity transform={Transform.fromXyz(...at).withRotation(Quat.fromEuler("XYZ", 0, turn, 0))}>
      {!debug.includes("nomodel") && <Model name="ship" src={SRC} />}
      {debug.includes("nomodel") && <Mesh3d name="ship-stand-in" shape={manifold.box(300, 60, 500).move(-180, 0, 300)}><StandardMaterial base_color="#777777" /></Mesh3d>}
      {!debug.includes("nolights") && <>
      <Instances name="ship-windows" at={WINDOWS} shape={UNIT} shadow={false}>
        <StandardMaterial base_color="#fff4e6" emissive={glow("#ffe7c9", 2600 * lights)} />
      </Instances>
      <Instances name="ship-windows-warm" at={WINDOWS_WARM} shape={UNIT} shadow={false}>
        <StandardMaterial base_color="#ffd9a8" emissive={glow("#ffc27a", 2400 * lights)} />
      </Instances>
      <Instances name="ship-bridge" at={BRIDGE} shape={UNIT} shadow={false}>
        <StandardMaterial base_color="#e9f3ff" emissive={glow("#dcecff", 3000 * lights)} />
      </Instances>
      <Instances name="ship-deck-lights" at={DECK_LIGHTS} shape={UNIT} shadow={false}>
        <StandardMaterial base_color="#e8f4ff" emissive={glow("#cfe6ff", 9000 * lights)} />
      </Instances>
      {/* the lens: dark glass in the pod's face, and the iris, which takes the beam */}
      <Mesh3d name="ship-glass" allowOverlap transform={Transform.fromXyz(...shipPoint(EYE[0], EYE[1], GLASS_H)).withScale([1, 0.1, 1])}>
        <Sphere radius={GLASS_R} />
        <StandardMaterial base_color="#06090b" perceptual_roughness={0.06} metallic={0.2} />
      </Mesh3d>
      <Mesh3d name="ship-iris" allowOverlap transform={Transform.fromXyz(...shipPoint(EYE[0], EYE[1], GLASS_H - GLASS_R * 0.1 + 0.6)).withScale([1, 0.06, 1])}>
        <Sphere radius={GLASS_R * (0.22 + 0.1 * beam)} />
        <StandardMaterial base_color="#dff4ff" emissive={glow("#bfe6ff", 1800 + 60000 * beam)} />
      </Mesh3d>
      {/* the engines burning in their bells */}
      {ENGINES.map(([x, y], k) => (
        <Mesh3d key={k} name={`ship-burn-${k}`} allowOverlap transform={Transform.fromXyz(...shipPoint(x + STEM[0] * 1.5, y + STEM[1] * 1.5, ENGINE.h))}>
          <Sphere radius={ENGINE.throat * 0.95} />
          <StandardMaterial base_color="#cfeaff" emissive={glow("#9fd8ff", 14000 * thrust)} />
        </Mesh3d>
      ))}
      <Mesh3d name="ship-beacon" allowOverlap transform={Transform.fromXyz(...shipPoint(BEACON[0], BEACON[1], ANT.h))}>
        <Sphere radius={ANT.r * 1.3} />
        <StandardMaterial base_color="#ff8a70" emissive={glow("#ff4a30", 40000 * beacon)} />
      </Mesh3d>
      <Mesh3d name="ship-beacon-mast" allowOverlap transform={Transform.fromXyz(...shipPoint(TOWER.at[0], TOWER.at[1], TOWER.mast[1] + 2))}>
        <Sphere radius={3} />
        <StandardMaterial base_color="#ff8a70" emissive={glow("#ff4a30", 40000 * beacon2)} />
      </Mesh3d>
      </>}
    </Entity>
  );
}
